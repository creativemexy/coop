import { VirtualAccountsService } from './virtual-accounts.service';
import { DepositType } from './entities/pending-deposit.entity';
export declare class VirtualAccountsController {
    private readonly service;
    constructor(service: VirtualAccountsService);
    getMine(userId: string): Promise<{
        id: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
        status: string;
        provider: string;
    } | null>;
    initiateDeposit(userId: string, body: {
        amount: number;
        type?: DepositType;
    }): Promise<{
        id: string;
        amount: number;
        type: DepositType;
        reference: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
        status: string;
        expiresAt: Date | null;
        creditedAt: Date | null;
    }>;
    getLatestDeposit(userId: string): Promise<{
        id: string;
        amount: number;
        type: DepositType;
        reference: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
        status: string;
        expiresAt: Date | null;
        creditedAt: Date | null;
    } | null>;
    verifyDeposit(userId: string, depositId: string): Promise<{
        id: string;
        amount: number;
        type: DepositType;
        reference: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
        status: string;
        expiresAt: Date | null;
        creditedAt: Date | null;
    }>;
    initiateLoanRepayment(userId: string, repaymentId: string): Promise<{
        id: string;
        amount: number;
        type: DepositType;
        reference: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
        status: string;
        expiresAt: Date | null;
        creditedAt: Date | null;
    }>;
    getLoanRepaymentInstruction(userId: string, repaymentId: string): Promise<{
        id: string;
        amount: number;
        type: DepositType;
        reference: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
        status: string;
        expiresAt: Date | null;
        creditedAt: Date | null;
    } | null>;
    verifyLoanRepayment(userId: string, repaymentId: string): Promise<{
        id: string;
        amount: number;
        type: DepositType;
        reference: string;
        accountNumber: string;
        accountName: string;
        bankName: string;
        status: string;
        expiresAt: Date | null;
        creditedAt: Date | null;
    }>;
    private toDto;
}
