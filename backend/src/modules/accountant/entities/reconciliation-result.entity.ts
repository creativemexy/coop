import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReconciliationRun } from './reconciliation-run.entity';

export enum ResultStatus {
  MATCHED = 'matched',
  UNMATCHED = 'unmatched',
  NEEDS_REVIEW = 'needs_review',
}

@Entity('reconciliation_results')
export class ReconciliationResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'run_id' })
  runId: string;

  @ManyToOne(() => ReconciliationRun, (r) => r.results)
  @JoinColumn({ name: 'run_id' })
  run: ReconciliationRun;

  @Column({ type: 'uuid', name: 'subscription_id' })
  subscriptionId: string;

  @Column({ type: 'uuid', name: 'installment_id', nullable: true })
  installmentId: string;

  @Column({ type: 'decimal', name: 'expected_amount', precision: 15, scale: 2 })
  expectedAmount: number;

  @Column({ type: 'decimal', name: 'actual_amount', precision: 15, scale: 2, default: 0 })
  actualAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discrepancy: number;

  @Column({ type: 'date', name: 'expected_date', nullable: true })
  expectedDate: Date;

  @Column({ type: 'date', name: 'actual_date', nullable: true })
  actualDate: Date;

  @Column({
    type: 'enum',
    enum: ResultStatus,
    default: ResultStatus.UNMATCHED,
  })
  status: ResultStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'simple-array', name: 'flags', nullable: true })
  flags: string[];

  @Column({ type: 'uuid', name: 'organization_id', nullable: true })
  organizationId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
