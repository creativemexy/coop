"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const support_controller_1 = require("./support.controller");
const support_service_1 = require("./support.service");
const webhook_log_entity_1 = require("../payments/entities/webhook-log.entity");
const support_ticket_entity_1 = require("../bnpl/entities/support-ticket.entity");
const ticket_message_entity_1 = require("./entities/ticket-message.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
let SupportModule = class SupportModule {
};
exports.SupportModule = SupportModule;
exports.SupportModule = SupportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                webhook_log_entity_1.WebhookLog,
                support_ticket_entity_1.SupportTicket,
                ticket_message_entity_1.TicketMessage,
                audit_log_entity_1.AuditLog,
                bnpl_subscription_entity_1.BnplSubscription,
                bnpl_installment_entity_1.BnplInstallment,
                payment_entity_1.Payment,
            ]),
        ],
        controllers: [support_controller_1.SupportController],
        providers: [support_service_1.SupportService],
    })
], SupportModule);
//# sourceMappingURL=support.module.js.map