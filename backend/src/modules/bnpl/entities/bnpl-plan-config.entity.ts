import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum InterestModel {
  FIXED_MONTHLY_FEE = 'fixed_monthly_fee',
  REDUCING_BALANCE = 'reducing_balance',
  SIMPLE = 'simple',
}

export enum DueDateRule {
  SAME_DAY_MONTHLY = 'same_day_monthly',
  END_OF_MONTH = 'end_of_month',
}

export enum LateFeeType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

@Entity('bnpl_plan_configs')
export class BnplPlanConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'organization_id', unique: true })
  organizationId: string;

  @Column({ type: 'jsonb', name: 'available_tenors' })
  availableTenors: {
    installmentCount: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    label: string;
  }[];

  @Column({
    type: 'enum',
    enum: InterestModel,
    name: 'interest_model',
    default: InterestModel.SIMPLE,
  })
  interestModel: InterestModel;

  @Column({
    type: 'decimal',
    name: 'max_principal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  maxPrincipal: number;

  @Column({ type: 'boolean', name: 'require_membership', default: false })
  requireMembership: boolean;

  @Column({
    type: 'enum',
    enum: DueDateRule,
    name: 'due_date_rule',
    default: DueDateRule.SAME_DAY_MONTHLY,
  })
  dueDateRule: DueDateRule;

  @Column({ type: 'int', name: 'grace_period_days', default: 0 })
  gracePeriodDays: number;

  @Column({
    type: 'enum',
    enum: LateFeeType,
    name: 'late_fee_type',
    default: LateFeeType.PERCENTAGE,
  })
  lateFeeType: LateFeeType;

  @Column({
    type: 'decimal',
    name: 'late_fee_value',
    precision: 10,
    scale: 2,
    default: 0,
  })
  lateFeeValue: number;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}