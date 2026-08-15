import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Distribution } from './distribution.entity';
import { DistributionRun } from './distribution-run.entity';

@Entity('distribution_payments')
@Index(['userId'])
@Index(['distributionId'])
@Index(['runId'])
export class DistributionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'holding_id' })
  holdingId: string;

  @Column({ type: 'uuid', name: 'distribution_id' })
  distributionId: string;

  @ManyToOne(() => Distribution)
  @JoinColumn({ name: 'distribution_id' })
  distribution: Distribution;

  @Column({ type: 'uuid', name: 'run_id', nullable: true })
  runId: string | null;

  @ManyToOne(() => DistributionRun)
  @JoinColumn({ name: 'run_id' })
  run: DistributionRun;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'int', name: 'units_at_record' })
  unitsAtRecord: number;

  @Column({ type: 'boolean', default: false, name: 'is_paid' })
  isPaid: boolean;

  @Column({ type: 'timestamp', name: 'paid_at', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}