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
exports.AccountantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const bnpl_plan_entity_1 = require("../bnpl/entities/bnpl-plan.entity");
const bnpl_catalog_item_entity_1 = require("../bnpl/entities/bnpl-catalog-item.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const fee_share_ledger_entity_1 = require("../ledger/entities/fee-share-ledger.entity");
const fee_pot_entity_1 = require("../ledger/entities/fee-pot.entity");
const distribution_entity_1 = require("../investments/entities/distribution.entity");
const fee_withdrawal_request_entity_1 = require("../ledger/entities/fee-withdrawal-request.entity");
const savings_transaction_entity_1 = require("../savings/entities/savings-transaction.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_entity_1 = require("../users/entities/user.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const reconciliation_run_entity_1 = require("./entities/reconciliation-run.entity");
const reconciliation_result_entity_1 = require("./entities/reconciliation-result.entity");
const adjustment_request_entity_1 = require("./entities/adjustment-request.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const loan_entity_1 = require("../loans/entities/loan.entity");
const loan_repayment_entity_1 = require("../loans/entities/loan-repayment.entity");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const savings_transaction_entity_2 = require("../savings/entities/savings-transaction.entity");
const journal_entry_entity_1 = require("../ledger/entities/journal-entry.entity");
const journal_line_entity_1 = require("../ledger/entities/journal-line.entity");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let AccountantService = class AccountantService {
    subRepo;
    instRepo;
    planRepo;
    catalogRepo;
    paymentRepo;
    feeShareRepo;
    orgRepo;
    userRepo;
    auditRepo;
    recRunRepo;
    recResultRepo;
    adjRepo;
    loanRepo;
    loanRepayRepo;
    savAcctRepo;
    savTxRepo;
    journalRepo;
    journalLineRepo;
    feePotRepo;
    distributionRepo;
    withdrawalRepo;
    constructor(subRepo, instRepo, planRepo, catalogRepo, paymentRepo, feeShareRepo, orgRepo, userRepo, auditRepo, recRunRepo, recResultRepo, adjRepo, loanRepo, loanRepayRepo, savAcctRepo, savTxRepo, journalRepo, journalLineRepo, feePotRepo, distributionRepo, withdrawalRepo) {
        this.subRepo = subRepo;
        this.instRepo = instRepo;
        this.planRepo = planRepo;
        this.catalogRepo = catalogRepo;
        this.paymentRepo = paymentRepo;
        this.feeShareRepo = feeShareRepo;
        this.orgRepo = orgRepo;
        this.userRepo = userRepo;
        this.auditRepo = auditRepo;
        this.recRunRepo = recRunRepo;
        this.recResultRepo = recResultRepo;
        this.adjRepo = adjRepo;
        this.loanRepo = loanRepo;
        this.loanRepayRepo = loanRepayRepo;
        this.savAcctRepo = savAcctRepo;
        this.savTxRepo = savTxRepo;
        this.journalRepo = journalRepo;
        this.journalLineRepo = journalLineRepo;
        this.feePotRepo = feePotRepo;
        this.distributionRepo = distributionRepo;
        this.withdrawalRepo = withdrawalRepo;
    }
    async getOrderLedger(orgId, days) {
        const where = {};
        if (orgId) {
            const plans = await this.planRepo.find({ where: { organizationId: orgId } });
            where.planId = (0, typeorm_2.In)(plans.map((p) => p.id));
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
    async getInstallmentLedger(orgId, days) {
        const since = days ? new Date(Date.now() - days * 86400000) : undefined;
        const where = {};
        if (since)
            where.createdAt = (0, typeorm_2.Between)(since, new Date());
        const insts = await this.instRepo.find({
            where,
            relations: { subscription: { plan: { catalogItem: true } } },
            order: { createdAt: 'DESC' },
            take: 1000,
        });
        let filtered = insts;
        if (orgId)
            filtered = insts.filter((i) => i.subscription?.plan?.organizationId === orgId);
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
    async getPaymentReferences(orgId, days) {
        const since = days ? new Date(Date.now() - days * 86400000) : undefined;
        const where = {};
        if (since)
            where.createdAt = (0, typeorm_2.Between)(since, new Date());
        const payments = await this.paymentRepo.find({ where, order: { createdAt: 'DESC' }, take: 500 });
        let filtered = payments;
        if (orgId) {
            const subs = await this.subRepo.find({
                where: { planId: (0, typeorm_2.In)((await this.planRepo.find({ where: { organizationId: orgId } })).map((p) => p.id)) },
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
    async getSettlementReferences(orgId, days) {
        const since = days ? new Date(Date.now() - days * 86400000) : undefined;
        const where = { payoutStatus: 'completed' };
        if (since)
            where.createdAt = (0, typeorm_2.Between)(since, new Date());
        const payments = await this.paymentRepo.find({ where, order: { createdAt: 'DESC' }, take: 500 });
        let filtered = payments;
        if (orgId) {
            const subs = await this.subRepo.find({
                where: { planId: (0, typeorm_2.In)((await this.planRepo.find({ where: { organizationId: orgId } })).map((p) => p.id)) },
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
    async exportOrderLedgerCsv(orgId, days) {
        const rows = await this.getOrderLedger(orgId, days);
        const header = 'ID,Plan,Status,Total Amount,Amount Paid,Down Payment,Outstanding,Provider Ref,Disbursement Ref,Payout Status,Installments,Paid,Created At,Settled At\n';
        return header + rows.map((r) => `"${r.id}","${r.planName}","${r.status}",${r.totalAmount},${r.amountPaid},${r.downPayment},${r.outstanding},"${r.providerReference || ''}","${r.disbursementReference || ''}","${r.payoutStatus}",${r.installmentCount},${r.paidInstallments},"${r.createdAt?.toISOString() || ''}","${r.settledAt?.toISOString() || ''}"`).join('\n');
    }
    async exportInstallmentLedgerCsv(orgId, days) {
        const rows = await this.getInstallmentLedger(orgId, days);
        const header = 'ID,Subscription ID,Plan,Amount,Late Fee,Due Date,Status,Paid At,Payment Reference,Organization ID,Created At\n';
        return header + rows.map((r) => `"${r.id}","${r.subscriptionId}","${r.planName}",${r.amount},${r.lateFeeAmount},"${String(r.dueDate).slice(0, 10) || ''}","${r.status}","${r.paidAt ? new Date(r.paidAt).toISOString() : ''}","${r.paymentReference || ''}","${r.organizationId || ''}","${new Date(r.createdAt).toISOString()}"`).join('\n');
    }
    async exportPaymentReferencesCsv(orgId, days) {
        const rows = await this.getPaymentReferences(orgId, days);
        const header = 'ID,Subscription ID,Amount,Fee,Provider,Provider Reference,Status,Payout Status,Payout Reference,Created At\n';
        return header + rows.map((r) => `"${r.id}","${r.subscriptionId || ''}",${r.amount},${r.fee},"${r.provider}","${r.providerReference}","${r.status}","${r.payoutStatus}","${r.payoutReference || ''}","${r.createdAt?.toISOString() || ''}"`).join('\n');
    }
    async exportSettlementReferencesCsv(orgId, days) {
        const rows = await this.getSettlementReferences(orgId, days);
        const header = 'ID,Subscription ID,Amount,Provider,Provider Reference,Payout Reference,Payout Status,Settled At\n';
        return header + rows.map((r) => `"${r.id}","${r.subscriptionId || ''}",${r.amount},"${r.provider}","${r.providerReference}","${r.payoutReference || ''}","${r.payoutStatus}","${new Date(r.settledAt).toISOString()}"`).join('\n');
    }
    async runReconciliation(dto) {
        const start = new Date(dto.rangeStart);
        const end = new Date(dto.rangeEnd);
        const run = this.recRunRepo.create({
            rangeStart: start,
            rangeEnd: end,
            organizationId: dto.organizationId,
            runBy: dto.runBy,
            status: reconciliation_run_entity_1.ReconciliationStatus.IN_PROGRESS,
        });
        const savedRun = await this.recRunRepo.save(run);
        const wherePlans = {};
        if (dto.organizationId)
            wherePlans.organizationId = dto.organizationId;
        const plans = await this.planRepo.find({ where: wherePlans });
        const planIds = plans.map((p) => p.id);
        const subs = await this.subRepo.find({
            where: { planId: (0, typeorm_2.In)(planIds) },
            relations: { installments: true },
        });
        const results = [];
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
                    where: { subscriptionId: sub.id, status: status_enum_1.PaymentStatus.SUCCESS, createdAt: (0, typeorm_2.Between)(start, end) },
                });
                const actualAmount = payments.reduce((s, p) => s + Number(p.amount), 0);
                actualAmountTotal += actualAmount;
                const hasPayment = payments.length > 0;
                const amountMatch = Math.abs(expectedAmount - actualAmount) < 0.01;
                const hasWebhook = inst.paymentReference != null;
                const flags = [];
                if (!hasPayment)
                    flags.push('missing_payment');
                if (!amountMatch && hasPayment)
                    flags.push('amount_mismatch');
                if (!hasWebhook && hasPayment)
                    flags.push('missing_webhook');
                let status;
                if (amountMatch && hasWebhook) {
                    status = reconciliation_result_entity_1.ResultStatus.MATCHED;
                    matchCount++;
                }
                else if (!hasPayment && !hasWebhook) {
                    status = reconciliation_result_entity_1.ResultStatus.UNMATCHED;
                    mismatchCount++;
                }
                else {
                    status = reconciliation_result_entity_1.ResultStatus.NEEDS_REVIEW;
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
            await this.recResultRepo.insert(results);
        }
        savedRun.status = reconciliation_run_entity_1.ReconciliationStatus.COMPLETED;
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
    async getReconciliationRuns(organizationId) {
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        return this.recRunRepo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
    }
    async getReconciliationRun(id) {
        const run = await this.recRunRepo.findOne({ where: { id }, relations: { results: true } });
        if (!run)
            throw new common_1.NotFoundException('Reconciliation run not found');
        return run;
    }
    async getReconciliationResults(runId, status) {
        const where = { runId };
        if (status)
            where.status = status;
        return this.recResultRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 500,
        });
    }
    async exportReconciliationCsv(runId) {
        const results = await this.recResultRepo.find({ where: { runId }, order: { createdAt: 'DESC' } });
        const header = 'Installment ID,Subscription ID,Expected Amount,Actual Amount,Discrepancy,Expected Date,Actual Date,Status,Flags,Notes\n';
        return header + results.map((r) => `"${r.installmentId || ''}","${r.subscriptionId}",${r.expectedAmount},${r.actualAmount},${r.discrepancy},"${String(r.expectedDate).slice(0, 10) || ''}","${r.actualDate ? String(r.actualDate).slice(0, 10) : ''}","${r.status}","${(r.flags || []).join(';')}","${r.notes || ''}"`).join('\n');
    }
    async updateReconciliationResult(id, dto) {
        const result = await this.recResultRepo.findOne({ where: { id } });
        if (!result)
            throw new common_1.NotFoundException('Reconciliation result not found');
        result.status = dto.status;
        if (dto.notes !== undefined)
            result.notes = dto.notes;
        return this.recResultRepo.save(result);
    }
    async createAdjustmentRequest(dto) {
        const req = this.adjRepo.create({ ...dto, status: adjustment_request_entity_1.AdjustmentStatus.PENDING });
        return this.adjRepo.save(req);
    }
    async listAdjustmentRequests(status) {
        const where = {};
        if (status)
            where.status = status;
        return this.adjRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
    }
    async getAdjustmentRequest(id) {
        const req = await this.adjRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Adjustment request not found');
        return req;
    }
    async approveAdjustmentRequest(id, reviewedBy) {
        const req = await this.adjRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Adjustment request not found');
        if (req.status !== adjustment_request_entity_1.AdjustmentStatus.PENDING)
            throw new common_1.BadRequestException('Adjustment is not pending');
        req.status = adjustment_request_entity_1.AdjustmentStatus.APPROVED;
        req.reviewedBy = reviewedBy;
        req.reviewedAt = new Date();
        return this.adjRepo.save(req);
    }
    async rejectAdjustmentRequest(id, reviewedBy, reason) {
        const req = await this.adjRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Adjustment request not found');
        if (req.status !== adjustment_request_entity_1.AdjustmentStatus.PENDING)
            throw new common_1.BadRequestException('Adjustment is not pending');
        req.status = adjustment_request_entity_1.AdjustmentStatus.REJECTED;
        req.reviewedBy = reviewedBy;
        req.reviewedAt = new Date();
        req.rejectionReason = reason;
        return this.adjRepo.save(req);
    }
    async getMemberStatement(userId, days) {
        if (!UUID_RE.test(userId))
            throw new common_1.NotFoundException('User not found');
        const since = days ? new Date(Date.now() - days * 86400000) : new Date(0);
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const subs = await this.subRepo.find({
            where: { userId },
            relations: { plan: { catalogItem: true }, installments: true },
            order: { createdAt: 'DESC' },
        });
        const payments = await this.paymentRepo.find({
            where: { userId, createdAt: (0, typeorm_2.Between)(since, new Date()) },
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
                activeSubscriptions: subs.filter((s) => s.status === status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT).length,
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
    async getCooperativeStatement(orgId, days) {
        if (!UUID_RE.test(orgId))
            throw new common_1.NotFoundException('Organization not found');
        const org = await this.orgRepo.findOne({ where: { id: orgId } });
        if (!org)
            throw new common_1.NotFoundException('Organization not found');
        const since = days ? new Date(Date.now() - days * 86400000) : new Date(0);
        const plans = await this.planRepo.find({ where: { organizationId: orgId } });
        const planIds = plans.map((p) => p.id);
        const subs = await this.subRepo.find({
            where: { planId: (0, typeorm_2.In)(planIds) },
            relations: { plan: { catalogItem: true }, installments: true },
        });
        const users = await this.userRepo.find({ where: { organizationId: orgId } });
        const userIds = users.map((u) => u.id);
        const payments = await this.paymentRepo.find({
            where: { userId: (0, typeorm_2.In)(userIds), createdAt: (0, typeorm_2.Between)(since, new Date()) },
        });
        const allInsts = subs.flatMap((s) => s.installments || []);
        const totalVolume = subs.reduce((s, sub) => s + Number(sub.totalAmount), 0);
        const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
        const outstandingInsts = allInsts.filter((i) => (i.status === status_enum_1.InstallmentStatus.PENDING || i.status === status_enum_1.InstallmentStatus.OVERDUE)
            && new Date(i.dueDate) < new Date());
        const totalOutstanding = outstandingInsts.reduce((s, i) => s + Number(i.amount), 0);
        const totalLateFees = outstandingInsts.reduce((s, i) => s + Number(i.lateFeeAmount), 0);
        return {
            cooperative: { id: org.id, name: org.name, code: org.code },
            summary: {
                totalMembers: users.length,
                activeSubscriptions: subs.filter((s) => s.status === status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT).length,
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
    async exportMemberStatementCsv(userId) {
        const stmt = await this.getMemberStatement(userId);
        const lines = [
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
    async exportCooperativeStatementCsv(orgId) {
        const stmt = await this.getCooperativeStatement(orgId);
        const lines = [
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
    async getFinancialAuditLog(days, action, limit) {
        const since = days ? new Date(Date.now() - days * 86400000) : new Date(Date.now() - 30 * 86400000);
        const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
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
        }
        else {
            where.action = (0, typeorm_2.In)(financialActions);
        }
        return this.auditRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: limit || 200,
        });
    }
    async getTransactionRegister(dto) {
        const since = dto.days ? new Date(Date.now() - dto.days * 86400000) : new Date(Date.now() - 90 * 86400000);
        const limit = dto.limit || 200;
        const offset = dto.offset || 0;
        const transactions = [];
        const promises = [];
        if (!dto.source || dto.source === 'payment') {
            promises.push((async () => {
                const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
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
        if (!dto.source || dto.source === 'bnpl_installment') {
            promises.push((async () => {
                const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
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
        if (!dto.source || dto.source === 'bnpl_subscription') {
            promises.push((async () => {
                const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
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
        if (!dto.source || dto.source === 'loan') {
            promises.push((async () => {
                const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
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
        if (!dto.source || dto.source === 'loan_repayment') {
            promises.push((async () => {
                const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
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
        if (!dto.source || dto.source === 'savings') {
            promises.push((async () => {
                const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
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
        if (!dto.source || dto.source === 'journal') {
            promises.push((async () => {
                const items = await this.journalRepo.find({
                    where: { status: status_enum_1.JournalStatus.POSTED, createdAt: (0, typeorm_2.Between)(since, new Date()) },
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
        if (!dto.source || dto.source === 'fee_share') {
            promises.push((async () => {
                const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
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
        const pendingRecs = await this.recRunRepo.count({ where: { status: reconciliation_run_entity_1.ReconciliationStatus.IN_PROGRESS } });
        const pendingAdjs = await this.adjRepo.count({ where: { status: adjustment_request_entity_1.AdjustmentStatus.PENDING } });
        const pendingEntries = await this.journalRepo.count({ where: { status: status_enum_1.JournalStatus.DRAFT } });
        const pendingWithdrawals = await this.withdrawalRepo.count({ where: { status: status_enum_1.PayoutStatus.PENDING } });
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
            .where('t.type = :type', { type: savings_transaction_entity_1.TransactionType.WITHDRAWAL })
            .getRawOne()
            .then((r) => Number(r?.total || 0));
        const totalLoans = await this.loanRepo
            .createQueryBuilder('l')
            .select('COALESCE(SUM(l.amount), 0)', 'total')
            .where('l.status IN (:...statuses)', { statuses: [loan_entity_1.LoanStatus.ACTIVE, loan_entity_1.LoanStatus.COMPLETED] })
            .getRawOne()
            .then((r) => Number(r?.total || 0));
        const totalDividends = await this.distributionRepo
            .createQueryBuilder('d')
            .select('COALESCE(SUM(d.total_pool), 0)', 'total')
            .where('d.status IN (:...statuses)', { statuses: [distribution_entity_1.DistributionStatus.EXECUTED, distribution_entity_1.DistributionStatus.APPROVED] })
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
            .where('s.status NOT IN (:...statuses)', { statuses: [status_enum_1.SubscriptionStatus.SETTLED] })
            .getRawOne()
            .then((r) => Number(r?.total || 0));
        const bnplVolume = await this.subRepo
            .createQueryBuilder('s')
            .select('COALESCE(SUM(s.total_amount), 0)', 'total')
            .getRawOne()
            .then((r) => Number(r?.total || 0));
        const postedEntries = await this.journalRepo.count({ where: { status: status_enum_1.JournalStatus.POSTED } });
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
    async exportTransactionRegisterCsv(dto) {
        const result = await this.getTransactionRegister({ ...dto, limit: 5000 });
        const header = 'Date,Type,Source,Description,Debit,Credit,Fee,Reference,Status,User ID,Subscription ID\n';
        return header + result.transactions.map((t) => `"${new Date(t.date).toISOString()}","${t.type}","${t.source}","${(t.description || '').replace(/"/g, '""')}",${t.debit},${t.credit},${t.fee},"${t.reference || ''}","${t.status}","${t.userId || ''}","${t.subscriptionId || ''}"`).join('\n');
    }
};
exports.AccountantService = AccountantService;
exports.AccountantService = AccountantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(2, (0, typeorm_1.InjectRepository)(bnpl_plan_entity_1.BnplPlan)),
    __param(3, (0, typeorm_1.InjectRepository)(bnpl_catalog_item_entity_1.BnplCatalogItem)),
    __param(4, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(5, (0, typeorm_1.InjectRepository)(fee_share_ledger_entity_1.FeeShareLedger)),
    __param(6, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(7, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(8, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(9, (0, typeorm_1.InjectRepository)(reconciliation_run_entity_1.ReconciliationRun)),
    __param(10, (0, typeorm_1.InjectRepository)(reconciliation_result_entity_1.ReconciliationResult)),
    __param(11, (0, typeorm_1.InjectRepository)(adjustment_request_entity_1.AdjustmentRequest)),
    __param(12, (0, typeorm_1.InjectRepository)(loan_entity_1.Loan)),
    __param(13, (0, typeorm_1.InjectRepository)(loan_repayment_entity_1.LoanRepayment)),
    __param(14, (0, typeorm_1.InjectRepository)(savings_account_entity_1.SavingsAccount)),
    __param(15, (0, typeorm_1.InjectRepository)(savings_transaction_entity_2.SavingsTransaction)),
    __param(16, (0, typeorm_1.InjectRepository)(journal_entry_entity_1.JournalEntry)),
    __param(17, (0, typeorm_1.InjectRepository)(journal_line_entity_1.JournalLine)),
    __param(18, (0, typeorm_1.InjectRepository)(fee_pot_entity_1.FeePot)),
    __param(19, (0, typeorm_1.InjectRepository)(distribution_entity_1.Distribution)),
    __param(20, (0, typeorm_1.InjectRepository)(fee_withdrawal_request_entity_1.FeeWithdrawalRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AccountantService);
//# sourceMappingURL=accountant.service.js.map