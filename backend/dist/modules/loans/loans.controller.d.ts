import { LoansService } from './loans.service';
export declare class LoansController {
    private readonly service;
    constructor(service: LoansService);
    apply(userId: string, dto: {
        amount: number;
        duration: number;
        purpose?: string;
    }): Promise<import("./entities/loan.entity").Loan | null>;
    eligibility(userId: string): Promise<{
        eligible: boolean;
        vested: boolean;
        savingsBalance: number;
        vestingMonths: number;
        multiplier: number;
        maxAmount: number;
        activeLoans: number;
        reasons: {
            key: string;
            label: string;
            passed: boolean;
        }[];
    }>;
    findPending(): Promise<import("./entities/loan.entity").Loan[]>;
    findDefaulted(): Promise<import("./entities/loan.entity").Loan[]>;
    findAll(userId: string): Promise<import("./entities/loan.entity").Loan[]>;
    findOne(userId: string, id: string): Promise<import("./entities/loan.entity").Loan>;
    approve(userId: string, loanId: string): Promise<import("./entities/loan.entity").Loan | null>;
    reject(userId: string, loanId: string): Promise<import("./entities/loan.entity").Loan | null>;
}
