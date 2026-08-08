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
var SmsEventDispatcher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsEventDispatcher = void 0;
const common_1 = require("@nestjs/common");
const sms_service_1 = require("./sms.service");
let SmsEventDispatcher = SmsEventDispatcher_1 = class SmsEventDispatcher {
    smsService;
    logger = new common_1.Logger(SmsEventDispatcher_1.name);
    constructor(smsService) {
        this.smsService = smsService;
    }
    async emit(event, data) {
        this.logger.log(`SMS Event: ${event} for user ${data.userId}`);
        const smsConfig = {
            'payment.success': {
                message: (d) => `Payment of ₦${d.amount} was successful. Ref: ${d.reference}`,
                recipient: (d) => d.phone || '',
            },
            'registration.complete': {
                message: () => 'Welcome to the Cooperative! Your account has been created.',
                recipient: (d) => d.phone || '',
            },
            'kyc.approved': {
                message: () => 'Your KYC has been approved. You can now access all features.',
                recipient: (d) => d.phone || '',
            },
            'installment.reminder': {
                message: (d) => `Reminder: Your BNPL installment of ₦${d.amount} is due on ${d.dueDate}.`,
                recipient: (d) => d.phone || '',
            },
        };
        const config = smsConfig[event];
        if (config && data.phone) {
            await this.smsService.send(data.phone, config.message(data), event);
        }
    }
};
exports.SmsEventDispatcher = SmsEventDispatcher;
exports.SmsEventDispatcher = SmsEventDispatcher = SmsEventDispatcher_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sms_service_1.SmsService])
], SmsEventDispatcher);
//# sourceMappingURL=sms-event-dispatcher.js.map