import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { ApprovalService } from '../bnpl/services/approval.service';
import { Payment } from '../payments/entities/payment.entity';
import {
  PaymentStatus,
  PayoutStatus,
  InstallmentStatus,
  PaymentProvider,
} from '../../common/enums/status.enum';
import { ApprovalRequestType } from '../bnpl/entities/approval-request.entity';
import { Role } from '../../common/enums/role.enum';
import { SmsLog } from '../sms/entities/sms-log.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class BusinessManagerService {
  private readonly logger = new Logger(BusinessManagerService.name);

  constructor(
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(BnplPlan)
    private readonly planRepo: Repository<BnplPlan>,
    @InjectRepository(BnplCatalogItem)
    private readonly catalogRepo: Repository<BnplCatalogItem>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(SmsLog)
    private readonly smsLogRepo: Repository<SmsLog>,
    private readonly usersService: UsersService,
    private readonly approvalService: ApprovalService,
  ) {}

  private async _log(
    entityType: string,
    entityId: string,
    action: string,
    performedBy: string,
    changes?: any,
    reason?: string,
  ) {
    try {
      let performerName: string | undefined;
      try {
        const user = await this.usersService.findById(performedBy);
        performerName =
          `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
          user?.email ||
          performedBy;
      } catch {
        /* ignore */
      }
      await this.auditRepo.save({
        entityType,
        entityId,
        action,
        changes: changes as Record<string, { from: any; to: any }>,
        reason,
        performedBy,
        performerName,
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${String(err)}`);
    }
  }

  // 1. Lookup order by reference (provider_reference, subscription ID, or payment reference)
  async lookupOrder(reference: string, organizationId?: string) {
    // Try to find by subscription ID
    const subQuery = this.subRepo.createQueryBuilder('sub')
      .leftJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('plan.catalogItem', 'catalogItem')
      .leftJoinAndSelect('sub.installments', 'installments')
      .where('sub.id = :reference', { reference });
    if (organizationId) {
      subQuery.andWhere('plan.organizationId = :organizationId', { organizationId });
    }
    let subscription = await subQuery.getOne();

    if (!subscription) {
      const payment = await this.paymentRepo.findOne({
        where: { providerReference: reference },
      });
      if (payment?.subscriptionId) {
        const subQuery2 = this.subRepo.createQueryBuilder('sub')
          .leftJoinAndSelect('sub.plan', 'plan')
          .leftJoinAndSelect('plan.catalogItem', 'catalogItem')
          .leftJoinAndSelect('sub.installments', 'installments')
          .where('sub.id = :id', { id: payment.subscriptionId });
        if (organizationId) {
          subQuery2.andWhere('plan.organizationId = :organizationId', { organizationId });
        }
        subscription = await subQuery2.getOne();
      }
    }

    if (!subscription) {
      throw new NotFoundException(
        `Order not found for reference: ${reference}`,
      );
    }

    // Get related payments
    const payments = await this.paymentRepo.find({
      where: { subscriptionId: subscription.id },
      order: { createdAt: 'DESC' },
    });

    return {
      subscription,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        fee: p.fee,
        provider: p.provider,
        providerReference: p.providerReference,
        status: p.status,
        payoutStatus: p.payoutStatus,
        createdAt: p.createdAt,
      })),
    };
  }

  // 2. View webhook processing status for recent payments scoped to org
  async getWebhookStatus(limit = 20, offset = 0, organizationId?: string) {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .orderBy('p.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .select([
        'p.id', 'p.provider_reference', 'p.provider', 'p.status',
        'p.payout_status', 'p.amount', 'p.created_at',
      ]);
    if (organizationId) {
      const subQuery = this.subRepo.createQueryBuilder('sub')
        .leftJoin('sub.plan', 'plan')
        .where('plan.organization_id = :organizationId', { organizationId })
        .select('sub.id');
      qb.andWhere('p.subscription_id IN (' + subQuery.getQuery() + ')')
        .setParameters(subQuery.getParameters());
    }
    const [payments, total] = await qb.getManyAndCount();

    return {
      total,
      payments: payments.map((p) => ({
        id: p.id,
        providerReference: p.providerReference,
        provider: p.provider,
        status: p.status,
        payoutStatus: p.payoutStatus,
        amount: p.amount,
        createdAt: p.createdAt,
        webhookReceived: p.status !== PaymentStatus.PENDING,
      })),
    };
  }

  // 3. Resubmit webhook for a payment (safe re-trigger)
  async resubmitWebhook(paymentId: string, organizationId?: string, performedBy?: string) {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .where('p.id = :paymentId', { paymentId });
    if (organizationId) {
      const subQuery = this.subRepo.createQueryBuilder('sub')
        .leftJoin('sub.plan', 'plan')
        .where('plan.organization_id = :organizationId', { organizationId })
        .select('sub.id');
      qb.andWhere('p.subscription_id IN (' + subQuery.getQuery() + ')')
        .setParameters(subQuery.getParameters());
    }
    const payment = await qb.getOne();
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const result = {
      message:
        'Webhook resubmission prepared. Use the reference to re-trigger on the provider dashboard.',
      provider: payment.provider,
      providerReference: payment.providerReference,
      paymentId: payment.id,
      status: payment.status,
    };

    await this._log(
      'payment',
      paymentId,
      'webhook_resubmit',
      performedBy || 'system',
      { providerReference: { from: null, to: payment.providerReference } },
      `Webhook resubmission prepared for ${payment.providerReference}`,
    );

    return result;
  }

  // 4. View logs (SMS logs + payment logs) scoped to org
  async getLogs(
    type: 'sms' | 'payment' | 'all' = 'all',
    limit = 50,
    offset = 0,
    organizationId?: string,
  ) {
    const smsLogs =
      type === 'all' || type === 'sms'
        ? await this.smsLogRepo.find({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
          })
        : [];

    let paymentLogs: any[] = [];
    if (type === 'all' || type === 'payment') {
      const qb = this.paymentRepo.createQueryBuilder('p')
        .orderBy('p.created_at', 'DESC')
        .take(limit)
        .skip(offset)
        .select([
          'p.id', 'p.provider_reference', 'p.provider', 'p.status',
          'p.payout_status', 'p.amount', 'p.created_at',
        ]);
      if (organizationId) {
        const subQuery = this.subRepo.createQueryBuilder('sub')
          .leftJoin('sub.plan', 'plan')
          .where('plan.organization_id = :organizationId', { organizationId })
          .select('sub.id');
        qb.andWhere('p.subscription_id IN (' + subQuery.getQuery() + ')')
          .setParameters(subQuery.getParameters());
      }
      paymentLogs = await qb.getMany();
    }

    return {
      smsLogs: smsLogs.map((l) => ({
        id: l.id,
        recipient: l.recipient,
        eventType: l.eventType,
        provider: l.provider,
        status: l.status,
        createdAt: l.createdAt,
      })),
      paymentLogs: paymentLogs.map((p) => ({
        id: p.id,
        providerReference: p.providerReference,
        provider: p.provider,
        status: p.status,
        payoutStatus: p.payoutStatus,
        amount: p.amount,
        createdAt: p.createdAt,
      })),
    };
  }

  // 5. Safe repayment action: mark installment as paid with provider reference
  // No financial control — only records that a payment happened off-system
  async markInstallmentAsPaid(
    installmentId: string,
    providerReference: string,
    performedBy?: string,
    organizationId?: string,
  ) {
    const instQb = this.instRepo.createQueryBuilder('inst')
      .leftJoinAndSelect('inst.subscription', 'sub')
      .leftJoin('sub.plan', 'plan')
      .where('inst.id = :installmentId', { installmentId });
    if (organizationId) {
      instQb.andWhere('plan.organization_id = :organizationId', { organizationId });
    }
    const installment = await instQb.getOne();
    if (!installment) {
      throw new NotFoundException('Installment not found');
    }
    if (installment.status === InstallmentStatus.PAID) {
      throw new BadRequestException('Installment is already marked as paid');
    }

    const oldStatus = installment.status;

    // Safe action: update installment status and payment reference
    installment.status = InstallmentStatus.PAID;
    installment.paidAt = new Date();
    installment.paymentReference = providerReference;
    await this.instRepo.save(installment);

    // Update subscription amount_paid
    const sub = installment.subscription;
    if (sub) {
      sub.amountPaid = Number(sub.amountPaid) + Number(installment.amount);
      await this.subRepo.save(sub);
    }

    // Log a payment stub for audit trail
    const payment = this.paymentRepo.create({
      userId: sub?.userId || 'unknown',
      subscriptionId: sub?.id,
      amount: Number(installment.amount),
      fee: 0,
      provider: 'manual' as PaymentProvider,
      providerReference,
      status: PaymentStatus.SUCCESS,
      payoutStatus: PayoutStatus.PENDING,
      metadata: { markedBy: performedBy || 'business_manager', installmentId },
    });
    await this.paymentRepo.save(payment);

    await this._log(
      'installment',
      installmentId,
      'mark_paid',
      performedBy || 'system',
      {
        status: { from: oldStatus, to: InstallmentStatus.PAID },
        paymentReference: { from: null, to: providerReference },
      },
      `Installment ${installmentId} marked as paid via ${providerReference}`,
    );

    return {
      message: 'Installment marked as paid successfully',
      installmentId,
      providerReference,
      amount: installment.amount,
      paymentId: payment.id,
    };
  }

  // 6. Route manual corrections: supervisors execute directly, BMs require approval
  async markInstallmentAsPaidOrRequestApproval(
    installmentId: string,
    providerReference: string,
    performedBy: string,
    role: string,
    organizationId?: string,
    reason?: string,
  ) {
    if (
      role === (Role.SUPERVISOR as string) ||
      role === (Role.SUPER_ADMIN as string)
    ) {
      return this.markInstallmentAsPaid(
        installmentId,
        providerReference,
        performedBy,
        organizationId,
      );
    }
    return this.approvalService.submit({
      requestType: 'manual_override' as ApprovalRequestType,
      requestData: { installmentId, providerReference },
      reason: reason || 'Manual correction requested',
      requestedBy: performedBy,
    });
  }
}
