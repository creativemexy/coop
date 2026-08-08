import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AppSetting } from '../settings/entities/app-setting.entity';
import { WebhookLog } from '../payments/entities/webhook-log.entity';
import { ProcessingStep, ProcessingStepType } from '../bnpl/entities/processing-step.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { InvestmentOrder } from '../investments/entities/investment-order.entity';
import { InvestmentHolding } from '../investments/entities/investment-holding.entity';
import { Role } from '../../common/enums/role.enum';
import { OrgStatus, KycStatus } from '../../common/enums/status.enum';
import { Dispute, DisputeStatus } from './entities/dispute.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { Loan } from '../loans/entities/loan.entity';
export interface TenantConfig {
    bnplEnabled: boolean;
    kycRequirementLevel: string;
    repaymentRetryPolicy: {
        maxAttempts: number;
        cooldownHours: number;
        autoRetryOnFailure: boolean;
    };
    webhookProviders: {
        paystack: {
            endpoint: string;
            enabled: boolean;
            retryOnFailure: boolean;
            retryMaxAttempts: number;
        };
    };
    logRetentionDays: number;
}
export declare class AdminService {
    private readonly authService;
    private readonly orgRepo;
    private readonly userRepo;
    private readonly settingRepo;
    private readonly webhookLogRepo;
    private readonly stepRepo;
    private readonly auditRepo;
    private readonly instRepo;
    private readonly subRepo;
    private readonly planRepo;
    private readonly paymentRepo;
    private readonly investOrderRepo;
    private readonly holdingRepo;
    private readonly disputeRepo;
    private readonly savingsAccRepo;
    private readonly savingsTxRepo;
    private readonly loanRepo;
    constructor(authService: AuthService, orgRepo: Repository<Organization>, userRepo: Repository<User>, settingRepo: Repository<AppSetting>, webhookLogRepo: Repository<WebhookLog>, stepRepo: Repository<ProcessingStep>, auditRepo: Repository<AuditLog>, instRepo: Repository<BnplInstallment>, subRepo: Repository<BnplSubscription>, planRepo: Repository<BnplPlan>, paymentRepo: Repository<Payment>, investOrderRepo: Repository<InvestmentOrder>, holdingRepo: Repository<InvestmentHolding>, disputeRepo: Repository<Dispute>, savingsAccRepo: Repository<SavingsAccount>, savingsTxRepo: Repository<SavingsTransaction>, loanRepo: Repository<Loan>);
    resetPassword(userId: string, newPassword: string): Promise<{
        message: string;
    }>;
    revokeSessions(userId: string): Promise<{
        message: string;
    }>;
    assignRole(userId: string, role: Role, callerRole: string, organizationId?: string, apexOrgId?: string): Promise<User | null>;
    private getTenantSettingsMap;
    getTenantConfig(id: string): Promise<TenantConfig>;
    updateTenantConfig(id: string, dto: Partial<TenantConfig & {
        name?: string;
        status?: string;
    }>): Promise<{
        id: string;
        name: string;
        code: string;
        status: OrgStatus;
        apexOrg: string | null;
        apexOrgId: string;
        userCount: number;
        bnplEnabled: boolean;
        kycRequirementLevel: string;
        repaymentRetryPolicy: any;
        webhookProviders: any;
        logRetentionDays: number;
        supportedProducts: never[];
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listTenants(): Promise<{
        id: string;
        name: string;
        code: string;
        status: OrgStatus;
        apexOrg: string | null;
        supportedProducts: never[];
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        bnplEnabled: boolean;
        kycRequirementLevel: string;
        createdAt: Date;
    }[]>;
    getTenantDetail(id: string): Promise<{
        id: string;
        name: string;
        code: string;
        status: OrgStatus;
        apexOrg: string | null;
        apexOrgId: string;
        userCount: number;
        bnplEnabled: boolean;
        kycRequirementLevel: string;
        repaymentRetryPolicy: any;
        webhookProviders: any;
        logRetentionDays: number;
        supportedProducts: never[];
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getTenantHealth(id: string): Promise<{
        tenantId: string;
        name: string;
        status: OrgStatus;
        isActive: boolean;
        users: {
            total: number;
            active: number;
            pending: number;
        };
        roleDistribution: {
            role: any;
            count: number;
        }[];
        lastUpdated: Date;
    }>;
    updateTenantSettings(id: string, dto: {
        name?: string;
        status?: string;
        supportedProducts?: string[];
        notificationWebhookUrl?: string;
        notificationEmail?: string;
    }): Promise<{
        id: string;
        name: string;
        code: string;
        status: OrgStatus;
        apexOrg: string | null;
        apexOrgId: string;
        userCount: number;
        bnplEnabled: boolean;
        kycRequirementLevel: string;
        repaymentRetryPolicy: any;
        webhookProviders: any;
        logRetentionDays: number;
        supportedProducts: never[];
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getTenantSettings(id: string): Promise<{
        id: string;
        name: string;
        code: string;
        status: OrgStatus;
        apexOrg: string | null;
        apexOrgId: string;
        userCount: number;
        bnplEnabled: boolean;
        kycRequirementLevel: string;
        repaymentRetryPolicy: any;
        webhookProviders: any;
        logRetentionDays: number;
        supportedProducts: never[];
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getWebhookDeliveryStatus(tenantId?: string, days?: number): Promise<{
        period: string;
        total: number;
        processed: number;
        failed: number;
        retried: number;
        backlog: number;
        recentLogs: WebhookLog[];
    }>;
    getFailedJobs(tenantId?: string, days?: number): Promise<{
        total: number;
        byType: Record<string, number>;
        steps: ProcessingStep[];
    }>;
    getQueueStatus(tenantId?: string): Promise<{
        overdueInstallments: number;
        pendingProcessingSteps: number;
        failedProcessingSteps: number;
        agingBuckets: {
            label: string;
            min: number;
            max: number;
            count: number;
            totalAmount: number;
        }[];
        queueLatency: string;
        errorRate: string;
    }>;
    getDisputes(query: {
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Dispute[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    resolveDispute(id: string, dto: {
        status: DisputeStatus;
        resolution: string;
    }, resolvedBy: string): Promise<Dispute>;
    getMemberStatement(userId: string): Promise<{
        member: {
            id: string;
            name: string;
            email: string;
        };
        transactions: {
            date: Date;
            type: string;
            amount: number;
            description: string;
            status: string;
            reference: string;
        }[];
    }>;
    getSystemLogs(tenantId?: string, days?: number): Promise<{
        total: number;
        byAction: Record<string, number>;
        byEntity: Record<string, number>;
        logs: AuditLog[];
    }>;
    getAdminOverview(): Promise<{
        kpis: {
            activeTenants: number;
            activeUsers: number;
            webhookSuccessRate: number;
            webhookTotal7d: number;
            webhookProcessed7d: number;
            jobsFailed24h: number;
            jobsFailed7d: number;
            reconciliationBacklog: number;
        };
        queues: {
            webhooksNeedingAttention: WebhookLog[];
            failedJobs: {
                id: string;
                stepType: ProcessingStepType;
                subscriptionId: string;
                errorMessage: string | null;
                retryCount: number;
                createdAt: Date;
                age: number;
            }[];
            retryingJobs: {
                id: string;
                stepType: ProcessingStepType;
                subscriptionId: string;
                errorMessage: string | null;
                retryCount: number;
                createdAt: Date;
                age: number;
            }[];
        };
    }>;
    getTenantsHealthTable(): Promise<{
        id: string;
        name: string;
        code: string;
        status: string;
        bnplEnabled: boolean;
        lastWebhookError: string | null;
        backlogCount: number;
    }[]>;
    getAdminAuditLogs(filters?: {
        tenantId?: string;
        actorId?: string;
        action?: string;
        days?: number;
    }): Promise<AuditLog[]>;
    getUsersByOrganization(): Promise<{
        id: string;
        name: string;
        code: string;
        status: OrgStatus;
        users: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            role: Role;
            isActive: boolean;
            kycStatus: KycStatus;
            createdAt: Date;
        }[];
    }[]>;
    getTenantOrderVolume(tenantId: string): Promise<{
        totalOrders: number;
        activeSubscriptions: number;
        totalVolume: number;
        byPlan: {
            planId: string;
            planName: string;
            orderCount: number;
            totalVolume: number;
        }[];
    }>;
    getTenantRepaymentKpis(tenantId: string): Promise<{
        totalInstallments: number;
        paidRate: number;
        overdueAmount: number;
        paidMtd: number;
        paidInstallments?: undefined;
        overdueCount?: undefined;
        paidMtdCount?: undefined;
        paidMtdAmount?: undefined;
    } | {
        totalInstallments: number;
        paidInstallments: number;
        paidRate: number;
        overdueCount: number;
        overdueAmount: number;
        paidMtdCount: number;
        paidMtdAmount: number;
        paidMtd?: undefined;
    }>;
    getTenantDelinquencySnapshot(tenantId: string): Promise<{
        totalDelinquent: number;
        totalDelinquentAmount: number;
        buckets: {
            label: string;
            count: number;
            amount: number;
        }[];
    }>;
    exportTenantReport(tenantId: string): Promise<string>;
    private _parseSetting;
    private diffDays;
    getFinancialReports(): Promise<{
        summary: {
            totalVolume: number;
            totalFees: number;
            monthVolume: number;
            yearVolume: number;
            outstandingPrincipal: number;
            aum: number;
            totalInvested: number;
            defaultRate: number;
            totalUsers: number;
            newUsersMonth: number;
            activeLoans: number;
            defaultedLoans: number;
            savingsBalance: number;
            totalSavingsDeposits: number;
            totalSavingsWithdrawals: number;
            activeSavingsAccounts: number;
            activeLoanCount: number;
            loanOutstanding: number;
        };
        trends: {
            month: string;
            volume: number;
            fees: number;
            users: number;
        }[];
    }>;
}
