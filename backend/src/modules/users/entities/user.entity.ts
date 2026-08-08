import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum';
import { KycStatus } from '../../../common/enums/status.enum';
import { ApexOrganization } from '../../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { encryptColumn } from '../../../common/encryption.transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, transformer: encryptColumn })
  email: string;

  @Column({ type: 'varchar', name: 'email_hash', length: 64, unique: true, nullable: true })
  emailHash: string | null;

  @Column({ type: 'varchar', name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', name: 'first_name', length: 255, transformer: encryptColumn, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', name: 'last_name', length: 255, transformer: encryptColumn, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, transformer: encryptColumn })
  phone: string | null;

  @Column({ type: 'varchar', name: 'phone_hash', length: 64, nullable: true, unique: true })
  phoneHash: string | null;

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @Column({ type: 'uuid', name: 'apex_org_id', nullable: true })
  apexOrgId: string | null;

  @ManyToOne(() => ApexOrganization, (apex) => apex.users)
  @JoinColumn({ name: 'apex_org_id' })
  apexOrg: ApexOrganization | null;

  @Column({ type: 'uuid', name: 'organization_id', nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.NONE,
    name: 'kyc_status',
  })
  kycStatus: KycStatus;

  @Column({ type: 'varchar', name: 'kyc_reference', nullable: true })
  kycReference: string;

  @Column({ type: 'text', name: 'kyc_image', nullable: true })
  kycImage: string | null;

  @Column({ type: 'timestamp', name: 'kyc_verified_at', nullable: true })
  kycVerifiedAt: Date | null;

  @Column({ type: 'varchar', name: 'social_provider', nullable: true })
  socialProvider: string;

  @Column({ type: 'varchar', name: 'social_id', nullable: true })
  socialId: string;

  @Column({ type: 'boolean', name: 'registration_fee_paid', default: false })
  registrationFeePaid: boolean;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  @Column({ type: 'jsonb', name: 'notification_preferences', nullable: true })
  notificationPreferences: { email?: boolean; sms?: boolean; inApp?: boolean };

  @Column({ type: 'varchar', name: 'referral_code', length: 20, nullable: true, unique: true })
  referralCode: string;

  @Column({ type: 'varchar', name: 'referred_by', nullable: true })
  referredBy: string;

  @Column({ type: 'int', name: 'referral_count', default: 0 })
  referralCount: number;

  @Column({ type: 'decimal', name: 'referral_earnings', precision: 15, scale: 2, default: 0 })
  referralEarnings: number;

  @Column({ type: 'varchar', name: 'refresh_token_hash', nullable: true })
  refreshTokenHash: string;

  @Column({ type: 'int', name: 'failed_attempts', default: 0 })
  failedAttempts: number;

  @Column({ type: 'timestamp', name: 'locked_until', nullable: true })
  lockedUntil: Date;

  @Column({ type: 'varchar', name: 'reset_token', nullable: true })
  resetToken: string;

  @Column({ type: 'timestamp', name: 'reset_token_expiry', nullable: true })
  resetTokenExpiry: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
