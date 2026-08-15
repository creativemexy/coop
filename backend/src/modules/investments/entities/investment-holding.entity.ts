import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { InvestmentProduct } from './investment-product.entity';

@Entity('investment_holdings')
@Index(['userId', 'isActive'])
export class InvestmentHolding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => InvestmentProduct)
  @JoinColumn({ name: 'product_id' })
  product: InvestmentProduct;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'int' })
  units: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'cost_basis' })
  costBasis: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'current_value', nullable: true })
  currentValue: number | null;

  @Column({ type: 'date', name: 'locked_until', nullable: true })
  lockedUntil: Date | null;

  @Column({ type: 'date', name: 'maturity_date', nullable: true })
  maturityDate: Date | null;

  @Column({ type: 'boolean', default: true, name: 'is_locked' })
  isLocked: boolean;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
