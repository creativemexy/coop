export declare enum IncidentSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum IncidentStatus {
    DETECTED = "detected",
    INVESTIGATING = "investigating",
    MITIGATED = "mitigated",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare enum IncidentSource {
    MONITORING = "monitoring",
    USER_REPORTED = "user_reported",
    SYSTEM_ALERT = "system_alert",
    PAYMENT_FAILURE = "payment_failure",
    SECURITY = "security",
    PERFORMANCE = "performance"
}
export declare class Incident {
    id: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    source: IncidentSource;
    tenantId: string;
    affectedSystems: string[];
    metrics: Record<string, any>;
    resolutionSteps: Record<string, any>[];
    assignedTo: string;
    reportedBy: string;
    resolvedBy: string;
    detectedAt: Date;
    resolvedAt: Date;
    rootCause: string;
    actionItems: string;
    createdAt: Date;
    updatedAt: Date;
}
