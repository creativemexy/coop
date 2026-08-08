import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum InvestmentType {
  SHARES = 'shares',
  FIXED_INCOME = 'fixed_income',
  POOLED = 'pooled',
}

export enum RiskTier {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum DistributionFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  MATURITY = 'maturity',
}

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export const VALID_LIFECYCLE_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  [ProductStatus.DRAFT]: [ProductStatus.PENDING_REVIEW, ProductStatus.ARCHIVED],
  [ProductStatus.PENDING_REVIEW]: [ProductStatus.ACTIVE, ProductStatus.DRAFT],
  [ProductStatus.ACTIVE]: [ProductStatus.SUSPENDED, ProductStatus.CLOSED],
  [ProductStatus.SUSPENDED]: [ProductStatus.ACTIVE, ProductStatus.CLOSED],
  [ProductStatus.CLOSED]: [ProductStatus.ARCHIVED],
  [ProductStatus.ARCHIVED]: [],
};

@Entity('investment_products')
export class InvestmentProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: InvestmentType })
  type: InvestmentType;

  @Column({ type: 'enum', enum: RiskTier, default: RiskTier.MEDIUM })
  riskTier: RiskTier;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'minimum_investment', default: 0 })
  minimumInvestment: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'maximum_investment', nullable: true })
  maximumInvestment: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_capacity', nullable: true })
  totalCapacity: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'current_capacity', nullable: true })
  currentCapacity: number | null;

  @Column({ type: 'jsonb', name: 'per_investor_caps', nullable: true })
  perInvestorCaps: { min?: number; max?: number } | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price', nullable: true })
  unitPrice: number | null;

  @Column({ type: 'int', name: 'lock_in_days', default: 0 })
  lockInDays: number;

  @Column({ type: 'int', name: 'tenor_days', nullable: true })
  tenorDays: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'management_fee_rate', default: 0 })
  managementFeeRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'expected_return_rate', default: 0 })
  expectedReturnRate: number;

  @Column({ type: 'text', name: 'profit_sharing_rules', nullable: true })
  profitSharingRules: string | null;

  @Column({ type: 'enum', enum: DistributionFrequency, default: DistributionFrequency.MATURITY })
  distributionFrequency: DistributionFrequency;

  @Column({ type: 'int', name: 'total_units', nullable: true })
  totalUnits: number | null;

  @Column({ type: 'int', name: 'available_units', nullable: true })
  availableUnits: number | null;

  @Column({ type: 'boolean', default: true, name: 'is_open' })
  isOpen: boolean;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'uuid', name: 'organization_id', nullable: true })
  organizationId: string | null;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
