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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sms_log_entity_1 = require("./entities/sms-log.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const termii_client_1 = require("./termii/termii.client");
const mask_util_1 = require("../../common/mask.util");
let SmsService = SmsService_1 = class SmsService {
    repo;
    termiiClient;
    logger = new common_1.Logger(SmsService_1.name);
    constructor(repo, termiiClient) {
        this.repo = repo;
        this.termiiClient = termiiClient;
    }
    async send(recipient, message, eventType) {
        try {
            const sent = await this.termiiClient.sendSms(recipient, message);
            await this.repo.save({
                recipient,
                message,
                eventType,
                provider: status_enum_1.SmsProvider.TERMII,
                status: sent ? status_enum_1.SmsStatus.SENT : status_enum_1.SmsStatus.FAILED,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to send SMS to ${(0, mask_util_1.maskPhone)(recipient)}: ${errorMessage}`);
            await this.repo.save({
                recipient,
                message,
                eventType,
                provider: status_enum_1.SmsProvider.TERMII,
                status: status_enum_1.SmsStatus.FAILED,
                providerResponse: { error: errorMessage },
            });
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sms_log_entity_1.SmsLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        termii_client_1.TermiiClient])
], SmsService);
//# sourceMappingURL=sms.service.js.map