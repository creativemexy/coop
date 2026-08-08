"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const savings_account_entity_1 = require("./entities/savings-account.entity");
const savings_transaction_entity_1 = require("./entities/savings-transaction.entity");
const user_activity_service_1 = require("../users/user-activity.service");
const settings_service_1 = require("../settings/settings.service");
const risk_service_1 = require("../../common/risk.service");
let SavingsService = class SavingsService {
    accountRepo;
    txRepo;
    activityService;
    settingsService;
    riskService;
    constructor(accountRepo, txRepo, activityService, settingsService, riskService) {
        this.accountRepo = accountRepo;
        this.txRepo = txRepo;
        this.activityService = activityService;
        this.settingsService = settingsService;
        this.riskService = riskService;
    }
    async getOrCreateAccount(userId) {
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
    async getAccount(userId) {
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
    async deposit(userId, amount, description, type = 'general') {
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        const minCheck = await this.riskService.checkMin('min_deposit_amount', amount);
        if (minCheck && !minCheck.allowed) {
            throw new common_1.BadRequestException(`Minimum deposit is ₦${minCheck.min.toLocaleString()}`);
        }
        const maxCheck = await this.riskService.checkMinMax('max_single_deposit', amount);
        if (maxCheck && !maxCheck.allowed) {
            throw new common_1.BadRequestException(`Maximum single deposit is ₦${maxCheck.limit.toLocaleString()}`);
        }
        const account = await this.getOrCreateAccount(userId);
        const isGoal = type === 'goal';
        const balanceBefore = Number(isGoal ? account.goalBalance : account.balance);
        const balanceAfter = balanceBefore + amount;
        if (isGoal) {
            await this.accountRepo.update(account.id, { goalBalance: balanceAfter });
        }
        else {
            await this.accountRepo.update(account.id, { balance: balanceAfter });
        }
        const tx = await this.txRepo.save(this.txRepo.create({
            accountId: account.id,
            type: isGoal ? savings_transaction_entity_1.TransactionType.GOAL_DEPOSIT : savings_transaction_entity_1.TransactionType.DEPOSIT,
            amount,
            balanceBefore,
            balanceAfter,
            description: description || (isGoal ? 'Goal savings deposit' : 'Savings deposit'),
        }));
        await this.activityService.log(userId, isGoal ? 'goal_deposit' : 'savings_deposit', { amount, balanceAfter });
        return tx;
    }
    async applyExternalDeposit(userId, amount, description, externalReference, type = 'general') {
        if (amount <= 0)
            return null;
        const existing = await this.txRepo.findOne({
            where: { externalReference },
        });
        if (existing)
            return null;
        const account = await this.getOrCreateAccount(userId);
        const isGoal = type === 'goal';
        const balanceBefore = Number(isGoal ? account.goalBalance : account.balance);
        const balanceAfter = balanceBefore + amount;
        if (isGoal) {
            await this.accountRepo.update(account.id, { goalBalance: balanceAfter });
        }
        else {
            await this.accountRepo.update(account.id, { balance: balanceAfter });
        }
        const tx = await this.txRepo.save(this.txRepo.create({
            accountId: account.id,
            type: isGoal ? savings_transaction_entity_1.TransactionType.GOAL_DEPOSIT : savings_transaction_entity_1.TransactionType.DEPOSIT,
            amount,
            balanceBefore,
            balanceAfter,
            description: description || 'Bank transfer credit',
            externalReference,
        }));
        await this.activityService.log(userId, isGoal ? 'goal_deposit' : 'savings_deposit', {
            amount,
            balanceAfter,
            externalReference,
        });
        return tx;
    }
    async areWithdrawalsEnabled() {
        return ((await this.settingsService.getValue('withdrawals_enabled')) === 'true');
    }
    async getDailyTotal(userId, type) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const account = await this.accountRepo.findOne({ where: { userId } });
        if (!account)
            return 0;
        const txType = type === 'deposit' ? savings_transaction_entity_1.TransactionType.DEPOSIT : savings_transaction_entity_1.TransactionType.WITHDRAWAL;
        const result = await this.txRepo
            .createQueryBuilder('tx')
            .where('tx.account_id = :accountId', { accountId: account.id })
            .andWhere('tx.type = :type', { type: txType })
            .andWhere('tx.created_at >= :start', { start: startOfDay })
            .select('COALESCE(SUM(tx.amount), 0)', 'total')
            .getRawOne();
        return Number(result?.total ?? 0);
    }
    async withdraw(userId, amount, description, type = 'general') {
        if (!(await this.areWithdrawalsEnabled()))
            throw new common_1.ForbiddenException('Withdrawals are currently disabled. Please check back later.');
        if (amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        const maxCheck = await this.riskService.checkMinMax('max_single_withdrawal', amount);
        if (maxCheck && !maxCheck.allowed) {
            throw new common_1.BadRequestException(`Maximum single withdrawal is ₦${maxCheck.limit.toLocaleString()}`);
        }
        const dailyTotal = await this.getDailyTotal(userId, 'withdrawal');
        const dailyCheck = await this.riskService.checkDailyLimit('max_daily_withdrawal_total', dailyTotal + amount);
        if (dailyCheck && !dailyCheck.allowed) {
            throw new common_1.BadRequestException(`Daily withdrawal limit of ₦${dailyCheck.limit.toLocaleString()} reached`);
        }
        const account = await this.getOrCreateAccount(userId);
        const isGoal = type === 'goal';
        const balanceBefore = Number(isGoal ? account.goalBalance : account.balance);
        if (balanceBefore < amount)
            throw new common_1.BadRequestException('Insufficient balance');
        const balanceAfter = balanceBefore - amount;
        if (isGoal) {
            await this.accountRepo.update(account.id, { goalBalance: balanceAfter });
        }
        else {
            await this.accountRepo.update(account.id, { balance: balanceAfter });
        }
        const tx = await this.txRepo.save(this.txRepo.create({
            accountId: account.id,
            type: isGoal
                ? savings_transaction_entity_1.TransactionType.GOAL_WITHDRAWAL
                : savings_transaction_entity_1.TransactionType.WITHDRAWAL,
            amount,
            balanceBefore,
            balanceAfter,
            description: description ||
                (isGoal ? 'Goal savings withdrawal' : 'Savings withdrawal'),
        }));
        await this.activityService.log(userId, isGoal ? 'goal_withdrawal' : 'savings_withdrawal', { amount, balanceAfter });
        return tx;
    }
    async getTotalSavings() {
        const result = await this.accountRepo
            .createQueryBuilder('a')
            .select('COALESCE(SUM(a.balance), 0) + COALESCE(SUM(a.goalBalance), 0)', 'total')
            .getRawOne();
        return Number(result?.total || 0);
    }
    async setTarget(userId, targetAmount) {
        const account = await this.getOrCreateAccount(userId);
        await this.accountRepo.update(account.id, { targetAmount });
        return this.getAccount(userId);
    }
    async getTransactions(userId) {
        const account = await this.getOrCreateAccount(userId);
        return this.txRepo.find({
            where: { accountId: account.id },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
};
exports.SavingsService = SavingsService;
exports.SavingsService = SavingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(savings_account_entity_1.SavingsAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(savings_transaction_entity_1.SavingsTransaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        user_activity_service_1.UserActivityService,
        settings_service_1.SettingsService,
        risk_service_1.RiskService])
], SavingsService);
//# sourceMappingURL=savings.service.js.map