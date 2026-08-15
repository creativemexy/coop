import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SavingsAccount } from './savings-account.entity';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  GOAL_DEPOSIT = 'goal_deposit',
  GOAL_WITHDRAWAL = 'goal_withdrawal',
  INTEREST = 'interest',
  LOAN_SERVICE_FEE = 'loan_service_fee',
  LOAN_DISBURSEMENT = 'loan_disbursement',
}

@Entity('savings_transactions')
@Index(['accountId', 'createdAt'])
export class SavingsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  @ManyToOne(() => SavingsAccount, (a) => a.transactions)
  @JoinColumn({ name: 'account_id' })
  account: SavingsAccount;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'balance_before' })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'balance_after' })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'varchar',
    nullable: true,
    unique: true,
    name: 'external_reference',
  })
  externalReference: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
