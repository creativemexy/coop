import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RiskFlagStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum RiskFlagEntityType {
  SUBSCRIPTION = 'subscription',
  USER = 'user',
}

@Entity('bnpl_risk_flags')
export class RiskFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: RiskFlagEntityType, name: 'entity_type' })
  entityType: RiskFlagEntityType;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, name: 'flagged_by' })
  flaggedBy: string;

  @Column({
    type: 'enum',
    enum: RiskFlagStatus,
    default: RiskFlagStatus.OPEN,
  })
  status: RiskFlagStatus;

  @Column({ type: 'uuid', name: 'resolved_by', nullable: true })
  resolvedBy: string;

  @Column({ type: 'text', name: 'resolution_note', nullable: true })
  resolutionNote: string;

  @Column({ type: 'timestamp', name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}