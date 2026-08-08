import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AdjustmentType {
  METADATA_CORRECTION = 'metadata_correction',
  JOURNAL_ENTRY = 'journal_entry',
}

export enum AdjustmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('adjustment_requests')
export class AdjustmentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AdjustmentType,
    name: 'adjustment_type',
  })
  adjustmentType: AdjustmentType;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 50, name: 'reason_code' })
  reasonCode: string;

  @Column({ type: 'jsonb', name: 'changes' })
  changes: Record<string, any>;

  @Column({ type: 'varchar', length: 100, name: 'reference_type', nullable: true })
  referenceType: string;

  @Column({ type: 'uuid', name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({
    type: 'enum',
    enum: AdjustmentStatus,
    default: AdjustmentStatus.PENDING,
  })
  status: AdjustmentStatus;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ type: 'uuid', name: 'requested_by' })
  requestedBy: string;

  @Column({ type: 'uuid', name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
