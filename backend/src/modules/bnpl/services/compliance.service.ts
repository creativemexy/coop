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

    const [
      activeSubs,
      defaultedSubs,
      pendingInsts,
      paidInstsMTD,
    ] = await Promise.all([
      this.subRepo.find({ where: { status: SubscriptionStatus.ACTIVE_REPAYMENT } }),
      this.subRepo.find({ where: { status: SubscriptionStatus.DEFAULTED } }),
      this.instRepo.find({ where: { status: InstallmentStatus.PENDING } }),
      this.instRepo.find({ where: { status: InstallmentStatus.PAID, paidAt: Between(startOfMonth, endOfMonth) } }),
    ]);

    const totalActivePrincipal = activeSubs.reduce((s, sub) => s + Number(sub.totalAmount), 0);
    const totalOutstandingPrincipal = activeSubs.reduce((s, sub) => s + (Number(sub.totalAmount) - Number(sub.amountPaid)), 0);
    const defaultedAmount = defaultedSubs.reduce((s, sub) => s + Number(sub.totalAmount), 0);

    const installmentsDueToday = pendingInsts.filter((i) => new Date(i.dueDate).toDateString() === now.toDateString());
    const installmentsDue7d = pendingInsts.filter((i) => {
      const diff = (new Date(i.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });
    const installmentsDue30d = pendingInsts.filter((i) => {
      const diff = (new Date(i.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    });

    const delinquentInsts = pendingInsts.filter((i) => new Date(i.dueDate) < now);
    const totalDelinquentAmount = delinquentInsts.reduce((s, i) => s + Number(i.amount), 0);
    const delinquencyRate = totalActivePrincipal > 0 ? totalDelinquentAmount / totalActivePrincipal : 0;

    const paidMtdAmount = paidInstsMTD.reduce((s, i) => s + Number(i.amount), 0);

    // Delinquency bucket breakdown
    const bucket = (min: number, max: number) => {
      const items = delinquentInsts.filter((i) => {
        const d = diffDays(new Date(i.dueDate), now);
        return d >= min && d <= max;
      });
      return { count: items.length, amount: items.reduce((s, i) => s + Number(i.amount), 0) };
    };

    return {
      totalActiveSubscriptions: activeSubs.length,
      totalActivePrincipal,
      totalOutstandingPrincipal,
      defaultedAmount,
      defaultedSubscriptions: defaultedSubs.length,
      installmentsDue: {
        today: { count: installmentsDueToday.length, amount: installmentsDueToday.reduce((s, i) => s + Number(i.amount), 0) },
        next7Days: { count: installmentsDue7d.length, amount: installmentsDue7d.reduce((s, i) => s + Number(i.amount), 0) },
        next30Days: { count: installmentsDue30d.length, amount: installmentsDue30d.reduce((s, i) => s + Number(i.amount), 0) },
      },
      paidMtd: { count: paidInstsMTD.length, amount: paidMtdAmount },
      delinquency: {
        '1-30days': bucket(1, 30),
        '31-60days': bucket(31, 60),
        '61-90days': bucket(61, 90),
        '90plus': bucket(91, Infinity),
      },
      delinquencyRate,
      totalDelinquentAmount,
    };
  }

  async getRevenueSummary() {
    const paidInstallments = await this.instRepo.find({
      where: { status: InstallmentStatus.PAID },
    });
    const interestFeesCollected = paidInstallments.reduce(
      (s, i) => s + Number(i.amount),
      0,
    );

    const pendingInstallments = await this.instRepo.find({
      where: { status: InstallmentStatus.PENDING },
    });
    const projectedRemaining = pendingInstallments.reduce(
      (s, i) => s + Number(i.amount),
      0,
    );

    const completedSubs = await this.subRepo.find({
      where: { status: SubscriptionStatus.SETTLED },
    });
    const totalCompletedRevenue = completedSubs.reduce(
      (s, sub) => s + Number(sub.totalAmount),
      0,
    );

    return {
      interestFeesCollected,
      totalPaidInstallments: paidInstallments.length,
      projectedRemainingRevenue: projectedRemaining,
      totalPendingInstallments: pendingInstallments.length,
      totalCompletedRevenue,
      completedSubscriptions: completedSubs.length,
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
    const subs = await this.subRepo.find({
      relations: { installments: true },
      order: { createdAt: 'ASC' },
    });

    const cohorts: Record<string, {
      subscriptionCount: number;
      totalPrincipal: number;
      outstandingPrincipal: number;
      delinquentCount: number;
      delinquentAmount: number;
      delinquencyRate: number;
      bucketBreakdown: {
        '1-30days': { count: number; amount: number };
        '31-60days': { count: number; amount: number };
        '61-90days': { count: number; amount: number };
        '90plus': { count: number; amount: number };
      };
    }> = {};

    const now = new Date();

    for (const sub of subs) {
      const cohortKey = `${sub.createdAt.getFullYear()}-${String(sub.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          subscriptionCount: 0,
          totalPrincipal: 0,
          outstandingPrincipal: 0,
          delinquentCount: 0,
          delinquentAmount: 0,
          delinquencyRate: 0,
          bucketBreakdown: {
            '1-30days': { count: 0, amount: 0 },
            '31-60days': { count: 0, amount: 0 },
            '61-90days': { count: 0, amount: 0 },
            '90plus': { count: 0, amount: 0 },
          },
        };
      }

      const c = cohorts[cohortKey];
      c.subscriptionCount++;
      c.totalPrincipal += Number(sub.totalAmount);
      c.outstandingPrincipal += Number(sub.totalAmount) - Number(sub.amountPaid);

      for (const inst of sub.installments || []) {
        if (inst.status === InstallmentStatus.PAID) continue;
        const days = diffDays(new Date(inst.dueDate), now);
        if (days <= 0) continue;
        c.delinquentCount++;
        const instAmount = Number(inst.amount);
        c.delinquentAmount += instAmount;

        if (days <= 30) {
          c.bucketBreakdown['1-30days'].count++;
          c.bucketBreakdown['1-30days'].amount += instAmount;
        } else if (days <= 60) {
          c.bucketBreakdown['31-60days'].count++;
          c.bucketBreakdown['31-60days'].amount += instAmount;
        } else if (days <= 90) {
          c.bucketBreakdown['61-90days'].count++;
          c.bucketBreakdown['61-90days'].amount += instAmount;
        } else {
          c.bucketBreakdown['90plus'].count++;
          c.bucketBreakdown['90plus'].amount += instAmount;
        }
      }
    }

    for (const c of Object.keys(cohorts)) {
      const cohort = cohorts[c];
      cohort.delinquencyRate =
        cohort.totalPrincipal > 0
          ? cohort.delinquentAmount / cohort.totalPrincipal
          : 0;
    }

    const sorted = Object.entries(cohorts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({ period, ...data }));

    return sorted;
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

      const activeSubs = await this.subRepo
        .createQueryBuilder('s')
        .where('s.created_at <= :monthEnd', { monthEnd })
        .andWhere(
          '(s.status = :active OR s.status = :settled)',
          { active: SubscriptionStatus.ACTIVE_REPAYMENT, settled: SubscriptionStatus.SETTLED },
        )
        .getMany();

      const totalOutstanding = activeSubs.reduce(
        (s, sub) => s + (Number(sub.totalAmount) - Number(sub.amountPaid)),
        0,
      );
      const totalPrincipal = activeSubs.reduce(
        (s, sub) => s + Number(sub.totalAmount),
        0,
      );

      const delinquentInsts = await this.instRepo
        .createQueryBuilder('i')
        .innerJoin(BnplSubscription, 's', 's.id = i.subscription_id')
        .where('i.status = :pending', { pending: InstallmentStatus.PENDING })
        .andWhere('i.due_date < :monthEnd', { monthEnd })
        .andWhere('s.created_at <= :monthEnd', { monthEnd })
        .getMany();

      const delinquentAmount = delinquentInsts.reduce(
        (s, i) => s + Number(i.amount),
        0,
      );

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