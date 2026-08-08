export declare enum ExceptionCaseStatus {
    OPEN = "open",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    ESCALATED = "escalated"
}
export declare class ExceptionCase {
    id: string;
    subscriptionId: string;
    reasonId: string;
    description: string;
    status: ExceptionCaseStatus;
    createdBy: string;
    assignedTo: string;
    resolution: string;
    resolvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
