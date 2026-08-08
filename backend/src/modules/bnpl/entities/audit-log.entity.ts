import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('bnpl_audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'jsonb', name: 'changes', nullable: true })
  changes: Record<string, { from: any; to: any }>;

  @Column({ type: 'text', name: 'reason', nullable: true })
  reason: string;

  @Column({ type: 'uuid', name: 'performed_by' })
  performedBy: string;

  @Column({ type: 'varchar', length: 255, name: 'performer_name', nullable: true })
  performerName: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  evidence: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}