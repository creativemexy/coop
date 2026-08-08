import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type DepositType = 'general' | 'goal' | 'loan';
export type PendingDepositStatus =
  'pending' | 'credited' | 'expired' | 'failed';

/**
 * A bank-transfer deposit instruction issued via FirstCheckout.
 *
 * When an individual clicks "Deposit" on the savings page a pending deposit is
 * created with a transaction-bound virtual account. Once the transfer lands,
 * the FirstCheckout / Interswitch webhook credits the member's savings
 * balance (general or goal) and marks this row credited.
 */
@Entity('pending_deposits')
export class PendingDeposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10, default: 'general' })
  type: DepositType;

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'loan_repayment_id' })
  loanRepaymentId: string | null;

  @Column({ type: 'varchar', length: 40, unique: true })
  reference: string;

  @Column({ type: 'varchar', length: 20, unique: true, name: 'account_number' })
  accountNumber: string;

  @Column({ type: 'varchar', nullable: true, name: 'account_name' })
  accountName: string;

  @Column({ type: 'varchar', nullable: true, name: 'bank_name' })
  bankName: string;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: true,
    name: 'bank_reference',
  })
  bankReference: string;

  @Column({ type: 'varchar', nullable: true })
  token: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PendingDepositStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'credited_at' })
  creditedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
