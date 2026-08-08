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
var FirstCheckoutClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirstCheckoutClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let FirstCheckoutClient = FirstCheckoutClient_1 = class FirstCheckoutClient {
    configService;
    httpService;
    logger = new common_1.Logger(FirstCheckoutClient_1.name);
    enabled;
    apiUrl;
    publicKey;
    secretKey;
    merchantId;
    clientId;
    clientSecret;
    accessToken = null;
    accessTokenAt = 0;
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.enabled =
            configService.get('FIRST_BANKOUT_ENABLED') === 'true';
        this.apiUrl = (configService.get('FIRST_BANKOUT_API_URL') ||
            'https://www.firstchekoutdev.com').replace(/\/$/, '');
        this.publicKey =
            configService.get('FIRST_BANKOUT_PUBLIC_KEY') || '';
        this.secretKey =
            configService.get('FIRST_BANKOUT_SECRET_KEY') || '';
        this.merchantId =
            configService.get('FIRST_BANKOUT_MERCHANT_ID') || '';
        this.clientId = configService.get('FIRST_BANKOUT_CLIENT_ID') || '';
        this.clientSecret =
            configService.get('FIRST_BANKOUT_CLIENT_SECRET') || '';
    }
    get isStub() {
        return !this.enabled || !this.publicKey || !this.clientId;
    }
    isStubbed() {
        return this.isStub;
    }
    async createDepositVirtualAccount(params) {
        const tx = await this.initiateTransaction({
            reference: params.reference,
            amount: params.amount,
            email: params.email,
            name: params.name,
            purpose: params.purpose,
        });
        const draft = await this.initiatePayWithTransfer({
            transactionReference: tx.accessCode,
            typeId: 2,
        });
        return { ...draft, accessCode: tx.accessCode };
    }
    async getAccessToken() {
        const ttl = 55 * 60 * 1000;
        if (this.accessToken && Date.now() - this.accessTokenAt < ttl) {
            return this.accessToken;
        }
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/identityserver/api/v2/Authenticate/token`, new URLSearchParams({
            client_Id: this.clientId,
            client_Secret: this.clientSecret,
            grant_type: 'client_credentials',
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }));
        const token = data?.value?.access_token;
        if (!token) {
            throw new Error('FirstCheckout access token was empty');
        }
        this.accessToken = token;
        this.accessTokenAt = Date.now();
        return token;
    }
    stubAccount(seed) {
        const digits = seed.replace(/\D/g, '').slice(0, 7).padStart(7, '0');
        return `910${digits}`;
    }
    async initiateTransaction(params) {
        if (this.isStub) {
            this.logger.warn('FirstCheckout not configured, using stub transaction');
            return {
                accessCode: `TX-${params.reference.slice(0, 26).toUpperCase()}`,
            };
        }
        const token = await this.getAccessToken();
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/apigateway/api/v1/transactions/initiate`, {
            Amount: params.amount,
            PayerEmail: params.email,
            PayerName: params.name || '',
            Purpose: params.purpose || 'savings',
            PublicKey: this.publicKey,
            PaymentReference: params.reference,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }));
        const accessCode = data?.data?.accessCode;
        if (!accessCode) {
            throw new Error(`FirstCheckout transaction init failed: ${data?.status}`);
        }
        return { accessCode };
    }
    async initiatePayWithTransfer(params) {
        if (this.isStub) {
            this.logger.warn('FirstCheckout not configured, using stub virtual account');
            return {
                accountNumber: this.stubAccount(params.transactionReference),
                accountName: 'Coop Member',
                bankName: 'First Bank',
            };
        }
        const token = await this.getAccessToken();
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/apigateway/api/v1/paywithtransfer/initiate`, {
            TransactionReference: params.transactionReference,
            TypeId: params.typeId ?? 2,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }));
        const details = data?.data?.accountDetails;
        const accountNumber = details?.virtualAccountNo;
        if (!accountNumber) {
            throw new Error(`FirstCheckout pay-with-transfer failed: ${data?.status}`);
        }
        const bankName = (details?.virtualAccountName || '').split('/')[0].trim();
        return {
            accountNumber,
            accountName: details.accountName,
            bankName: bankName || 'First Bank',
            token: data.data?.token,
        };
    }
    async queryTransaction(reference) {
        if (this.isStub) {
            this.logger.warn('FirstCheckout not configured — queryTransaction blocked (gateway not live)');
            return { transactionReference: reference, status: 'BLOCKED', amount: 0 };
        }
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.apiUrl}/apigateway/api/v1/transactions/referenceId/${encodeURIComponent(reference)}`, {
            headers: {
                'Merchant-Id': this.merchantId,
                'Secret-Key': this.secretKey,
            },
        }));
        return data?.data ?? {};
    }
    async confirmPayWithTransfer(params) {
        if (this.isStub) {
            this.logger.warn('FirstCheckout not configured — confirm blocked (gateway not live)');
            return {
                paymentStatus: 'BLOCKED',
                amount: 0,
                message: 'Stub confirm-blocked (gateway not live)',
            };
        }
        const token = await this.getAccessToken();
        const { data } = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/apigateway/api/v1/paywithtransfer/confirm-payment`, {
            UniqueReference: params.reference,
            VirtualAccountNo: params.accountNumber,
            VirtualAccountToken: params.token,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }));
        const tx = data?.data?.transactions?.[0];
        return {
            paymentStatus: tx?.paymentStatus,
            amount: tx?.amount,
            message: tx?.message || data?.status,
        };
    }
};
exports.FirstCheckoutClient = FirstCheckoutClient;
exports.FirstCheckoutClient = FirstCheckoutClient = FirstCheckoutClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], FirstCheckoutClient);
//# sourceMappingURL=firstcheckout.client.js.map