import { Repository } from 'typeorm';
import { Loan } from './entities/loan.entity';
import { LoanRepayment } from './entities/loan-repayment.entity';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { SavingsService } from '../savings/savings.service';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SettingsService } from '../settings/settings.service';
import { RiskService } from '../../common/risk.service';
import { UserActivityService } from '../users/user-activity.service';
import { AuditService } from '../../common/audit.service';
import { UsersService } from '../users/users.service';
import { Role } from '../../common/enums/role.enum';
export declare class LoansService {
    private readonly loanRepo;
    private readonly repaymentRepo;
    private readonly savingsTxRepo;
    private readonly accountRepo;
    private readonly savingsService;
    private readonly settingsService;
    private readonly activityService;
    private readonly auditService;
    private readonly usersService;
    private readonly riskService;
    constructor(loanRepo: Repository<Loan>, repaymentRepo: Repository<LoanRepayment>, savingsTxRepo: Repository<SavingsTransaction>, accountRepo: Repository<SavingsAccount>, savingsService: SavingsService, settingsService: SettingsService, activityService: UserActivityService, auditService: AuditService, usersService: UsersService, riskService: RiskService);
    checkEligibility(userId: string): Promise<{
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
    apply(userId: string, dto: {
        amount: number;
        duration: number;
        purpose?: string;
    }): Promise<Loan | null>;
    findByUser(userId: string): Promise<Loan[]>;
    findOne(id: string, userId: string): Promise<Loan>;
    getActiveLoans(userId: string): Promise<Loan[]>;
    getTotalOutstanding(userId: string): Promise<number>;
    findPending(): Promise<Loan[]>;
    getStageLoans(stage: 'apex' | 'organization' | 'admin' | 'disbursement', reviewer?: {
        role: Role;
        apexOrgId?: string;
        organizationId?: string;
    }): Promise<Loan[]>;
    private loadLoanWithRepayments;
    private loadLoanWithBorrower;
    private scopeForLoan;
    approveApex(loanId: string, reviewer: {
        sub: string;
        role: Role;
        apexOrgId?: string;
        organizationId?: string;
    }): Promise<Loan | null>;
    approveOrganization(loanId: string, reviewer: {
        sub: string;
        role: Role;
        apexOrgId?: string;
        organizationId?: string;
    }): Promise<Loan | null>;
    approveFinal(loanId: string, reviewer: {
        sub: string;
        role: Role;
        apexOrgId?: string;
        organizationId?: string;
    }): Promise<Loan | null>;
    disburse(loanId: string, reviewer: {
        sub: string;
        role: Role;
        apexOrgId?: string;
        organizationId?: string;
    }): Promise<Loan | null>;
    reject(loanId: string, rejectedBy: string, reason?: string): Promise<Loan | null>;
    getRepaymentForPayment(userId: string, repaymentId: string): Promise<LoanRepayment | null>;
    markRepaymentPaid(userId: string, repaymentId: string): Promise<{
        paid: boolean;
        loan: Loan | null;
    }>;
    getAllActiveTotal(): Promise<number>;
    getDefaultedLoans(): Promise<Loan[]>;
}
