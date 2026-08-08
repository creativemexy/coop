"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const user_activity_entity_1 = require("./entities/user-activity.entity");
const referral_entity_1 = require("./entities/referral.entity");
const role_enum_1 = require("../../common/enums/role.enum");
const encryption_service_1 = require("../../common/encryption.service");
const login_history_entity_1 = require("../auth/entities/login-history.entity");
const device_session_entity_1 = require("../auth/entities/device-session.entity");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const loan_entity_1 = require("../loans/entities/loan.entity");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const kyc_submission_entity_1 = require("../kyc/entities/kyc-submission.entity");
const in_app_notification_entity_1 = require("../notifications/entities/in-app-notification.entity");
const saved_payment_method_entity_1 = require("../payment-methods/entities/saved-payment-method.entity");
const support_ticket_entity_1 = require("../bnpl/entities/support-ticket.entity");
const investment_holding_entity_1 = require("../investments/entities/investment-holding.entity");
const investment_order_entity_1 = require("../investments/entities/investment-order.entity");
const redemption_request_entity_1 = require("../investments/entities/redemption-request.entity");
const distribution_payment_entity_1 = require("../investments/entities/distribution-payment.entity");
const audit_service_1 = require("../../common/audit.service");
const audit_log_entity_1 = require("../../common/entities/audit-log.entity");
let UsersService = class UsersService {
    userRepository;
    activityRepo;
    referralRepo;
    auditService;
    constructor(userRepository, activityRepo, referralRepo, auditService) {
        this.userRepository = userRepository;
        this.activityRepo = activityRepo;
        this.referralRepo = referralRepo;
        this.auditService = auditService;
    }
    async findById(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findByEmail(email) {
        return this.userRepository.findOne({
            where: { emailHash: (0, encryption_service_1.hashForLookup)(email) },
        });
    }
    async findGlobalBusinessManager() {
        const user = await this.userRepository.findOne({
            where: { role: role_enum_1.Role.BUSINESS_MANAGER, isActive: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('No active global business manager found. Seed the user first.');
        }
        return user;
    }
    async findBySocial(provider, socialId) {
        return this.userRepository.findOne({ where: { socialProvider: provider, socialId } });
    }
    async createSocialUser(dto) {
        const user = this.userRepository.create({
            email: dto.email, emailHash: (0, encryption_service_1.hashForLookup)(dto.email),
            firstName: dto.firstName, lastName: dto.lastName,
            role: role_enum_1.Role.INDIVIDUAL, passwordHash: '',
            socialProvider: dto.socialProvider, socialId: dto.socialId,
            registrationFeePaid: true,
        });
        return this.userRepository.save(user);
    }
    async createBusinessManager(dto) {
        const existing = await this.userRepository.findOne({
            where: { role: role_enum_1.Role.BUSINESS_MANAGER, isActive: true },
        });
        if (existing) {
            throw new common_1.BadRequestException('A global business manager already exists. Deactivate the existing one first.');
        }
        return this.userRepository.save({
            email: dto.email, emailHash: (0, encryption_service_1.hashForLookup)(dto.email),
            passwordHash: dto.password,
            firstName: dto.firstName, lastName: dto.lastName,
            phone: dto.phone, phoneHash: dto.phone ? (0, encryption_service_1.hashForLookup)(dto.phone) : null,
            role: role_enum_1.Role.BUSINESS_MANAGER, isActive: true,
        });
    }
    async updateUser(id, updates) {
        await this.userRepository.update(id, updates);
        return this.findById(id);
    }
    async listUsers(role, organizationId, apexOrgId, filters) {
        const qb = this.userRepository.createQueryBuilder('u');
        if (role)
            qb.andWhere('u.role = :role', { role });
        if (organizationId)
            qb.andWhere('u.organization_id = :orgId', { orgId: organizationId });
        if (apexOrgId)
            qb.andWhere('u.apex_org_id = :apexId', { apexId: apexOrgId });
        if (filters?.kycStatus)
            qb.andWhere('u.kyc_status = :kyc', { kyc: filters.kycStatus });
        if (filters?.isActive !== undefined)
            qb.andWhere('u.is_active = :active', { active: filters.isActive });
        if (filters?.search) {
            qb.andWhere('u.email_hash = :hash', { hash: (0, encryption_service_1.hashForLookup)(filters.search) });
        }
        qb.orderBy('u.created_at', 'DESC');
        return qb.getMany();
    }
    async search(query) {
        const users = await this.listUsers(undefined, undefined, undefined, { search: query });
        return users.map((u) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email: u.email,
        }));
    }
    async generateReferralCode(userId) {
        const user = await this.findById(userId);
        if (user.referralCode)
            return user.referralCode;
        const code = 'COOP' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await this.userRepository.update(userId, { referralCode: code });
        return code;
    }
    async getReferralStats(userId) {
        const user = await this.findById(userId);
        return {
            referralCode: user.referralCode || await this.generateReferralCode(userId),
            referralCount: user.referralCount,
            referralEarnings: Number(user.referralEarnings),
        };
    }
    async exportData(userId) {
        const em = this.userRepository.manager;
        const user = await this.findById(userId);
        const activity = await this.activityRepo.find({
            where: { userId }, order: { createdAt: 'DESC' }, take: 500,
        });
        const referrals = await this.referralRepo.find({
            where: [{ referrerId: userId }, { refereeId: userId }],
        });
        const [loginHistory, deviceSessions, subscriptions, loans, savingsAccounts, payments, kycSubmissions, notifications, paymentMethods, supportTickets, holdings, orders, redemptions, distributionPayments,] = await Promise.all([
            em.find(login_history_entity_1.LoginHistory, { where: { userId }, order: { createdAt: 'DESC' }, take: 500 }).catch(() => []),
            em.find(device_session_entity_1.DeviceSession, { where: { userId }, order: { lastUsedAt: 'DESC' } }).catch(() => []),
            em.find(bnpl_subscription_entity_1.BnplSubscription, { where: { userId }, order: { createdAt: 'DESC' }, relations: { installments: true } }).catch(() => []),
            em.find(loan_entity_1.Loan, { where: { userId }, order: { createdAt: 'DESC' }, relations: { repayments: true } }).catch(() => []),
            em.find(savings_account_entity_1.SavingsAccount, { where: { userId }, relations: { transactions: true } }).catch(() => []),
            em.find(payment_entity_1.Payment, { where: { userId }, order: { createdAt: 'DESC' }, take: 500 }).catch(() => []),
            em.find(kyc_submission_entity_1.KycSubmission, { where: { userId }, order: { createdAt: 'DESC' } }).catch(() => []),
            em.find(in_app_notification_entity_1.InAppNotification, { where: { userId }, order: { createdAt: 'DESC' }, take: 500 }).catch(() => []),
            em.find(saved_payment_method_entity_1.SavedPaymentMethod, { where: { userId } }).catch(() => []),
            em.find(support_ticket_entity_1.SupportTicket, { where: { createdBy: userId }, order: { createdAt: 'DESC' } }).catch(() => []),
            em.find(investment_holding_entity_1.InvestmentHolding, { where: { userId }, order: { createdAt: 'DESC' } }).catch(() => []),
            em.find(investment_order_entity_1.InvestmentOrder, { where: { userId }, order: { createdAt: 'DESC' } }).catch(() => []),
            em.find(redemption_request_entity_1.RedemptionRequest, { where: { userId }, order: { createdAt: 'DESC' } }).catch(() => []),
            em.find(distribution_payment_entity_1.DistributionPayment, { where: { userId }, order: { createdAt: 'DESC' } }).catch(() => []),
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
    async deleteAccount(userId) {
        const user = await this.findById(userId);
        if (user.deletedAt) {
            throw new common_1.BadRequestException('Account has already been deleted');
        }
        const em = this.userRepository.manager;
        const now = new Date();
        const anonymousId = `deleted-${user.id}`.slice(0, 255);
        await Promise.all([
            em.update(user_entity_1.User, userId, {
                email: anonymousId,
                emailHash: null,
                firstName: null,
                lastName: null,
                phone: null,
                phoneHash: null,
                passwordHash: '',
                refreshTokenHash: null,
                resetToken: null,
                resetTokenExpiry: null,
                socialProvider: null,
                socialId: null,
                kycReference: null,
                isActive: false,
                deletedAt: now,
                notificationPreferences: null,
                referralCode: null,
                referredBy: null,
            }),
            em.delete(device_session_entity_1.DeviceSession, { userId }),
            em.delete(login_history_entity_1.LoginHistory, { userId }),
        ]);
        await this.auditService.log(audit_log_entity_1.AuditAction.USER_DELETE, {
            entityType: 'User',
            entityId: user.id,
            performedBy: userId,
            metadata: { reason: 'user_requested_deletion' },
        });
        return { message: 'Account deleted successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_activity_entity_1.UserActivity)),
    __param(2, (0, typeorm_1.InjectRepository)(referral_entity_1.Referral)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map