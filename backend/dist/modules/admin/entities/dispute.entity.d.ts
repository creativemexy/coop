export declare enum DisputeType {
    BNPL = "bnpl",
    INVESTMENT = "investment",
    PAYMENT = "payment",
    OTHER = "other"
}
export declare enum DisputeStatus {
    OPENED = "opened",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}
export declare class Dispute {
    id: string;
    type: DisputeType;
    referenceId: string;
    userId: string;
    reason: string;
    status: DisputeStatus;
    resolution: string | null;
    resolvedBy: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
