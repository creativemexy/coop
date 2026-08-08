import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import {
  PaymentStatus,
  PayoutStatus,
  PaymentProvider,
} from '../../common/enums/status.enum';
import { PaystackClient } from './providers/paystack/paystack.client';
import { UsersService } from '../users/users.service';
import { RiskService } from '../../common/risk.service';
import { FeeShareService } from '../ledger/services/fee-share.service';
import { DoubleEntryService } from '../ledger/services/double-entry.service';
import { AccountsService } from '../ledger/services/accounts.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
    private readonly paystackClient: PaystackClient,
    private readonly usersService: UsersService,
    private readonly riskService: RiskService,
    private readonly feeShareService: FeeShareService,
    private readonly doubleEntryService: DoubleEntryService,
    private readonly accountsService: AccountsService,
  ) {}

  async initiate(dto: {
    userId: string;
    subscriptionId?: string;
    amount: number;
    provider: PaymentProvider;
    purpose?: string;
    callbackUrl?: string;
  }): Promise<{ payment: Payment; authorizationUrl?: string }> {
    const maxCheck = await this.riskService.checkMinMax('max_payment_amount', dto.amount);
    if (maxCheck && !maxCheck.allowed) {
      throw new BadRequestException(`Maximum single payment is ₦${maxCheck.limit.toLocaleString()}`);
    }

    const providerReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const user = await this.usersService.findById(dto.userId);
    const fee = Math.round(dto.amount * 0.015 * 100) / 100;

    const payment = this.repo.create({
      userId: dto.userId,
      subscriptionId: dto.subscriptionId,
      amount: dto.amount,
      fee,
      provider: dto.provider,
      providerReference,
      status: PaymentStatus.PENDING,
      payoutStatus: PayoutStatus.PENDING,
      purpose: dto.purpose,
      metadata: { purpose: dto.purpose },
    });

    const saved = await this.repo.save(payment);

    const { authorizationUrl } =
      await this.paystackClient.initializeTransaction({
        email: user.email,
        amount: dto.amount,
        reference: providerReference,
        callbackUrl: dto.callbackUrl,
        metadata: {
          userId: dto.userId,
          subscriptionId: dto.subscriptionId,
          paymentId: saved.id,
          purpose: dto.purpose,
        },
      });

    this.logger.log(
      `Payment initiated: ${providerReference}, amount: ${dto.amount}, purpose: ${dto.purpose || 'general'}`,
    );

    return { payment: saved, authorizationUrl };
  }

  async findByProviderReference(reference: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { providerReference: reference } });
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    metadata?: Record<string, any>,
  ): Promise<Payment> {
    await this.repo.update(id, { status, metadata });
    return this.repo.findOneOrFail({ where: { id } });
  }

  async verify(reference: string): Promise<{ status: string; payment?: Payment }> {
    const paystackData = await this.paystackClient.verifyTransaction(reference);
    const payment = await this.findByProviderReference(reference);
    const paystackStatus = paystackData?.status;

    if (paystackStatus === 'success' && payment) {
      const isRegistration = payment.purpose === 'registration' ||
        (payment.metadata && (payment.metadata as any).purpose === 'registration');
      const wasPending = payment.status === PaymentStatus.PENDING;

      if (wasPending) {
        const mergedMeta = {
          ...(payment.metadata || {}),
          ...(paystackData as any),
        };
        await this.updateStatus(payment.id, PaymentStatus.SUCCESS, mergedMeta);
      }

      if (isRegistration && payment.userId) {
        await this.usersService.updateUser(
          payment.userId,
          { registrationFeePaid: true, isActive: true } as any,
        );
        await this.recordRegistrationLedger(payment.userId, payment.id, payment.amount);
      }

      return { status: 'success', payment: { ...payment, status: PaymentStatus.SUCCESS } };
    }
    return { status: paystackStatus || 'unknown', payment: payment ?? undefined };
  }

  async findByUser(userId: string): Promise<Payment[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async updatePayoutStatus(
    id: string,
    payoutStatus: PayoutStatus,
    payoutReference?: string,
  ): Promise<void> {
    await this.repo.update(id, { payoutStatus, payoutReference });
  }

  private async recordRegistrationLedger(
    userId: string,
    paymentId: string,
    amount: number,
  ): Promise<void> {
    try {
      if (await this.feeShareService.hasRegistrationRecord(paymentId)) {
        return;
      }
      const user = (await this.usersService.findById(userId)) as User | null;
      if (user) {
        const cashAccount = await this.accountsService.findByCode('1000');
        const revenueAccount =
          (await this.accountsService.findByCode('4200')) ??
          (await this.accountsService.findByCode('4100'));
        if (cashAccount && revenueAccount) {
          try {
            await this.doubleEntryService.postEntry({
              description: `Registration fee - ${user.email}`,
              entryDate: new Date(),
              postedBy: 'SYSTEM',
              lines: [
                {
                  accountId: cashAccount.id,
                  debit: amount,
                  credit: 0,
                  organizationId: user.organizationId ?? undefined,
                },
                {
                  accountId: revenueAccount.id,
                  debit: 0,
                  credit: amount,
                  organizationId: user.organizationId ?? undefined,
                },
              ],
            });
          } catch (jeErr) {
            this.logger.warn(`Journal entry creation failed: ${(jeErr as Error).message}`);
          }
        }
        await this.feeShareService.recordRegistrationFee({
          paymentId,
          totalFee: amount,
          organizationId: user.organizationId ?? undefined,
          apexOrgId: user.apexOrgId ?? undefined,
        });
      }
    } catch (err) {
      this.logger.warn(`Registration ledger recording failed: ${(err as Error).message}`);
    }
  }
}
