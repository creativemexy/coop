import { AdminService } from './admin.service';
import { Role } from '../../common/enums/role.enum';
import { DisputeStatus } from './entities/dispute.entity';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    resetPassword(id: string, dto: {
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    revokeSessions(id: string): Promise<{
        message: string;
    }>;
    assignRole(id: string, dto: {
        role: Role;
        organizationId?: string;
        apexOrgId?: string;
    }, user: any): Promise<import("../users/entities/user.entity").User | null>;
    listTenants(): Promise<{
        id: string;
        name: string;
        code: string;
        status: import("../../common/enums/status.enum").OrgStatus;
        apexOrg: string | null;
        supportedProducts: never[];
        notificationWebhookUrl: string | null;
        notificationEmail: string | null;
        bnplEnabled: boolean;
        kycRequirementLevel: string;
        createdAt: Date;
    }[]>;
    getTenant(id: string): Promise<{
        id: string;
        name: string;
        code: string;
        status: import("../../common/enums/status.enum").OrgStatus;
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
        status: import("../../common/enums/status.enum").OrgStatus;
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
        status: import("../../common/enums/status.enum").OrgStatus;
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
        status: import("../../common/enums/status.enum").OrgStatus;
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
    getTenantConfig(id: string): Promise<import("./admin.service").TenantConfig>;
    updateTenantConfig(id: string, dto: {
        bnplEnabled?: boolean;
        kycRequirementLevel?: string;
        repaymentRetryPolicy?: {
            maxAttempts: number;
            cooldownHours: number;
            autoRetryOnFailure: boolean;
        };
        webhookProviders?: {
            paystack: {
                endpoint: string;
                enabled: boolean;
                retryOnFailure: boolean;
                retryMaxAttempts: number;
            };
        };
        logRetentionDays?: number;
        name?: string;
        status?: string;
    }): Promise<{
        id: string;
        name: string;
        code: string;
        status: import("../../common/enums/status.enum").OrgStatus;
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
    getOverview(): Promise<{
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
            webhooksNeedingAttention: import("../payments/entities/webhook-log.entity").WebhookLog[];
            failedJobs: {
                id: string;
                stepType: import("../bnpl/entities/processing-step.entity").ProcessingStepType;
                subscriptionId: string;
                errorMessage: string | null;
                retryCount: number;
                createdAt: Date;
                age: number;
            }[];
            retryingJobs: {
                id: string;
                stepType: import("../bnpl/entities/processing-step.entity").ProcessingStepType;
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
    getUsersByOrg(user?: any): Promise<any[]>;
    getAdminAuditLogs(tenantId?: string, actorId?: string, action?: string, days?: string): Promise<import("../bnpl/entities/audit-log.entity").AuditLog[]>;
    getOrderVolume(id: string): Promise<{
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
    getRepaymentKpis(id: string): Promise<{
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
    getDelinquency(id: string): Promise<{
        totalDelinquent: number;
        totalDelinquentAmount: number;
        buckets: {
            label: string;
            count: number;
            amount: number;
        }[];
    }>;
    exportTenantReport(id: string, res: any): Promise<void>;
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
    getWebhookDeliveryStatus(days?: string): Promise<{
        period: string;
        total: number;
        processed: number;
        failed: number;
        retried: number;
        backlog: number;
        recentLogs: import("../payments/entities/webhook-log.entity").WebhookLog[];
    }>;
    getFailedJobs(days?: string): Promise<{
        total: number;
        byType: Record<string, number>;
        steps: import("../bnpl/entities/processing-step.entity").ProcessingStep[];
    }>;
    getQueueStatus(): Promise<{
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
    getSystemLogs(days?: string): Promise<{
        total: number;
        byAction: Record<string, number>;
        byEntity: Record<string, number>;
        logs: import("../bnpl/entities/audit-log.entity").AuditLog[];
    }>;
    getDisputes(status?: string, type?: string, page?: string, limit?: string): Promise<{
        data: import("./entities/dispute.entity").Dispute[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    resolveDispute(id: string, dto: {
        status: DisputeStatus;
        resolution: string;
    }, user: any): Promise<import("./entities/dispute.entity").Dispute>;
}
