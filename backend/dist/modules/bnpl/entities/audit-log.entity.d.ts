export declare class AuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    changes: Record<string, {
        from: any;
        to: any;
    }>;
    reason: string;
    performedBy: string;
    performerName: string;
    ipAddress: string;
    evidence: string;
    createdAt: Date;
}
