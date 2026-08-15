import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Loan } from './loan.entity';

export enum RepaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('loan_repayments')
@Index(['loanId', 'status'])
export class LoanRepayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'loan_id' })
  loanId: string;

  @ManyToOne(() => Loan, (l) => l.repayments)
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @Column({ type: 'date', name: 'due_date' })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'timestamp', name: 'paid_at', nullable: true })
  paidAt: Date;

  @Column({ type: 'varchar', name: 'payment_reference', nullable: true })
  paymentReference: string;

  @Column({ type: 'enum', enum: RepaymentStatus, default: RepaymentStatus.PENDING })
  status: RepaymentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
