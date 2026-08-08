import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum DistributionType {
  DIVIDEND = 'dividend',
  INTEREST = 'interest',
  PROFIT_SHARE = 'profit_share',
}

export enum DistributionStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  EXECUTED = 'executed',
  FAILED = 'failed',
}

@Entity('distributions')
export class Distribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'enum', enum: DistributionType })
  type: DistributionType;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'amount_per_unit' })
  amountPerUnit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_pool' })
  totalPool: number;

  @Column({ type: 'date', name: 'record_date' })
  recordDate: Date;

  @Column({ type: 'date', name: 'pay_date' })
  payDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: DistributionStatus, default: DistributionStatus.DRAFT })
  status: DistributionStatus;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'boolean', default: false, name: 'is_paid' })
  isPaid: boolean;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
