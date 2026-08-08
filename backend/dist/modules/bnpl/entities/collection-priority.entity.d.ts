export declare enum PriorityLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum PriorityEntityType {
    SUBSCRIPTION = "subscription",
    USER = "user"
}
export declare class CollectionPriority {
    id: string;
    entityType: PriorityEntityType;
    entityId: string;
    priority: PriorityLevel;
    reason: string;
    assignedBy: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
