import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProcessingStepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ProcessingStepType {
  PAYMENT_INTENT = 'payment_intent',
  DISBURSEMENT = 'disbursement',
  INSTALLMENT_GENERATION = 'installment_generation',
  SETTLEMENT = 'settlement',
  RECONCILIATION = 'reconciliation',
}

@Entity('bnpl_processing_steps')
export class ProcessingStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'subscription_id' })
  subscriptionId: string;

  @Column({ type: 'enum', enum: ProcessingStepType, name: 'step_type' })
  stepType: ProcessingStepType;

  @Column({
    type: 'enum',
    enum: ProcessingStepStatus,
    default: ProcessingStepStatus.PENDING,
  })
  status: ProcessingStepStatus;

  @Column({ type: 'varchar', length: 255, name: 'idempotency_key', nullable: true, unique: true })
  idempotencyKey: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'varchar', length: 255, name: 'external_reference', nullable: true })
  externalReference: string;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
