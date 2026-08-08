import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BnplCatalogItem } from './bnpl-catalog-item.entity';
import { BnplSubscription } from './bnpl-subscription.entity';

export enum InterestType {
  FLAT = 'flat',
  MONTHLY_FEE = 'monthly_fee',
  REDUCING_BALANCE = 'reducing_balance',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RETIRED = 'retired',
}

@Entity('bnpl_plans')
export class BnplPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'uuid', name: 'catalog_item_id' })
  catalogItemId: string;

  @ManyToOne(() => BnplCatalogItem, (item) => item.plans)
  @JoinColumn({ name: 'catalog_item_id' })
  catalogItem: BnplCatalogItem;

  // Tenor options
  @Column({ type: 'jsonb', name: 'tenor_options', nullable: true })
  tenorOptions: number[]; // e.g., [3, 6, 9, 12] months

  // Principal limits and eligibility bands
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'min_principal', nullable: true })
  minPrincipal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'max_principal', nullable: true })
  maxPrincipal: number;

  @Column({ type: 'jsonb', name: 'eligibility_bands', nullable: true })
  eligibilityBands: Array<{ minScore: number; maxScore: number; maxPrincipal: number }>;

  // Installment schedule rules
  @Column({
    type: 'decimal',
    name: 'down_payment_percent',
    precision: 5,
    scale: 2,
  })
  downPaymentPercent: number;

  @Column({ type: 'int', name: 'installment_count' })
  installmentCount: number;

  @Column({ type: 'varchar', name: 'installment_frequency', length: 20 })
  installmentFrequency: string;

  // Fee/interest rules
  @Column({ type: 'enum', enum: InterestType, name: 'interest_type', default: InterestType.FLAT })
  interestType: InterestType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'monthly_fee_rate', nullable: true })
  monthlyFeeRate: number;

  // Grace period and late fee policies
  @Column({ type: 'int', name: 'grace_period_days', default: 0 })
  gracePeriodDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'late_fee_rate', default: 0 })
  lateFeeRate: number;

  @Column({ type: 'int', name: 'late_fee_cap_days', nullable: true })
  lateFeeCapDays: number;

  // Feature flag
  @Column({ type: 'boolean', name: 'is_enabled', default: true })
  isEnabled: boolean;

  @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.ACTIVE })
  status: PlanStatus;

  // Version tracking
  @Column({ type: 'int', name: 'version', default: 1 })
  version: number;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => BnplSubscription, (sub) => sub.plan)
  subscriptions: BnplSubscription[];
}
