import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LoanRepayment } from './loan-repayment.entity';

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
  REJECTED = 'rejected',
}

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'interest_rate', default: 5 })
  interestRate: number;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'monthly_payment' })
  monthlyPayment: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_repayment' })
  totalRepayment: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'amount_paid', default: 0 })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'service_fee', default: 0 })
  serviceFee: number;

  @Column({ type: 'boolean', name: 'service_fee_paid', default: false })
  serviceFeePaid: boolean;

  @Column({ type: 'timestamp', name: 'service_fee_paid_at', nullable: true })
  serviceFeePaidAt: Date;

  @Column({ type: 'uuid', name: 'service_fee_tx_id', nullable: true })
  serviceFeeTxId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  purpose: string;

  @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.PENDING })
  status: LoanStatus;

  @OneToMany(() => LoanRepayment, (r) => r.loan)
  repayments: LoanRepayment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
