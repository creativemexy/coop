export declare enum RiskFlagStatus {
    OPEN = "open",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}
export declare enum RiskFlagEntityType {
    SUBSCRIPTION = "subscription",
    USER = "user"
}
export declare class RiskFlag {
    id: string;
    entityType: RiskFlagEntityType;
    entityId: string;
    reason: string;
    description: string;
    flaggedBy: string;
    status: RiskFlagStatus;
    resolvedBy: string;
    resolutionNote: string;
    resolvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
