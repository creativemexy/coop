import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import {
  SubscriptionStatus,
  PayoutStatus,
} from '../../../common/enums/status.enum';
import { BnplPlan } from './bnpl-plan.entity';
import { BnplInstallment } from './bnpl-installment.entity';

@Entity('bnpl_subscriptions')
export class BnplSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'plan_id' })
  planId: string;

  @ManyToOne(() => BnplPlan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: BnplPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.CREATED,
  })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', name: 'down_payment', precision: 15, scale: 2 })
  downPayment: number;

  @Column({ type: 'decimal', name: 'total_amount', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'decimal',
    name: 'amount_paid',
    precision: 15,
    scale: 2,
    default: 0,
  })
  amountPaid: number;

  @Column({ type: 'date', name: 'next_installment_date', nullable: true })
  nextInstallmentDate: Date;

  @Column({ type: 'varchar', name: 'provider_reference', nullable: true })
  providerReference: string;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    name: 'payout_status',
    default: PayoutStatus.PENDING,
  })
  payoutStatus: PayoutStatus;

  @Column({ type: 'varchar', name: 'disbursement_reference', nullable: true })
  disbursementReference: string;

  @Column({ type: 'timestamp', name: 'disbursed_at', nullable: true })
  disbursedAt: Date;

  @Column({ type: 'timestamp', name: 'settled_at', nullable: true })
  settledAt: Date;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => BnplInstallment, (inst) => inst.subscription)
  installments: BnplInstallment[];
}
