import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InvestmentHolding } from './investment-holding.entity';

export enum RedemptionStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  PROCESSED = 'processed',
  PAID = 'paid',
  REJECTED = 'rejected',
}

@Entity('redemption_requests')
export class RedemptionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'holding_id' })
  holdingId: string;

  @ManyToOne(() => InvestmentHolding)
  @JoinColumn({ name: 'holding_id' })
  holding: InvestmentHolding;

  @Column({ type: 'int', name: 'units' })
  units: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: RedemptionStatus, default: RedemptionStatus.REQUESTED })
  status: RedemptionStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', name: 'processed_at', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
