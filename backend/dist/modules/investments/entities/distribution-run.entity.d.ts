export declare enum DistRunStatus {
    COMPUTING = "computing",
    PAYOUTS_READY = "payouts_ready",
    APPROVED = "approved",
    PAID = "paid",
    FAILED = "failed"
}
export declare class DistributionRun {
    id: string;
    distributionId: string;
    productId: string;
    periodStart: Date;
    periodEnd: Date;
    totalAccrued: number;
    totalHoldings: number;
    payoutCount: number;
    successCount: number;
    failedCount: number;
    status: DistRunStatus;
    runSummary: Record<string, any> | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    executedBy: string | null;
    executedAt: Date | null;
    createdBy: string;
    createdAt: Date;
}
