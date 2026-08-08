import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
export declare class AuditService {
    private readonly auditRepo;
    private readonly logger;
    constructor(auditRepo: Repository<AuditLog>);
    log(action: AuditAction, opts: {
        entityType?: string;
        entityId?: string;
        performedBy?: string;
        metadata?: Record<string, any>;
        ipAddress?: string;
    }): Promise<void>;
    findRecent(limit?: number): Promise<AuditLog[]>;
}
