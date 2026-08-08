import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExceptionCategory {
  FAILED_PAYMENT = 'failed_payment',
  LATE_PAYMENT = 'late_payment',
  MISMATCH_AMOUNT = 'mismatch_amount',
  MISSING_WEBHOOK = 'missing_webhook',
  ELIGIBILITY_EXCEPTION = 'eligibility_exception',
  OTHER = 'other',
}

export enum EscalationAction {
  AUTO_RESOLVE = 'auto_resolve',
  MANUAL_REVIEW = 'manual_review',
  SUPERVISOR_ESCALATION = 'supervisor_escalation',
  WRITE_OFF = 'write_off',
}

@Entity('bnpl_exception_reasons')
export class ExceptionReason {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ExceptionCategory, name: 'category', default: ExceptionCategory.OTHER })
  category: ExceptionCategory;

  @Column({ type: 'int', name: 'escalation_threshold_days', nullable: true })
  escalationThresholdDays: number;

  @Column({ type: 'int', name: 'escalation_threshold_count', nullable: true })
  escalationThresholdCount: number;

  @Column({ type: 'enum', enum: EscalationAction, name: 'escalation_action', default: EscalationAction.MANUAL_REVIEW })
  escalationAction: EscalationAction;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}