import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IncidentSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum IncidentStatus {
  DETECTED = 'detected',
  INVESTIGATING = 'investigating',
  MITIGATED = 'mitigated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum IncidentSource {
  MONITORING = 'monitoring',
  USER_REPORTED = 'user_reported',
  SYSTEM_ALERT = 'system_alert',
  PAYMENT_FAILURE = 'payment_failure',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
}

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
  })
  severity: IncidentSeverity;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.DETECTED,
  })
  status: IncidentStatus;

  @Column({
    type: 'enum',
    enum: IncidentSource,
    name: 'source',
  })
  source: IncidentSource;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string;

  @Column({ type: 'jsonb', name: 'affected_systems', nullable: true })
  affectedSystems: string[];

  @Column({ type: 'jsonb', name: 'metrics', nullable: true })
  metrics: Record<string, any>;

  @Column({ type: 'jsonb', name: 'resolution_steps', nullable: true })
  resolutionSteps: Record<string, any>[];

  @Column({ type: 'uuid', name: 'assigned_to', nullable: true })
  assignedTo: string;

  @Column({ type: 'uuid', name: 'reported_by' })
  reportedBy: string;

  @Column({ type: 'uuid', name: 'resolved_by', nullable: true })
  resolvedBy: string;

  @Column({ type: 'timestamp', name: 'detected_at', default: () => 'CURRENT_TIMESTAMP' })
  detectedAt: Date;

  @Column({ type: 'timestamp', name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', name: 'root_cause', nullable: true })
  rootCause: string;

  @Column({ type: 'text', name: 'action_items', nullable: true })
  actionItems: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
