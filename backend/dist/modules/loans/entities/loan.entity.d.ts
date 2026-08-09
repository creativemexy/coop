import { LoanRepayment } from './loan-repayment.entity';
export declare enum LoanStatus {
    PENDING = "pending",
    APEX_APPROVED = "apex_approved",
    ORG_APPROVED = "org_approved",
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
    apexApprovedBy: string;
    apexApprovedAt: Date;
    orgApprovedBy: string;
    orgApprovedAt: Date;
    adminApprovedBy: string;
    adminApprovedAt: Date;
    disbursedBy: string;
    disbursedAt: Date;
    disbursedAmount: number;
    rejectedBy: string;
    rejectedAt: Date;
    rejectionReason: string | null;
    purpose: string;
    status: LoanStatus;
    repayments: LoanRepayment[];
    borrower?: {
        apexOrgId?: string | null;
        organizationId?: string | null;
    };
    createdAt: Date;
    updatedAt: Date;
}
