import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ApprovalRequestType {
  PRODUCT_CHANGE = 'product_change',
  MANUAL_OVERRIDE = 'manual_override',
  USER_SUSPENSION = 'user_suspension',
  WRITE_OFF = 'write_off',
  RESTRUCTURING = 'restructuring',
  ELIGIBILITY_EXCEPTION = 'eligibility_exception',
  TENANT_PRODUCT_ENABLEMENT = 'tenant_product_enablement',
  POLICY_TEMPLATE_CHANGE = 'policy_template_change',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('bnpl_approval_requests')
@Index(['status', 'createdAt'])
export class ApprovalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ApprovalRequestType,
    name: 'request_type',
  })
  requestType: ApprovalRequestType;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'jsonb', name: 'request_data' })
  requestData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ type: 'uuid', name: 'requested_by' })
  requestedBy: string;

  @Column({ type: 'uuid', name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}