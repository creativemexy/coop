import { DashboardService } from './dashboard.service';
import { TicketCategory } from '../bnpl/entities/support-ticket.entity';
export declare class DashboardController {
    private readonly service;
    constructor(service: DashboardService);
    superAdmin(): Promise<{
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
    admin(apexOrgId: string): Promise<{
        apexOrgId: string;
        totalOrganizations: number;
        totalMembers: number;
        totalRevenue: number;
    }>;
    accountant(organizationId: string): Promise<{
        organizationId: string;
        totalJournalEntries: number;
        pendingEntries: number;
        feePotsBalance: number;
    }>;
    businessManager(organizationId: string): Promise<{
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
    businessManagerBank(organizationId: string, dto: {
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        sortCode?: string;
        bankCode?: string;
    }): Promise<import("../organizations/entities/organization.entity").Organization | null>;
    businessManagerMemberFinancials(bmUserId: string, memberId: string): Promise<{
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
            status: import("../../common/enums/status.enum").SubscriptionStatus;
            createdAt: Date;
        }[];
        paymentHistory: {
            id: string;
            date: Date;
            amount: number;
            status: import("../../common/enums/status.enum").PaymentStatus;
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
    businessManagerMemberTransactions(bmUserId: string): Promise<{
        date: string;
        type: string;
        amount: number;
        description: string;
        status: string;
        memberName: string;
        memberEmail: string;
    }[]>;
    bnplManager(organizationId: string): Promise<{
        organizationId: string;
        totalCatalogItems: number;
        totalPlans: number;
        activeSubscriptions: number;
        totalSubscriptions: number;
        newSubscriptionsThisMonth: number;
        installmentCompletionRate: number;
    }>;
    individual(userId: string): Promise<{
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
    individualTransactions(userId: string): Promise<{
        date: string;
        type: string;
        amount: number;
        description: string;
        status: string;
        reference: string;
    }[]>;
    memberStatement(userId: string): Promise<{
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
            status: import("../../common/enums/status.enum").SubscriptionStatus;
            createdAt: Date;
        }[];
        paymentHistory: {
            id: string;
            date: Date;
            amount: number;
            status: import("../../common/enums/status.enum").PaymentStatus;
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
    exportMemberStatement(res: any, userId: string): Promise<void>;
    repaymentSchedule(userId: string): Promise<{
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
            status: import("../../common/enums/status.enum").InstallmentStatus;
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
            status: import("../../common/enums/status.enum").InstallmentStatus;
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
    memberTickets(userId: string): Promise<import("../bnpl/entities/support-ticket.entity").SupportTicket[]>;
    createMemberTicket(userId: string, dto: {
        subject: string;
        description?: string;
        category?: TicketCategory;
        relatedOrderId?: string;
        relatedPaymentId?: string;
    }): Promise<import("../bnpl/entities/support-ticket.entity").SupportTicket>;
    memberTicketMessages(id: string, userId: string): Promise<import("../support/entities/ticket-message.entity").TicketMessage[]>;
}
