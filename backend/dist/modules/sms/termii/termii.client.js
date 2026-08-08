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
var TermiiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermiiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const mask_util_1 = require("../../../common/mask.util");
let TermiiClient = TermiiClient_1 = class TermiiClient {
    configService;
    httpService;
    logger = new common_1.Logger(TermiiClient_1.name);
    apiKey;
    senderId;
    baseUrl;
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.apiKey = configService.get('TERMII_API_KEY') || '';
        this.senderId = configService.get('TERMII_SENDER_ID') || 'CoopBNPL';
        this.baseUrl = 'https://api.termii.com';
    }
    async sendSms(recipient, message) {
        if (!this.apiKey) {
            this.logger.warn('Termii API key not configured, logging SMS instead');
            this.logger.log(`[SMS Stub] To: ${(0, mask_util_1.maskPhone)(recipient)}, Message: ${message}`);
            return true;
        }
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.baseUrl}/api/sms/send`, {
                api_key: this.apiKey,
                to: recipient,
                from: this.senderId,
                sms: message,
                type: 'plain',
                channel: 'generic',
            }, {
                headers: { 'Content-Type': 'application/json' },
            }));
            this.logger.log(`SMS sent to ${(0, mask_util_1.maskPhone)(recipient)} via Termii`);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Termii SMS failed for ${(0, mask_util_1.maskPhone)(recipient)}: ${errorMessage}`);
            return false;
        }
    }
};
exports.TermiiClient = TermiiClient;
exports.TermiiClient = TermiiClient = TermiiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], TermiiClient);
//# sourceMappingURL=termii.client.js.map