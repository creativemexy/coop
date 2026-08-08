import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InvestmentProduct } from './investment-product.entity';

export enum CycleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('share_issuance_cycles')
export class ShareIssuanceCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => InvestmentProduct)
  @JoinColumn({ name: 'product_id' })
  product: InvestmentProduct;

  @Column({ type: 'varchar', length: 255, name: 'cycle_name' })
  cycleName: string;

  @Column({ type: 'int', name: 'total_units' })
  totalUnits: number;

  @Column({ type: 'int', name: 'allocated_units', default: 0 })
  allocatedUnits: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_value' })
  totalValue: number;

  @Column({ type: 'date', name: 'open_date', nullable: true })
  openDate: Date | null;

  @Column({ type: 'date', name: 'close_date', nullable: true })
  closeDate: Date | null;

  @Column({ type: 'enum', enum: CycleStatus, default: CycleStatus.PENDING })
  status: CycleStatus;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
