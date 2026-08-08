export type DepositType = 'general' | 'goal' | 'loan';
export type PendingDepositStatus = 'pending' | 'credited' | 'expired' | 'failed';
export declare class PendingDeposit {
    id: string;
    userId: string;
    amount: number;
    type: DepositType;
    loanRepaymentId: string | null;
    reference: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankReference: string;
    token: string | null;
    status: PendingDepositStatus;
    expiresAt: Date;
    creditedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
