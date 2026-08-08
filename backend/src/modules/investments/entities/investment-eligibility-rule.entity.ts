import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InvestmentProduct } from './investment-product.entity';

export enum KycLevel {
  NONE = 'none',
  BASIC = 'basic',
  ADVANCED = 'advanced',
}

@Entity('investment_eligibility_rules')
export class InvestmentEligibilityRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => InvestmentProduct)
  @JoinColumn({ name: 'product_id' })
  product: InvestmentProduct;

  @Column({ type: 'enum', enum: KycLevel, name: 'kyc_required_level', default: KycLevel.BASIC })
  kycRequiredLevel: KycLevel;

  @Column({ type: 'boolean', name: 'require_membership', default: false })
  requireMembership: boolean;

  @Column({ type: 'jsonb', name: 'allowed_geographies', nullable: true })
  allowedGeographies: string[] | null;

  @Column({ type: 'boolean', name: 'accreditation_required', default: false })
  accreditationRequired: boolean;

  @Column({ type: 'jsonb', name: 'investor_whitelist', nullable: true })
  investorWhitelist: string[] | null;

  @Column({ type: 'jsonb', name: 'investor_blacklist', nullable: true })
  investorBlacklist: string[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
