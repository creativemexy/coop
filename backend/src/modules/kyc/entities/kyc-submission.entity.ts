import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { KycProvider } from '../../../common/enums/status.enum';
import { KycStatus } from '../../../common/enums/status.enum';

@Entity('kyc_submissions')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
export class KycSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: KycProvider, default: KycProvider.KORAPAY })
  provider: KycProvider;

  @Column({ type: 'varchar', length: 50, default: 'bvn' })
  identityType: string;

  @Column({ type: 'varchar', length: 255 })
  reference: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ type: 'jsonb', name: 'provider_response', nullable: true })
  providerResponse: Record<string, any>;

  @Column({
    type: 'timestamp',
    name: 'submitted_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  submittedAt: Date;

  @Column({ type: 'timestamp', name: 'processed_at', nullable: true })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
