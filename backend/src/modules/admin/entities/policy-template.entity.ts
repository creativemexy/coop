import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PolicyTemplateType {
  BNPL_PRODUCT = 'bnpl_product',
  KYC_REQUIREMENT = 'kyc_requirement',
  MANAGER_ACTION = 'manager_action',
  INTEREST_RATE = 'interest_rate',
  COLLECTION = 'collection',
}

export enum PolicyTemplateStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  SUPERSEDED = 'superseded',
  REJECTED = 'rejected',
}

@Entity('policy_templates')
export class PolicyTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PolicyTemplateType,
    name: 'template_type',
  })
  templateType: PolicyTemplateType;

  @Column({ type: 'int', name: 'version', default: 1 })
  version: number;

  @Column({
    type: 'enum',
    enum: PolicyTemplateStatus,
    default: PolicyTemplateStatus.DRAFT,
  })
  status: PolicyTemplateStatus;

  @Column({ type: 'jsonb', name: 'rules' })
  rules: Record<string, any>;

  @Column({ type: 'jsonb', name: 'metadata', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ type: 'text', name: 'change_summary', nullable: true })
  changeSummary: string;

  @Column({ type: 'uuid', name: 'superseded_by', nullable: true })
  supersededBy: string;

  @Column({ type: 'uuid', name: 'parent_template_id', nullable: true })
  parentTemplateId: string;

  @Column({ type: 'boolean', name: 'is_applicable_to_all_tenants', default: true })
  isApplicableToAllTenants: boolean;

  @Column({ type: 'simple-array', name: 'applicable_tenant_ids', nullable: true })
  applicableTenantIds: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
