import { Repository } from 'typeorm';
import { SavingsAccount } from './entities/savings-account.entity';
import { SavingsTransaction } from './entities/savings-transaction.entity';
import { UserActivityService } from '../users/user-activity.service';
import { SettingsService } from '../settings/settings.service';
import { RiskService } from '../../common/risk.service';
export declare class SavingsService {
    private readonly accountRepo;
    private readonly txRepo;
    private readonly activityService;
    private readonly settingsService;
    private readonly riskService;
    constructor(accountRepo: Repository<SavingsAccount>, txRepo: Repository<SavingsTransaction>, activityService: UserActivityService, settingsService: SettingsService, riskService: RiskService);
    getOrCreateAccount(userId: string): Promise<SavingsAccount>;
    getAccount(userId: string): Promise<SavingsAccount>;
    deposit(userId: string, amount: number, description?: string, type?: 'general' | 'goal'): Promise<SavingsTransaction>;
    applyExternalDeposit(userId: string, amount: number, description: string, externalReference: string, type?: 'general' | 'goal'): Promise<SavingsTransaction | null>;
    areWithdrawalsEnabled(): Promise<boolean>;
    getDailyTotal(userId: string, type: 'deposit' | 'withdrawal'): Promise<number>;
    withdraw(userId: string, amount: number, description?: string, type?: 'general' | 'goal'): Promise<SavingsTransaction>;
    getTotalSavings(): Promise<number>;
    setTarget(userId: string, targetAmount: number): Promise<SavingsAccount>;
    getTransactions(userId: string): Promise<SavingsTransaction[]>;
}
