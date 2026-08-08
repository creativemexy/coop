import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InvestmentProduct } from './investment-product.entity';

export enum OrderStatus {
  PLACED = 'placed',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  INVESTED = 'invested',
  ALLOCATED = 'allocated',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity('investment_orders')
export class InvestmentOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => InvestmentProduct)
  @JoinColumn({ name: 'product_id' })
  product: InvestmentProduct;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'int', nullable: true, name: 'units' })
  units: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price', nullable: true })
  unitPrice: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'fee', default: 0 })
  fee: number;

  @Column({ type: 'int', name: 'product_version', nullable: true })
  productVersion: number | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PLACED })
  status: OrderStatus;

  @Column({ type: 'varchar', name: 'payment_reference', nullable: true })
  paymentReference: string | null;

  @Column({ type: 'uuid', name: 'payment_id', nullable: true })
  paymentId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
