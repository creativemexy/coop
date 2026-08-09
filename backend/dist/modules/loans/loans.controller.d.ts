import { LoansService } from './loans.service';
import { Role } from '../../common/enums/role.enum';
interface Reviewer {
    sub: string;
    role: Role;
    apexOrgId?: string;
    organizationId?: string;
}
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
    findStage(stage: 'apex' | 'organization' | 'admin' | 'disbursement', reviewer: Reviewer): Promise<import("./entities/loan.entity").Loan[]>;
    findPending(): Promise<import("./entities/loan.entity").Loan[]>;
    findDefaulted(): Promise<import("./entities/loan.entity").Loan[]>;
    findAll(userId: string): Promise<import("./entities/loan.entity").Loan[]>;
    findOne(userId: string, id: string): Promise<import("./entities/loan.entity").Loan>;
    approveApex(reviewer: Reviewer, loanId: string): Promise<import("./entities/loan.entity").Loan | null>;
    approveOrg(reviewer: Reviewer, loanId: string): Promise<import("./entities/loan.entity").Loan | null>;
    approveAdmin(reviewer: Reviewer, loanId: string): Promise<import("./entities/loan.entity").Loan | null>;
    disburse(reviewer: Reviewer, loanId: string): Promise<import("./entities/loan.entity").Loan | null>;
    reject(reviewer: Reviewer, loanId: string, dto: {
        reason?: string;
    }): Promise<import("./entities/loan.entity").Loan | null>;
}
export {};
