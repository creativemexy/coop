export declare enum CorporateActionType {
    SPLIT = "split",
    BONUS = "bonus",
    DIVIDEND = "dividend",
    BUYBACK = "buyback"
}
export declare enum CorporateActionStatus {
    PENDING = "pending",
    APPROVED = "approved",
    EXECUTED = "executed",
    CANCELLED = "cancelled"
}
export declare class CorporateAction {
    id: string;
    productId: string;
    type: CorporateActionType;
    description: string | null;
    ratioNumerator: number;
    ratioDenominator: number;
    effectiveDate: Date;
    status: CorporateActionStatus;
    executionResult: Record<string, any> | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    executedBy: string | null;
    executedAt: Date | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
