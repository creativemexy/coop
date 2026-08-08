import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LoanRepayment } from './loan-repayment.entity';

export enum LoanStatus {
  PENDING = 'pending',
  APEX_APPROVED = 'apex_approved',
  ORG_APPROVED = 'org_approved',
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

  @Column({ type: 'uuid', name: 'apex_approved_by', nullable: true })
  apexApprovedBy: string;

  @Column({ type: 'timestamp', name: 'apex_approved_at', nullable: true })
  apexApprovedAt: Date;

  @Column({ type: 'uuid', name: 'org_approved_by', nullable: true })
  orgApprovedBy: string;

  @Column({ type: 'timestamp', name: 'org_approved_at', nullable: true })
  orgApprovedAt: Date;

  @Column({ type: 'uuid', name: 'admin_approved_by', nullable: true })
  adminApprovedBy: string;

  @Column({ type: 'timestamp', name: 'admin_approved_at', nullable: true })
  adminApprovedAt: Date;

  @Column({ type: 'uuid', name: 'disbursed_by', nullable: true })
  disbursedBy: string;

  @Column({ type: 'timestamp', name: 'disbursed_at', nullable: true })
  disbursedAt: Date;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'disbursed_amount',
    default: 0,
  })
  disbursedAmount: number;

  @Column({ type: 'uuid', name: 'rejected_by', nullable: true })
  rejectedBy: string;

  @Column({ type: 'timestamp', name: 'rejected_at', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'text', name: 'rejection_reason', nullable: true })
  rejectionReason: string;

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
