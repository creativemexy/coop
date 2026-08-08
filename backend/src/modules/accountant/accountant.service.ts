import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan, Raw } from 'typeorm';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { FeeShareLedger } from '../ledger/entities/fee-share-ledger.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';
import { Distribution, DistributionStatus } from '../investments/entities/distribution.entity';
import { FeeWithdrawalRequest } from '../ledger/entities/fee-withdrawal-request.entity';
import { TransactionType } from '../savings/entities/savings-transaction.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { ReconciliationRun, ReconciliationStatus } from './entities/reconciliation-run.entity';
import { ReconciliationResult, ResultStatus } from './entities/reconciliation-result.entity';
import { AdjustmentRequest, AdjustmentType, AdjustmentStatus } from './entities/adjustment-request.entity';
import { SubscriptionStatus, InstallmentStatus, PaymentStatus, JournalStatus, PayoutStatus } from '../../common/enums/status.enum';
import { Loan, LoanStatus } from '../loans/entities/loan.entity';
import { LoanRepayment } from '../loans/entities/loan-repayment.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { JournalEntry } from '../ledger/entities/journal-entry.entity';
import { JournalLine } from '../ledger/entities/journal-line.entity';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AccountantService {
  constructor(
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(BnplPlan)
    private readonly planRepo: Repository<BnplPlan>,
    @InjectRepository(BnplCatalogItem)
    private readonly catalogRepo: Repository<BnplCatalogItem>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(FeeShareLedger)
    private readonly feeShareRepo: Repository<FeeShareLedger>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(ReconciliationRun)
    private readonly recRunRepo: Repository<ReconciliationRun>,
    @InjectRepository(ReconciliationResult)
    private readonly recResultRepo: Repository<ReconciliationResult>,
    @InjectRepository(AdjustmentRequest)
    private readonly adjRepo: Repository<AdjustmentRequest>,
    @InjectRepository(Loan)
    private readonly loanRepo: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly loanRepayRepo: Repository<LoanRepayment>,
    @InjectRepository(SavingsAccount)
    private readonly savAcctRepo: Repository<SavingsAccount>,
    @InjectRepository(SavingsTransaction)
    private readonly savTxRepo: Repository<SavingsTransaction>,
    @InjectRepository(JournalEntry)
    private readonly journalRepo: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private readonly journalLineRepo: Repository<JournalLine>,
    @InjectRepository(FeePot)
    private readonly feePotRepo: Repository<FeePot>,
    @InjectRepository(Distribution)
    private readonly distributionRepo: Repository<Distribution>,
    @InjectRepository(FeeWithdrawalRequest)
    private readonly withdrawalRepo: Repository<FeeWithdrawalRequest>,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  //  EXISTING: BNPL Financial Views (unchanged)
  // ═══════════════════════════════════════════════════════════════

  async getOrderLedger(orgId?: string, days?: number) {
    const where: any = {};
    if (orgId) {
      const plans = await this.planRepo.find({ where: { organizationId: orgId } });
      where.planId = In(plans.map((p) => p.id));
    }
    const subs = await this.subRepo.find({
      where,
      relations: { plan: { catalogItem: true }, installments: true },
      order: { createdAt: 'DESC' },
      take: 500,
    });
    return subs.map((s) => ({
      id: s.id,
      status: s.status,
      totalAmount: Number(s.totalAmount),
      amountPaid: Number(s.amountPaid),
      downPayment: Number(s.downPayment),
      outstanding: Number(s.totalAmount) - Number(s.amountPaid),
      providerReference: s.providerReference,
      disbursementReference: s.disbursementReference,
      payoutStatus: s.payoutStatus,
      createdAt: s.createdAt,
      settledAt: s.settledAt,
      planName: s.plan?.catalogItem?.name || 'Unknown',
      planOrgId: s.plan?.organizationId || null,
      installmentCount: s.installments?.length || 0,
      paidInstallments: s.installments?.filter((i) => i.status === 'paid').length || 0,
    }));
  }

  async getInstallmentLedger(orgId?: string, days?: number) {
    const since = days ? new Date(Date.now() - days * 86400000) : undefined;
    const where: any = {};
    if (since) where.createdAt = Between(since, new Date());
    const insts = await this.instRepo.find({
      where,
      relations: { subscription: { plan: { catalogItem: true } } },
      order: { createdAt: 'DESC' },
      take: 1000,
    });
    let filtered = insts;
    if (orgId) filtered = insts.filter((i) => i.subscription?.plan?.organizationId === orgId);
    return filtered.map((i) => ({
      id: i.id,
      subscriptionId: i.subscriptionId,
      amount: Number(i.amount),
      lateFeeAmount: Number(i.lateFeeAmount),
      dueDate: i.dueDate,
      status: i.status,
      paidAt: i.paidAt,
      paymentReference: i.paymentReference,
      planName: i.subscription?.plan?.catalogItem?.name || 'Unknown',
      organizationId: i.subscription?.plan?.organizationId || null,
      createdAt: i.createdAt,
    }));
  }

  async getPaymentReferences(orgId?: string, days?: number) {
    const since = days ? new Date(Date.now() - days * 86400000) : undefined;
    const where: any = {};
    if (since) where.createdAt = Between(since, new Date());
    const payments = await this.paymentRepo.find({ where, order: { createdAt: 'DESC' }, take: 500 });
    let filtered = payments;
    if (orgId) {
      const subs = await this.subRepo.find({
        where: { planId: In((await this.planRepo.find({ where: { organizationId: orgId } })).map((p) => p.id)) },
      });
      const subIds = new Set(subs.map((s) => s.id));
      filtered = payments.filter((p) => p.subscriptionId && subIds.has(p.subscriptionId));
    }
    return filtered.map((p) => ({
      id: p.id,
      subscriptionId: p.subscriptionId,
      amount: Number(p.amount),
      fee: Number(p.fee),
      provider: p.provider,
      providerReference: p.providerReference,
      status: p.status,
      payoutStatus: p.payoutStatus,
      payoutReference: p.payoutReference,
      createdAt: p.createdAt,
    }));
  }

  async getSettlementReferences(orgId?: string, days?: number) {
    const since = days ? new Date(Date.now() - days * 86400000) : undefined;
    const where: any = { payoutStatus: 'completed' };
    if (since) where.createdAt = Between(since, new Date());
    const payments = await this.paymentRepo.find({ where, order: { createdAt: 'DESC' }, take: 500 });
    let filtered = payments;
    if (orgId) {
      const subs = await this.subRepo.find({
        where: { planId: In((await this.planRepo.find({ where: { organizationId: orgId } })).map((p) => p.id)) },
      });
      const subIds = new Set(subs.map((s) => s.id));
      filtered = payments.filter((p) => p.subscriptionId && subIds.has(p.subscriptionId));
    }
    return filtered.map((p) => ({
      id: p.id,
      subscriptionId: p.subscriptionId,
      amount: Number(p.amount),
      provider: p.provider,
      providerReference: p.providerReference,
      payoutReference: p.payoutReference,
      payoutStatus: p.payoutStatus,
      settledAt: p.createdAt,
    }));
  }

  async getTenants() {
    return this.orgRepo.find({ select: { id: true, name: true, code: true }, order: { name: 'ASC' } });
  }

  async exportOrderLedgerCsv(orgId?: string, days?: number): Promise<string> {
    const rows = await this.getOrderLedger(orgId, days);
    const header = 'ID,Plan,Status,Total Amount,Amount Paid,Down Payment,Outstanding,Provider Ref,Disbursement Ref,Payout Status,Installments,Paid,Created At,Settled At\n';
    return header + rows.map((r) =>
      `"${r.id}","${r.planName}","${r.status}",${r.totalAmount},${r.amountPaid},${r.downPayment},${r.outstanding},"${r.providerReference || ''}","${r.disbursementReference || ''}","${r.payoutStatus}",${r.installmentCount},${r.paidInstallments},"${r.createdAt?.toISOString() || ''}","${r.settledAt?.toISOString() || ''}"`
    ).join('\n');
  }

  async exportInstallmentLedgerCsv(orgId?: string, days?: number): Promise<string> {
    const rows = await this.getInstallmentLedger(orgId, days);
    const header = 'ID,Subscription ID,Plan,Amount,Late Fee,Due Date,Status,Paid At,Payment Reference,Organization ID,Created At\n';
    return header + rows.map((r) =>
      `"${r.id}","${r.subscriptionId}","${r.planName}",${r.amount},${r.lateFeeAmount},"${String(r.dueDate).slice(0, 10) || ''}","${r.status}","${r.paidAt ? new Date(r.paidAt).toISOString() : ''}","${r.paymentReference || ''}","${r.organizationId || ''}","${new Date(r.createdAt).toISOString()}"`
    ).join('\n');
  }

  async exportPaymentReferencesCsv(orgId?: string, days?: number): Promise<string> {
    const rows = await this.getPaymentReferences(orgId, days);
    const header = 'ID,Subscription ID,Amount,Fee,Provider,Provider Reference,Status,Payout Status,Payout Reference,Created At\n';
    return header + rows.map((r) =>
      `"${r.id}","${r.subscriptionId || ''}",${r.amount},${r.fee},"${r.provider}","${r.providerReference}","${r.status}","${r.payoutStatus}","${r.payoutReference || ''}","${r.createdAt?.toISOString() || ''}"`
    ).join('\n');
  }

  async exportSettlementReferencesCsv(orgId?: string, days?: number): Promise<string> {
    const rows = await this.getSettlementReferences(orgId, days);
    const header = 'ID,Subscription ID,Amount,Provider,Provider Reference,Payout Reference,Payout Status,Settled At\n';
    return header + rows.map((r) =>
      `"${r.id}","${r.subscriptionId || ''}",${r.amount},"${r.provider}","${r.providerReference}","${r.payoutReference || ''}","${r.payoutStatus}","${new Date(r.settledAt).toISOString()}"`
    ).join('\n');
  }

  // ═══════════════════════════════════════════════════════════════
  //  RECONCILIATION WORKBENCH
  // ═══════════════════════════════════════════════════════════════

  async runReconciliation(dto: {
    rangeStart: string;
    rangeEnd: string;
    organizationId?: string;
    runBy: string;
  }) {
    const start = new Date(dto.rangeStart);
    const end = new Date(dto.rangeEnd);

    const run = this.recRunRepo.create({
      rangeStart: start,
      rangeEnd: end,
      organizationId: dto.organizationId,
      runBy: dto.runBy,
      status: ReconciliationStatus.IN_PROGRESS,
    });
    const savedRun = await this.recRunRepo.save(run);

    const wherePlans: any = {};
    if (dto.organizationId) wherePlans.organizationId = dto.organizationId;
    const plans = await this.planRepo.find({ where: wherePlans });
    const planIds = plans.map((p) => p.id);

    const subs = await this.subRepo.find({
      where: { planId: In(planIds) },
      relations: { installments: true },
    });

    const results: Partial<ReconciliationResult>[] = [];
    let totalExpected = 0;
    let totalActual = 0;
    let matchCount = 0;
    let mismatchCount = 0;
    let expectedAmountTotal = 0;
    let actualAmountTotal = 0;

    for (const sub of subs) {
      const dueInsts = (sub.installments || []).filter((i) => {
        const d = new Date(i.dueDate);
        return d >= start && d <= end;
      });

      for (const inst of dueInsts) {
        const expectedAmount = Number(inst.amount) + Number(inst.lateFeeAmount);
        expectedAmountTotal += expectedAmount;
        totalExpected++;

        const payments = await this.paymentRepo.find({
          where: { subscriptionId: sub.id, status: PaymentStatus.SUCCESS, createdAt: Between(start, end) },
        });

        const actualAmount = payments.reduce((s, p) => s + Number(p.amount), 0);
        actualAmountTotal += actualAmount;

        const hasPayment = payments.length > 0;
        const amountMatch = Math.abs(expectedAmount - actualAmount) < 0.01;
        const hasWebhook = inst.paymentReference != null;

        const flags: string[] = [];
        if (!hasPayment) flags.push('missing_payment');
        if (!amountMatch && hasPayment) flags.push('amount_mismatch');
        if (!hasWebhook && hasPayment) flags.push('missing_webhook');

        let status: ResultStatus;
        if (amountMatch && hasWebhook) {
          status = ResultStatus.MATCHED;
          matchCount++;
        } else if (!hasPayment && !hasWebhook) {
          status = ResultStatus.UNMATCHED;
          mismatchCount++;
        } else {
          status = ResultStatus.NEEDS_REVIEW;
          mismatchCount++;
        }

        results.push({
          runId: savedRun.id,
          subscriptionId: sub.id,
          installmentId: inst.id,
          expectedAmount,
          actualAmount,
          discrepancy: expectedAmount - actualAmount,
          expectedDate: inst.dueDate,
          actualDate: payments[0]?.createdAt || null,
          status,
          flags,
          organizationId: sub.plan?.organizationId || null,
        });
      }
    }

    if (results.length > 0) {
      await this.recResultRepo.insert(results as ReconciliationResult[]);
    }

    savedRun.status = ReconciliationStatus.COMPLETED;
    savedRun.totalExpected = totalExpected;
    savedRun.totalActual = totalActual;
    savedRun.matchCount = matchCount;
    savedRun.mismatchCount = mismatchCount;
    savedRun.expectedAmount = expectedAmountTotal;
    savedRun.actualAmount = actualAmountTotal;
    savedRun.discrepancy = expectedAmountTotal - actualAmountTotal;
    savedRun.completedAt = new Date();
    await this.recRunRepo.save(savedRun);

    return this.recRunRepo.findOne({
      where: { id: savedRun.id },
      relations: { results: true },
    });
  }

  async getReconciliationRuns(organizationId?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    return this.recRunRepo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }

  async getReconciliationRun(id: string) {
    const run = await this.recRunRepo.findOne({ where: { id }, relations: { results: true } });
    if (!run) throw new NotFoundException('Reconciliation run not found');
    return run;
  }

  async getReconciliationResults(runId: string, status?: ResultStatus) {
    const where: any = { runId };
    if (status) where.status = status;
    return this.recResultRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 500,
    });
  }

  async exportReconciliationCsv(runId: string): Promise<string> {
    const results = await this.recResultRepo.find({ where: { runId }, order: { createdAt: 'DESC' } });
    const header = 'Installment ID,Subscription ID,Expected Amount,Actual Amount,Discrepancy,Expected Date,Actual Date,Status,Flags,Notes\n';
    return header + results.map((r) =>
      `"${r.installmentId || ''}","${r.subscriptionId}",${r.expectedAmount},${r.actualAmount},${r.discrepancy},"${String(r.expectedDate).slice(0, 10) || ''}","${r.actualDate ? String(r.actualDate).slice(0, 10) : ''}","${r.status}","${(r.flags || []).join(';')}","${r.notes || ''}"`
    ).join('\n');
  }

  async updateReconciliationResult(id: string, dto: { status: ResultStatus; notes?: string }) {
    const result = await this.recResultRepo.findOne({ where: { id } });
    if (!result) throw new NotFoundException('Reconciliation result not found');
    result.status = dto.status;
    if (dto.notes !== undefined) result.notes = dto.notes;
    return this.recResultRepo.save(result);
  }

  // ═══════════════════════════════════════════════════════════════
  //  ADJUSTMENT REQUESTS
  // ═══════════════════════════════════════════════════════════════

  async createAdjustmentRequest(dto: {
    adjustmentType: AdjustmentType;
    description: string;
    reasonCode: string;
    changes: Record<string, any>;
    referenceType?: string;
    referenceId?: string;
    requestedBy: string;
  }) {
    const req = this.adjRepo.create({ ...dto, status: AdjustmentStatus.PENDING });
    return this.adjRepo.save(req);
  }

  async listAdjustmentRequests(status?: AdjustmentStatus) {
    const where: any = {};
    if (status) where.status = status;
    return this.adjRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  async getAdjustmentRequest(id: string) {
    const req = await this.adjRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Adjustment request not found');
    return req;
  }

  async approveAdjustmentRequest(id: string, reviewedBy: string) {
    const req = await this.adjRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Adjustment request not found');
    if (req.status !== AdjustmentStatus.PENDING) throw new BadRequestException('Adjustment is not pending');
    req.status = AdjustmentStatus.APPROVED;
    req.reviewedBy = reviewedBy;
    req.reviewedAt = new Date();
    return this.adjRepo.save(req);
  }

  async rejectAdjustmentRequest(id: string, reviewedBy: string, reason: string) {
    const req = await this.adjRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Adjustment request not found');
    if (req.status !== AdjustmentStatus.PENDING) throw new BadRequestException('Adjustment is not pending');
    req.status = AdjustmentStatus.REJECTED;
    req.reviewedBy = reviewedBy;
    req.reviewedAt = new Date();
    req.rejectionReason = reason;
    return this.adjRepo.save(req);
  }

  // ═══════════════════════════════════════════════════════════════
  //  STATEMENTS
  // ═══════════════════════════════════════════════════════════════

  async getMemberStatement(userId: string, days?: number) {
    if (!UUID_RE.test(userId)) throw new NotFoundException('User not found');
    const since = days ? new Date(Date.now() - days * 86400000) : new Date(0);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const subs = await this.subRepo.find({
      where: { userId },
      relations: { plan: { catalogItem: true }, installments: true },
      order: { createdAt: 'DESC' },
    });

    const payments = await this.paymentRepo.find({
      where: { userId, createdAt: Between(since, new Date()) },
      order: { createdAt: 'DESC' },
    });

    const allInsts = subs.flatMap((s) => s.installments || []);
    const totalBilled = allInsts.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalPaid = allInsts.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
    const totalLateFees = allInsts.reduce((sum, i) => sum + Number(i.lateFeeAmount), 0);
    const outstanding = totalBilled - totalPaid;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const mtdStart = new Date(currentYear, currentMonth, 1);
    const paidMtd = payments.filter((p) => p.createdAt >= mtdStart).reduce((sum, p) => sum + Number(p.amount), 0);

    const upcomingInsts = allInsts
      .filter((i) => i.status === 'pending' && new Date(i.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return {
      member: { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email },
      summary: {
        totalSubscriptions: subs.length,
        activeSubscriptions: subs.filter((s) => s.status === SubscriptionStatus.ACTIVE_REPAYMENT).length,
        totalBilled: Math.round(totalBilled * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalLateFees: Math.round(totalLateFees * 100) / 100,
        outstanding: Math.round(outstanding * 100) / 100,
        paidMtd: Math.round(paidMtd * 100) / 100,
      },
      repaymentSchedule: subs.map((s) => ({
        subscriptionId: s.id,
        planName: s.plan?.catalogItem?.name || 'Unknown',
        totalAmount: Number(s.totalAmount),
        amountPaid: Number(s.amountPaid),
        outstanding: Number(s.totalAmount) - Number(s.amountPaid),
        status: s.status,
        installments: (s.installments || []).map((i) => ({
          id: i.id,
          amount: Number(i.amount),
          dueDate: i.dueDate,
          status: i.status,
          paidAt: i.paidAt,
          paymentReference: i.paymentReference,
          lateFeeAmount: Number(i.lateFeeAmount),
        })),
      })),
      paymentHistory: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        fee: Number(p.fee),
        provider: p.provider,
        providerReference: p.providerReference,
        status: p.status,
        createdAt: p.createdAt,
      })),
      upcomingPayments: upcomingInsts.slice(0, 12).map((i) => ({
        installmentId: i.id,
        subscriptionId: i.subscriptionId,
        amount: Number(i.amount),
        dueDate: i.dueDate,
        planName: subs.find((s) => s.installments?.includes(i))?.plan?.catalogItem?.name || 'Unknown',
      })),
    };
  }

  async getCooperativeStatement(orgId: string, days?: number) {
    if (!UUID_RE.test(orgId)) throw new NotFoundException('Organization not found');
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    const since = days ? new Date(Date.now() - days * 86400000) : new Date(0);

    const plans = await this.planRepo.find({ where: { organizationId: orgId } });
    const planIds = plans.map((p) => p.id);

    const subs = await this.subRepo.find({
      where: { planId: In(planIds) },
      relations: { plan: { catalogItem: true }, installments: true },
    });

    const users = await this.userRepo.find({ where: { organizationId: orgId } });
    const userIds = users.map((u) => u.id);

    const payments = await this.paymentRepo.find({
      where: { userId: In(userIds), createdAt: Between(since, new Date()) },
    });

    const allInsts = subs.flatMap((s) => s.installments || []);
    const totalVolume = subs.reduce((s, sub) => s + Number(sub.totalAmount), 0);
    const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
    const outstandingInsts = allInsts.filter((i) =>
      (i.status === InstallmentStatus.PENDING || i.status === InstallmentStatus.OVERDUE)
      && new Date(i.dueDate) < new Date(),
    );
    const totalOutstanding = outstandingInsts.reduce((s, i) => s + Number(i.amount), 0);
    const totalLateFees = outstandingInsts.reduce((s, i) => s + Number(i.lateFeeAmount), 0);

    return {
      cooperative: { id: org.id, name: org.name, code: org.code },
      summary: {
        totalMembers: users.length,
        activeSubscriptions: subs.filter((s) => s.status === SubscriptionStatus.ACTIVE_REPAYMENT).length,
        totalVolume: Math.round(totalVolume * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalLateFees: Math.round(totalLateFees * 100) / 100,
        paymentRate: totalVolume > 0 ? Math.round((totalCollected / totalVolume) * 10000) / 100 : 0,
      },
      repaymentSchedule: subs.map((s) => ({
        subscriptionId: s.id,
        memberId: s.userId,
        planName: s.plan?.catalogItem?.name || 'Unknown',
        totalAmount: Number(s.totalAmount),
        amountPaid: Number(s.amountPaid),
        outstanding: Number(s.totalAmount) - Number(s.amountPaid),
        status: s.status,
        installmentCount: s.installments?.length || 0,
        paidInstallments: s.installments?.filter((i) => i.status === 'paid').length || 0,
      })),
      agingSummary: [
        { label: '0-30 days', count: outstandingInsts.filter((i) => {
          const d = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / 86400000);
          return d >= 0 && d <= 30;
        }).length },
        { label: '31-60 days', count: outstandingInsts.filter((i) => {
          const d = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / 86400000);
          return d >= 31 && d <= 60;
        }).length },
        { label: '61-90 days', count: outstandingInsts.filter((i) => {
          const d = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / 86400000);
          return d >= 61 && d <= 90;
        }).length },
        { label: '90+ days', count: outstandingInsts.filter((i) => {
          const d = Math.floor((Date.now() - new Date(i.dueDate).getTime()) / 86400000);
          return d > 90;
        }).length },
      ],
    };
  }

  async exportMemberStatementCsv(userId: string): Promise<string> {
    const stmt = await this.getMemberStatement(userId);
    const lines: string[] = [
      `Member Statement - ${stmt.member.name} (${stmt.member.email})`,
      `Generated: ${new Date().toISOString()}`,
      '',
      '=== Summary ===',
      `Total Subscriptions,${stmt.summary.totalSubscriptions}`,
      `Active Subscriptions,${stmt.summary.activeSubscriptions}`,
      `Total Billed (₦),${stmt.summary.totalBilled}`,
      `Total Paid (₦),${stmt.summary.totalPaid}`,
      `Outstanding (₦),${stmt.summary.outstanding}`,
      `Total Late Fees (₦),${stmt.summary.totalLateFees}`,
      `Paid MTD (₦),${stmt.summary.paidMtd}`,
      '',
      '=== Repayment Schedule ===',
      'Subscription ID,Plan,Total Amount,Amount Paid,Outstanding,Status',
      ...stmt.repaymentSchedule.map((s) => `"${s.subscriptionId}","${s.planName}",${s.totalAmount},${s.amountPaid},${s.outstanding},"${s.status}"`),
      '',
      '=== Payment History ===',
      'Payment ID,Amount,Fee,Provider,Reference,Status,Date',
      ...stmt.paymentHistory.map((p) => `"${p.id}",${p.amount},${p.fee},"${p.provider}","${p.providerReference}","${p.status}","${p.createdAt.toISOString()}"`),
    ];
    return lines.join('\n');
  }

  async exportCooperativeStatementCsv(orgId: string): Promise<string> {
    const stmt = await this.getCooperativeStatement(orgId);
    const lines: string[] = [
      `Cooperative Statement - ${stmt.cooperative.name} (${stmt.cooperative.code})`,
      `Generated: ${new Date().toISOString()}`,
      '',
      '=== Summary ===',
      `Total Members,${stmt.summary.totalMembers}`,
      `Active Subscriptions,${stmt.summary.activeSubscriptions}`,
      `Total Volume (₦),${stmt.summary.totalVolume}`,
      `Total Collected (₦),${stmt.summary.totalCollected}`,
      `Total Outstanding (₦),${stmt.summary.totalOutstanding}`,
      `Total Late Fees (₦),${stmt.summary.totalLateFees}`,
      `Payment Rate (%),${stmt.summary.paymentRate}`,
      '',
      '=== Repayment Schedule ===',
      'Subscription ID,Member ID,Plan,Total Amount,Amount Paid,Outstanding,Status,Installments,Paid',
      ...stmt.repaymentSchedule.map((s) => `"${s.subscriptionId}","${s.memberId}","${s.planName}",${s.totalAmount},${s.amountPaid},${s.outstanding},"${s.status}",${s.installmentCount},${s.paidInstallments}`),
      '',
      '=== Aging Summary ===',
      'Bucket,Count',
      ...stmt.agingSummary.map((a) => `"${a.label}",${a.count}`),
    ];
    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════════
  //  COMPLIANCE & AUDIT SUPPORT
  // ═══════════════════════════════════════════════════════════════

  async getFinancialAuditLog(days?: number, action?: string, limit?: number) {
    const since = days ? new Date(Date.now() - days * 86400000) : new Date(Date.now() - 30 * 86400000);
    const where: any = { createdAt: Between(since, new Date()) };

    const financialActions = [
      'reconciliation_run',
      'reconciliation_export',
      'adjustment_request',
      'adjustment_approval',
      'adjustment_rejection',
      'statement_export',
      'payment_override',
      'journal_entry',
    ];

    if (action) {
      where.action = action;
    } else {
      where.action = In(financialActions);
    }

    return this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit || 200,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  UNIFIED TRANSACTION REGISTER
  // ═══════════════════════════════════════════════════════════════

  async getTransactionRegister(dto: {
    source?: string;
    orgId?: string;
    days?: number;
    limit?: number;
    offset?: number;
  }) {
    const since = dto.days ? new Date(Date.now() - dto.days * 86400000) : new Date(Date.now() - 90 * 86400000);
    const limit = dto.limit || 200;
    const offset = dto.offset || 0;
    const transactions: any[] = [];

    const promises: Promise<void>[] = [];

    // 1. Payments
    if (!dto.source || dto.source === 'payment') {
      promises.push((async () => {
        const where: any = { createdAt: Between(since, new Date()) };
        const items = await this.paymentRepo.find({ where, order: { createdAt: 'DESC' }, take: limit });
        for (const p of items) {
          transactions.push({
            id: p.id,
            date: p.createdAt,
            type: 'payment',
            source: 'payment',
            description: `Payment via ${p.provider}`,
            debit: 0,
            credit: Number(p.amount),
            fee: Number(p.fee),
            reference: p.providerReference,
            status: p.status,
            userId: p.userId,
            subscriptionId: p.subscriptionId,
          });
        }
      })());
    }

    // 2. BNPL Installments
    if (!dto.source || dto.source === 'bnpl_installment') {
      promises.push((async () => {
        const where: any = { createdAt: Between(since, new Date()) };
        const items = await this.instRepo.find({ where, relations: { subscription: { plan: { catalogItem: true } } }, order: { createdAt: 'DESC' }, take: limit });
        for (const i of items) {
          transactions.push({
            id: i.id,
            date: i.createdAt,
            type: 'bnpl_installment',
            source: 'bnpl',
            description: `Installment for ${i.subscription?.plan?.catalogItem?.name || 'Unknown'}`,
            debit: Number(i.amount),
            credit: 0,
            fee: Number(i.lateFeeAmount),
            reference: i.paymentReference || '',
            status: i.status,
            userId: i.subscription?.userId,
            subscriptionId: i.subscriptionId,
            dueDate: i.dueDate,
          });
        }
      })());
    }

    // 3. BNPL Subscriptions (order-level)
    if (!dto.source || dto.source === 'bnpl_subscription') {
      promises.push((async () => {
        const where: any = { createdAt: Between(since, new Date()) };
        const items = await this.subRepo.find({ where, relations: { plan: { catalogItem: true } }, order: { createdAt: 'DESC' }, take: limit });
        for (const s of items) {
          transactions.push({
            id: s.id,
            date: s.createdAt,
            type: 'bnpl_subscription',
            source: 'bnpl',
            description: `Order: ${s.plan?.catalogItem?.name || 'Unknown'}`,
            debit: Number(s.totalAmount),
            credit: Number(s.amountPaid),
            fee: 0,
            reference: s.providerReference || '',
            status: s.status,
            userId: s.userId,
            subscriptionId: s.id,
            payoutStatus: s.payoutStatus,
          });
        }
      })());
    }

    // 4. Loan disbursements
    if (!dto.source || dto.source === 'loan') {
      promises.push((async () => {
        const where: any = { createdAt: Between(since, new Date()) };
        const items = await this.loanRepo.find({ where, order: { createdAt: 'DESC' }, take: limit });
        for (const l of items) {
          transactions.push({
            id: l.id,
            date: l.createdAt,
            type: 'loan_disbursement',
            source: 'loan',
            description: `Loan: ${l.purpose || 'No purpose'} (${l.duration}mo @ ${l.interestRate}%)`,
            debit: Number(l.amount),
            credit: Number(l.amountPaid),
            fee: 0,
            reference: '',
            status: l.status,
            userId: l.userId,
            totalRepayment: Number(l.totalRepayment),
          });
        }
      })());
    }

    // 5. Loan repayments
    if (!dto.source || dto.source === 'loan_repayment') {
      promises.push((async () => {
        const where: any = { createdAt: Between(since, new Date()) };
        const items = await this.loanRepayRepo.find({ where, relations: { loan: true }, order: { createdAt: 'DESC' }, take: limit });
        for (const r of items) {
          transactions.push({
            id: r.id,
            date: r.createdAt,
            type: 'loan_repayment',
            source: 'loan',
            description: `Loan repayment ${r.paymentReference ? `(${r.paymentReference})` : ''}`,
            debit: 0,
            credit: Number(r.amount),
            fee: 0,
            reference: r.paymentReference || '',
            status: r.status,
            loanId: r.loanId,
            dueDate: r.dueDate,
          });
        }
      })());
    }

    // 6. Savings transactions
    if (!dto.source || dto.source === 'savings') {
      promises.push((async () => {
        const where: any = { createdAt: Between(since, new Date()) };
        const items = await this.savTxRepo.find({ where, relations: { account: true }, order: { createdAt: 'DESC' }, take: limit });
        for (const t of items) {
          transactions.push({
            id: t.id,
            date: t.createdAt,
            type: `savings_${t.type}`,
            source: 'savings',
            description: t.description || `Savings ${t.type}`,
            debit: t.type === 'withdrawal' ? Number(t.amount) : 0,
            credit: t.type === 'deposit' ? Number(t.amount) : 0,
            fee: 0,
            reference: '',
            status: 'completed',
            userId: t.account?.userId,
            balanceBefore: Number(t.balanceBefore),
            balanceAfter: Number(t.balanceAfter),
          });
        }
      })());
    }

    // 7. Journal entries (posted only)
    if (!dto.source || dto.source === 'journal') {
      promises.push((async () => {
        const items = await this.journalRepo.find({
          where: { status: JournalStatus.POSTED, createdAt: Between(since, new Date()) },
          relations: { lines: true },
          order: { createdAt: 'DESC' },
          take: limit,
        });
        for (const j of items) {
          const totalDebit = j.lines.reduce((s, l) => s + Number(l.debit), 0);
          const totalCredit = j.lines.reduce((s, l) => s + Number(l.credit), 0);
          transactions.push({
            id: j.id,
            date: j.createdAt,
            type: 'journal_entry',
            source: 'ledger',
            description: j.description || 'Journal entry',
            debit: totalDebit,
            credit: totalCredit,
            fee: 0,
            reference: '',
            status: 'posted',
            entryDate: j.entryDate,
            lineCount: j.lines.length,
            postedBy: j.postedBy,
          });
        }
      })());
    }

    // 8. Fee shares
    if (!dto.source || dto.source === 'fee_share') {
      promises.push((async () => {
        const where: any = { createdAt: Between(since, new Date()) };
        const items = await this.feeShareRepo.find({ where, order: { createdAt: 'DESC' }, take: limit });
        for (const f of items) {
          transactions.push({
            id: f.id,
            date: f.createdAt,
            type: 'fee_share',
            source: 'fees',
            description: `Fee split: ${f.source}`,
            debit: Number(f.totalFee),
            credit: 0,
            fee: 0,
            reference: '',
            status: 'completed',
            paymentId: f.paymentId,
            organizationId: f.organizationId,
            platformShare: Number(f.platformShare),
            organizationShare: Number(f.organizationShare),
            apexShare: Number(f.apexShare),
            superAdminShare: Number(f.superAdminShare),
          });
        }
      })());
    }

    await Promise.all(promises);

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = transactions.length;
    const paged = transactions.slice(offset, offset + limit);

    return {
      total,
      limit,
      offset,
      returned: paged.length,
      transactions: paged,
    };
  }

  async getDashboard() {
    const pots = await this.feePotRepo.find();
    const totalPots = pots.length;
    const totalBalance = pots.reduce((s, p) => s + Number(p.balance), 0);
    const pendingRecs = await this.recRunRepo.count({ where: { status: ReconciliationStatus.IN_PROGRESS } });
    const pendingAdjs = await this.adjRepo.count({ where: { status: AdjustmentStatus.PENDING } });
    const pendingEntries = await this.journalRepo.count({ where: { status: JournalStatus.DRAFT } });
    const pendingWithdrawals = await this.withdrawalRepo.count({ where: { status: PayoutStatus.PENDING } });

    const platformPot = pots.find((p) => p.potType === 'platform');
    const adminPot = pots.find((p) => p.potType === 'admin');

    const totalSavings = await this.savAcctRepo
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.balance), 0)', 'total')
      .getRawOne()
      .then((r) => Number(r?.total || 0));

    const totalWithdrawals = await this.savTxRepo
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.type = :type', { type: TransactionType.WITHDRAWAL })
      .getRawOne()
      .then((r) => Number(r?.total || 0));

    const totalLoans = await this.loanRepo
      .createQueryBuilder('l')
      .select('COALESCE(SUM(l.amount), 0)', 'total')
      .where('l.status IN (:...statuses)', { statuses: [LoanStatus.ACTIVE, LoanStatus.COMPLETED] })
      .getRawOne()
      .then((r) => Number(r?.total || 0));

    const totalDividends = await this.distributionRepo
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.total_pool), 0)', 'total')
      .where('d.status IN (:...statuses)', { statuses: [DistributionStatus.EXECUTED, DistributionStatus.APPROVED] })
      .getRawOne()
      .then((r) => Number(r?.total || 0));

    const totalFeeIncome = await this.feeShareRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.total_fee), 0)', 'total')
      .getRawOne()
      .then((r) => Number(r?.total || 0));

    const totalMembers = await this.userRepo.count();

    const bnplOutstanding = await this.subRepo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.total_amount - s.amount_paid), 0)', 'total')
      .where('s.status NOT IN (:...statuses)', { statuses: [SubscriptionStatus.SETTLED] })
      .getRawOne()
      .then((r) => Number(r?.total || 0));

    const bnplVolume = await this.subRepo
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.total_amount), 0)', 'total')
      .getRawOne()
      .then((r) => Number(r?.total || 0));

    const postedEntries = await this.journalRepo.count({ where: { status: JournalStatus.POSTED } });

    return {
      totalPots,
      totalBalance,
      platformBalance: platformPot ? Number(platformPot.balance) : 0,
      adminBalance: adminPot ? Number(adminPot.balance) : 0,
      pendingReconciliations: pendingRecs,
      pendingAdjustments: pendingAdjs,
      pendingJournalEntries: pendingEntries,
      pendingFeeWithdrawals: pendingWithdrawals,
      totalSavings,
      totalWithdrawals,
      totalLoans,
      totalDividends,
      totalFeeIncome,
      totalMembers,
      bnplOutstanding,
      bnplVolume,
      postedJournalEntries: postedEntries,
    };
  }

  async exportTransactionRegisterCsv(dto: { source?: string; days?: number }): Promise<string> {
    const result = await this.getTransactionRegister({ ...dto, limit: 5000 });
    const header = 'Date,Type,Source,Description,Debit,Credit,Fee,Reference,Status,User ID,Subscription ID\n';
    return header + result.transactions.map((t: any) =>
      `"${new Date(t.date).toISOString()}","${t.type}","${t.source}","${(t.description || '').replace(/"/g, '""')}",${t.debit},${t.credit},${t.fee},"${t.reference || ''}","${t.status}","${t.userId || ''}","${t.subscriptionId || ''}"`
    ).join('\n');
  }
}
