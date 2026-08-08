import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from '../bnpl/services/subscriptions.service';
import { FeePotService } from '../ledger/services/fee-pot.service';
import { SavingsService } from '../savings/savings.service';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { LoansService } from '../loans/loans.service';
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
import { InstallmentStatus, PaymentStatus, SubscriptionStatus } from '../../common/enums/status.enum';
import { SupportTicket, TicketCategory } from '../bnpl/entities/support-ticket.entity';
import { TicketMessage } from '../support/entities/ticket-message.entity';
import { InvestmentsService } from '../investments/investments.service';
import { BnplPlanConfig } from '../bnpl/entities/bnpl-plan-config.entity';
import { SettingsService } from '../settings/settings.service';
import { UserActivityService } from '../users/user-activity.service';
export declare class DashboardService {
    private readonly usersService;
    private readonly subscriptionsService;
    private readonly feePotService;
    private readonly savingsService;
    private readonly loansService;
    private readonly investmentsService;
    private readonly settingsService;
    private readonly activityService;
    private readonly userRepo;
    private readonly apexRepo;
    private readonly orgRepo;
    private readonly planRepo;
    private readonly catalogRepo;
    private readonly subRepo;
    private readonly instRepo;
    private readonly paymentRepo;
    private readonly journalRepo;
    private readonly feePotRepo;
    private readonly ticketRepo;
    private readonly planConfigRepo;
    private readonly savingsTxRepo;
    private readonly savingsAccountRepo;
    private readonly loanRepo;
    private readonly msgRepo;
    constructor(usersService: UsersService, subscriptionsService: SubscriptionsService, feePotService: FeePotService, savingsService: SavingsService, loansService: LoansService, investmentsService: InvestmentsService, settingsService: SettingsService, activityService: UserActivityService, userRepo: Repository<User>, apexRepo: Repository<ApexOrganization>, orgRepo: Repository<Organization>, planRepo: Repository<BnplPlan>, catalogRepo: Repository<BnplCatalogItem>, subRepo: Repository<BnplSubscription>, instRepo: Repository<BnplInstallment>, paymentRepo: Repository<Payment>, journalRepo: Repository<JournalEntry>, feePotRepo: Repository<FeePot>, ticketRepo: Repository<SupportTicket>, planConfigRepo: Repository<BnplPlanConfig>, savingsTxRepo: Repository<SavingsTransaction>, savingsAccountRepo: Repository<SavingsAccount>, loanRepo: Repository<Loan>, msgRepo: Repository<TicketMessage>);
    getSuperAdminDashboard(): Promise<{
        totalApexOrgs: number;
        totalOrganizations: number;
        totalUsers: number;
        totalCatalogItems: number;
        totalPlans: number;
        totalRevenue: number;
        bnplVolume: number;
        totalSavings: number;
        totalOutstandingLoans: number;
    }>;
    getAdminDashboard(apexOrgId: string): Promise<{
        apexOrgId: string;
        totalOrganizations: number;
        totalMembers: number;
        totalRevenue: number;
    }>;
    getAccountantDashboard(organizationId: string): Promise<{
        organizationId: string;
        totalJournalEntries: number;
        pendingEntries: number;
        feePotsBalance: number;
    }>;
    getBusinessManagerDashboard(organizationId: string): Promise<{
        organizationId: string;
        organizationName: string | null;
        totalMembers: number;
        totalSavings: number;
        totalLoans: number;
        loanBalance: number;
        pendingLoans: number;
        rejectedLoans: number;
        organizationFeePotBalance: number;
        organization: {
            bankName: string;
            accountName: string;
            accountNumber: string;
            sortCode: string;
            bankCode: string;
        } | null;
    }>;
    updateBusinessManagerOrgBank(organizationId: string, dto: {
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        sortCode?: string;
        bankCode?: string;
    }): Promise<Organization | null>;
    getBnplManagerDashboard(organizationId: string): Promise<{
        organizationId: string;
        totalCatalogItems: number;
        totalPlans: number;
        activeSubscriptions: number;
        totalSubscriptions: number;
        newSubscriptionsThisMonth: number;
        installmentCompletionRate: number;
    }>;
    checkSavingsVesting(userId: string): Promise<boolean>;
    calculateCreditLimit(userId: string): Promise<{
        eligible: boolean;
        limit: number;
        used: number;
        available: number;
    }>;
    getIndividualDashboard(userId: string): Promise<{
        activeSubscriptions: number;
        nextPaymentDate: Date;
        nextPaymentAmount: number;
        kycStatus: import("../../common/enums/status.enum").KycStatus;
        savingsBalance: number;
        goalBalance: number;
        savingsTarget: number;
        activeLoans: number;
        totalOutstanding: number;
        portfolio: {
            totalInvested: number;
            currentValue: number;
            totalEarned: number;
            holdingCount: number;
            unrealizedReturn: number;
            unrealizedReturnPct: number;
        };
        bnplEligible: boolean;
        bnplAvailable: number;
        bnplUsed: number;
        bnplCreditLimit: number;
        referralCode: string;
        referralCount: number;
        referralEarnings: number;
    }>;
    getUnifiedTransactions(userId: string): Promise<{
        date: string;
        type: string;
        amount: number;
        description: string;
        status: string;
        reference: string;
    }[]>;
    getMemberStatement(userId: string): Promise<{
        accountSummary: {
            name: string;
            email: string;
            kycStatus: import("../../common/enums/status.enum").KycStatus;
            kycImage: string | null;
            memberSince: Date;
            bnplBalance: number;
            savingsBalance: number;
            loanBalance: number;
        };
        subscriptions: {
            id: string;
            itemName: string;
            totalAmount: number;
            amountPaid: number;
            balance: number;
            status: SubscriptionStatus;
            createdAt: Date;
        }[];
        paymentHistory: {
            id: string;
            date: Date;
            amount: number;
            status: PaymentStatus;
            provider: import("../../common/enums/status.enum").PaymentProvider;
            reference: string;
        }[];
        upcomingPayments: {
            id: string;
            itemName: string;
            amount: number;
            dueDate: Date;
            lateFee: number;
        }[];
        loans: {
            id: string;
            amount: number;
            totalRepayment: number;
            amountPaid: number;
            balance: number;
            status: import("../loans/entities/loan.entity").LoanStatus;
            monthlyPayment: number;
        }[];
    }>;
    getMemberFinancials(bmUserId: string, memberId: string): Promise<{
        accountSummary: {
            name: string;
            email: string;
            kycStatus: import("../../common/enums/status.enum").KycStatus;
            kycImage: string | null;
            memberSince: Date;
            bnplBalance: number;
            savingsBalance: number;
            loanBalance: number;
        };
        subscriptions: {
            id: string;
            itemName: string;
            totalAmount: number;
            amountPaid: number;
            balance: number;
            status: SubscriptionStatus;
            createdAt: Date;
        }[];
        paymentHistory: {
            id: string;
            date: Date;
            amount: number;
            status: PaymentStatus;
            provider: import("../../common/enums/status.enum").PaymentProvider;
            reference: string;
        }[];
        upcomingPayments: {
            id: string;
            itemName: string;
            amount: number;
            dueDate: Date;
            lateFee: number;
        }[];
        loans: {
            id: string;
            amount: number;
            totalRepayment: number;
            amountPaid: number;
            balance: number;
            status: import("../loans/entities/loan.entity").LoanStatus;
            monthlyPayment: number;
        }[];
    }>;
    getBusinessManagerMemberTransactions(bmUserId: string): Promise<{
        date: string;
        type: string;
        amount: number;
        description: string;
        status: string;
        memberName: string;
        memberEmail: string;
    }[]>;
    exportMemberStatementCsv(userId: string): Promise<string>;
    getRepaymentSchedule(userId: string): Promise<{
        summary: {
            totalUpcoming: number;
            pastPaid: number;
            overdueCount: number;
            bnplBalance: number;
            loanBalance: number;
            totalOutstanding: number;
            nextDueDate: Date | null;
            nextDueAmount: number;
        };
        upcoming: ({
            id: string;
            type: "bnpl";
            itemName: string;
            amount: number;
            lateFee: number;
            dueDate: Date;
            status: InstallmentStatus;
            paidAt: Date;
            paymentReference: string;
            subscriptionId: string;
            isOverdue: boolean;
        } | {
            id: string;
            type: "loan";
            itemName: string;
            amount: number;
            lateFee: number;
            dueDate: Date;
            status: string;
            paidAt: Date;
            paymentReference: string;
            loanId: string;
            isOverdue: boolean;
        })[];
        past: ({
            id: string;
            type: "bnpl";
            itemName: string;
            amount: number;
            lateFee: number;
            dueDate: Date;
            status: InstallmentStatus;
            paidAt: Date;
            paymentReference: string;
            subscriptionId: string;
            isOverdue: boolean;
        } | {
            id: string;
            type: "loan";
            itemName: string;
            amount: number;
            lateFee: number;
            dueDate: Date;
            status: string;
            paidAt: Date;
            paymentReference: string;
            loanId: string;
            isOverdue: boolean;
        })[];
    }>;
    getMemberTickets(userId: string): Promise<SupportTicket[]>;
    createMemberTicket(dto: {
        subject: string;
        description?: string;
        category?: TicketCategory;
        relatedOrderId?: string;
        relatedPaymentId?: string;
        createdBy: string;
    }): Promise<SupportTicket>;
    getMemberTicketMessages(ticketId: string, userId: string): Promise<TicketMessage[]>;
}
