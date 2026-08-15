import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplPlan, PlanStatus } from '../entities/bnpl-plan.entity';
import { BnplPlanConfig, InterestModel, DueDateRule, LateFeeType } from '../entities/bnpl-plan-config.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { UsersService } from '../../users/users.service';
import {
  SubscriptionStatus,
  InstallmentStatus,
  PayoutStatus,
} from '../../../common/enums/status.enum';
import { maskEmail, maskName } from '../../../common/mask.util';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(BnplPlan)
    private readonly planRepo: Repository<BnplPlan>,
    @InjectRepository(BnplPlanConfig)
    private readonly configRepo: Repository<BnplPlanConfig>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    private readonly usersService: UsersService,
  ) {}

  async checkEligibility(userId: string, planId: string) {
    const plan = await this.planRepo.findOne({
      where: { id: planId, status: PlanStatus.ACTIVE },
      relations: { catalogItem: true },
    });
    if (!plan) {
      return {
        eligible: false,
        reasons: [{ key: 'plan_not_found', label: 'Plan not found or inactive', passed: false }],
      };
    }

    const config = await this.configRepo.findOne({ where: { organizationId: plan.organizationId } });
    const user = await this.usersService.findById(userId);
    const itemPrice = Number(plan.catalogItem?.price || 0);
    const userScore = (user as any).creditScore;
    const reasons: Array<{ key: string; label: string; passed: boolean; detail?: string }> = [];

    // Membership check
    const membershipOk = !config?.requireMembership || !!user?.organizationId;
    reasons.push({
      key: 'membership',
      label: 'Organization membership',
      passed: membershipOk,
      detail: membershipOk ? undefined : 'User must belong to an organization',
    });

    // Principal limits
    const minOk = !plan.minPrincipal || itemPrice >= Number(plan.minPrincipal);
    const maxOk = (!plan.maxPrincipal || itemPrice <= Number(plan.maxPrincipal));
    const orgMaxOk = !config?.maxPrincipal || itemPrice <= Number(config.maxPrincipal);
    reasons.push({
      key: 'principal_min',
      label: `Minimum principal (₦${Number(plan.minPrincipal || 0).toLocaleString()})`,
      passed: minOk,
      detail: minOk ? undefined : `Item price ₦${itemPrice.toLocaleString()} below minimum ₦${Number(plan.minPrincipal).toLocaleString()}`,
    });
    reasons.push({
      key: 'principal_max',
      label: `Maximum principal (₦${Number(plan.maxPrincipal || 0).toLocaleString()})`,
      passed: maxOk && orgMaxOk,
      detail: !maxOk
        ? `Item price ₦${itemPrice.toLocaleString()} exceeds plan maximum`
        : !orgMaxOk
          ? `Item price ₦${itemPrice.toLocaleString()} exceeds organization maximum`
          : undefined,
    });

    // Score bands
    let scoreOk = true;
    if (plan.eligibilityBands?.length && userScore !== undefined) {
      scoreOk = plan.eligibilityBands.some(
        (band) => userScore >= band.minScore && userScore <= band.maxScore && itemPrice <= band.maxPrincipal,
      );
      reasons.push({
        key: 'credit_score',
        label: `Credit score (${userScore})`,
        passed: scoreOk,
        detail: scoreOk ? undefined : `Score ${userScore} doesn't match any eligibility tier`,
      });
    } else if (plan.eligibilityBands?.length && userScore === undefined) {
      scoreOk = false;
      reasons.push({
        key: 'credit_score',
        label: 'Credit score',
        passed: false,
        detail: 'No credit score on record',
      });
    }

    const eligible = membershipOk && minOk && maxOk && orgMaxOk && scoreOk;

    return { eligible, reasons };
  }

  async subscribe(userId: string, planId: string): Promise<BnplSubscription> {
    const { eligible, reasons } = await this.checkEligibility(userId, planId);
    if (!eligible) {
      throw new BadRequestException(
        `Not eligible: ${reasons.filter((r) => !r.passed).map((r) => r.label).join(', ')}`,
      );
    }

    const plan = await this.planRepo.findOne({
      where: { id: planId, status: PlanStatus.ACTIVE },
      relations: { catalogItem: true },
    });
    if (!plan) throw new NotFoundException('Plan not found or inactive');

    const config = await this.configRepo.findOne({ where: { organizationId: plan.organizationId } });
    const itemPrice = Number(plan.catalogItem?.price || 0);

    const totalAmount = this._calculateTotalAmount(
      itemPrice,
      Number(plan.interestRate),
      plan.installmentCount,
      config?.interestModel || InterestModel.SIMPLE,
    );

    const subscription = this.subRepo.create({
      userId,
      planId,
      status: SubscriptionStatus.CREATED,
      downPayment: 0,
      totalAmount,
      amountPaid: 0,
      payoutStatus: PayoutStatus.PENDING,
    });

    return this.subRepo.save(subscription);
  }

  async findByUser(userId: string): Promise<BnplSubscription[]> {
    return this.subRepo.find({
      where: { userId },
      relations: { plan: { catalogItem: true }, installments: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<BnplSubscription> {
    const sub = await this.subRepo.findOne({
      where: { id },
      relations: { plan: { catalogItem: true }, installments: true },
    });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }
    return sub;
  }

  async findByOrg(organizationId: string): Promise<BnplSubscription[]> {
    return this.subRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('plan.catalogItem', 'catalogItem')
      .leftJoinAndSelect('sub.installments', 'installments')
      .where('plan.organizationId = :orgId', { orgId: organizationId })
      .orderBy('sub.created_at', 'DESC')
      .getMany();
  }

  // ── Orders management ──

  async listOrders(filters?: {
    status?: string;
    payoutStatus?: string;
    search?: string;
    product?: string;
    tenor?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const qb = this.subRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.plan', 'plan')
      .leftJoinAndSelect('plan.catalogItem', 'catalogItem')
      .leftJoinAndSelect('sub.installments', 'installments');

    if (filters?.status) {
      const statuses = filters.status.split(',');
      if (statuses.length === 1) {
        qb.andWhere('sub.status = :status', { status: filters.status });
      } else {
        qb.andWhere('sub.status IN (:...statuses)', { statuses });
      }
    }
    if (filters?.payoutStatus) {
      qb.andWhere('sub.payout_status = :payoutStatus', {
        payoutStatus: filters.payoutStatus,
      });
    }
    if (filters?.search) {
      qb.andWhere('catalogItem.name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }
    if (filters?.product) {
      qb.andWhere('catalogItem.name ILIKE :product', {
        product: `%${filters.product}%`,
      });
    }
    if (filters?.tenor) {
      qb.andWhere('plan.installment_count = :tenor', {
        tenor: filters.tenor,
      });
    }
    if (filters?.dateFrom) {
      qb.andWhere('sub.created_at >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }
    if (filters?.dateTo) {
      qb.andWhere('sub.created_at <= :dateTo', {
        dateTo: new Date(filters.dateTo),
      });
    }
    qb.orderBy('sub.created_at', 'DESC');

    const subs = await qb.getMany();
    const ids = subs.map((s) => s.id);

    const rows: Array<{ entity_id: string; active_cnt: string; open_cnt: string }> = ids.length
      ? await this.auditRepo.manager.query(
          `SELECT entity_id,
                  COUNT(*) FILTER (WHERE status = 'open' OR status = 'investigating') AS active_cnt,
                  COUNT(*) FILTER (WHERE status = 'open') AS open_cnt
           FROM bnpl_risk_flags
           WHERE entity_id = ANY($1::uuid[])
             AND (status = 'open' OR status = 'investigating')
           GROUP BY entity_id`,
          [ids],
        )
      : [];

    const riskByEntity = new Map<string, { active: number; open: number }>();
    for (const r of rows) {
      riskByEntity.set(r.entity_id, {
        active: Number(r.active_cnt || 0),
        open: Number(r.open_cnt || 0),
      });
    }

    const enriched: any[] = [];

    for (const sub of subs) {
      const riskCount = riskByEntity.get(sub.id)?.active ?? 0;
      const openRiskCount = riskByEntity.get(sub.id)?.open ?? 0;

      const overdueInst = (sub.installments || []).filter(
        (i) => i.status === InstallmentStatus.PENDING && new Date(i.dueDate) < new Date(),
      );
      const paidInst = (sub.installments || []).filter((i) => i.status === InstallmentStatus.PAID);

      enriched.push({
        ...sub,
        riskFlagCount: riskCount,
        openRiskFlagCount: openRiskCount,
        riskLevel: openRiskCount > 0 ? 'high' : riskCount > 0 ? 'medium' : 'low',
        overdueInstallmentCount: overdueInst.length,
        totalInstallmentCount: (sub.installments || []).length,
        paidInstallmentCount: paidInst.length,
      });
    }

    return enriched;
  }

  async getOrderPayments(orderId: string) {
    const payments = await this.subRepo.manager.query(
      `SELECT id, amount, fee, provider, provider_reference, status, payout_status, metadata, created_at
       FROM payments
       WHERE subscription_id = $1
       ORDER BY created_at DESC`,
      [orderId],
    );
    return payments.map((p: any) => ({
      id: p.id,
      amount: Number(p.amount),
      fee: Number(p.fee || 0),
      provider: p.provider,
      providerReference: p.provider_reference,
      status: p.status,
      payoutStatus: p.payout_status,
      metadata: p.metadata,
      createdAt: p.created_at,
    }));
  }

  async updateOrderStatus(
    id: string,
    status: SubscriptionStatus,
    performedBy?: string,
    reason?: string,
  ): Promise<BnplSubscription> {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Order not found');

    const allowedTransitions: Record<SubscriptionStatus, SubscriptionStatus[]> =
      {
        [SubscriptionStatus.CREATED]: [SubscriptionStatus.PENDING_PAYMENT, SubscriptionStatus.DEFAULTED],
        [SubscriptionStatus.PENDING_PAYMENT]: [SubscriptionStatus.DEFAULTED],
        [SubscriptionStatus.DISBURSED]: [SubscriptionStatus.ACTIVE_REPAYMENT, SubscriptionStatus.DEFAULTED],
        [SubscriptionStatus.ACTIVE_REPAYMENT]: [SubscriptionStatus.DEFAULTED],
        [SubscriptionStatus.SETTLED]: [],
        [SubscriptionStatus.DEFAULTED]: [SubscriptionStatus.PENDING_PAYMENT],
      };

    if (!allowedTransitions[sub.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${sub.status} to ${status}`,
      );
    }

    const oldStatus = sub.status;
    sub.status = status;
    if (status === SubscriptionStatus.PENDING_PAYMENT && !sub.approvedAt) {
      sub.approvedAt = new Date();
    }
    const saved = await this.subRepo.save(sub);

    this._logAudit({
      entityType: 'subscription',
      entityId: id,
      action: 'status_change',
      changes: {
        status: { from: oldStatus, to: status },
      },
      reason,
      performedBy,
    });

    return saved;
  }

  async approve(id: string, performedBy?: string): Promise<BnplSubscription> {
    return this.updateOrderStatus(id, SubscriptionStatus.PENDING_PAYMENT, performedBy, 'Approved via approve()');
  }

  async markDisbursed(
    id: string,
    disbursementReference: string,
    performedBy?: string,
    reason?: string,
  ): Promise<BnplSubscription> {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Order not found');
    if (sub.status !== SubscriptionStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order must be in pending_payment to disburse');
    }

    const plan = await this.planRepo.findOne({
      where: { id: sub.planId },
      relations: { catalogItem: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const config = await this.configRepo.findOne({ where: { organizationId: plan.organizationId } });
    const itemPrice = Number(plan.catalogItem?.price || 0);
    const downPayment = (itemPrice * Number(plan.downPaymentPercent)) / 100;

    sub.downPayment = downPayment;
    sub.payoutStatus = PayoutStatus.COMPLETED;
    sub.disbursementReference = disbursementReference;
    sub.disbursedAt = new Date();
    sub.status = SubscriptionStatus.DISBURSED;

    const saved = await this.subRepo.save(sub);

    const installmentAmount =
      (Number(sub.totalAmount) - downPayment) / Number(plan.installmentCount);
    const installments: BnplInstallment[] = [];
    const startDate = this._calculateStartDate(config ?? undefined);

    for (let i = 0; i < plan.installmentCount; i++) {
      const dueDate = this._calculateDueDate(
        startDate,
        i,
        plan.installmentFrequency,
        config?.dueDateRule || DueDateRule.SAME_DAY_MONTHLY,
      );

      const gracePeriodEnd = config?.gracePeriodDays
        ? new Date(dueDate.getTime() + config.gracePeriodDays * 86400000)
        : undefined;

      const lateFeeAmount = this._calculateLateFee(
        installmentAmount,
        config?.lateFeeType || LateFeeType.FLAT,
        config?.lateFeeValue || 0,
      );

      installments.push(
        this.instRepo.create({
          subscriptionId: saved.id,
          dueDate,
          amount: installmentAmount,
          lateFeeAmount,
          gracePeriodEnd,
          status: InstallmentStatus.PENDING,
        }),
      );
    }
    await this.instRepo.save(installments);

    saved.nextInstallmentDate = installments[0]?.dueDate || null;
    const result = await this.subRepo.save(saved);

    this._logAudit({
      entityType: 'subscription',
      entityId: id,
      action: 'disburse',
      changes: {
        status: { from: SubscriptionStatus.PENDING_PAYMENT, to: SubscriptionStatus.DISBURSED },
        disbursementReference: { from: null, to: disbursementReference },
        downPayment: { from: sub.downPayment, to: downPayment },
      },
      reason: reason || `Disbursed with ref ${disbursementReference}`,
      performedBy,
    });

    return result;
  }

  async markSettled(id: string, performedBy?: string, reason?: string): Promise<BnplSubscription> {
    const sub = await this.subRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Order not found');
    const oldStatus = sub.status;
    sub.settledAt = new Date();
    sub.status = SubscriptionStatus.SETTLED;
    const saved = await this.subRepo.save(sub);

    this._logAudit({
      entityType: 'subscription',
      entityId: id,
      action: 'settle',
      changes: {
        status: { from: oldStatus, to: SubscriptionStatus.SETTLED },
        settledAt: { from: null, to: sub.settledAt },
      },
      reason: reason || 'Manually settled',
      performedBy,
    });

    return saved;
  }

  async searchUsers(query: string) {
    const results = await this.usersService.search(query);
    return results.map((u) => ({
      id: u.id,
      name: maskName(u.name) ?? u.id,
      email: maskEmail(u.email) ?? '',
    }));
  }

  // ── Private helpers ──

  private async _logAudit(dto: {
    entityType: string;
    entityId: string;
    action: string;
    changes?: Record<string, { from: any; to: any }>;
    reason?: string;
    performedBy?: string;
  }) {
    try {
      let performerName: string | undefined;
      if (dto.performedBy) {
        try {
          const user = await this.usersService.findById(dto.performedBy);
          performerName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || dto.performedBy;
        } catch { /* ignore */ }
      }
      await this.auditRepo.save({
        entityType: dto.entityType,
        entityId: dto.entityId,
        action: dto.action,
        changes: dto.changes as Record<string, { from: any; to: any }>,
        reason: dto.reason,
        performedBy: dto.performedBy || 'system',
        performerName,
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${err}`);
    }
  }

  private _calculateStartDate(config?: BnplPlanConfig): Date {
    const now = new Date();
    if (config?.gracePeriodDays) {
      return new Date(now.getTime() + config.gracePeriodDays * 86400000);
    }
    return now;
  }

  private _calculateDueDate(
    start: Date,
    index: number,
    frequency: string,
    rule: DueDateRule,
  ): Date {
    const due = new Date(start);

    if (frequency === 'weekly') {
      due.setDate(due.getDate() + (index + 1) * 7);
    } else if (frequency === 'biweekly') {
      due.setDate(due.getDate() + (index + 1) * 14);
    } else {
      if (rule === DueDateRule.END_OF_MONTH) {
        due.setMonth(due.getMonth() + (index + 1));
        due.setDate(0);
      } else {
        const originalDay = start.getDate();
        due.setMonth(due.getMonth() + (index + 1));
        if (due.getDate() !== originalDay) {
          due.setDate(0);
        }
      }
    }
    return due;
  }

  private _calculateTotalAmount(
    principal: number,
    interestRate: number,
    installmentCount: number,
    model: InterestModel,
  ): number {
    switch (model) {
      case InterestModel.FIXED_MONTHLY_FEE:
        return principal + principal * (interestRate / 100) * installmentCount;
      case InterestModel.REDUCING_BALANCE: {
        const monthlyRate = interestRate / 100 / 12;
        const emi =
          (principal *
            monthlyRate *
            Math.pow(1 + monthlyRate, installmentCount)) /
          (Math.pow(1 + monthlyRate, installmentCount) - 1);
        return emi * installmentCount;
      }
      case InterestModel.SIMPLE:
      default:
        return principal + (principal * interestRate) / 100;
    }
  }

  private _calculateLateFee(
    installmentAmount: number,
    feeType: LateFeeType,
    feeValue: number,
  ): number {
    if (feeValue <= 0) return 0;
    if (feeType === LateFeeType.PERCENTAGE) {
      return installmentAmount * (feeValue / 100);
    }
    return feeValue;
  }
}