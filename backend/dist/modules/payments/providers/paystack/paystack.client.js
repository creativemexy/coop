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
var PaystackClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaystackClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let PaystackClient = PaystackClient_1 = class PaystackClient {
    configService;
    httpService;
    logger = new common_1.Logger(PaystackClient_1.name);
    secretKey;
    baseUrl;
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.secretKey =
            configService.get('PAYSTACK_SECRET_KEY') || '';
        this.baseUrl = 'https://api.paystack.co';
    }
    async initializeTransaction(params) {
        if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
            this.logger.warn('Paystack secret key not configured, using stub');
            return {
                authorizationUrl: `https://checkout.paystack.com/${params.reference}`,
                accessCode: params.reference,
            };
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/transaction/initialize`, {
                email: params.email,
                amount: Math.round(params.amount * 100),
                reference: params.reference,
                callback_url: params.callbackUrl,
                metadata: params.metadata,
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            }));
            if (!data.status || !data.data) {
                throw new Error(`Paystack init failed: ${data.message}`);
            }
            return {
                authorizationUrl: data.data.authorization_url,
                accessCode: data.data.access_code,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Paystack init failed: ${errorMessage}`);
            throw error;
        }
    }
    async verifyTransaction(reference) {
        if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
            this.logger.warn('Paystack secret key not configured, using stub');
            return {
                status: 'success',
                reference,
                amount: 0,
                fees: 0,
                paid_at: new Date().toISOString(),
                channel: 'card',
                customer: { email: '' },
            };
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/transaction/verify/${reference}`, {
                headers: { Authorization: `Bearer ${this.secretKey}` },
            }));
            if (!data.status) {
                throw new Error(`Paystack verify failed: ${data.message}`);
            }
            return data.data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Paystack verify failed: ${errorMessage}`);
            throw error;
        }
    }
    async resolveBankAccount(accountNumber, bankCode) {
        if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
            this.logger.warn('Paystack secret key not configured, skipping bank resolve');
            return null;
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/bank/resolve`, {
                params: { account_number: accountNumber, bank_code: bankCode },
                headers: { Authorization: `Bearer ${this.secretKey}` },
            }));
            if (!data.status || !data.data) {
                throw new Error(`Paystack bank resolve failed: ${data.message}`);
            }
            return {
                accountName: data.data.account_name,
                accountNumber: data.data.account_number,
                bankId: data.data.bank_id,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Paystack bank resolve failed: ${errorMessage}`);
            throw error;
        }
    }
    async getBalance() {
        if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
            this.logger.warn('Paystack secret key not configured, using stub balance');
            return [{ currency: 'NGN', available: 0, balance: 0 }];
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/balance`, {
                headers: { Authorization: `Bearer ${this.secretKey}` },
            }));
            if (!data.status || !data.data) {
                throw new Error(`Paystack balance failed: ${data.message}`);
            }
            return data.data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Paystack balance failed: ${errorMessage}`);
            throw error;
        }
    }
    async listBanks() {
        if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
            this.logger.warn('Paystack secret key not configured, using stub bank list');
            return [
                { code: '999992', name: 'OPay' },
                { code: '058', name: 'GTBank' },
            ];
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/bank`, {
                params: { currency: 'NGN', perPage: 300 },
                headers: { Authorization: `Bearer ${this.secretKey}` },
            }));
            if (!data.status || !Array.isArray(data.data)) {
                throw new Error(`Paystack bank list failed: ${data.message}`);
            }
            return data.data
                .filter((b) => b.code && b.name)
                .map((b) => ({ code: b.code, name: b.name, slug: b.slug }));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Paystack bank list failed: ${errorMessage}`);
            throw error;
        }
    }
    async createTransferRecipient(params) {
        if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
            this.logger.warn('Paystack secret key not configured, using stub recipient');
            return `RCP_${params.accountNumber}`;
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/transferrecipient`, {
                type: 'nuban',
                name: params.name,
                account_number: params.accountNumber,
                bank_code: params.bankCode,
                currency: 'NGN',
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            }));
            if (!data.status || !data.data?.recipient_code) {
                throw new Error(`Paystack recipient create failed: ${data.message}`);
            }
            return data.data.recipient_code;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Paystack recipient create failed: ${errorMessage}`);
            throw error;
        }
    }
    async initiateTransfer(params) {
        const reference = params.reference ||
            `TFR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
            this.logger.warn('Paystack secret key not configured, using stub transfer');
            return { reference, status: 'success', recipientCode: params.recipient };
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/transfer`, {
                source: 'balance',
                amount: Math.round(params.amount * 100),
                recipient: params.recipient,
                reason: params.reason,
                reference,
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            }));
            if (!data.status || !data.data?.reference) {
                throw new Error(`Paystack transfer failed: ${data.message}`);
            }
            return {
                reference: data.data.reference,
                status: data.data.status || 'success',
                recipientCode: params.recipient,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Paystack transfer failed: ${errorMessage}`);
            throw error;
        }
    }
    async verifyTransfer(reference) {
        if (!this.secretKey || this.secretKey === 'sk_test_xxx') {
            this.logger.warn('Paystack secret key not configured, using stub verify');
            return { reference, status: 'success', recipientCode: '' };
        }
        try {
            const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.baseUrl}/transfer/verify/${reference}`, {
                headers: { Authorization: `Bearer ${this.secretKey}` },
            }));
            if (!data.status || !data.data) {
                return null;
            }
            return {
                reference: data.data.reference || reference,
                status: data.data.status || 'success',
                recipientCode: data.data.recipient?.recipient_code || '',
            };
        }
        catch (error) {
            const responseStatus = error?.response?.status;
            if (responseStatus === 404) {
                return null;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Paystack transfer verify failed: ${errorMessage}`);
            throw error;
        }
    }
};
exports.PaystackClient = PaystackClient;
exports.PaystackClient = PaystackClient = PaystackClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], PaystackClient);
//# sourceMappingURL=paystack.client.js.map