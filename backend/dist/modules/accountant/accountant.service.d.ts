import { Repository } from 'typeorm';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { FeeShareLedger } from '../ledger/entities/fee-share-ledger.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';
import { Distribution } from '../investments/entities/distribution.entity';
import { FeeWithdrawalRequest } from '../ledger/entities/fee-withdrawal-request.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { ReconciliationRun } from './entities/reconciliation-run.entity';
import { ReconciliationResult, ResultStatus } from './entities/reconciliation-result.entity';
import { AdjustmentRequest, AdjustmentType, AdjustmentStatus } from './entities/adjustment-request.entity';
import { SubscriptionStatus, InstallmentStatus, PaymentStatus, PayoutStatus } from '../../common/enums/status.enum';
import { Loan } from '../loans/entities/loan.entity';
import { LoanRepayment } from '../loans/entities/loan-repayment.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { JournalEntry } from '../ledger/entities/journal-entry.entity';
import { JournalLine } from '../ledger/entities/journal-line.entity';
export declare class AccountantService {
    private readonly subRepo;
    private readonly instRepo;
    private readonly planRepo;
    private readonly catalogRepo;
    private readonly paymentRepo;
    private readonly feeShareRepo;
    private readonly orgRepo;
    private readonly userRepo;
    private readonly auditRepo;
    private readonly recRunRepo;
    private readonly recResultRepo;
    private readonly adjRepo;
    private readonly loanRepo;
    private readonly loanRepayRepo;
    private readonly savAcctRepo;
    private readonly savTxRepo;
    private readonly journalRepo;
    private readonly journalLineRepo;
    private readonly feePotRepo;
    private readonly distributionRepo;
    private readonly withdrawalRepo;
    constructor(subRepo: Repository<BnplSubscription>, instRepo: Repository<BnplInstallment>, planRepo: Repository<BnplPlan>, catalogRepo: Repository<BnplCatalogItem>, paymentRepo: Repository<Payment>, feeShareRepo: Repository<FeeShareLedger>, orgRepo: Repository<Organization>, userRepo: Repository<User>, auditRepo: Repository<AuditLog>, recRunRepo: Repository<ReconciliationRun>, recResultRepo: Repository<ReconciliationResult>, adjRepo: Repository<AdjustmentRequest>, loanRepo: Repository<Loan>, loanRepayRepo: Repository<LoanRepayment>, savAcctRepo: Repository<SavingsAccount>, savTxRepo: Repository<SavingsTransaction>, journalRepo: Repository<JournalEntry>, journalLineRepo: Repository<JournalLine>, feePotRepo: Repository<FeePot>, distributionRepo: Repository<Distribution>, withdrawalRepo: Repository<FeeWithdrawalRequest>);
    getOrderLedger(orgId?: string, days?: number): Promise<{
        id: string;
        status: SubscriptionStatus;
        totalAmount: number;
        amountPaid: number;
        downPayment: number;
        outstanding: number;
        providerReference: string;
        disbursementReference: string;
        payoutStatus: PayoutStatus;
        createdAt: Date;
        settledAt: Date;
        planName: string;
        planOrgId: string | null;
        installmentCount: number;
        paidInstallments: number;
    }[]>;
    getInstallmentLedger(orgId?: string, days?: number): Promise<{
        id: string;
        subscriptionId: string;
        amount: number;
        lateFeeAmount: number;
        dueDate: Date;
        status: InstallmentStatus;
        paidAt: Date;
        paymentReference: string;
        planName: string;
        organizationId: string | null;
        createdAt: Date;
    }[]>;
    getPaymentReferences(orgId?: string, days?: number): Promise<{
        id: string;
        subscriptionId: string;
        amount: number;
        fee: number;
        provider: import("../../common/enums/status.enum").PaymentProvider;
        providerReference: string;
        status: PaymentStatus;
        payoutStatus: PayoutStatus;
        payoutReference: string;
        createdAt: Date;
    }[]>;
    getSettlementReferences(orgId?: string, days?: number): Promise<{
        id: string;
        subscriptionId: string;
        amount: number;
        provider: import("../../common/enums/status.enum").PaymentProvider;
        providerReference: string;
        payoutReference: string;
        payoutStatus: PayoutStatus;
        settledAt: Date;
    }[]>;
    getTenants(): Promise<Organization[]>;
    exportOrderLedgerCsv(orgId?: string, days?: number): Promise<string>;
    exportInstallmentLedgerCsv(orgId?: string, days?: number): Promise<string>;
    exportPaymentReferencesCsv(orgId?: string, days?: number): Promise<string>;
    exportSettlementReferencesCsv(orgId?: string, days?: number): Promise<string>;
    runReconciliation(dto: {
        rangeStart: string;
        rangeEnd: string;
        organizationId?: string;
        runBy: string;
    }): Promise<ReconciliationRun | null>;
    getReconciliationRuns(organizationId?: string): Promise<ReconciliationRun[]>;
    getReconciliationRun(id: string): Promise<ReconciliationRun>;
    getReconciliationResults(runId: string, status?: ResultStatus): Promise<ReconciliationResult[]>;
    exportReconciliationCsv(runId: string): Promise<string>;
    updateReconciliationResult(id: string, dto: {
        status: ResultStatus;
        notes?: string;
    }): Promise<ReconciliationResult>;
    createAdjustmentRequest(dto: {
        adjustmentType: AdjustmentType;
        description: string;
        reasonCode: string;
        changes: Record<string, any>;
        referenceType?: string;
        referenceId?: string;
        requestedBy: string;
    }): Promise<AdjustmentRequest>;
    listAdjustmentRequests(status?: AdjustmentStatus): Promise<AdjustmentRequest[]>;
    getAdjustmentRequest(id: string): Promise<AdjustmentRequest>;
    approveAdjustmentRequest(id: string, reviewedBy: string): Promise<AdjustmentRequest>;
    rejectAdjustmentRequest(id: string, reviewedBy: string, reason: string): Promise<AdjustmentRequest>;
    getMemberStatement(userId: string, days?: number): Promise<{
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
            status: SubscriptionStatus;
            installments: {
                id: string;
                amount: number;
                dueDate: Date;
                status: InstallmentStatus;
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
            status: PaymentStatus;
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
    getCooperativeStatement(orgId: string, days?: number): Promise<{
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
            status: SubscriptionStatus;
            installmentCount: number;
            paidInstallments: number;
        }[];
        agingSummary: {
            label: string;
            count: number;
        }[];
    }>;
    exportMemberStatementCsv(userId: string): Promise<string>;
    exportCooperativeStatementCsv(orgId: string): Promise<string>;
    getFinancialAuditLog(days?: number, action?: string, limit?: number): Promise<AuditLog[]>;
    getTransactionRegister(dto: {
        source?: string;
        orgId?: string;
        days?: number;
        limit?: number;
        offset?: number;
    }): Promise<{
        total: number;
        limit: number;
        offset: number;
        returned: number;
        transactions: any[];
    }>;
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
    exportTransactionRegisterCsv(dto: {
        source?: string;
        days?: number;
    }): Promise<string>;
}
