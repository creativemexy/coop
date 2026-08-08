import { ReconciliationRun } from './reconciliation-run.entity';
export declare enum ResultStatus {
    MATCHED = "matched",
    UNMATCHED = "unmatched",
    NEEDS_REVIEW = "needs_review"
}
export declare class ReconciliationResult {
    id: string;
    runId: string;
    run: ReconciliationRun;
    subscriptionId: string;
    installmentId: string;
    expectedAmount: number;
    actualAmount: number;
    discrepancy: number;
    expectedDate: Date;
    actualDate: Date;
    status: ResultStatus;
    notes: string;
    flags: string[];
    organizationId: string | null;
    createdAt: Date;
}
