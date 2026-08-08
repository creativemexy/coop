export declare enum DistributionType {
    DIVIDEND = "dividend",
    INTEREST = "interest",
    PROFIT_SHARE = "profit_share"
}
export declare enum DistributionStatus {
    DRAFT = "draft",
    PENDING_APPROVAL = "pending_approval",
    APPROVED = "approved",
    EXECUTED = "executed",
    FAILED = "failed"
}
export declare class Distribution {
    id: string;
    productId: string;
    type: DistributionType;
    amountPerUnit: number;
    totalPool: number;
    recordDate: Date;
    payDate: Date;
    description: string | null;
    status: DistributionStatus;
    approvedBy: string | null;
    approvedAt: Date | null;
    isPaid: boolean;
    createdBy: string | null;
    createdAt: Date;
}
