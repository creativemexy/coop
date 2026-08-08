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
var VirtualAccountsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualAccountsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const virtual_account_entity_1 = require("./entities/virtual-account.entity");
const pending_deposit_entity_1 = require("./entities/pending-deposit.entity");
const firstcheckout_client_1 = require("./firstcheckout.client");
const savings_service_1 = require("../savings/savings.service");
const loans_service_1 = require("../loans/loans.service");
const risk_service_1 = require("../../common/risk.service");
const user_entity_1 = require("../users/entities/user.entity");
const role_enum_1 = require("../../common/enums/role.enum");
const DEPOSIT_TTL_MS = 30 * 60 * 1000;
let VirtualAccountsService = VirtualAccountsService_1 = class VirtualAccountsService {
    accountRepo;
    pendingRepo;
    userRepo;
    client;
    savingsService;
    loansService;
    configService;
    riskService;
    logger = new common_1.Logger(VirtualAccountsService_1.name);
    inFlight = new Map();
    constructor(accountRepo, pendingRepo, userRepo, client, savingsService, loansService, configService, riskService) {
        this.accountRepo = accountRepo;
        this.pendingRepo = pendingRepo;
        this.userRepo = userRepo;
        this.client = client;
        this.savingsService = savingsService;
        this.loansService = loansService;
        this.configService = configService;
        this.riskService = riskService;
    }
    async getForUser(userId) {
        const existing = await this.accountRepo.findOne({ where: { userId } });
        if (existing) {
            return existing;
        }
        return this.provisionForUser(userId);
    }
    provisionForUser(userId) {
        const running = this.inFlight.get(userId);
        if (running) {
            return running;
        }
        const promise = this.doProvision(userId);
        this.inFlight.set(userId, promise);
        void promise.finally(() => this.inFlight.delete(userId));
        return promise;
    }
    async doProvision(userId) {
        const existing = await this.accountRepo.findOne({ where: { userId } });
        if (existing) {
            return existing;
        }
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role !== role_enum_1.Role.INDIVIDUAL) {
            return null;
        }
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            'Coop Member';
        const reference = `FCO-${Date.now().toString(36)}${Math.random()
            .toString(36)
            .slice(2, 8)}`.toUpperCase();
        const initAmount = this.configService.get('FIRST_BANKOUT_VA_INIT_AMOUNT', 5000);
        try {
            const tx = await this.client.initiateTransaction({
                reference,
                amount: initAmount,
                email: user.email || '',
                name,
                purpose: 'Virtual account provisioning',
            });
            const draft = await this.client.initiatePayWithTransfer({
                transactionReference: tx.accessCode,
            });
            const account = this.accountRepo.create({
                userId,
                provider: 'firstcheckout',
                accountNumber: draft.accountNumber,
                accountName: draft.accountName || name,
                bankName: draft.bankName || 'First Bank',
                bankReference: tx.accessCode,
                token: draft.token || null,
                status: 'active',
            });
            const saved = await this.accountRepo.save(account);
            this.logger.log(`Provisioned virtual account ${saved.accountNumber} for user ${userId}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`Virtual account provisioning failed for ${userId}: ${error instanceof Error ? error.message : 'unknown error'}`);
            return null;
        }
    }
    async handleDepositNotification(payload) {
        const accountNumber = payload.recipientAccountNumber;
        const reference = payload.requestReference;
        if (!accountNumber || !reference || !payload.amount) {
            return { status: 'ignored' };
        }
        const divisor = Number(this.configService.get('FIRST_BANKOUT_AMOUNT_DIVISOR', '1')) || 1;
        const amount = Number(payload.amount) / divisor;
        if (!Number.isFinite(amount) || amount <= 0) {
            this.logger.warn(`Ignoring deposit with invalid amount: ${payload.amount}`);
            return { status: 'invalid_amount' };
        }
        const pending = await this.pendingRepo.findOne({
            where: { accountNumber },
        });
        if (pending) {
            return this.creditPendingDeposit(pending, reference, amount);
        }
        this.logger.warn(`Deposit notification for ${accountNumber} (${reference}) has no pending instruction — cannot verify, not crediting`);
        return { status: 'ignored' };
    }
    async confirmInstruction(pending) {
        try {
            if (this.client.isStubbed()) {
                const res = await this.client.queryTransaction(pending.reference);
                return { confirmed: res.status === 'SUCCESS' };
            }
            const res = await this.client.confirmPayWithTransfer({
                reference: pending.bankReference ?? pending.reference,
                accountNumber: pending.accountNumber,
                token: pending.token ?? undefined,
            });
            return {
                confirmed: res.paymentStatus === 'SUCCESSFUL',
                amount: res.amount ? Number(res.amount) : undefined,
            };
        }
        catch (error) {
            this.logger.warn(`Verification failed for ${pending.reference}: ${error instanceof Error ? error.message : 'unknown error'}`);
            return { confirmed: false };
        }
    }
    async creditPendingDeposit(pending, reference, amount) {
        if (pending.status !== 'pending') {
            return { status: 'duplicate' };
        }
        const { confirmed, amount: confirmedAmount } = await this.confirmInstruction(pending);
        if (!confirmed) {
            this.logger.log(`Ignoring ${pending.type} notification for ${pending.reference} — transfer not confirmed`);
            return { status: 'ignored' };
        }
        if (pending.type === 'loan') {
            if (!pending.loanRepaymentId) {
                return { status: 'duplicate' };
            }
            const expected = Number(pending.amount);
            const received = confirmedAmount ?? amount;
            if (Math.abs(received - expected) / expected > 0.02) {
                this.logger.warn(`Loan payment ${pending.reference} amount mismatch: expected ₦${expected}, received ₦${received} — not crediting`);
                return { status: 'ignored' };
            }
            await this.loansService.markRepaymentPaid(pending.userId, pending.loanRepaymentId);
            await this.pendingRepo.update(pending.id, {
                status: 'credited',
                bankReference: reference,
                creditedAt: new Date(),
            });
            this.logger.log(`Confirmed loan repayment ₦${expected} (${pending.reference}, ${reference}) for user ${pending.userId}`);
            return { status: 'processed', creditedAmount: expected };
        }
        const credited = await this.savingsService.applyExternalDeposit(pending.userId, amount, `Bank transfer credit via virtual account — ${reference}`, reference, pending.type);
        if (!credited) {
            return { status: 'duplicate' };
        }
        await this.pendingRepo.update(pending.id, {
            status: 'credited',
            bankReference: reference,
            creditedAt: new Date(),
        });
        this.logger.log(`Credited ₦${amount} to ${pending.type} savings for user ${pending.userId} from pending deposit ${pending.reference} (${reference})`);
        return { status: 'processed', creditedAmount: amount };
    }
    async initiateDeposit(userId, amountParam, type = 'general') {
        const amount = Number(amountParam);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Amount must be positive');
        }
        const minCheck = await this.riskService.checkMin('min_deposit_amount', amount);
        if (minCheck && !minCheck.allowed) {
            throw new common_1.BadRequestException(`Minimum deposit is ₦${minCheck.min.toLocaleString()}`);
        }
        const maxCheck = await this.riskService.checkMinMax('max_single_deposit', amount);
        if (maxCheck && !maxCheck.allowed) {
            throw new common_1.BadRequestException(`Maximum single deposit is ₦${maxCheck.limit.toLocaleString()}`);
        }
        await this.pendingRepo.update({ userId, status: 'pending' }, { status: 'expired' });
        const active = await this.pendingRepo.findOne({
            where: {
                userId,
                status: 'pending',
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (active) {
            return active;
        }
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role !== role_enum_1.Role.INDIVIDUAL) {
            throw new common_1.BadRequestException('Only individual members can save');
        }
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            'Coop Member';
        const reference = `FCSV-${crypto.randomUUID().replace(/-/g, '').slice(0, 26).toUpperCase()}`;
        const va = await this.client.createDepositVirtualAccount({
            reference,
            amount,
            email: user.email || '',
            name,
            purpose: `Savings ${type} deposit`,
        });
        const pending = this.pendingRepo.create({
            userId,
            amount,
            type,
            reference,
            accountNumber: va.accountNumber,
            accountName: va.accountName || name,
            bankName: va.bankName || 'First Bank',
            bankReference: va.accessCode,
            token: va.token || null,
            status: 'pending',
            expiresAt: new Date(Date.now() + DEPOSIT_TTL_MS),
        });
        const saved = await this.pendingRepo.save(pending);
        this.logger.log(`Issued ${type} deposit instruction ${saved.reference} (₦${amount}) for user ${userId} on account ${saved.accountNumber} — awaiting verification`);
        return saved;
    }
    async verifyDeposit(userId, depositId) {
        const deposit = await this.pendingRepo.findOne({
            where: { id: depositId },
        });
        if (!deposit || deposit.userId !== userId) {
            throw new common_1.NotFoundException('Deposit not found');
        }
        if (deposit.status !== 'pending') {
            return deposit;
        }
        if (deposit.expiresAt && deposit.expiresAt < new Date()) {
            await this.pendingRepo.update(deposit.id, { status: 'expired' });
            deposit.status = 'expired';
            return deposit;
        }
        const { confirmed, amount: confirmedAmount } = await this.confirmInstruction(deposit);
        const amount = confirmedAmount ?? Number(deposit.amount);
        if (!confirmed) {
            this.logger.log(`Deposit ${deposit.reference} is pending — transfer not yet confirmed, no credit recorded`);
            return deposit;
        }
        const credited = await this.savingsService.applyExternalDeposit(deposit.userId, amount, `Bank transfer credit via virtual account — ${deposit.reference}`, deposit.reference, deposit.type === 'loan' ? 'general' : deposit.type);
        if (!credited) {
            return deposit;
        }
        await this.pendingRepo.update(deposit.id, {
            status: 'credited',
            bankReference: deposit.reference,
            creditedAt: new Date(),
        });
        this.logger.log(`Verified + credited ₦${amount} to ${deposit.type} savings for user ${deposit.userId} (${deposit.reference})`);
        return this.pendingRepo.findOne({
            where: { id: deposit.id },
        });
    }
    async findMyPending(userId) {
        return this.pendingRepo.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async initiateLoanRepayment(userId, repaymentId) {
        const repayment = await this.loansService.getRepaymentForPayment(userId, repaymentId);
        if (!repayment) {
            throw new common_1.BadRequestException('Repayment is not payable');
        }
        const amount = Number(repayment.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Invalid repayment amount');
        }
        const active = await this.pendingRepo.findOne({
            where: {
                userId,
                type: 'loan',
                loanRepaymentId: repaymentId,
                status: 'pending',
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
        });
        if (active) {
            return active;
        }
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.role !== role_enum_1.Role.INDIVIDUAL) {
            throw new common_1.BadRequestException('Only individual members can repay loans');
        }
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            'Coop Member';
        const reference = `FCLN-${crypto.randomUUID()
            .replace(/-/g, '')
            .slice(0, 26)
            .toUpperCase()}`;
        const va = await this.client.createDepositVirtualAccount({
            reference,
            amount,
            email: user.email || '',
            name,
            purpose: 'Loan repayment',
        });
        const pending = this.pendingRepo.create({
            userId,
            amount,
            type: 'loan',
            loanRepaymentId: repaymentId,
            reference,
            accountNumber: va.accountNumber,
            accountName: va.accountName || name,
            bankName: va.bankName || 'First Bank',
            bankReference: va.accessCode,
            token: va.token || null,
            status: 'pending',
            expiresAt: new Date(Date.now() + DEPOSIT_TTL_MS),
        });
        const saved = await this.pendingRepo.save(pending);
        this.logger.log(`Issued loan repayment instruction ${saved.reference} (₦${amount}) for user ${userId} on account ${saved.accountNumber}`);
        return saved;
    }
    async findLoanRepaymentInstruction(userId, repaymentId) {
        return this.pendingRepo.findOne({
            where: {
                userId,
                loanRepaymentId: repaymentId,
                type: 'loan',
            },
            order: { createdAt: 'DESC' },
        });
    }
    async verifyLoanRepayment(userId, repaymentId) {
        const pending = await this.findLoanRepaymentInstruction(userId, repaymentId);
        if (!pending) {
            throw new common_1.NotFoundException('Payment instruction not found');
        }
        if (pending.status !== 'pending') {
            return pending;
        }
        if (pending.expiresAt && pending.expiresAt < new Date()) {
            await this.pendingRepo.update(pending.id, { status: 'expired' });
            pending.status = 'expired';
            return pending;
        }
        const { confirmed, amount: confirmedAmount } = await this.confirmInstruction(pending);
        if (!confirmed) {
            this.logger.log(`Loan payment ${pending.reference} is pending — transfer not yet confirmed, not marked paid`);
            return pending;
        }
        const expected = Number(pending.amount);
        const received = confirmedAmount ?? expected;
        if (Math.abs(received - expected) / expected > 0.02) {
            this.logger.warn(`Loan payment ${pending.reference} amount mismatch: expected ₦${expected}, confirmed ₦${received} — not marking paid`);
            return pending;
        }
        const { paid } = await this.loansService.markRepaymentPaid(userId, repaymentId);
        if (!paid) {
            await this.pendingRepo.update(pending.id, { status: 'credited' });
            pending.status = 'credited';
            return pending;
        }
        await this.pendingRepo.update(pending.id, {
            status: 'credited',
            bankReference: pending.reference,
            creditedAt: new Date(),
        });
        this.logger.log(`Verified + recorded loan repayment for ${userId} (${pending.reference})`);
        return this.findLoanRepaymentInstruction(userId, repaymentId);
    }
};
exports.VirtualAccountsService = VirtualAccountsService;
exports.VirtualAccountsService = VirtualAccountsService = VirtualAccountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(virtual_account_entity_1.VirtualAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(pending_deposit_entity_1.PendingDeposit)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        firstcheckout_client_1.FirstCheckoutClient,
        savings_service_1.SavingsService,
        loans_service_1.LoansService,
        config_1.ConfigService,
        risk_service_1.RiskService])
], VirtualAccountsService);
//# sourceMappingURL=virtual-accounts.service.js.map