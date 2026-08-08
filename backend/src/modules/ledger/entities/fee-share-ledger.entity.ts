import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { FeeSource } from '../../../common/enums/status.enum';

@Entity('fee_share_ledger')
export class FeeShareLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'enum', enum: FeeSource })
  source: FeeSource;

  @Column({ type: 'decimal', name: 'total_fee', precision: 15, scale: 2 })
  totalFee: number;

  @Column({
    type: 'decimal',
    name: 'super_admin_share',
    precision: 15,
    scale: 2,
  })
  superAdminShare: number;

  @Column({ type: 'varchar', name: 'super_admin_user_id', nullable: true })
  superAdminUserId: string;

  @Column({ type: 'decimal', name: 'platform_share', precision: 15, scale: 2 })
  platformShare: number;

  @Column({
    type: 'decimal',
    name: 'organization_share',
    precision: 15,
    scale: 2,
  })
  organizationShare: number;

  @Column({ type: 'uuid', name: 'organization_id', nullable: true })
  organizationId: string;

  @Column({ type: 'decimal', name: 'apex_share', precision: 15, scale: 2 })
  apexShare: number;

  @Column({ type: 'uuid', name: 'apex_org_id', nullable: true })
  apexOrgId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
