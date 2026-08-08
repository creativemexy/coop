import { Loan } from './loan.entity';
export declare enum RepaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    OVERDUE = "overdue"
}
export declare class LoanRepayment {
    id: string;
    loanId: string;
    loan: Loan;
    dueDate: Date;
    amount: number;
    paidAt: Date;
    paymentReference: string;
    status: RepaymentStatus;
    createdAt: Date;
}
