import { SavingsAccount } from './savings-account.entity';
export declare enum TransactionType {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    GOAL_DEPOSIT = "goal_deposit",
    GOAL_WITHDRAWAL = "goal_withdrawal",
    INTEREST = "interest",
    LOAN_SERVICE_FEE = "loan_service_fee"
}
export declare class SavingsTransaction {
    id: string;
    accountId: string;
    account: SavingsAccount;
    type: TransactionType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    externalReference: string | null;
    createdAt: Date;
}
