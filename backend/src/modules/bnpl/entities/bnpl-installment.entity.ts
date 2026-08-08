import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InstallmentStatus } from '../../../common/enums/status.enum';
import { BnplSubscription } from './bnpl-subscription.entity';

@Entity('bnpl_installments')
export class BnplInstallment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'subscription_id' })
  subscriptionId: string;

  @ManyToOne(() => BnplSubscription, (sub) => sub.installments)
  @JoinColumn({ name: 'subscription_id' })
  subscription: BnplSubscription;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'decimal', name: 'late_fee_amount', precision: 15, scale: 2, default: 0 })
  lateFeeAmount: number;

  @Column({ type: 'date', name: 'grace_period_end', nullable: true })
  gracePeriodEnd: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: InstallmentStatus,
    default: InstallmentStatus.PENDING,
  })
  status: InstallmentStatus;

  @Column({ type: 'timestamp', name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ type: 'varchar', name: 'payment_reference', nullable: true })
  paymentReference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
