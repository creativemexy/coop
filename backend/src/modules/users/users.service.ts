import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { UserActivity } from './entities/user-activity.entity';
import { Referral } from './entities/referral.entity';
import { Role } from '../../common/enums/role.enum';
import { hashForLookup } from '../../common/encryption.service';
import { LoginHistory } from '../auth/entities/login-history.entity';
import { DeviceSession } from '../auth/entities/device-session.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { Loan } from '../loans/entities/loan.entity';
import { LoanRepayment } from '../loans/entities/loan-repayment.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { Payment } from '../payments/entities/payment.entity';
import { KycSubmission } from '../kyc/entities/kyc-submission.entity';
import { InAppNotification } from '../notifications/entities/in-app-notification.entity';
import { SavedPaymentMethod } from '../payment-methods/entities/saved-payment-method.entity';
import { SupportTicket } from '../bnpl/entities/support-ticket.entity';
import { InvestmentHolding } from '../investments/entities/investment-holding.entity';
import { InvestmentOrder } from '../investments/entities/investment-order.entity';
import { RedemptionRequest } from '../investments/entities/redemption-request.entity';
import { DistributionPayment } from '../investments/entities/distribution-payment.entity';
import { AuditService } from '../../common/audit.service';
import { AuditAction } from '../../common/entities/audit-log.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserActivity)
    private readonly activityRepo: Repository<UserActivity>,
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    private readonly auditService: AuditService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids.length) return [];
    return this.userRepository.find({
      where: { id: In(ids) },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { emailHash: hashForLookup(email) },
    });
  }

  async findGlobalBusinessManager(): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { role: Role.BUSINESS_MANAGER, isActive: true },
    });
    if (!user) {
      throw new NotFoundException('No active global business manager found. Seed the user first.');
    }
    return user;
  }

  async findBySocial(provider: string, socialId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { socialProvider: provider, socialId } });
  }

  async createSocialUser(dto: {
    email: string; firstName: string; lastName: string;
    socialProvider: string; socialId: string;
  }) {
    const user = this.userRepository.create({
      email: dto.email, emailHash: hashForLookup(dto.email),
      firstName: dto.firstName, lastName: dto.lastName,
      role: Role.INDIVIDUAL, passwordHash: '',
      socialProvider: dto.socialProvider, socialId: dto.socialId,
      registrationFeePaid: true,
    });
    return this.userRepository.save(user);
  }

  async createBusinessManager(dto: {
    email: string; password: string; firstName: string;
    lastName: string; phone?: string;
  }): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { role: Role.BUSINESS_MANAGER, isActive: true },
    });
    if (existing) {
      throw new BadRequestException('A global business manager already exists. Deactivate the existing one first.');
    }
    return this.userRepository.save({
      email: dto.email, emailHash: hashForLookup(dto.email),
      passwordHash: dto.password,
      firstName: dto.firstName, lastName: dto.lastName,
      phone: dto.phone, phoneHash: dto.phone ? hashForLookup(dto.phone) : null,
      role: Role.BUSINESS_MANAGER, isActive: true,
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updates);
    return this.findById(id);
  }

  async listUsers(
    role?: Role, organizationId?: string, apexOrgId?: string,
    filters?: { kycStatus?: string; isActive?: boolean; search?: string },
  ): Promise<User[]> {
    const qb = this.userRepository.createQueryBuilder('u');
    if (role) qb.andWhere('u.role = :role', { role });
    if (organizationId) qb.andWhere('u.organization_id = :orgId', { orgId: organizationId });
    if (apexOrgId) qb.andWhere('u.apex_org_id = :apexId', { apexId: apexOrgId });
    if (filters?.kycStatus) qb.andWhere('u.kyc_status = :kyc', { kyc: filters.kycStatus });
    if (filters?.isActive !== undefined) qb.andWhere('u.is_active = :active', { active: filters.isActive });
    if (filters?.search) {
      qb.andWhere('u.email_hash = :hash', { hash: hashForLookup(filters.search) });
    }
    qb.orderBy('u.created_at', 'DESC');
    return qb.getMany();
  }

  async search(query: string): Promise<{ id: string; name: string; email: string }[]> {
    const users = await this.listUsers(undefined, undefined, undefined, { search: query });
    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
    }));
  }

  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.findById(userId);
    if (user.referralCode) return user.referralCode;
    const code = 'COOP' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await this.userRepository.update(userId, { referralCode: code });
    return code;
  }

  async getReferralStats(userId: string) {
    const user = await this.findById(userId);
    return {
      referralCode: user.referralCode || await this.generateReferralCode(userId),
      referralCount: user.referralCount,
      referralEarnings: Number(user.referralEarnings),
    };
  }

  async exportData(userId: string) {
    const em = this.userRepository.manager;
    const user = await this.findById(userId);

    const activity = await this.activityRepo.find({
      where: { userId }, order: { createdAt: 'DESC' as any }, take: 500,
    });
    const referrals = await this.referralRepo.find({
      where: [{ referrerId: userId }, { refereeId: userId }],
    });

    const [
      loginHistory, deviceSessions,
      subscriptions, loans, savingsAccounts,
      payments, kycSubmissions, notifications,
      paymentMethods, supportTickets,
      holdings, orders, redemptions, distributionPayments,
    ] = await Promise.all([
      em.find(LoginHistory, { where: { userId }, order: { createdAt: 'DESC' as any }, take: 500 }).catch(() => []),
      em.find(DeviceSession, { where: { userId }, order: { lastUsedAt: 'DESC' as any } }).catch(() => []),
      em.find(BnplSubscription, { where: { userId }, order: { createdAt: 'DESC' as any }, relations: { installments: true } }).catch(() => []),
      em.find(Loan, { where: { userId }, order: { createdAt: 'DESC' as any }, relations: { repayments: true } }).catch(() => []),
      em.find(SavingsAccount, { where: { userId }, relations: { transactions: true } }).catch(() => []),
      em.find(Payment, { where: { userId }, order: { createdAt: 'DESC' as any }, take: 500 }).catch(() => []),
      em.find(KycSubmission, { where: { userId }, order: { createdAt: 'DESC' as any } }).catch(() => []),
      em.find(InAppNotification, { where: { userId }, order: { createdAt: 'DESC' as any }, take: 500 }).catch(() => []),
      em.find(SavedPaymentMethod, { where: { userId } }).catch(() => []),
      em.find(SupportTicket, { where: { createdBy: userId }, order: { createdAt: 'DESC' as any } }).catch(() => []),
      em.find(InvestmentHolding, { where: { userId }, order: { createdAt: 'DESC' as any } }).catch(() => []),
      em.find(InvestmentOrder, { where: { userId }, order: { createdAt: 'DESC' as any } }).catch(() => []),
      em.find(RedemptionRequest, { where: { userId }, order: { createdAt: 'DESC' as any } }).catch(() => []),
      em.find(DistributionPayment, { where: { userId }, order: { createdAt: 'DESC' as any } }).catch(() => []),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, phone: user.phone, role: user.role,
        kycStatus: user.kycStatus, isActive: user.isActive,
        registrationFeePaid: user.registrationFeePaid,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      },
      activity,
      referrals,
      loginHistory,
      deviceSessions,
      bnplSubscriptions: subscriptions,
      loans,
      savings: savingsAccounts,
      payments,
      kycSubmissions,
      notifications,
      savedPaymentMethods: paymentMethods,
      supportTickets,
      investments: { holdings, orders, redemptions, distributionPayments },
    };
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (user.deletedAt) {
      throw new BadRequestException('Account has already been deleted');
    }

    const em = this.userRepository.manager;
    const now = new Date();
    const anonymousId = `deleted-${user.id}`.slice(0, 255);

    await Promise.all([
      em.update(User, userId, {
        email: anonymousId,
        emailHash: null,
        firstName: null,
        lastName: null,
        phone: null,
        phoneHash: null,
        passwordHash: '',
        refreshTokenHash: null as any,
        resetToken: null as any,
        resetTokenExpiry: null as any,
        socialProvider: null as any,
        socialId: null as any,
        kycReference: null as any,
        isActive: false,
        deletedAt: now,
        notificationPreferences: null as any,
        referralCode: null as any,
        referredBy: null as any,
      }),
      em.delete(DeviceSession, { userId }),
      em.delete(LoginHistory, { userId }),
    ]);

    await this.auditService.log(AuditAction.USER_DELETE, {
      entityType: 'User',
      entityId: user.id,
      performedBy: userId,
      metadata: { reason: 'user_requested_deletion' },
    });

    return { message: 'Account deleted successfully' };
  }
}
