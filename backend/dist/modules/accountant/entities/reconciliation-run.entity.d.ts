import { ReconciliationResult } from './reconciliation-result.entity';
export declare enum ReconciliationStatus {
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class ReconciliationRun {
    id: string;
    rangeStart: Date;
    rangeEnd: Date;
    status: ReconciliationStatus;
    totalExpected: number;
    totalActual: number;
    matchCount: number;
    mismatchCount: number;
    expectedAmount: number;
    actualAmount: number;
    discrepancy: number;
    organizationId: string;
    runBy: string;
    completedAt: Date;
    results: ReconciliationResult[];
    createdAt: Date;
    updatedAt: Date;
}
