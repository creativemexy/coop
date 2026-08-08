import { InvestmentHolding } from './investment-holding.entity';
export declare enum RedemptionStatus {
    REQUESTED = "requested",
    APPROVED = "approved",
    PROCESSED = "processed",
    PAID = "paid",
    REJECTED = "rejected"
}
export declare class RedemptionRequest {
    id: string;
    userId: string;
    holdingId: string;
    holding: InvestmentHolding;
    units: number;
    amount: number;
    status: RedemptionStatus;
    reason: string | null;
    rejectionReason: string | null;
    processedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
