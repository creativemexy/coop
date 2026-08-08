import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PayoutStatus } from '../../../common/enums/status.enum';
import { PotType } from '../../../common/enums/status.enum';

@Entity('fee_withdrawal_requests')
export class FeeWithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, name: 'pot_type' })
  potType: PotType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Column({ type: 'uuid', name: 'requested_by' })
  requestedBy: string;

  @Column({ type: 'uuid', name: 'approved_by', nullable: true })
  approvedBy?: string;

  @Column({ type: 'varchar', length: 20, name: 'account_number', nullable: true })
  accountNumber?: string;

  @Column({ type: 'varchar', length: 20, name: 'bank_code', nullable: true })
  bankCode?: string;

  @Column({ type: 'varchar', length: 100, name: 'bank_name', nullable: true })
  bankName?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'varchar', length: 100, name: 'paystack_reference', nullable: true })
  paystackReference?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
