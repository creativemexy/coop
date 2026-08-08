import { Repository } from 'typeorm';
import { RiskFlag, RiskFlagStatus, RiskFlagEntityType } from '../entities/risk-flag.entity';
import { ExceptionReason } from '../entities/exception-reason.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplPlan } from '../entities/bnpl-plan.entity';
import { UsersService } from '../../users/users.service';
export declare class ComplianceService {
    private readonly flagRepo;
    private readonly reasonRepo;
    private readonly auditRepo;
    private readonly subRepo;
    private readonly instRepo;
    private readonly planRepo;
    private readonly usersService;
    constructor(flagRepo: Repository<RiskFlag>, reasonRepo: Repository<ExceptionReason>, auditRepo: Repository<AuditLog>, subRepo: Repository<BnplSubscription>, instRepo: Repository<BnplInstallment>, planRepo: Repository<BnplPlan>, usersService: UsersService);
    createFlag(dto: {
        entityType: RiskFlagEntityType;
        entityId: string;
        reason: string;
        description?: string;
        flaggedBy: string;
    }): Promise<RiskFlag>;
    listFlags(filters?: {
        status?: string;
        entityType?: string;
    }): Promise<any[]>;
    resolveFlag(id: string, dto: {
        status: RiskFlagStatus;
        resolutionNote?: string;
        resolvedBy: string;
    }): Promise<RiskFlag>;
    listExceptionReasons(): Promise<ExceptionReason[]>;
    createExceptionReason(dto: {
        title: string;
        description?: string;
        createdBy: string;
    }): Promise<ExceptionReason>;
    updateExceptionReason(id: string, dto: {
        title?: string;
        description?: string;
        status?: string;
    }): Promise<ExceptionReason>;
    deleteExceptionReason(id: string): Promise<void>;
    getPortfolioSummary(): Promise<{
        totalActiveSubscriptions: number;
        totalOutstandingPrincipal: number;
        totalInstallmentsDue: number;
        totalInstallmentsDueCount: number;
        delinquency: {
            '1-30days': {
                count: number;
                amount: number;
            };
            '31-60days': {
                count: number;
                amount: number;
            };
            '61-90days': {
                count: number;
                amount: number;
            };
            '90plus': {
                count: number;
                amount: number;
            };
        };
        delinquencyRate: number;
        totalDelinquentAmount: number;
    }>;
    getPortfolioKpis(): Promise<{
        totalActiveSubscriptions: number;
        totalActivePrincipal: number;
        totalOutstandingPrincipal: number;
        defaultedAmount: number;
        defaultedSubscriptions: number;
        installmentsDue: {
            today: {
                count: number;
                amount: number;
            };
            next7Days: {
                count: number;
                amount: number;
            };
            next30Days: {
                count: number;
                amount: number;
            };
        };
        paidMtd: {
            count: number;
            amount: number;
        };
        delinquency: {
            '1-30days': {
                count: number;
                amount: number;
            };
            '31-60days': {
                count: number;
                amount: number;
            };
            '61-90days': {
                count: number;
                amount: number;
            };
            '90plus': {
                count: number;
                amount: number;
            };
        };
        delinquencyRate: number;
        totalDelinquentAmount: number;
    }>;
    getRevenueSummary(): Promise<{
        interestFeesCollected: number;
        totalPaidInstallments: number;
        projectedRemainingRevenue: number;
        totalPendingInstallments: number;
        totalCompletedRevenue: number;
        completedSubscriptions: number;
    }>;
    exportCsv(): Promise<string>;
    listAuditLogs(filters?: {
        entityType?: string;
        entityId?: string;
        action?: string;
        category?: string;
    }): Promise<AuditLog[]>;
    logAction(dto: {
        entityType: string;
        entityId: string;
        action: string;
        changes?: Record<string, {
            from: any;
            to: any;
        }>;
        reason?: string;
        performedBy: string;
        performerName?: string;
        ipAddress?: string;
        evidence?: string;
    }): Promise<AuditLog>;
    getAuditLog(id: string): Promise<AuditLog>;
    getAuditEvidence(id: string): Promise<string | null>;
    getDelinquencyCohorts(): Promise<{
        subscriptionCount: number;
        totalPrincipal: number;
        outstandingPrincipal: number;
        delinquentCount: number;
        delinquentAmount: number;
        delinquencyRate: number;
        bucketBreakdown: {
            "1-30days": {
                count: number;
                amount: number;
            };
            "31-60days": {
                count: number;
                amount: number;
            };
            "61-90days": {
                count: number;
                amount: number;
            };
            "90plus": {
                count: number;
                amount: number;
            };
        };
        period: string;
    }[]>;
    getDelinquencyTrends(): Promise<{
        month: string;
        delinquencyRate: number;
        delinquentAmount: number;
        totalOutstanding: number;
    }[]>;
}
