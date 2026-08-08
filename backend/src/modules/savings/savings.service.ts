import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsAccount } from './entities/savings-account.entity';
import {
  SavingsTransaction,
  TransactionType,
} from './entities/savings-transaction.entity';
import { UserActivityService } from '../users/user-activity.service';
import { SettingsService } from '../settings/settings.service';
import { RiskService } from '../../common/risk.service';

@Injectable()
export class SavingsService {
  constructor(
    @InjectRepository(SavingsAccount)
    private readonly accountRepo: Repository<SavingsAccount>,
    @InjectRepository(SavingsTransaction)
    private readonly txRepo: Repository<SavingsTransaction>,
    private readonly activityService: UserActivityService,
    private readonly settingsService: SettingsService,
    private readonly riskService: RiskService,
  ) {}

  async getOrCreateAccount(userId: string): Promise<SavingsAccount> {
    let account = await this.accountRepo.findOne({ where: { userId } });
    if (!account) {
      account = this.accountRepo.create({
        userId,
        balance: 0,
        goalBalance: 0,
        status: 'active',
      });
      account = await this.accountRepo.save(account);
    }
    return account;
  }

  async getAccount(userId: string): Promise<SavingsAccount> {
    const account = await this.accountRepo.findOne({
      where: { userId },
      relations: { transactions: true },
      order: { transactions: { createdAt: 'DESC' } },
    });
    if (!account) {
      return this.getOrCreateAccount(userId);
    }
    return account;
  }

