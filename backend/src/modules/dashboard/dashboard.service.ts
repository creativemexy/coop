import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../bnpl/services/subscriptions.service';
import { FeePotService } from '../ledger/services/fee-pot.service';
import { SavingsService } from '../savings/savings.service';
import { SavingsTransaction, TransactionType as SavingsTxType } from '../savings/entities/savings-transaction.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { LoansService } from '../loans/loans.service';
import { LoanRepayment, RepaymentStatus } from '../loans/entities/loan-repayment.entity';
import { Loan } from '../loans/entities/loan.entity';
import { User } from '../users/entities/user.entity';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { JournalEntry } from '../ledger/entities/journal-entry.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';
import { InstallmentStatus, PaymentStatus, SubscriptionStatus, PotType } from '../../common/enums/status.enum';
import { Role } from '../../common/enums/role.enum';
import { SupportTicket, TicketStatus, TicketCategory } from '../bnpl/entities/support-ticket.entity';
import { TicketMessage } from '../support/entities/ticket-message.entity';
import { InvestmentsService } from '../investments/investments.service';
import { BnplPlanConfig } from '../bnpl/entities/bnpl-plan-config.entity';
import { SettingsService } from '../settings/settings.service';
import { UserActivityService } from '../users/user-activity.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly feePotService: FeePotService,
    private readonly savingsService: SavingsService,
    private readonly loansService: LoansService,
    private readonly investmentsService: InvestmentsService,
    private readonly settingsService: SettingsService,
    private readonly activityService: UserActivityService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ApexOrganization)
    private readonly apexRepo: Repository<ApexOrganization>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(BnplPlan)
    private readonly planRepo: Repository<BnplPlan>,
    @InjectRepository(BnplCatalogItem)
    private readonly catalogRepo: Repository<BnplCatalogItem>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(JournalEntry)
    private readonly journalRepo: Repository<JournalEntry>,
    @InjectRepository(FeePot)
    private readonly feePotRepo: Repository<FeePot>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(BnplPlanConfig)
    private readonly planConfigRepo: Repository<BnplPlanConfig>,
    @InjectRepository(SavingsTransaction)
    private readonly savingsTxRepo: Repository<SavingsTransaction>,
    @InjectRepository(SavingsAccount)
    private readonly savingsAccountRepo: Repository<SavingsAccount>,
    @InjectRepository(Loan)
    private readonly loanRepo: Repository<Loan>,
    @InjectRepository(TicketMessage)
    private readonly msgRepo: Repository<TicketMessage>,
  ) {}

  async getSuperAdminDashboard() {
    const [
      totalApexOrgs,
      totalOrganizations,
      totalUsers,
      totalCatalogItems,
      totalPlans,
      revenueResult,
      bnplVolumeResult,
      totalSavings,
      totalOutstandingLoans,
    ] = await Promise.all([
      this.apexRepo.count(),
      this.orgRepo.count(),
      this.userRepo.count(),
      this.catalogRepo.count(),
      this.planRepo.count(),
      this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :status', { status: PaymentStatus.SUCCESS })
        .getRawOne<{ total: string }>(),
      this.subRepo
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.total_amount), 0)', 'total')
        .where('s.status IN (:...statuses)', {
          statuses: [SubscriptionStatus.DISBURSED, SubscriptionStatus.ACTIVE_REPAYMENT],
        })
        .getRawOne<{ total: string }>(),
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

  async getAdminDashboard(apexOrgId: string) {
    const [totalOrganizations, totalMembers] = await Promise.all([
      this.orgRepo.count({ where: { apexOrgId } }),
      this.userRepo.count({ where: { apexOrgId } }),
    ]);

    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .innerJoin(User, 'u', 'u.id = p.user_id')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('u.apex_org_id = :apexOrgId', { apexOrgId })
      .getRawOne<{ total: string }>();

    return {
      apexOrgId,
      totalOrganizations,
      totalMembers,
      totalRevenue: Number(revenueResult?.total || 0),
    };
  }

  async getAccountantDashboard(organizationId: string) {
    const [totalEntries, pendingEntries, feePotResult] = await Promise.all([
      this.journalRepo.count(),
      this.journalRepo.count({
        where: { status: 'draft' as any },
      }),
      this.feePotRepo
        .createQueryBuilder('fp')
        .select('COALESCE(SUM(fp.balance), 0)', 'total')
        .where('fp.entity_id = :orgId', { orgId: organizationId })
        .getRawOne<{ total: string }>(),
    ]);

    return {
      organizationId,
      totalJournalEntries: totalEntries,
      pendingEntries,
      feePotsBalance: Number(feePotResult?.total || 0),
    };
  }

  async getBusinessManagerDashboard(organizationId: string) {
    const [orgPot, org, savings, loans, totalMembers] =
      await Promise.all([
        this.feePotRepo.findOne({
          where: { potType: PotType.ORGANIZATION, entityId: organizationId },
        }),
        this.orgRepo.findOne({ where: { id: organizationId } }),
        this.savingsAccountRepo
          .createQueryBuilder('sa')
          .innerJoin(User, 'u', 'u.id = sa.user_id')
          .where('u.organization_id = :orgId AND u.role = :role', {
            orgId: organizationId,
            role: Role.INDIVIDUAL,
          })
          .select('COALESCE(SUM(sa.balance), 0)', 'total')
          .getRawOne<{ total: string }>()
          .catch(() => ({ total: '0' })),
        this.loanRepo
          .createQueryBuilder('l')
          .innerJoin(User, 'u', 'u.id = l.user_id')
          .where('u.organization_id = :orgId AND u.role = :role', {
            orgId: organizationId,
            role: Role.INDIVIDUAL,
          })
          .select([
            'COUNT(l.id) AS total',
            "COALESCE(SUM(CASE WHEN l.status IN ('active','approved','defaulted') THEN l.total_repayment - l.amount_paid ELSE 0 END), 0) AS balance",
            "COALESCE(SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending",
            "COALESCE(SUM(CASE WHEN l.status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected",
          ])
          .getRawOne<{ total: string; balance: string; pending: string; rejected: string }>()
          .catch(() => ({ total: '0', balance: '0', pending: '0', rejected: '0' })),
        this.userRepo.count({
          where: {
            organizationId: organizationId ?? undefined,
            role: Role.INDIVIDUAL,
          },
        }),
      ]);

    const totalSavings = Number(savings?.total || 0);
    const totalLoans = Number(loans?.total || 0);
    const loanBalance = Number(loans?.balance || 0);
    const pendingLoans = Number(loans?.pending || 0);
    const rejectedLoans = Number(loans?.rejected || 0);

    return {
      organizationId,
      organizationName: org?.name || null,
      totalMembers,
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

  async updateBusinessManagerOrgBank(
    organizationId: string,
    dto: { bankName?: string; accountName?: string; accountNumber?: string; sortCode?: string; bankCode?: string },
  ) {
    await this.orgRepo.update(organizationId, dto);
    return this.orgRepo.findOne({ where: { id: organizationId } });
  }

  async getBnplManagerDashboard(organizationId: string) {
    const plans = await this.planRepo.find({
      where: { organizationId },
    });
    const planIds = plans.map((p) => p.id);

    const [activeSubscriptions, installmentStats, totalCatalogItems, subscriptionStats] = await Promise.all([
      planIds.length > 0
        ? this.subRepo.count({
            where: planIds.map((id) => ({
              planId: id,
              status: SubscriptionStatus.ACTIVE_REPAYMENT,
            })),
          })
        : 0,
      planIds.length > 0
        ? this.instRepo
            .createQueryBuilder('i')
            .innerJoin(BnplSubscription, 's', 's.id = i.subscription_id')
            .where('s.plan_id IN (:...planIds)', { planIds })
            .select([
              'COUNT(i.id) as total',
              "SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) as paid",
            ])
            .getRawOne<{ total: string; paid: string }>()
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
            .getRawOne<{ total: string; newThisMonth: string }>()
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

  async checkSavingsVesting(userId: string): Promise<boolean> {
    const vestingMonths = await this.settingsService.getNumber('credit_limit_vesting_months', 6);
    const account = await this.savingsService.getAccount(userId);
    if (!account?.id) return false;

    const now = new Date();
    for (let i = 0; i < vestingMonths; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await this.savingsTxRepo.count({
        where: {
          accountId: account.id,
          type: SavingsTxType.DEPOSIT,
          createdAt: Between(monthStart, monthEnd),
        },
      });
      if (count === 0) return false;
    }
    return true;
  }

  async calculateCreditLimit(userId: string): Promise<{ eligible: boolean; limit: number; used: number; available: number }> {
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
        { userId, status: SubscriptionStatus.DISBURSED },
        { userId, status: SubscriptionStatus.ACTIVE_REPAYMENT },
      ],
    });
    const used = activeSubs.reduce((sum, s) => sum + (Number(s.totalAmount) - Number(s.amountPaid)), 0);

    return { eligible: true, limit, used, available: Math.max(0, limit - used) };
  }

  async getIndividualDashboard(userId: string) {
    const user = await this.usersService.findById(userId);

    const activeSubs = await this.subRepo.find({
      where: [
        { userId, status: SubscriptionStatus.DISBURSED },
        { userId, status: SubscriptionStatus.ACTIVE_REPAYMENT },
      ],
      relations: { installments: true },
      order: { createdAt: 'DESC' },
    });

    const nextInstallment = activeSubs
      .flatMap((s) => s.installments || [])
      .filter(
        (i) =>
          i.status === InstallmentStatus.PENDING &&
          new Date(i.dueDate) >= new Date(),
      )
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      )[0];

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

  async getUnifiedTransactions(userId: string) {
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
    const loanRepayments = loans.flatMap((l) =>
      (l.repayments || []).map((r) => ({
        date: r.createdAt.toISOString(),
        type: r.status === RepaymentStatus.PAID ? 'loan_repayment' : 'loan_due',
        amount: -Number(r.amount),
        description: `Loan repayment due ${new Date(r.dueDate).toLocaleDateString()}`,
        status: r.status,
        reference: r.id,
      })),
    );

    const mapped: Array<{
      date: string;
      type: string;
      amount: number;
      description: string;
      status: string;
      reference: string;
    }> = [
      ...savingsTxs.map((tx) => ({
        date: tx.createdAt.toISOString(),
        type: tx.type === SavingsTxType.DEPOSIT ? 'savings_deposit' : tx.type === SavingsTxType.WITHDRAWAL ? 'savings_withdrawal' : 'savings_interest',
        amount: tx.type === SavingsTxType.WITHDRAWAL ? -Number(tx.amount) : Number(tx.amount),
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

  async getMemberStatement(userId: string) {
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

    const activeSubs = subs.filter(
      (s) => s.status === SubscriptionStatus.ACTIVE_REPAYMENT || s.status === SubscriptionStatus.DISBURSED,
    );

    const upcomingInstallments = subs
      .flatMap((s) => (s.installments || []).map((i) => ({ ...i, itemName: s.plan?.catalogItem?.name || 'Unknown' })))
      .filter((i) => i.status === InstallmentStatus.PENDING)
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

  async getMemberFinancials(bmUserId: string, memberId: string) {
    const bm = await this.usersService.findById(bmUserId);
    if (bm?.role !== 'business_manager') {
      throw new ForbiddenException('Only business managers can view member financials');
    }
    const member = await this.usersService.findById(memberId);
    if (!member) throw new NotFoundException('Member not found');
    if (member.organizationId !== bm.organizationId) {
      throw new ForbiddenException('You can only view members of your own organization');
    }
    return this.getMemberStatement(memberId);
  }

  async getBusinessManagerMemberTransactions(bmUserId: string) {
    const bm = await this.usersService.findById(bmUserId);
    if (bm?.role !== 'business_manager') {
      throw new ForbiddenException('Only business managers can view member transactions');
    }
    const members = await this.userRepo.find({
      where: { organizationId: bm.organizationId ?? undefined, role: Role.INDIVIDUAL },
      order: { createdAt: 'ASC' },
    });

    const rows: Array<{
      date: string;
      type: string;
      amount: number;
      description: string;
      status: string;
      memberName: string;
      memberEmail: string;
    }> = [];

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

  async exportMemberStatementCsv(userId: string): Promise<string> {
    const stmt = await this.getMemberStatement(userId);
    const rows: string[] = [];

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

  async getRepaymentSchedule(userId: string) {
    const subs = await this.subRepo.find({
      where: { userId },
      relations: { plan: { catalogItem: true }, installments: true },
    });

    const loans = await this.loansService.findByUser(userId);

    const bnplItems = subs.flatMap((s) =>
      (s.installments || []).map((i) => ({
        id: i.id,
        type: 'bnpl' as const,
        itemName: s.plan?.catalogItem?.name || 'Unknown',
        amount: Number(i.amount),
        lateFee: Number(i.lateFeeAmount || 0),
        dueDate: i.dueDate,
        status: i.status,
        paidAt: i.paidAt,
        paymentReference: i.paymentReference,
        subscriptionId: s.id,
        isOverdue: i.status === 'pending' && new Date(i.dueDate) < new Date(),
      })),
    );

    const loanItems = loans.flatMap((l) =>
      (l.repayments || []).map((r) => ({
        id: r.id,
        type: 'loan' as const,
        itemName: `Loan #${l.id.slice(0, 8)}`,
        amount: Number(r.amount),
        lateFee: 0,
        dueDate: r.dueDate,
        status: r.status === RepaymentStatus.PAID ? 'paid' : r.status === RepaymentStatus.OVERDUE ? 'overdue' : 'pending',
        paidAt: r.paidAt,
        paymentReference: '',
        loanId: l.id,
        isOverdue: r.status === RepaymentStatus.PENDING && new Date(r.dueDate) < new Date(),
      })),
    );

    const allItems = [...bnplItems, ...loanItems].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    const upcoming = allItems.filter((i) => i.status === 'pending' || i.status === 'overdue');
    const past = allItems.filter((i) => i.status === 'paid');

    const overdueCount = upcoming.filter((i) => i.isOverdue).length;

    const bnplBalance = subs
      .filter((s) => s.status === SubscriptionStatus.ACTIVE_REPAYMENT || s.status === SubscriptionStatus.DISBURSED)
      .reduce((sum, s) => sum + (Number(s.totalAmount) - Number(s.amountPaid)), 0);

    const loanBalance = loans
      .filter((l) => l.status === 'active')
      .reduce((sum, l) => sum + (Number(l.totalRepayment) - Number(l.amountPaid)), 0);

    const nextPayment = upcoming.length > 0
      ? upcoming.reduce((earliest, item) =>
          new Date(item.dueDate) < new Date(earliest.dueDate) ? item : earliest,
        )
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

  async getMemberTickets(userId: string) {
    return this.ticketRepo.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createMemberTicket(dto: {
    subject: string;
    description?: string;
    category?: TicketCategory;
    relatedOrderId?: string;
    relatedPaymentId?: string;
    createdBy: string;
  }) {
    const ticket = await this.ticketRepo.save({
      subject: dto.subject,
      description: dto.description,
      category: dto.category || TicketCategory.OTHER,
      relatedOrderId: dto.relatedOrderId,
      relatedPaymentId: dto.relatedPaymentId,
      createdBy: dto.createdBy,
      status: TicketStatus.OPEN,
    } as SupportTicket);
    await this.activityService.log(dto.createdBy, 'support_ticket_created', { subject: dto.subject, category: dto.category });
    return ticket;
  }

  async getMemberTicketMessages(ticketId: string, userId: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId, createdBy: userId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.msgRepo.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
  }
}
