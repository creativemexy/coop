import { LoanRepayment } from './loan-repayment.entity';
export declare enum LoanStatus {
    PENDING = "pending",
    APPROVED = "approved",
    ACTIVE = "active",
    COMPLETED = "completed",
    DEFAULTED = "defaulted",
    REJECTED = "rejected"
}
export declare class Loan {
    id: string;
    userId: string;
    amount: number;
    interestRate: number;
    duration: number;
    monthlyPayment: number;
    totalRepayment: number;
    amountPaid: number;
    serviceFee: number;
    serviceFeePaid: boolean;
    serviceFeePaidAt: Date;
    serviceFeeTxId: string;
    purpose: string;
    status: LoanStatus;
    repayments: LoanRepayment[];
    createdAt: Date;
    updatedAt: Date;
}