  async deposit(
    userId: string,
    amount: number,
    description?: string,
    type: 'general' | 'goal' = 'general',
  ): Promise<SavingsTransaction> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const minCheck = await this.riskService.checkMin(
      'min_deposit_amount',
      amount,
    );
    if (minCheck && !minCheck.allowed) {
      throw new BadRequestException(
        `Minimum deposit is ₦${minCheck.min.toLocaleString()}`,
      );
    }
    const maxCheck = await this.riskService.checkMinMax(
      'max_single_deposit',
      amount,
    );
    if (maxCheck && !maxCheck.allowed) {
      throw new BadRequestException(
        `Maximum single deposit is ₦${maxCheck.limit.toLocaleString()}`,
      );
    }
    const account = await this.getOrCreateAccount(userId);
    const isGoal = type === 'goal';
    const balanceBefore = Number(
      isGoal ? account.goalBalance : account.balance,
    );
    const balanceAfter = balanceBefore + amount;
    if (isGoal) {
      await this.accountRepo.update(account.id, { goalBalance: balanceAfter });
    } else {
      await this.accountRepo.update(account.id, { balance: balanceAfter });
    }
    const tx = await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        type: isGoal ? TransactionType.GOAL_DEPOSIT : TransactionType.DEPOSIT,
        amount,
        balanceBefore,
        balanceAfter,
        description:
          description || (isGoal ? 'Goal savings deposit' : 'Savings deposit'),
      }),
    );
    await this.activityService.log(
      userId,
      isGoal ? 'goal_deposit' : 'savings_deposit',
      { amount, balanceAfter },
    );
    return tx;
  }

  /**
   * Credit a savings account from an externally confirmed bank-transfer
   * deposit (e.g. FirstCheckout virtual account). Idempotent by
   * `externalReference` — returns null when the reference was already applied.
   */
  async applyExternalDeposit(
    userId: string,
    amount: number,
    description: string,
    externalReference: string,
    type: 'general' | 'goal' = 'general',
  ): Promise<SavingsTransaction | null> {
    if (amount <= 0) return null;
    const existing = await this.txRepo.findOne({
      where: { externalReference },
    });
    if (existing) return null;

    const account = await this.getOrCreateAccount(userId);
    const isGoal = type === 'goal';
    const balanceBefore = Number(
      isGoal ? account.goalBalance : account.balance,
    );
    const balanceAfter = balanceBefore + amount;

    if (isGoal) {
      await this.accountRepo.update(account.id, { goalBalance: balanceAfter });
    } else {
      await this.accountRepo.update(account.id, { balance: balanceAfter });
    }
    const tx = await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        type: isGoal ? TransactionType.GOAL_DEPOSIT : TransactionType.DEPOSIT,
        amount,
        balanceBefore,
        balanceAfter,
        description: description || 'Bank transfer credit',
        externalReference,
      }),
    );
    await this.activityService.log(
      userId,
      isGoal ? 'goal_deposit' : 'savings_deposit',
      {
        amount,
        balanceAfter,
        externalReference,
      },
    );
    return tx;
  }

  async areWithdrawalsEnabled(): Promise<boolean> {
    return (
      (await this.settingsService.getValue('withdrawals_enabled')) === 'true'
    );
  }

  async getDailyTotal(
    userId: string,
    type: 'deposit' | 'withdrawal',
  ): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const account = await this.accountRepo.findOne({ where: { userId } });
    if (!account) return 0;
    const txType =
      type === 'deposit' ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL;
    const result = await this.txRepo
      .createQueryBuilder('tx')
      .where('tx.account_id = :accountId', { accountId: account.id })
      .andWhere('tx.type = :type', { type: txType })
      .andWhere('tx.created_at >= :start', { start: startOfDay })
      .select('COALESCE(SUM(tx.amount), 0)', 'total')
      .getRawOne<{ total: string }>();
    return Number(result?.total ?? 0);
  }

  async withdraw(
    userId: string,
    amount: number,
    description?: string,
    type: 'general' | 'goal' = 'general',
  ): Promise<SavingsTransaction> {
    if (!(await this.areWithdrawalsEnabled()))
      throw new ForbiddenException(
        'Withdrawals are currently disabled. Please check back later.',
      );
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    const maxCheck = await this.riskService.checkMinMax(
      'max_single_withdrawal',
      amount,
    );
    if (maxCheck && !maxCheck.allowed) {
      throw new BadRequestException(
        `Maximum single withdrawal is ₦${maxCheck.limit.toLocaleString()}`,
      );
    }
    const dailyTotal = await this.getDailyTotal(userId, 'withdrawal');
    const dailyCheck = await this.riskService.checkDailyLimit(
      'max_daily_withdrawal_total',
      dailyTotal + amount,
    );
    if (dailyCheck && !dailyCheck.allowed) {
      throw new BadRequestException(
        `Daily withdrawal limit of ₦${dailyCheck.limit.toLocaleString()} reached`,
      );
    }
    const account = await this.getOrCreateAccount(userId);
    const isGoal = type === 'goal';
    const balanceBefore = Number(
      isGoal ? account.goalBalance : account.balance,
    );
    if (balanceBefore < amount)
      throw new BadRequestException('Insufficient balance');
    const balanceAfter = balanceBefore - amount;
    if (isGoal) {
      await this.accountRepo.update(account.id, { goalBalance: balanceAfter });
    } else {
      await this.accountRepo.update(account.id, { balance: balanceAfter });
    }
    const tx = await this.txRepo.save(
      this.txRepo.create({
        accountId: account.id,
        type: isGoal
          ? TransactionType.GOAL_WITHDRAWAL
          : TransactionType.WITHDRAWAL,
        amount,
        balanceBefore,
        balanceAfter,
        description:
          description ||
          (isGoal ? 'Goal savings withdrawal' : 'Savings withdrawal'),
      }),
    );
    await this.activityService.log(
      userId,
      isGoal ? 'goal_withdrawal' : 'savings_withdrawal',
      { amount, balanceAfter },
    );
    return tx;
  }

  async getTotalSavings(): Promise<number> {
    const result = await this.accountRepo
      .createQueryBuilder('a')
      .select(
        'COALESCE(SUM(a.balance), 0) + COALESCE(SUM(a.goalBalance), 0)',
        'total',
      )
      .getRawOne<{ total: string }>();
    return Number(result?.total || 0);
  }

  async setTarget(
    userId: string,
    targetAmount: number,
  ): Promise<SavingsAccount> {
    const account = await this.getOrCreateAccount(userId);
    await this.accountRepo.update(account.id, { targetAmount });
    return this.getAccount(userId);
  }

  async getTransactions(userId: string): Promise<SavingsTransaction[]> {
    const account = await this.getOrCreateAccount(userId);
    return this.txRepo.find({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
