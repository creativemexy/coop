import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CorporateActionType {
  SPLIT = 'split',
  BONUS = 'bonus',
  DIVIDEND = 'dividend',
  BUYBACK = 'buyback',
}

export enum CorporateActionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
}

@Entity('investment_corporate_actions')
export class CorporateAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'enum', enum: CorporateActionType })
  type: CorporateActionType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'ratio_numerator', default: 1 })
  ratioNumerator: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'ratio_denominator', default: 1 })
  ratioDenominator: number;

  @Column({ type: 'date', name: 'effective_date' })
  effectiveDate: Date;

  @Column({ type: 'enum', enum: CorporateActionStatus, default: CorporateActionStatus.PENDING })
  status: CorporateActionStatus;

  @Column({ type: 'jsonb', name: 'execution_result', nullable: true })
  executionResult: Record<string, any> | null;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string | null;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'uuid', name: 'executed_by', nullable: true })
  executedBy: string | null;

  @Column({ type: 'timestamp', name: 'executed_at', nullable: true })
  executedAt: Date | null;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
