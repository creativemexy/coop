import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PricingFormula {
  SIMPLE = 'simple',
  NAV_BASED = 'nav_based',
}

export enum NavSchedule {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum AccrualMethod {
  SIMPLE = 'simple',
  COMPOUND = 'compound',
}

@Entity('investment_pricing_config')
export class PricingConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id', unique: true })
  productId: string;

  @Column({ type: 'enum', enum: PricingFormula, default: PricingFormula.SIMPLE, name: 'formula_type' })
  formulaType: PricingFormula;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'min_unit_price', nullable: true })
  minUnitPrice: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'max_unit_price', nullable: true })
  maxUnitPrice: number | null;

  @Column({ type: 'enum', enum: NavSchedule, nullable: true, name: 'nav_schedule' })
  navSchedule: NavSchedule | null;

  @Column({ type: 'boolean', default: false, name: 'allow_corporate_actions' })
  allowCorporateActions: boolean;

  @Column({ type: 'boolean', default: true, name: 'distribution_approval_required' })
  distributionApprovalRequired: boolean;

  @Column({ type: 'enum', enum: AccrualMethod, default: AccrualMethod.SIMPLE, name: 'accrual_method' })
  accrualMethod: AccrualMethod;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
