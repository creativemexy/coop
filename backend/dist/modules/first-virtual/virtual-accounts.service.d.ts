import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { VirtualAccount } from './entities/virtual-account.entity';
import { PendingDeposit, DepositType } from './entities/pending-deposit.entity';
import { FirstCheckoutClient, DepositNotificationData } from './firstcheckout.client';
import { SavingsService } from '../savings/savings.service';
import { LoansService } from '../loans/loans.service';
import { RiskService } from '../../common/risk.service';
import { User } from '../users/entities/user.entity';
export declare class VirtualAccountsService {
    private readonly accountRepo;
    private readonly pendingRepo;
    private readonly userRepo;
    private readonly client;
    private readonly savingsService;
    private readonly loansService;
    private readonly configService;
    private readonly riskService;
    private readonly logger;
    private readonly inFlight;
    constructor(accountRepo: Repository<VirtualAccount>, pendingRepo: Repository<PendingDeposit>, userRepo: Repository<User>, client: FirstCheckoutClient, savingsService: SavingsService, loansService: LoansService, configService: ConfigService, riskService: RiskService);
    getForUser(userId: string): Promise<VirtualAccount | null>;
    provisionForUser(userId: string): Promise<VirtualAccount | null>;
    private doProvision;
    handleDepositNotification(payload: DepositNotificationData): Promise<{
        status: 'processed' | 'duplicate' | 'unknown_account' | 'invalid_amount' | 'ignored';
        creditedAmount?: number;
    }>;
    private confirmInstruction;
    private creditPendingDeposit;
    initiateDeposit(userId: string, amountParam: number, type?: DepositType): Promise<PendingDeposit>;
    verifyDeposit(userId: string, depositId: string): Promise<PendingDeposit>;
    findMyPending(userId: string): Promise<PendingDeposit | null>;
    initiateLoanRepayment(userId: string, repaymentId: string): Promise<PendingDeposit>;
    findLoanRepaymentInstruction(userId: string, repaymentId: string): Promise<PendingDeposit | null>;
    verifyLoanRepayment(userId: string, repaymentId: string): Promise<PendingDeposit>;
}
