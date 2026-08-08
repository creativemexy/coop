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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualAccountWebhookController = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const config_1 = require("@nestjs/config");
const csrf_guard_1 = require("../../common/guards/csrf.guard");
const webhook_auth_guard_1 = require("../../common/guards/webhook-auth.guard");
const virtual_accounts_service_1 = require("./virtual-accounts.service");
let VirtualAccountWebhookController = class VirtualAccountWebhookController {
    service;
    configService;
    secretKey;
    constructor(service, configService) {
        this.service = service;
        this.configService = configService;
        this.secretKey =
            configService.get('FIRST_BANKOUT_SECRET_KEY') || '';
    }
    async handleDeposit(payload, signature, altSignature) {
        const headerSignature = signature || altSignature;
        if (this.secretKey && headerSignature) {
            const hash = crypto
                .createHmac('sha512', this.secretKey)
                .update(JSON.stringify(payload))
                .digest('hex');
            if (hash !== headerSignature &&
                hash.toLowerCase() !== headerSignature.toLowerCase()) {
                return { status: 'invalid_signature' };
            }
        }
        return this.service.handleDepositNotification(payload);
    }
};
exports.VirtualAccountWebhookController = VirtualAccountWebhookController;
__decorate([
    (0, common_1.Post)('firstcheckout/virtual-account-deposit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-fch-signature')),
    __param(2, (0, common_1.Headers)('x-fch-x-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VirtualAccountWebhookController.prototype, "handleDeposit", null);
exports.VirtualAccountWebhookController = VirtualAccountWebhookController = __decorate([
    (0, common_1.Controller)('api/v1/payments/webhook'),
    (0, csrf_guard_1.SkipCsrf)(),
    (0, common_1.UseGuards)(webhook_auth_guard_1.WebhookAuthGuard),
    __metadata("design:paramtypes", [virtual_accounts_service_1.VirtualAccountsService,
        config_1.ConfigService])
], VirtualAccountWebhookController);
//# sourceMappingURL=virtual-account-webhook.controller.js.map