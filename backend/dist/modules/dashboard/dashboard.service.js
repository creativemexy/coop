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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const users_service_1 = require("../users/users.service");
const subscriptions_service_1 = require("../bnpl/services/subscriptions.service");
const fee_pot_service_1 = require("../ledger/services/fee-pot.service");
const savings_service_1 = require("../savings/savings.service");
const savings_transaction_entity_1 = require("../savings/entities/savings-transaction.entity");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const loans_service_1 = require("../loans/loans.service");
const loan_repayment_entity_1 = require("../loans/entities/loan-repayment.entity");
const loan_entity_1 = require("../loans/entities/loan.entity");
const user_entity_1 = require("../users/entities/user.entity");
const apex_organization_entity_1 = require("../apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const bnpl_plan_entity_1 = require("../bnpl/entities/bnpl-plan.entity");
const bnpl_catalog_item_entity_1 = require("../bnpl/entities/bnpl-catalog-item.entity");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const journal_entry_entity_1 = require("../ledger/entities/journal-entry.entity");
const fee_pot_entity_1 = require("../ledger/entities/fee-pot.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const role_enum_1 = require("../../common/enums/role.enum");
const support_ticket_entity_1 = require("../bnpl/entities/support-ticket.entity");
const ticket_message_entity_1 = require("../support/entities/ticket-message.entity");
const investments_service_1 = require("../investments/investments.service");
const bnpl_plan_config_entity_1 = require("../bnpl/entities/bnpl-plan-config.entity");
const settings_service_1 = require("../settings/settings.service");
const user_activity_service_1 = require("../users/user-activity.service");
let DashboardService = class DashboardService {
    usersService;
    subscriptionsService;
    feePotService;
    savingsService;
    loansService;
    investmentsService;
    settingsService;
    activityService;
    userRepo;
    apexRepo;
    orgRepo;
    planRepo;
    catalogRepo;
    subRepo;
    instRepo;
    paymentRepo;
    journalRepo;
    feePotRepo;
    ticketRepo;
    planConfigRepo;
    savingsTxRepo;
    savingsAccountRepo;
    loanRepo;
    msgRepo;
    constructor(usersService, subscriptionsService, feePotService, savingsService, loansService, investmentsService, settingsService, activityService, userRepo, apexRepo, orgRepo, planRepo, catalogRepo, subRepo, instRepo, paymentRepo, journalRepo, feePotRepo, ticketRepo, planConfigRepo, savingsTxRepo, savingsAccountRepo, loanRepo, msgRepo) {
        this.usersService = usersService;
        this.subscriptionsService = subscriptionsService;
        this.feePotService = feePotService;
        this.savingsService = savingsService;
        this.loansService = loansService;
        this.investmentsService = investmentsService;
        this.settingsService = settingsService;
        this.activityService = activityService;
        this.userRepo = userRepo;
        this.apexRepo = apexRepo;
        this.orgRepo = orgRepo;
        this.planRepo = planRepo;
        this.catalogRepo = catalogRepo;
        this.subRepo = subRepo;
        this.instRepo = instRepo;
        this.paymentRepo = paymentRepo;
        this.journalRepo = journalRepo;
        this.feePotRepo = feePotRepo;
        this.ticketRepo = ticketRepo;
        this.planConfigRepo = planConfigRepo;
        this.savingsTxRepo = savingsTxRepo;
        this.savingsAccountRepo = savingsAccountRepo;
        this.loanRepo = loanRepo;
        this.msgRepo = msgRepo;
    }
    async getSuperAdminDashboard() {
        const [totalApexOrgs, totalOrganizations, totalUsers, totalCatalogItems, totalPlans, revenueResult, bnplVolumeResult, totalSavings, totalOutstandingLoans,] = await Promise.all([
            this.apexRepo.count(),
            this.orgRepo.count(),
            this.userRepo.count(),
            this.catalogRepo.count(),
            this.planRepo.count(),
            this.paymentRepo
                .createQueryBuilder('p')
                .select('COALESCE(SUM(p.amount), 0)', 'total')
                .where('p.status = :status', { status: status_enum_1.PaymentStatus.SUCCESS })
                .getRawOne(),
            this.subRepo
                .createQueryBuilder('s')
                .select('COALESCE(SUM(s.total_amount), 0)', 'total')
                .where('s.status IN (:...statuses)', {
                statuses: [status_enum_1.SubscriptionStatus.DISBURSED, status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT],
            })
                .getRawOne(),
            this.savingsService.getTotalSavings(),
            this.loansService.getAllActiveTotal(),
        ]);
        return {
            totalApexOrgs,
            totalOrganizations,
            totalUsers,
            totalCatalogItems,
            totalPlans,
            totalRevenue: Number(revenueResult?.total || 0),
            bnplVolume: Number(bnplVolumeResult?.total || 0),
            totalSavings,
            totalOutstandingLoans,
        };
    }
    async getAdminDashboard(apexOrgId) {
        const [totalOrganizations, totalMembers] = await Promise.all([
            this.orgRepo.count({ where: { apexOrgId } }),
            this.userRepo.count({ where: { apexOrgId } }),
        ]);
        const revenueResult = await this.paymentRepo
            .createQueryBuilder('p')
            .select('COALESCE(SUM(p.amount), 0)', 'total')
            .innerJoin(user_entity_1.User, 'u', 'u.id = p.user_id')
            .where('p.status = :status', { status: status_enum_1.PaymentStatus.SUCCESS })
            .andWhere('u.apex_org_id = :apexOrgId', { apexOrgId })
            .getRawOne();
        return {
            apexOrgId,
            totalOrganizations,
            totalMembers,
            totalRevenue: Number(revenueResult?.total || 0),
        };
    }
    async getAccountantDashboard(organizationId) {
        const [totalEntries, pendingEntries, feePotResult] = await Promise.all([
            this.journalRepo.count(),
            this.journalRepo.count({
                where: { status: 'draft' },
            }),
            this.feePotRepo
                .createQueryBuilder('fp')
                .select('COALESCE(SUM(fp.balance), 0)', 'total')
                .where('fp.entity_id = :orgId', { orgId: organizationId })
                .getRawOne(),
        ]);
        return {
            organizationId,
            totalJournalEntries: totalEntries,
            pendingEntries,
            feePotsBalance: Number(feePotResult?.total || 0),
        };
    }
    async getBusinessManagerDashboard(organizationId) {
        const members = await this.userRepo.find({
            where: { organizationId: organizationId ?? undefined, role: role_enum_1.Role.INDIVIDUAL },
        });
        const memberIds = members.map((m) => m.id);
        const [orgPot, org, savings, loans] = await Promise.all([
            this.feePotRepo.findOne({
                where: { potType: status_enum_1.PotType.ORGANIZATION, entityId: organizationId },
            }),
            this.orgRepo.findOne({ where: { id: organizationId } }),
            memberIds.length > 0
                ? this.savingsAccountRepo
                    .createQueryBuilder('sa')
                    .where('sa.user_id IN (:...memberIds)', { memberIds })
                    .select('COALESCE(SUM(sa.balance), 0)', 'total')
                    .getRawOne()
                : Promise.resolve({ total: '0' }),
            memberIds.length > 0
                ? this.loanRepo
                    .createQueryBuilder('l')
                    .where('l.user_id IN (:...memberIds)', { memberIds })
                    .select([
                    'COUNT(l.id) AS total',
                    "COALESCE(SUM(CASE WHEN l.status IN ('active','approved','defaulted') THEN l.total_repayment - l.amount_paid ELSE 0 END), 0) AS balance",
                    "COALESCE(SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending",
                    "COALESCE(SUM(CASE WHEN l.status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected",
                ])
                    .getRawOne()
                : Promise.resolve({ total: '0', balance: '0', pending: '0', rejected: '0' }),
        ]);
        const totalSavings = Number(savings?.total || 0);
        const totalLoans = Number(loans?.total || 0);
        const loanBalance = Number(loans?.balance || 0);
        const pendingLoans = Number(loans?.pending || 0);
        const rejectedLoans = Number(loans?.rejected || 0);
        return {
            organizationId,
            organizationName: org?.name || null,
            totalMembers: members.length,
            totalSavings,
            totalLoans,
            loanBalance,
            pendingLoans,
            rejectedLoans,
            organizationFeePotBalance: orgPot ? Number(orgPot.balance) : 0,
            organization: org
                ? {
                    bankName: org.bankName,
                    accountName: org.accountName,
                    accountNumber: org.accountNumber,
                    sortCode: org.sortCode,
                    bankCode: org.bankCode,
                }
                : null,
        };
    }
    async updateBusinessManagerOrgBank(organizationId, dto) {
        await this.orgRepo.update(organizationId, dto);
        return this.orgRepo.findOne({ where: { id: organizationId } });
    }
    async getBnplManagerDashboard(organizationId) {
        const plans = await this.planRepo.find({
            where: { organizationId },
        });
        const planIds = plans.map((p) => p.id);
        const [activeSubscriptions, installmentStats, totalCatalogItems, subscriptionStats] = await Promise.all([
            planIds.length > 0
                ? this.subRepo.count({
                    where: planIds.map((id) => ({
                        planId: id,
                        status: status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT,
                    })),
                })
                : 0,
            planIds.length > 0
                ? this.instRepo
                    .createQueryBuilder('i')
                    .innerJoin(bnpl_subscription_entity_1.BnplSubscription, 's', 's.id = i.subscription_id')
                    .where('s.plan_id IN (:...planIds)', { planIds })
                    .select([
                    'COUNT(i.id) as total',
                    "SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) as paid",
                ])
                    .getRawOne()
                : { total: '0', paid: '0' },
            this.catalogRepo.count({ where: { isGlobal: true } }),
            planIds.length > 0
                ? this.subRepo
                    .createQueryBuilder('s')
                    .where('s.plan_id IN (:...planIds)', { planIds })
                    .select([
                    'COUNT(s.id) as total',
                    "SUM(CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as newThisMonth",
                ])
                    .getRawOne()
                : { total: '0', newThisMonth: '0' },
        ]);
        const total = Number(installmentStats?.total || 0);
        const paid = Number(installmentStats?.paid || 0);
        return {
            organizationId,
            totalCatalogItems,
            totalPlans: plans.length,
            activeSubscriptions,
            totalSubscriptions: Number(subscriptionStats?.total || 0),
            newSubscriptionsThisMonth: Number(subscriptionStats?.newThisMonth || 0),
            installmentCompletionRate: total > 0 ? paid / total : 0,
        };
    }
    async checkSavingsVesting(userId) {
        const vestingMonths = await this.settingsService.getNumber('credit_limit_vesting_months', 6);
        const account = await this.savingsService.getAccount(userId);
        if (!account?.id)
            return false;
        const now = new Date();
        for (let i = 0; i < vestingMonths; i++) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const count = await this.savingsTxRepo.count({
                where: {
                    accountId: account.id,
                    type: savings_transaction_entity_1.TransactionType.DEPOSIT,
                    createdAt: (0, typeorm_2.Between)(monthStart, monthEnd),
                },
            });
            if (count === 0)
                return false;
        }
        return true;
    }
    async calculateCreditLimit(userId) {
        const savingsAccount = await this.savingsService.getAccount(userId);
        const savingsBalance = Number(savingsAccount.balance);
        const vested = await this.checkSavingsVesting(userId);
        if (!vested || savingsBalance <= 0) {
            return { eligible: false, limit: 0, used: 0, available: 0 };
        }
        const hasActiveLoan = (await this.loansService.getActiveLoans(userId)).length > 0;
        const multiplier = hasActiveLoan
            ? await this.settingsService.getNumber('credit_limit_multiplier_with_loan', 2)
            : await this.settingsService.getNumber('credit_limit_multiplier_no_loan', 5);
        const maxCap = await this.settingsService.getNumber('credit_limit_max_cap', 10000000);
        const rawLimit = savingsBalance * multiplier;
        const limit = Math.min(rawLimit, maxCap);
        const activeSubs = await this.subRepo.find({
            where: [
                { userId, status: status_enum_1.SubscriptionStatus.DISBURSED },
                { userId, status: status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT },
            ],
        });
        const used = activeSubs.reduce((sum, s) => sum + (Number(s.totalAmount) - Number(s.amountPaid)), 0);
        return { eligible: true, limit, used, available: Math.max(0, limit - used) };
    }
    async getIndividualDashboard(userId) {
        const user = await this.usersService.findById(userId);
        const activeSubs = await this.subRepo.find({
            where: [
                { userId, status: status_enum_1.SubscriptionStatus.DISBURSED },
                { userId, status: status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT },
            ],
            relations: { installments: true },
            order: { createdAt: 'DESC' },
        });
        const nextInstallment = activeSubs
            .flatMap((s) => s.installments || [])
            .filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING &&
            new Date(i.dueDate) >= new Date())
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
        const savingsAccount = await this.savingsService.getAccount(userId);
        const activeLoans = await this.loansService.getActiveLoans(userId);
        const totalOutstanding = await this.loansService.getTotalOutstanding(userId);
        const portfolio = await this.investmentsService.getPortfolioSummary(userId);
        const credit = await this.calculateCreditLimit(userId);
        return {
            activeSubscriptions: activeSubs.length,
            nextPaymentDate: nextInstallment?.dueDate || null,
            nextPaymentAmount: Number(nextInstallment?.amount || 0),
            kycStatus: user.kycStatus,
            savingsBalance: Number(savingsAccount.balance),
            goalBalance: Number(savingsAccount.goalBalance || 0),
            savingsTarget: Number(savingsAccount.targetAmount || 0),
            activeLoans: activeLoans.length,
            totalOutstanding,
            portfolio: {
                totalInvested: portfolio.totalInvested,
                currentValue: portfolio.currentValue,
                totalEarned: portfolio.totalEarned,
                holdingCount: portfolio.holdingCount,
                unrealizedReturn: portfolio.unrealizedReturn,
                unrealizedReturnPct: portfolio.unrealizedReturnPct,
            },
            bnplEligible: credit.eligible,
            bnplAvailable: credit.available,
            bnplUsed: credit.used,
            bnplCreditLimit: credit.limit,
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            referralEarnings: Number(user.referralEarnings),
        };
    }
    async getUnifiedTransactions(userId) {
        const savingsTxs = await this.savingsService.getTransactions(userId);
        const payments = await this.paymentRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
        const subs = await this.subRepo.find({
            where: { userId },
            relations: { installments: true },
        });
        const installmentIds = subs.flatMap((s) => s.installments || []).map((i) => i.id);
        const installments = installmentIds.length > 0
            ? await this.instRepo.find({
                where: installmentIds.map((id) => ({ id })),
                order: { createdAt: 'DESC' },
                take: 50,
            })
            : [];
        const loans = await this.loansService.findByUser(userId);
        const loanRepayments = loans.flatMap((l) => (l.repayments || []).map((r) => ({
            date: r.createdAt.toISOString(),
            type: r.status === loan_repayment_entity_1.RepaymentStatus.PAID ? 'loan_repayment' : 'loan_due',
            amount: -Number(r.amount),
            description: `Loan repayment due ${new Date(r.dueDate).toLocaleDateString()}`,
            status: r.status,
            reference: r.id,
        })));
        const mapped = [
            ...savingsTxs.map((tx) => ({
                date: tx.createdAt.toISOString(),
                type: tx.type === savings_transaction_entity_1.TransactionType.DEPOSIT ? 'savings_deposit' : tx.type === savings_transaction_entity_1.TransactionType.WITHDRAWAL ? 'savings_withdrawal' : 'savings_interest',
                amount: tx.type === savings_transaction_entity_1.TransactionType.WITHDRAWAL ? -Number(tx.amount) : Number(tx.amount),
                description: tx.description || '',
                status: 'completed',
                reference: tx.id,
            })),
            ...payments.map((p) => ({
                date: p.createdAt.toISOString(),
                type: 'payment',
                amount: -Number(p.amount),
                description: `Payment for subscription`,
                status: p.status,
                reference: p.id,
            })),
            ...installments.map((i) => ({
                date: i.createdAt.toISOString(),
                type: 'installment',
                amount: -Number(i.amount),
                description: `Installment due ${new Date(i.dueDate).toLocaleDateString()}`,
                status: i.status,
                reference: i.id,
            })),
            ...loanRepayments,
        ];
        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return mapped.slice(0, 50);
    }
    async getMemberStatement(userId) {
        const user = await this.usersService.findById(userId);
        const subs = await this.subRepo.find({
            where: { userId },
            relations: { plan: { catalogItem: true }, installments: true },
            order: { createdAt: 'DESC' },
        });
        const payments = await this.paymentRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 100,
        });
        const savingsAccount = await this.savingsService.getAccount(userId);
        const activeLoans = await this.loansService.getActiveLoans(userId);
        const allLoans = await this.loansService.findByUser(userId);
        const activeSubs = subs.filter((s) => s.status === status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT || s.status === status_enum_1.SubscriptionStatus.DISBURSED);
        const upcomingInstallments = subs
            .flatMap((s) => (s.installments || []).map((i) => ({ ...i, itemName: s.plan?.catalogItem?.name || 'Unknown' })))
            .filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const bnplBalance = activeSubs.reduce((sum, s) => sum + (Number(s.totalAmount) - Number(s.amountPaid)), 0);
        const loanBalance = activeLoans.reduce((sum, l) => sum + Number(l.totalRepayment) - Number(l.amountPaid), 0);
        return {
            accountSummary: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                kycStatus: user.kycStatus,
                kycImage: user.kycImage,
                memberSince: user.createdAt,
                bnplBalance,
                savingsBalance: Number(savingsAccount.balance),
                loanBalance,
            },
            subscriptions: subs.map((s) => ({
                id: s.id,
                itemName: s.plan?.catalogItem?.name || 'Unknown',
                totalAmount: Number(s.totalAmount),
                amountPaid: Number(s.amountPaid),
                balance: Number(s.totalAmount) - Number(s.amountPaid),
                status: s.status,
                createdAt: s.createdAt,
            })),
            paymentHistory: payments.map((p) => ({
                id: p.id,
                date: p.createdAt,
                amount: Number(p.amount),
                status: p.status,
                provider: p.provider,
                reference: p.providerReference,
            })),
            upcomingPayments: upcomingInstallments.map((i) => ({
                id: i.id,
                itemName: i.itemName,
                amount: Number(i.amount),
                dueDate: i.dueDate,
                lateFee: Number(i.lateFeeAmount || 0),
            })),
            loans: allLoans.map((l) => ({
                id: l.id,
                amount: Number(l.amount),
                totalRepayment: Number(l.totalRepayment),
                amountPaid: Number(l.amountPaid),
                balance: Number(l.totalRepayment) - Number(l.amountPaid),
                status: l.status,
                monthlyPayment: Number(l.monthlyPayment),
            })),
        };
    }
    async getMemberFinancials(bmUserId, memberId) {
        const bm = await this.usersService.findById(bmUserId);
        if (bm?.role !== 'business_manager') {
            throw new common_1.ForbiddenException('Only business managers can view member financials');
        }
        const member = await this.usersService.findById(memberId);
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        if (member.organizationId !== bm.organizationId) {
            throw new common_1.ForbiddenException('You can only view members of your own organization');
        }
        return this.getMemberStatement(memberId);
    }
    async getBusinessManagerMemberTransactions(bmUserId) {
        const bm = await this.usersService.findById(bmUserId);
        if (bm?.role !== 'business_manager') {
            throw new common_1.ForbiddenException('Only business managers can view member transactions');
        }
        const members = await this.userRepo.find({
            where: { organizationId: bm.organizationId ?? undefined, role: role_enum_1.Role.INDIVIDUAL },
            order: { createdAt: 'ASC' },
        });
        const rows = [];
        for (const member of members) {
            const txs = await this.getUnifiedTransactions(member.id);
            const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.email;
            for (const tx of txs) {
                rows.push({
                    ...tx,
                    memberName: name,
                    memberEmail: member.email,
                });
            }
        }
        rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return rows.slice(0, 50);
    }
    async exportMemberStatementCsv(userId) {
        const stmt = await this.getMemberStatement(userId);
        const rows = [];
        rows.push('MEMBER STATEMENT');
        rows.push(`Name,${stmt.accountSummary.name}`);
        rows.push(`Email,${stmt.accountSummary.email}`);
        rows.push(`Member Since,${new Date(stmt.accountSummary.memberSince).toLocaleDateString()}`);
        rows.push(`BNPL Balance,${stmt.accountSummary.bnplBalance}`);
        rows.push(`Savings Balance,${stmt.accountSummary.savingsBalance}`);
        rows.push(`Loan Balance,${stmt.accountSummary.loanBalance}`);
        rows.push('');
        rows.push('PAYMENT HISTORY');
        rows.push('Date,Amount,Status,Provider,Reference');
        for (const p of stmt.paymentHistory) {
            rows.push(`${new Date(p.date).toISOString()},${p.amount},${p.status},${p.provider},"${p.reference}"`);
        }
        rows.push('');
        rows.push('UPCOMING PAYMENTS');
        rows.push('Item,Due Date,Amount,Late Fee');
        for (const p of stmt.upcomingPayments) {
            rows.push(`"${p.itemName}",${new Date(p.dueDate).toISOString().slice(0, 10)},${p.amount},${p.lateFee}`);
        }
        return rows.join('\n');
    }
    async getRepaymentSchedule(userId) {
        const subs = await this.subRepo.find({
            where: { userId },
            relations: { plan: { catalogItem: true }, installments: true },
        });
        const loans = await this.loansService.findByUser(userId);
        const bnplItems = subs.flatMap((s) => (s.installments || []).map((i) => ({
            id: i.id,
            type: 'bnpl',
            itemName: s.plan?.catalogItem?.name || 'Unknown',
            amount: Number(i.amount),
            lateFee: Number(i.lateFeeAmount || 0),
            dueDate: i.dueDate,
            status: i.status,
            paidAt: i.paidAt,
            paymentReference: i.paymentReference,
            subscriptionId: s.id,
            isOverdue: i.status === 'pending' && new Date(i.dueDate) < new Date(),
        })));
        const loanItems = loans.flatMap((l) => (l.repayments || []).map((r) => ({
            id: r.id,
            type: 'loan',
            itemName: `Loan #${l.id.slice(0, 8)}`,
            amount: Number(r.amount),
            lateFee: 0,
            dueDate: r.dueDate,
            status: r.status === loan_repayment_entity_1.RepaymentStatus.PAID ? 'paid' : r.status === loan_repayment_entity_1.RepaymentStatus.OVERDUE ? 'overdue' : 'pending',
            paidAt: r.paidAt,
            paymentReference: '',
            loanId: l.id,
            isOverdue: r.status === loan_repayment_entity_1.RepaymentStatus.PENDING && new Date(r.dueDate) < new Date(),
        })));
        const allItems = [...bnplItems, ...loanItems].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const upcoming = allItems.filter((i) => i.status === 'pending' || i.status === 'overdue');
        const past = allItems.filter((i) => i.status === 'paid');
        const overdueCount = upcoming.filter((i) => i.isOverdue).length;
        const bnplBalance = subs
            .filter((s) => s.status === status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT || s.status === status_enum_1.SubscriptionStatus.DISBURSED)
            .reduce((sum, s) => sum + (Number(s.totalAmount) - Number(s.amountPaid)), 0);
        const loanBalance = loans
            .filter((l) => l.status === 'active')
            .reduce((sum, l) => sum + (Number(l.totalRepayment) - Number(l.amountPaid)), 0);
        const nextPayment = upcoming.length > 0
            ? upcoming.reduce((earliest, item) => new Date(item.dueDate) < new Date(earliest.dueDate) ? item : earliest)
            : null;
        return {
            summary: {
                totalUpcoming: upcoming.length,
                pastPaid: past.length,
                overdueCount,
                bnplBalance,
                loanBalance,
                totalOutstanding: bnplBalance + loanBalance,
                nextDueDate: nextPayment?.dueDate || null,
                nextDueAmount: nextPayment ? nextPayment.amount + nextPayment.lateFee : 0,
            },
            upcoming,
            past,
        };
    }
    async getMemberTickets(userId) {
        return this.ticketRepo.find({
            where: { createdBy: userId },
            order: { createdAt: 'DESC' },
        });
    }
    async createMemberTicket(dto) {
        const ticket = await this.ticketRepo.save({
            subject: dto.subject,
            description: dto.description,
            category: dto.category || support_ticket_entity_1.TicketCategory.OTHER,
            relatedOrderId: dto.relatedOrderId,
            relatedPaymentId: dto.relatedPaymentId,
            createdBy: dto.createdBy,
            status: support_ticket_entity_1.TicketStatus.OPEN,
        });
        await this.activityService.log(dto.createdBy, 'support_ticket_created', { subject: dto.subject, category: dto.category });
        return ticket;
    }
    async getMemberTicketMessages(ticketId, userId) {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId, createdBy: userId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return this.msgRepo.find({
            where: { ticketId },
            order: { createdAt: 'ASC' },
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(8, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(9, (0, typeorm_1.InjectRepository)(apex_organization_entity_1.ApexOrganization)),
    __param(10, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(11, (0, typeorm_1.InjectRepository)(bnpl_plan_entity_1.BnplPlan)),
    __param(12, (0, typeorm_1.InjectRepository)(bnpl_catalog_item_entity_1.BnplCatalogItem)),
    __param(13, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(14, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(15, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(16, (0, typeorm_1.InjectRepository)(journal_entry_entity_1.JournalEntry)),
    __param(17, (0, typeorm_1.InjectRepository)(fee_pot_entity_1.FeePot)),
    __param(18, (0, typeorm_1.InjectRepository)(support_ticket_entity_1.SupportTicket)),
    __param(19, (0, typeorm_1.InjectRepository)(bnpl_plan_config_entity_1.BnplPlanConfig)),
    __param(20, (0, typeorm_1.InjectRepository)(savings_transaction_entity_1.SavingsTransaction)),
    __param(21, (0, typeorm_1.InjectRepository)(savings_account_entity_1.SavingsAccount)),
    __param(22, (0, typeorm_1.InjectRepository)(loan_entity_1.Loan)),
    __param(23, (0, typeorm_1.InjectRepository)(ticket_message_entity_1.TicketMessage)),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        subscriptions_service_1.SubscriptionsService,
        fee_pot_service_1.FeePotService,
        savings_service_1.SavingsService,
        loans_service_1.LoansService,
        investments_service_1.InvestmentsService,
        settings_service_1.SettingsService,
        user_activity_service_1.UserActivityService,
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
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map