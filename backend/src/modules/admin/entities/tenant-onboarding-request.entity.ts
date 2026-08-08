import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OnboardingStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  COMPLIANCE_REVIEW = 'compliance_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ONBOARDED = 'onboarded',
}

@Entity('tenant_onboarding_requests')
export class TenantOnboardingRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'org_name' })
  orgName: string;

  @Column({ type: 'varchar', length: 100, name: 'org_code' })
  orgCode: string;

  @Column({ type: 'uuid', name: 'apex_org_id' })
  apexOrgId: string;

  @Column({
    type: 'enum',
    enum: OnboardingStatus,
    default: OnboardingStatus.DRAFT,
  })
  status: OnboardingStatus;

  @Column({ type: 'jsonb', name: 'compliance_docs', nullable: true })
  complianceDocs: Record<string, any>;

  @Column({ type: 'jsonb', name: 'kyc_requirements', nullable: true })
  kycRequirements: Record<string, any>;

  @Column({ type: 'jsonb', name: 'product_config', nullable: true })
  productConfig: Record<string, any>;

  @Column({ type: 'jsonb', name: 'contact_info', nullable: true })
  contactInfo: Record<string, any>;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', name: 'review_notes', nullable: true })
  reviewNotes: string;

  @Column({ type: 'uuid', name: 'submitted_by' })
  submittedBy: string;

  @Column({ type: 'uuid', name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'timestamp', name: 'onboarded_at', nullable: true })
  onboardedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
