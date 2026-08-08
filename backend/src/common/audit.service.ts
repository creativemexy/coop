import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    action: AuditAction,
    opts: {
      entityType?: string;
      entityId?: string;
      performedBy?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
    },
  ): Promise<void> {
    try {
      const entry = this.auditRepo.create({ action, ...opts });
      await this.auditRepo.save(entry);
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  async findRecent(limit = 100): Promise<AuditLog[]> {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
