export declare enum QueueStatus {
    PENDING = "pending",
    CONTACTED = "contacted",
    IN_NEGOTIATION = "in_negotiation",
    ESCALATED = "escalated",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare enum QueuePriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class CollectionQueue {
    id: string;
    subscriptionId: string;
    userId: string;
    status: QueueStatus;
    priority: QueuePriority;
    daysOverdue: number;
    totalOverdueAmount: number;
    outstandingPrincipal: number;
    lastContactedAt: Date;
    agentNote: string;
    assignedTo: string;
    assignedBy: string;
    resolvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
