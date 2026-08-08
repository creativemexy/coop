import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InvestmentProduct } from './investment-product.entity';

@Entity('investment_product_versions')
export class InvestmentProductVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => InvestmentProduct)
  @JoinColumn({ name: 'product_id' })
  product: InvestmentProduct;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'jsonb', name: 'snapshot' })
  snapshot: Record<string, any>;

  @Column({ type: 'varchar', name: 'change_summary', nullable: true })
  changeSummary: string | null;

  @Column({ type: 'uuid', name: 'changed_by', nullable: true })
  changedBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
