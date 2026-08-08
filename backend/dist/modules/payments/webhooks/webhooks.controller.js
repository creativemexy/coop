"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const crypto = __importStar(require("crypto"));
const webhook_auth_guard_1 = require("../../../common/guards/webhook-auth.guard");
const payments_service_1 = require("../payments.service");
const webhook_log_entity_1 = require("../entities/webhook-log.entity");
const status_enum_1 = require("../../../common/enums/status.enum");
const user_entity_1 = require("../../users/entities/user.entity");
const double_entry_service_1 = require("../../ledger/services/double-entry.service");
const fee_share_service_1 = require("../../ledger/services/fee-share.service");
const accounts_service_1 = require("../../ledger/services/accounts.service");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    paymentsService;
    configService;
    doubleEntryService;
    feeShareService;
    accountsService;
    userRepo;
    webhookLogRepo;
    logger = new common_1.Logger(WebhooksController_1.name);
    secretKey;
    constructor(paymentsService, configService, doubleEntryService, feeShareService, accountsService, userRepo, webhookLogRepo) {
        this.paymentsService = paymentsService;
        this.configService = configService;
        this.doubleEntryService = doubleEntryService;
        this.feeShareService = feeShareService;
        this.accountsService = accountsService;
        this.userRepo = userRepo;
        this.webhookLogRepo = webhookLogRepo;
        this.secretKey =
            configService.get('PAYSTACK_SECRET_KEY') || '';
    }
    async handlePaystackWebhook(payload, signature) {
        if (this.secretKey) {
            const hash = crypto
                .createHmac('sha512', this.secretKey)
                .update(JSON.stringify(payload))
                .digest('hex');
            if (hash !== signature) {
                throw new common_1.UnauthorizedException('Invalid webhook signature');
            }
        }
        const event = payload?.event;
        const data = payload?.data;
        const providerReference = data?.reference;
        const eventId = (data?.id || payload?.id);
        if (!providerReference) {
            return { status: 'ignored' };
        }
        const existingPayment = await this.paymentsService.findByProviderReference(providerReference);
        if (existingPayment && existingPayment.status !== status_enum_1.PaymentStatus.PENDING) {
            return { status: 'already_processed' };
        }
        if (existingPayment?.metadata) {
            const meta = existingPayment.metadata;
            if (meta.processedEventIds && Array.isArray(meta.processedEventIds) && eventId) {
                if (meta.processedEventIds.includes(eventId)) {
                    return { status: 'duplicate_event' };
                }
            }
        }
        switch (event) {
            case 'charge.success':
                await this.paymentsService.updateStatus(existingPayment?.id || '', status_enum_1.PaymentStatus.SUCCESS, data);
                await this.paymentsService.updatePayoutStatus(existingPayment?.id || '', status_enum_1.PayoutStatus.PENDING, `POOL_${providerReference}`);
                if (eventId && existingPayment?.id) {
                    try {
                        const existingMeta = existingPayment.metadata || {};
                        const processedIds = existingMeta.processedEventIds || [];
                        processedIds.push(eventId);
                        await this.paymentsService.updateStatus(existingPayment.id, status_enum_1.PaymentStatus.SUCCESS, {
                            ...existingMeta,
                            processedEventIds: processedIds,
                        });
                    }
                    catch { }
                }
                const paymentMeta = existingPayment?.metadata;
                if (paymentMeta?.purpose === 'registration' && existingPayment?.userId) {
                    await this.userRepo.update(existingPayment.userId, { registrationFeePaid: true, isActive: true });
                    const user = await this.userRepo.findOne({ where: { id: existingPayment.userId } });
                    if (user) {
                        const cashAccount = await this.accountsService.findByCode('1000');
                        const revenueAccount = await this.accountsService.findByCode('4200') ?? await this.accountsService.findByCode('4100');
                        if (cashAccount && revenueAccount) {
                            try {
                                await this.doubleEntryService.postEntry({
                                    description: `Registration fee - ${user.email}`,
                                    entryDate: new Date(),
                                    postedBy: 'SYSTEM',
                                    lines: [
                                        { accountId: cashAccount.id, debit: existingPayment.amount, credit: 0, organizationId: user.organizationId ?? undefined },
                                        { accountId: revenueAccount.id, debit: 0, credit: existingPayment.amount, organizationId: user.organizationId ?? undefined },
                                    ],
                                });
                            }
                            catch (jeErr) {
                                this.logger.warn(`Journal entry creation failed: ${jeErr.message}`);
                            }
                        }
                        try {
                            await this.feeShareService.recordRegistrationFee({
                                paymentId: existingPayment.id,
                                totalFee: existingPayment.amount,
                                organizationId: user.organizationId ?? undefined,
                                apexOrgId: user.apexOrgId ?? undefined,
                            });
                        }
                        catch (fsErr) {
                            this.logger.warn(`Fee share recording failed: ${fsErr.message}`);
                        }
                    }
                    this.logger.log(`Registration fee paid for user: ${existingPayment.userId}`);
                }
                this.logger.log(`Payment succeeded: ${providerReference}`);
                break;
            case 'charge.failed':
                await this.paymentsService.updateStatus(existingPayment?.id || '', status_enum_1.PaymentStatus.FAILED, data);
                this.logger.log(`Payment failed: ${providerReference}`);
                break;
        }
        try {
            await this.webhookLogRepo.save({
                provider: 'paystack',
                eventType: event || 'unknown',
                eventId: eventId || `${providerReference}_${Date.now()}`,
                paymentId: existingPayment?.id || undefined,
                status: event === 'charge.success' ? 'processed' : 'failed',
                payload: payload,
                retryCount: 0,
            });
        }
        catch { }
        return { status: 'processed' };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('paystack'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-paystack-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handlePaystackWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('api/v1/payments/webhook'),
    (0, common_1.UseGuards)(webhook_auth_guard_1.WebhookAuthGuard),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(webhook_log_entity_1.WebhookLog)),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        config_1.ConfigService,
        double_entry_service_1.DoubleEntryService,
        fee_share_service_1.FeeShareService,
        accounts_service_1.AccountsService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map