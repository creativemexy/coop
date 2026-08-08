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
var KorapayClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KorapayClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const crypto = __importStar(require("crypto"));
const korapay_types_1 = require("./korapay.types");
let KorapayClient = KorapayClient_1 = class KorapayClient {
    configService;
    httpService;
    logger = new common_1.Logger(KorapayClient_1.name);
    baseUrl;
    secretKey;
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.secretKey = configService.get('KORAPAY_SECRET_KEY') || '';
        this.baseUrl = 'https://api.korapay.com/merchant';
    }
    async verifyIdentity(params) {
        const identityType = params.type || 'bvn';
        if (!this.secretKey) {
            this.logger.warn('KORAPAY_SECRET_KEY not configured, using stub');
            return {
                reference: params.reference,
                id: params.id,
                id_type: `ng_${identityType}`,
                first_name: 'John',
                last_name: 'Doe',
                date_of_birth: '1990-01-01',
                phone_number: '08000000000',
                status: 'verified',
            };
        }
        const endpoint = korapay_types_1.KORAPAY_ENDPOINTS[identityType];
        if (!endpoint) {
            throw new Error(`Unknown identity type: ${identityType}`);
        }
        try {
            const body = {
                id: params.id,
                verification_consent: true,
            };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}${endpoint}`, body, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json',
                },
            }));
            const data = response.data;
            if (!data.status) {
                this.logger.warn(`Korapay lookup failed: ${JSON.stringify(data)}`);
                throw new Error(data.message || 'Korapay identity verification failed');
            }
            return data.data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Korapay identity verification failed: ${errorMessage}`);
            throw error;
        }
    }
    verifyWebhookSignature(rawBody, signature) {
        if (!this.secretKey)
            return true;
        if (!signature)
            return false;
        const expected = crypto
            .createHmac('sha256', this.secretKey)
            .update(rawBody)
            .digest('hex');
        try {
            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        }
        catch {
            return signature === expected;
        }
    }
    parseWebhookPayload(payload) {
        if (!payload?.event || !payload?.data?.reference)
            return null;
        return payload;
    }
};
exports.KorapayClient = KorapayClient;
exports.KorapayClient = KorapayClient = KorapayClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], KorapayClient);
//# sourceMappingURL=korapay.client.js.map