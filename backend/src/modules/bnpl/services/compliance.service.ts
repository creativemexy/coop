import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { RiskFlag, RiskFlagStatus, RiskFlagEntityType } from '../entities/risk-flag.entity';
import { ExceptionReason } from '../entities/exception-reason.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplPlan } from '../entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../entities/bnpl-catalog-item.entity';
import {
  SubscriptionStatus,
  InstallmentStatus,
  PayoutStatus,
} from '../../../common/enums/status.enum';
import { UsersService } from '../../users/users.service';
import { maskEmail, maskName } from '../../../common/mask.util';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(RiskFlag)
    private readonly flagRepo: Repository<RiskFlag>,
    @InjectRepository(ExceptionReason)
    private readonly reasonRepo: Repository<ExceptionReason>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(BnplPlan)
    private readonly planRepo: Repository<BnplPlan>,
    private readonly usersService: UsersService,
  ) {}

  // ── Risk Flags ──

  async createFlag(dto: {
    entityType: RiskFlagEntityType;
    entityId: string;
    reason: string;
    description?: string;
    flaggedBy: string;
  }): Promise<RiskFlag> {
    const flag = this.flagRepo.create({
      entityType: dto.entityType,
      entityId: dto.entityId,
      reason: dto.reason,
      description: dto.description,
      flaggedBy: dto.flaggedBy,
      status: RiskFlagStatus.OPEN,
    });
    return this.flagRepo.save(flag);
  }

  async listFlags(filters?: {
    status?: string;
    entityType?: string;
  }): Promise<any[]> {
    const qb = this.flagRepo.createQueryBuilder('f');
    if (filters?.status) qb.andWhere('f.status = :status', { status: filters.status });
    if (filters?.entityType) qb.andWhere('f.entity_type = :entityType', { entityType: filters.entityType });
    qb.orderBy('f.created_at', 'DESC');
    const flags = await qb.getMany();

    const enriched: any[] = [];
    for (const flag of flags) {
      let entityName: string | null = null;
      if (flag.entityType === RiskFlagEntityType.SUBSCRIPTION) {
        try {
          const sub = await this.subRepo.findOne({
            where: { id: flag.entityId },
            relations: { plan: { catalogItem: true } },
          });
          entityName = sub?.plan?.catalogItem?.name || null;
        } catch { /* ignore */ }
      } else if (flag.entityType === RiskFlagEntityType.USER) {
        try {
          const user = await this.usersService.findById(flag.entityId);
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          entityName = user.email ? `${maskName(user.firstName)} ${maskName(user.lastName)}`.trim() || maskEmail(user.email) : name;
        } catch { /* ignore */ }
      }
      enriched.push({ ...flag, entityName });
    }
    return enriched;
  }

  async resolveFlag(
    id: string,
    dto: { status: RiskFlagStatus; resolutionNote?: string; resolvedBy: string },
  ): Promise<RiskFlag> {
    const flag = await this.flagRepo.findOne({ where: { id } });
    if (!flag) throw new NotFoundException('Flag not found');
    flag.status = dto.status;
    flag.resolutionNote = dto.resolutionNote as string;
    flag.resolvedBy = dto.resolvedBy;
    flag.resolvedAt = new Date();
    return this.flagRepo.save(flag);
  }

  // ── Exception Reasons ──

  async listExceptionReasons(): Promise<ExceptionReason[]> {
    return this.reasonRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createExceptionReason(dto: {
    title: string;
    description?: string;
    createdBy: string;
  }): Promise<ExceptionReason> {
    const reason = this.reasonRepo.create({
      title: dto.title,
      description: dto.description,
      createdBy: dto.createdBy,
      status: 'active',
    });
    return this.reasonRepo.save(reason);
  }

  async updateExceptionReason(
    id: string,
    dto: { title?: string; description?: string; status?: string },
  ): Promise<ExceptionReason> {
    await this.reasonRepo.update(id, dto);
    const updated = await this.reasonRepo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Exception reason not found');
    return updated;
  }

  async deleteExceptionReason(id: string): Promise<void> {
    await this.reasonRepo.delete(id);
  }

  // ── Portfolio Report ──

  async getPortfolioSummary() {
    const activeSubs = await this.subRepo.find({
      where: { status: SubscriptionStatus.ACTIVE_REPAYMENT },
    });

    const totalOutstandingPrincipal = activeSubs.reduce(
      (s, sub) => s + (Number(sub.totalAmount) - Number(sub.amountPaid)),
      0,
    );

    const now = new Date();
    const allInstallments = await this.instRepo.find({
      where: { status: InstallmentStatus.PENDING },
    });

    const installmentsDue = allInstallments.filter(
      (i) => new Date(i.dueDate) >= now,
    );
    const totalInstallmentsDue = installmentsDue.reduce(
      (s, i) => s + Number(i.amount),
      0,
    );

    const delinquent1_30 = allInstallments.filter((i) => {
      const days = diffDays(new Date(i.dueDate), now);
      return days >= 1 && days <= 30;
    });
    const delinquent31_60 = allInstallments.filter((i) => {
      const days = diffDays(new Date(i.dueDate), now);
      return days >= 31 && days <= 60;
    });
    const delinquent61_90 = allInstallments.filter((i) => {
      const days = diffDays(new Date(i.dueDate), now);
      return days >= 61 && days <= 90;
    });
    const delinquent90plus = allInstallments.filter((i) => {
      const days = diffDays(new Date(i.dueDate), now);
      return days > 90;
    });

    const totalDelinquentAmount =
      delinquent1_30.reduce((s, i) => s + Number(i.amount), 0) +
      delinquent31_60.reduce((s, i) => s + Number(i.amount), 0) +
      delinquent61_90.reduce((s, i) => s + Number(i.amount), 0) +
      delinquent90plus.reduce((s, i) => s + Number(i.amount), 0);

    const totalActivePrincipal = activeSubs.reduce(
      (s, sub) => s + Number(sub.totalAmount),
      0,
    );

    const delinquencyRate =
      totalActivePrincipal > 0
        ? totalDelinquentAmount / totalActivePrincipal
        : 0;

    return {
      totalActiveSubscriptions: activeSubs.length,
      totalOutstandingPrincipal,
      totalInstallmentsDue,
      totalInstallmentsDueCount: installmentsDue.length,
      delinquency: {
        '1-30days': {
          count: delinquent1_30.length,
          amount: delinquent1_30.reduce((s, i) => s + Number(i.amount), 0),
        },
        '31-60days': {
          count: delinquent31_60.length,
          amount: delinquent31_60.reduce((s, i) => s + Number(i.amount), 0),
        },
        '61-90days': {
          count: delinquent61_90.length,
          amount: delinquent61_90.reduce((s, i) => s + Number(i.amount), 0),
        },
        '90plus': {
          count: delinquent90plus.length,
          amount: delinquent90plus.reduce((s, i) => s + Number(i.amount), 0),
        },
      },
      delinquencyRate,
      totalDelinquentAmount,
    };
  }

  async getPortfolioKpis() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nowISO = now.toISOString();

    const [
      activeSubAgg,
      defaultedSubAgg,
      instAgg,
      paidMtdAgg,
    ] = await Promise.all([
      this.subRepo
        .createQueryBuilder('s')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(s.total_amount), 0)', 'principal')
        .addSelect('COALESCE(SUM(s.total_amount - s.amount_paid), 0)', 'outstanding')
        .where('s.status = :status', { status: SubscriptionStatus.ACTIVE_REPAYMENT })
        .getRawOne(),
      this.subRepo
        .createQueryBuilder('s')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(s.total_amount), 0)', 'amount')
        .where('s.status = :status', { status: SubscriptionStatus.DEFAULTED })
        .getRawOne(),
      this.instRepo
        .createQueryBuilder('i')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(i.amount), 0)', 'amount')
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date = :today THEN i.amount ELSE 0 END), 0)`,
          'dueTodayAmount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date = :today THEN 1 ELSE 0 END), 0)`,
          'dueTodayCount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date > :now AND i.due_date <= :in7d THEN i.amount ELSE 0 END), 0)`,
          'due7dAmount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date > :now AND i.due_date <= :in7d THEN 1 ELSE 0 END), 0)`,
          'due7dCount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date > :now AND i.due_date <= :in30d THEN i.amount ELSE 0 END), 0)`,
          'due30dAmount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date > :now AND i.due_date <= :in30d THEN 1 ELSE 0 END), 0)`,
          'due30dCount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :now THEN i.amount ELSE 0 END), 0)`,
          'delinquentAmount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :now THEN 1 ELSE 0 END), 0)`,
          'delinquentCount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :now AND i.due_date >= :b1_30 THEN i.amount ELSE 0 END), 0)`,
          'delinquent1_30Amount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :now AND i.due_date >= :b1_30 THEN 1 ELSE 0 END), 0)`,
          'delinquent1_30Count',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :b1_30 AND i.due_date >= :b31_60 THEN i.amount ELSE 0 END), 0)`,
          'delinquent31_60Amount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :b1_30 AND i.due_date >= :b31_60 THEN 1 ELSE 0 END), 0)`,
          'delinquent31_60Count',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :b31_60 AND i.due_date >= :b61_90 THEN i.amount ELSE 0 END), 0)`,
          'delinquent61_90Amount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :b31_60 AND i.due_date >= :b61_90 THEN 1 ELSE 0 END), 0)`,
          'delinquent61_90Count',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :b61_90 THEN i.amount ELSE 0 END), 0)`,
          'delinquent90plusAmount',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN i.due_date < :b61_90 THEN 1 ELSE 0 END), 0)`,
          'delinquent90plusCount',
        )
        .where('i.status = :status', { status: InstallmentStatus.PENDING })
        .setParameters({
          status: InstallmentStatus.PENDING,
          today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          now: nowISO,
          in7d: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
          in30d: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30),
          b1_30: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30),
          b31_60: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60),
          b61_90: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90),
        })
        .getRawOne(),
      this.instRepo
        .createQueryBuilder('i')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(i.amount), 0)', 'amount')
        .where('i.status = :status AND i.paid_at >= :from AND i.paid_at <= :to', {
          status: InstallmentStatus.PAID,
          from: startOfMonth,
          to: endOfMonth,
        })
        .getRawOne(),
    ]);

    const activeSubs = Number(activeSubAgg?.count ?? 0);
    const totalActivePrincipal = Number(activeSubAgg?.principal ?? 0);
    const totalOutstandingPrincipal = Number(activeSubAgg?.outstanding ?? 0);
    const defaultedSubs = Number(defaultedSubAgg?.count ?? 0);
    const defaultedAmount = Number(defaultedSubAgg?.amount ?? 0);

    const totalDelinquentAmount = Number(instAgg?.delinquentAmount ?? 0);
    const delinquencyRate = totalActivePrincipal > 0 ? totalDelinquentAmount / totalActivePrincipal : 0;
    const paidMtdAmount = Number(paidMtdAgg?.amount ?? 0);

    return {
      totalActiveSubscriptions: activeSubs,
      totalActivePrincipal,
      totalOutstandingPrincipal,
      defaultedAmount,
      defaultedSubscriptions: defaultedSubs,
      installmentsDue: {
        today: { count: Number(instAgg?.dueTodayCount ?? 0), amount: Number(instAgg?.dueTodayAmount ?? 0) },
        next7Days: { count: Number(instAgg?.due7dCount ?? 0), amount: Number(instAgg?.due7dAmount ?? 0) },
        next30Days: { count: Number(instAgg?.due30dCount ?? 0), amount: Number(instAgg?.due30dAmount ?? 0) },
      },
      paidMtd: { count: Number(paidMtdAgg?.count ?? 0), amount: paidMtdAmount },
      delinquency: {
        '1-30days': { count: Number(instAgg?.delinquent1_30Count ?? 0), amount: Number(instAgg?.delinquent1_30Amount ?? 0) },
        '31-60days': { count: Number(instAgg?.delinquent31_60Count ?? 0), amount: Number(instAgg?.delinquent31_60Amount ?? 0) },
        '61-90days': { count: Number(instAgg?.delinquent61_90Count ?? 0), amount: Number(instAgg?.delinquent61_90Amount ?? 0) },
        '90plus': { count: Number(instAgg?.delinquent90plusCount ?? 0), amount: Number(instAgg?.delinquent90plusAmount ?? 0) },
      },
      delinquencyRate,
      totalDelinquentAmount,
    };
  }

  async getRevenueSummary() {
    const [
      paidAgg,
      pendingAgg,
      settledAgg,
    ] = await Promise.all([
      this.instRepo
        .createQueryBuilder('i')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(i.amount), 0)', 'total')
        .where('i.status = :status', { status: InstallmentStatus.PAID })
        .getRawOne(),
      this.instRepo
        .createQueryBuilder('i')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(i.amount), 0)', 'total')
        .where('i.status = :status', { status: InstallmentStatus.PENDING })
        .getRawOne(),
      this.subRepo
        .createQueryBuilder('s')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(s.total_amount), 0)', 'total')
        .where('s.status = :status', { status: SubscriptionStatus.SETTLED })
        .getRawOne(),
    ]);

    return {
      interestFeesCollected: Number(paidAgg?.total ?? 0),
      totalPaidInstallments: Number(paidAgg?.count ?? 0),
      projectedRemainingRevenue: Number(pendingAgg?.total ?? 0),
      totalPendingInstallments: Number(pendingAgg?.count ?? 0),
      totalCompletedRevenue: Number(settledAgg?.total ?? 0),
      completedSubscriptions: Number(settledAgg?.count ?? 0),
    };
  }

  async exportCsv() {
    const [portfolio, revenue, kpis] = await Promise.all([
      this.getPortfolioSummary(),
      this.getRevenueSummary(),
      this.getPortfolioKpis(),
    ]);

    const lines: string[] = [
      'Section,Metric,Value',
      `Portfolio,Active Subscriptions,${portfolio.totalActiveSubscriptions}`,
      `Portfolio,Active Principal,${kpis.totalActivePrincipal}`,
      `Portfolio,Outstanding Principal,${portfolio.totalOutstandingPrincipal}`,
      `Portfolio,Installments Due,${portfolio.totalInstallmentsDue}`,
      `Portfolio,Installments Due Today,${kpis.installmentsDue.today.count} ${kpis.installmentsDue.today.count > 0 ? '(' + kpis.installmentsDue.today.amount + ')' : ''}`,
      `Portfolio,Installments Due Next 7d,${kpis.installmentsDue.next7Days.count} (${kpis.installmentsDue.next7Days.amount})`,
      `Portfolio,Installments Due Next 30d,${kpis.installmentsDue.next30Days.count} (${kpis.installmentsDue.next30Days.amount})`,
      `Portfolio,Paid MTD Count,${kpis.paidMtd.count}`,
      `Portfolio,Paid MTD Amount,${kpis.paidMtd.amount}`,
      `Portfolio,Delinquency Rate,${(portfolio.delinquencyRate * 100).toFixed(2)}%`,
      `Portfolio,Delinquent 1-30d Count,${portfolio.delinquency['1-30days'].count}`,
      `Portfolio,Delinquent 1-30d Amount,${portfolio.delinquency['1-30days'].amount}`,
      `Portfolio,Delinquent 31-60d Count,${portfolio.delinquency['31-60days'].count}`,
      `Portfolio,Delinquent 31-60d Amount,${portfolio.delinquency['31-60days'].amount}`,
      `Portfolio,Delinquent 61-90d Count,${portfolio.delinquency['61-90days'].count}`,
      `Portfolio,Delinquent 61-90d Amount,${portfolio.delinquency['61-90days'].amount}`,
      `Portfolio,Delinquent 90+ Count,${portfolio.delinquency['90plus'].count}`,
      `Portfolio,Delinquent 90+ Amount,${portfolio.delinquency['90plus'].amount}`,
      `Portfolio,Defaulted Subscriptions,${kpis.defaultedSubscriptions}`,
      `Portfolio,Defaulted Amount,${kpis.defaultedAmount}`,
      `Revenue,Interest/Fees Collected,${revenue.interestFeesCollected}`,
      `Revenue,Paid Installments,${revenue.totalPaidInstallments}`,
      `Revenue,Projected Remaining,${revenue.projectedRemainingRevenue}`,
      `Revenue,Pending Installments,${revenue.totalPendingInstallments}`,
      `Revenue,Completed Subscriptions,${revenue.completedSubscriptions}`,
      `Revenue,Total Completed Revenue,${revenue.totalCompletedRevenue}`,
    ];

    return lines.join('\n');
  }

  // ── Audit Logs ──

  async listAuditLogs(filters?: {
    entityType?: string;
    entityId?: string;
    action?: string;
    category?: string;
  }): Promise<AuditLog[]> {
    const qb = this.auditRepo.createQueryBuilder('a');
    if (filters?.entityType) qb.andWhere('a.entity_type = :entityType', { entityType: filters.entityType });
    if (filters?.entityId) qb.andWhere('a.entity_id = :entityId', { entityId: filters.entityId });
    if (filters?.action) qb.andWhere('a.action = :action', { action: filters.action });
    if (filters?.category) {
      const categoryMap: Record<string, string[]> = {
        product: ['plan', 'catalog_item', 'plan_config', 'catalog', 'bnpl_plan', 'bnpl_catalog_item'],
        order: ['subscription', 'order', 'bnpl_subscription', 'approval_request'],
        repayment: ['installment', 'payment', 'bnpl_installment', 'repayment'],
      };
      const entityTypes = categoryMap[filters.category] || [];
      if (entityTypes.length > 0) {
        qb.andWhere('a.entity_type IN (:...entityTypes)', { entityTypes });
      }
    }
    qb.orderBy('a.created_at', 'DESC');
    qb.limit(200);
    return qb.getMany();
  }

  async logAction(dto: {
    entityType: string;
    entityId: string;
    action: string;
    changes?: Record<string, { from: any; to: any }>;
    reason?: string;
    performedBy: string;
    performerName?: string;
    ipAddress?: string;
    evidence?: string;
  }): Promise<AuditLog> {
    const log = this.auditRepo.create(dto);
    return this.auditRepo.save(log);
  }

  async getAuditLog(id: string): Promise<AuditLog> {
    const log = await this.auditRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }

  async getAuditEvidence(id: string): Promise<string | null> {
    const log = await this.auditRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Audit log not found');
    return log.evidence || null;
  }

  // ── Delinquency Cohorts ──

  async getDelinquencyCohorts() {
    const now = new Date();
    const nowISO = now.toISOString();

    const cohortsRaw = await this.subRepo
      .createQueryBuilder('s')
      .select("to_char(s.created_at, 'YYYY-MM')", 'period')
      .addSelect('COUNT(DISTINCT s.id)', 'subscriptionCount')
      .addSelect('COALESCE(SUM(s.total_amount), 0)', 'totalPrincipal')
      .addSelect('COALESCE(SUM(s.total_amount - s.amount_paid), 0)', 'outstandingPrincipal')
      .addSelect(
        `COALESCE(SUM(CASE WHEN i.id IS NOT NULL AND i.status != :paid THEN i.amount ELSE 0 END), 0)`,
        'delinquentAmount',
      )
      .addSelect(
        `COUNT(DISTINCT CASE WHEN i.id IS NOT NULL AND i.status != :paid AND i.due_date < :now THEN i.id END)`,
        'delinquentCount',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN i.status != :paid AND i.due_date < :now AND i.due_date >= :b1_30 THEN i.amount ELSE 0 END), 0)`,
        'b1_30Amount',
      )
      .addSelect(
        `COUNT(DISTINCT CASE WHEN i.status != :paid AND i.due_date < :now AND i.due_date >= :b1_30 THEN i.id END)`,
        'b1_30Count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN i.status != :paid AND i.due_date < :b1_30 AND i.due_date >= :b31_60 THEN i.amount ELSE 0 END), 0)`,
        'b31_60Amount',
      )
      .addSelect(
        `COUNT(DISTINCT CASE WHEN i.status != :paid AND i.due_date < :b1_30 AND i.due_date >= :b31_60 THEN i.id END)`,
        'b31_60Count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN i.status != :paid AND i.due_date < :b31_60 AND i.due_date >= :b61_90 THEN i.amount ELSE 0 END), 0)`,
        'b61_90Amount',
      )
      .addSelect(
        `COUNT(DISTINCT CASE WHEN i.status != :paid AND i.due_date < :b31_60 AND i.due_date >= :b61_90 THEN i.id END)`,
        'b61_90Count',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN i.status != :paid AND i.due_date < :b61_90 THEN i.amount ELSE 0 END), 0)`,
        'b90plusAmount',
      )
      .addSelect(
        `COUNT(DISTINCT CASE WHEN i.status != :paid AND i.due_date < :b61_90 THEN i.id END)`,
        'b90plusCount',
      )
      .leftJoin('bnpl_installments', 'i', 'i.subscription_id = s.id')
      .setParameters({
        paid: InstallmentStatus.PAID,
        now: nowISO,
        b1_30: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString(),
        b31_60: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60).toISOString(),
        b61_90: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90).toISOString(),
      })
      .groupBy("to_char(s.created_at, 'YYYY-MM')")
      .getRawMany();

    return cohortsRaw
      .map((r) => {
        const totalPrincipal = Number(r.totalPrincipal ?? 0);
        const delinquentAmount = Number(r.delinquentAmount ?? 0);
        return {
          period: r.period,
          subscriptionCount: Number(r.subscriptionCount ?? 0),
          totalPrincipal,
          outstandingPrincipal: Number(r.outstandingPrincipal ?? 0),
          delinquentCount: Number(r.delinquentCount ?? 0),
          delinquentAmount,
          delinquencyRate: totalPrincipal > 0 ? delinquentAmount / totalPrincipal : 0,
          bucketBreakdown: {
            '1-30days': { count: Number(r.b1_30Count ?? 0), amount: Number(r.b1_30Amount ?? 0) },
            '31-60days': { count: Number(r.b31_60Count ?? 0), amount: Number(r.b31_60Amount ?? 0) },
            '61-90days': { count: Number(r.b61_90Count ?? 0), amount: Number(r.b61_90Amount ?? 0) },
            '90plus': { count: Number(r.b90plusCount ?? 0), amount: Number(r.b90plusAmount ?? 0) },
          },
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  // ── Delinquency Trends (last 12 months) ──

  async getDelinquencyTrends() {
    const now = new Date();
    const trends: {
      month: string;
      delinquencyRate: number;
      delinquentAmount: number;
      totalOutstanding: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const subAgg = await this.subRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.total_amount - s.amount_paid), 0)', 'outstanding')
        .addSelect('COALESCE(SUM(s.total_amount), 0)', 'principal')
        .where('s.created_at <= :monthEnd', { monthEnd })
        .andWhere(
          '(s.status = :active OR s.status = :settled)',
          { active: SubscriptionStatus.ACTIVE_REPAYMENT, settled: SubscriptionStatus.SETTLED },
        )
        .getRawOne();

      const totalOutstanding = Number(subAgg?.outstanding ?? 0);
      const totalPrincipal = Number(subAgg?.principal ?? 0);

      const delAgg = await this.instRepo
        .createQueryBuilder('i')
        .select('COALESCE(SUM(i.amount), 0)', 'total')
        .innerJoin(BnplSubscription, 's', 's.id = i.subscription_id')
        .where('i.status = :pending', { pending: InstallmentStatus.PENDING })
        .andWhere('i.due_date < :monthEnd', { monthEnd })
        .andWhere('s.created_at <= :monthEnd', { monthEnd })
        .getRawOne();

      const delinquentAmount = Number(delAgg?.total ?? 0);

      trends.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        delinquencyRate: totalPrincipal > 0 ? delinquentAmount / totalPrincipal : 0,
        delinquentAmount,
        totalOutstanding,
      });
    }

    return trends;
  }
}

function diffDays(a: Date, b: Date): number {
  const diff = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}