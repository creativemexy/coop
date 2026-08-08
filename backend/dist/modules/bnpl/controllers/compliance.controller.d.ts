import { ComplianceService } from '../services/compliance.service';
import { SubscriptionsService } from '../services/subscriptions.service';
import { RiskFlagStatus, RiskFlagEntityType } from '../entities/risk-flag.entity';
export declare class ComplianceController {
    private readonly service;
    private readonly subsService;
    constructor(service: ComplianceService, subsService: SubscriptionsService);
    checkEligibility(planId: string, userId: string): Promise<{
        eligible: boolean;
        reasons: {
            key: string;
            label: string;
            passed: boolean;
            detail?: string;
        }[];
    }>;
    createFlag(dto: {
        entityType: RiskFlagEntityType;
        entityId: string;
        reason: string;
        description?: string;
    }, userId: string): Promise<import("../entities/risk-flag.entity").RiskFlag>;
    listFlags(status?: string, entityType?: string): Promise<any[]>;
    resolveFlag(id: string, dto: {
        status: RiskFlagStatus;
        resolutionNote?: string;
    }, userId: string): Promise<import("../entities/risk-flag.entity").RiskFlag>;
    listExceptionReasons(): Promise<import("../entities/exception-reason.entity").ExceptionReason[]>;
    createExceptionReason(dto: {
        title: string;
        description?: string;
    }, userId: string): Promise<import("../entities/exception-reason.entity").ExceptionReason>;
    updateExceptionReason(id: string, dto: {
        title?: string;
        description?: string;
        status?: string;
    }): Promise<import("../entities/exception-reason.entity").ExceptionReason>;
    deleteExceptionReason(id: string): Promise<{
        message: string;
    }>;
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
    export(res: any): Promise<void>;
    listAuditLogs(entityType?: string, entityId?: string, action?: string, category?: string): Promise<import("../entities/audit-log.entity").AuditLog[]>;
    getAuditLog(id: string): Promise<import("../entities/audit-log.entity").AuditLog>;
    getAuditEvidence(id: string): Promise<{
        evidence: null;
    } | {
        evidence: string;
    }>;
    getDelinquencyCohorts(): Promise<{
        subscriptionCount: number;
        totalPrincipal: number;
        outstandingPrincipal: number;
        delinquentCount: number;
        delinquentAmount: number;
        delinquencyRate: number;
        bucketBreakdown: {
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
        period: string;
    }[]>;
    getDelinquencyTrends(): Promise<{
        month: string;
        delinquencyRate: number;
        delinquentAmount: number;
        totalOutstanding: number;
    }[]>;
}
