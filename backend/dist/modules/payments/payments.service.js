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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("./entities/payment.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const paystack_client_1 = require("./providers/paystack/paystack.client");
const users_service_1 = require("../users/users.service");
const risk_service_1 = require("../../common/risk.service");
const fee_share_service_1 = require("../ledger/services/fee-share.service");
const double_entry_service_1 = require("../ledger/services/double-entry.service");
const accounts_service_1 = require("../ledger/services/accounts.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    repo;
    paystackClient;
    usersService;
    riskService;
    feeShareService;
    doubleEntryService;
    accountsService;
    logger = new common_1.Logger(PaymentsService_1.name);
    constructor(repo, paystackClient, usersService, riskService, feeShareService, doubleEntryService, accountsService) {
        this.repo = repo;
        this.paystackClient = paystackClient;
        this.usersService = usersService;
        this.riskService = riskService;
        this.feeShareService = feeShareService;
        this.doubleEntryService = doubleEntryService;
        this.accountsService = accountsService;
    }
    async initiate(dto) {
        const maxCheck = await this.riskService.checkMinMax('max_payment_amount', dto.amount);
        if (maxCheck && !maxCheck.allowed) {
            throw new common_1.BadRequestException(`Maximum single payment is ₦${maxCheck.limit.toLocaleString()}`);
        }
        const providerReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const user = await this.usersService.findById(dto.userId);
        const fee = Math.round(dto.amount * 0.015 * 100) / 100;
        const payment = this.repo.create({
            userId: dto.userId,
            subscriptionId: dto.subscriptionId,
            amount: dto.amount,
            fee,
            provider: dto.provider,
            providerReference,
            status: status_enum_1.PaymentStatus.PENDING,
            payoutStatus: status_enum_1.PayoutStatus.PENDING,
            purpose: dto.purpose,
            metadata: { purpose: dto.purpose },
        });
        const saved = await this.repo.save(payment);
        const { authorizationUrl } = await this.paystackClient.initializeTransaction({
            email: user.email,
            amount: dto.amount,
            reference: providerReference,
            callbackUrl: dto.callbackUrl,
            metadata: {
                userId: dto.userId,
                subscriptionId: dto.subscriptionId,
                paymentId: saved.id,
                purpose: dto.purpose,
            },
        });
        this.logger.log(`Payment initiated: ${providerReference}, amount: ${dto.amount}, purpose: ${dto.purpose || 'general'}`);
        return { payment: saved, authorizationUrl };
    }
    async findByProviderReference(reference) {
        return this.repo.findOne({ where: { providerReference: reference } });
    }
    async updateStatus(id, status, metadata) {
        await this.repo.update(id, { status, metadata });
        return this.repo.findOneOrFail({ where: { id } });
    }
    async verify(reference) {
        const paystackData = await this.paystackClient.verifyTransaction(reference);
        const payment = await this.findByProviderReference(reference);
        const paystackStatus = paystackData?.status;
        if (paystackStatus === 'success' && payment) {
            const isRegistration = payment.purpose === 'registration' ||
                (payment.metadata && payment.metadata.purpose === 'registration');
            const wasPending = payment.status === status_enum_1.PaymentStatus.PENDING;
            if (wasPending) {
                const mergedMeta = {
                    ...(payment.metadata || {}),
                    ...paystackData,
                };
                await this.updateStatus(payment.id, status_enum_1.PaymentStatus.SUCCESS, mergedMeta);
            }
            if (isRegistration && payment.userId) {
                await this.usersService.updateUser(payment.userId, { registrationFeePaid: true, isActive: true });
                await this.recordRegistrationLedger(payment.userId, payment.id, payment.amount);
            }
            return { status: 'success', payment: { ...payment, status: status_enum_1.PaymentStatus.SUCCESS } };
        }
        return { status: paystackStatus || 'unknown', payment: payment ?? undefined };
    }
    async findByUser(userId) {
        return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    }
    async updatePayoutStatus(id, payoutStatus, payoutReference) {
        await this.repo.update(id, { payoutStatus, payoutReference });
    }
    async recordRegistrationLedger(userId, paymentId, amount) {
        try {
            if (await this.feeShareService.hasRegistrationRecord(paymentId)) {
                return;
            }
            const user = (await this.usersService.findById(userId));
            if (user) {
                const cashAccount = await this.accountsService.findByCode('1000');
                const revenueAccount = (await this.accountsService.findByCode('4200')) ??
                    (await this.accountsService.findByCode('4100'));
                if (cashAccount && revenueAccount) {
                    try {
                        await this.doubleEntryService.postEntry({
                            description: `Registration fee - ${user.email}`,
                            entryDate: new Date(),
                            postedBy: 'SYSTEM',
                            lines: [
                                {
                                    accountId: cashAccount.id,
                                    debit: amount,
                                    credit: 0,
                                    organizationId: user.organizationId ?? undefined,
                                },
                                {
                                    accountId: revenueAccount.id,
                                    debit: 0,
                                    credit: amount,
                                    organizationId: user.organizationId ?? undefined,
                                },
                            ],
                        });
                    }
                    catch (jeErr) {
                        this.logger.warn(`Journal entry creation failed: ${jeErr.message}`);
                    }
                }
                await this.feeShareService.recordRegistrationFee({
                    paymentId,
                    totalFee: amount,
                    organizationId: user.organizationId ?? undefined,
                    apexOrgId: user.apexOrgId ?? undefined,
                });
            }
        }
        catch (err) {
            this.logger.warn(`Registration ledger recording failed: ${err.message}`);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        paystack_client_1.PaystackClient,
        users_service_1.UsersService,
        risk_service_1.RiskService,
        fee_share_service_1.FeeShareService,
        double_entry_service_1.DoubleEntryService,
        accounts_service_1.AccountsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map