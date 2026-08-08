import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ReconciliationResult } from './reconciliation-result.entity';

export enum ReconciliationStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('reconciliation_runs')
export class ReconciliationRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', name: 'range_start' })
  rangeStart: Date;

  @Column({ type: 'date', name: 'range_end' })
  rangeEnd: Date;

  @Column({
    type: 'enum',
    enum: ReconciliationStatus,
    default: ReconciliationStatus.IN_PROGRESS,
  })
  status: ReconciliationStatus;

  @Column({ type: 'int', name: 'total_expected', default: 0 })
  totalExpected: number;

  @Column({ type: 'int', name: 'total_actual', default: 0 })
  totalActual: number;

  @Column({ type: 'int', name: 'match_count', default: 0 })
  matchCount: number;

  @Column({ type: 'int', name: 'mismatch_count', default: 0 })
  mismatchCount: number;

  @Column({ type: 'decimal', name: 'expected_amount', precision: 15, scale: 2, default: 0 })
  expectedAmount: number;

  @Column({ type: 'decimal', name: 'actual_amount', precision: 15, scale: 2, default: 0 })
  actualAmount: number;

  @Column({ type: 'decimal', name: 'discrepancy', precision: 15, scale: 2, default: 0 })
  discrepancy: number;

  @Column({ type: 'uuid', name: 'organization_id', nullable: true })
  organizationId: string;

  @Column({ type: 'uuid', name: 'run_by' })
  runBy: string;

  @Column({ type: 'timestamp', name: 'completed_at', nullable: true })
  completedAt: Date;

  @OneToMany(() => ReconciliationResult, (r) => r.run)
  results: ReconciliationResult[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
