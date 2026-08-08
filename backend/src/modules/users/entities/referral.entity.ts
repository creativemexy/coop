import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'referrer_id' })
  referrerId: string;

  @Index()
  @Column({ name: 'referee_id', nullable: true })
  refereeId: string;

  @Column({ name: 'referee_email', length: 255 })
  refereeEmail: string;

  @Index()
  @Column({ name: 'referral_code', length: 20 })
  referralCode: string;

  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  status: ReferralStatus;

  @Column({ type: 'decimal', name: 'reward_amount', precision: 15, scale: 2, default: 0 })
  rewardAmount: number;

  @Column({ name: 'reward_paid', default: false })
  rewardPaid: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
