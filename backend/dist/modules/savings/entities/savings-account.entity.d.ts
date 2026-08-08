import { SavingsTransaction } from './savings-transaction.entity';
export declare class SavingsAccount {
    id: string;
    userId: string;
    balance: number;
    goalBalance: number;
    targetAmount: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    transactions: SavingsTransaction[];
}
