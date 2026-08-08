import { SavingsService } from './savings.service';
export declare class SavingsController {
    private readonly service;
    constructor(service: SavingsService);
    getAccount(userId: string): Promise<{
        withdrawalsEnabled: boolean;
        id: string;
        userId: string;
        balance: number;
        goalBalance: number;
        targetAmount: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        transactions: import("./entities/savings-transaction.entity").SavingsTransaction[];
    }>;
    getTransactions(userId: string): Promise<import("./entities/savings-transaction.entity").SavingsTransaction[]>;
    deposit(userId: string, dto: {
        amount: number;
        description?: string;
        type?: 'general' | 'goal';
    }): Promise<import("./entities/savings-transaction.entity").SavingsTransaction>;
    withdraw(userId: string, dto: {
        amount: number;
        description?: string;
        type?: 'general' | 'goal';
    }): Promise<import("./entities/savings-transaction.entity").SavingsTransaction>;
    setTarget(userId: string, dto: {
        targetAmount: number;
    }): Promise<import("./entities/savings-account.entity").SavingsAccount>;
}
