import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  PaymentStatus,
  PayoutStatus,
  PaymentProvider,
} from '../../../common/enums/status.enum';

@Entity('payments')
@Index(['userId', 'createdAt'])
@Index(['subscriptionId'])
@Index(['status', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'subscription_id', nullable: true })
  subscriptionId: string;

  @Column({ type: 'varchar', nullable: true })
  purpose: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ type: 'varchar', name: 'provider_reference', length: 255 })
  providerReference: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    name: 'payout_status',
    default: PayoutStatus.PENDING,
  })
  payoutStatus: PayoutStatus;

  @Column({ type: 'varchar', name: 'payout_reference', nullable: true })
  payoutReference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
