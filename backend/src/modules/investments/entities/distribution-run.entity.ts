import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum DistRunStatus {
  COMPUTING = 'computing',
  PAYOUTS_READY = 'payouts_ready',
  APPROVED = 'approved',
  PAID = 'paid',
  FAILED = 'failed',
}

@Entity('distribution_runs')
@Index('UQ_distribution_runs_active', ['distributionId'], { unique: true, where: `status NOT IN ('paid', 'failed')` })
export class DistributionRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'distribution_id' })
  distributionId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'date', name: 'period_start' })
  periodStart: Date;

  @Column({ type: 'date', name: 'period_end' })
  periodEnd: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_accrued' })
  totalAccrued: number;

  @Column({ type: 'int', name: 'total_holdings' })
  totalHoldings: number;

  @Column({ type: 'int', name: 'payout_count', default: 0 })
  payoutCount: number;

  @Column({ type: 'int', name: 'success_count', default: 0 })
  successCount: number;

  @Column({ type: 'int', name: 'failed_count', default: 0 })
  failedCount: number;

  @Column({ type: 'enum', enum: DistRunStatus, default: DistRunStatus.COMPUTING })
  status: DistRunStatus;

  @Column({ type: 'jsonb', name: 'run_summary', nullable: true })
  runSummary: Record<string, any> | null;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'uuid', name: 'executed_by', nullable: true })
  executedBy: string | null;

  @Column({ type: 'timestamp', name: 'executed_at', nullable: true })
  executedAt: Date | null;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
