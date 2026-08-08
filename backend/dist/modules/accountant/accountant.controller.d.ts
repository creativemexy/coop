import { AccountantService } from './accountant.service';
import { ResultStatus } from './entities/reconciliation-result.entity';
import { AdjustmentType, AdjustmentStatus } from './entities/adjustment-request.entity';
export declare class AccountantController {
    private readonly svc;
    constructor(svc: AccountantService);
    getOrderLedger(orgId?: string, days?: string): Promise<{
        id: string;
        status: import("../../common/enums/status.enum").SubscriptionStatus;
        totalAmount: number;
        amountPaid: number;
        downPayment: number;
        outstanding: number;
        providerReference: string;
        disbursementReference: string;
        payoutStatus: import("../../common/enums/status.enum").PayoutStatus;
        createdAt: Date;
        settledAt: Date;
        planName: string;
        planOrgId: string | null;
        installmentCount: number;
        paidInstallments: number;
    }[]>;
    exportOrderLedger(orgId: string | undefined, days: string | undefined, res: any): Promise<void>;
    getInstallmentLedger(orgId?: string, days?: string): Promise<{
        id: string;
        subscriptionId: string;
        amount: number;
        lateFeeAmount: number;
        dueDate: Date;
        status: import("../../common/enums/status.enum").InstallmentStatus;
        paidAt: Date;
        paymentReference: string;
        planName: string;
        organizationId: string | null;
        createdAt: Date;
    }[]>;
    exportInstallmentLedger(orgId: string | undefined, days: string | undefined, res: any): Promise<void>;
    getPaymentReferences(orgId?: string, days?: string): Promise<{
        id: string;
        subscriptionId: string;
        amount: number;
        fee: number;
        provider: import("../../common/enums/status.enum").PaymentProvider;
        providerReference: string;
        status: import("../../common/enums/status.enum").PaymentStatus;
        payoutStatus: import("../../common/enums/status.enum").PayoutStatus;
        payoutReference: string;
        createdAt: Date;
    }[]>;
    exportPaymentReferences(orgId: string | undefined, days: string | undefined, res: any): Promise<void>;
    getSettlementReferences(orgId?: string, days?: string): Promise<{
        id: string;
        subscriptionId: string;
        amount: number;
        provider: import("../../common/enums/status.enum").PaymentProvider;
        providerReference: string;
        payoutReference: string;
        payoutStatus: import("../../common/enums/status.enum").PayoutStatus;
        settledAt: Date;
    }[]>;
    exportSettlementReferences(orgId: string | undefined, days: string | undefined, res: any): Promise<void>;
    getTenants(): Promise<import("../organizations/entities/organization.entity").Organization[]>;
    runReconciliation(dto: {
        rangeStart: string;
        rangeEnd: string;
        organizationId?: string;
    }, user: any): Promise<import("./entities/reconciliation-run.entity").ReconciliationRun | null>;
    getReconciliationRuns(orgId?: string): Promise<import("./entities/reconciliation-run.entity").ReconciliationRun[]>;
    getReconciliationRun(id: string): Promise<import("./entities/reconciliation-run.entity").ReconciliationRun>;
    getReconciliationResults(runId: string, status?: ResultStatus): Promise<import("./entities/reconciliation-result.entity").ReconciliationResult[]>;
    updateReconciliationResult(id: string, dto: {
        status: ResultStatus;
        notes?: string;
    }): Promise<import("./entities/reconciliation-result.entity").ReconciliationResult>;
    exportReconciliation(runId: string, res: any): Promise<void>;
    createAdjustment(dto: {
        adjustmentType: AdjustmentType;
        description: string;
        reasonCode: string;
        changes: Record<string, any>;
        referenceType?: string;
        referenceId?: string;
    }, user: any): Promise<import("./entities/adjustment-request.entity").AdjustmentRequest>;
    listAdjustments(status?: AdjustmentStatus): Promise<import("./entities/adjustment-request.entity").AdjustmentRequest[]>;
    getAdjustment(id: string): Promise<import("./entities/adjustment-request.entity").AdjustmentRequest>;
    approveAdjustment(id: string, user: any): Promise<import("./entities/adjustment-request.entity").AdjustmentRequest>;
    rejectAdjustment(id: string, dto: {
        reason: string;
    }, user: any): Promise<import("./entities/adjustment-request.entity").AdjustmentRequest>;
    getMemberStatement(userId: string, days?: string): Promise<{
        member: {
            id: string;
            name: string;
            email: string;
        };
        summary: {
            totalSubscriptions: number;
            activeSubscriptions: number;
            totalBilled: number;
            totalPaid: number;
            totalLateFees: number;
            outstanding: number;
            paidMtd: number;
        };
        repaymentSchedule: {
            subscriptionId: string;
            planName: string;
            totalAmount: number;
            amountPaid: number;
            outstanding: number;
            status: import("../../common/enums/status.enum").SubscriptionStatus;
            installments: {
                id: string;
                amount: number;
                dueDate: Date;
                status: import("../../common/enums/status.enum").InstallmentStatus;
                paidAt: Date;
                paymentReference: string;
                lateFeeAmount: number;
            }[];
        }[];
        paymentHistory: {
            id: string;
            amount: number;
            fee: number;
            provider: import("../../common/enums/status.enum").PaymentProvider;
            providerReference: string;
            status: import("../../common/enums/status.enum").PaymentStatus;
            createdAt: Date;
        }[];
        upcomingPayments: {
            installmentId: string;
            subscriptionId: string;
            amount: number;
            dueDate: Date;
            planName: string;
        }[];
    }>;
    exportMemberStatement(userId: string, res: any): Promise<void>;
    getCooperativeStatement(orgId: string, days?: string): Promise<{
        cooperative: {
            id: string;
            name: string;
            code: string;
        };
        summary: {
            totalMembers: number;
            activeSubscriptions: number;
            totalVolume: number;
            totalCollected: number;
            totalOutstanding: number;
            totalLateFees: number;
            paymentRate: number;
        };
        repaymentSchedule: {
            subscriptionId: string;
            memberId: string;
            planName: string;
            totalAmount: number;
            amountPaid: number;
            outstanding: number;
            status: import("../../common/enums/status.enum").SubscriptionStatus;
            installmentCount: number;
            paidInstallments: number;
        }[];
        agingSummary: {
            label: string;
            count: number;
        }[];
    }>;
    exportCooperativeStatement(orgId: string, res: any): Promise<void>;
    getTransactionRegister(source?: string, days?: string, limit?: string, offset?: string): Promise<{
        total: number;
        limit: number;
        offset: number;
        returned: number;
        transactions: any[];
    }>;
    exportTransactionRegister(res: any, source?: string, days?: string): Promise<void>;
    getFinancialAudit(days?: string, action?: string, limit?: string): Promise<import("../bnpl/entities/audit-log.entity").AuditLog[]>;
    getDashboard(): Promise<{
        totalPots: number;
        totalBalance: number;
        platformBalance: number;
        adminBalance: number;
        pendingReconciliations: number;
        pendingAdjustments: number;
        pendingJournalEntries: number;
        pendingFeeWithdrawals: number;
        totalSavings: number;
        totalWithdrawals: number;
        totalLoans: number;
        totalDividends: number;
        totalFeeIncome: number;
        totalMembers: number;
        bnplOutstanding: number;
        bnplVolume: number;
        postedJournalEntries: number;
    }>;
}
