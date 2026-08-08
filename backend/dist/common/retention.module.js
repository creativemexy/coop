"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetentionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const retention_service_1 = require("./retention.service");
const audit_service_1 = require("./audit.service");
const login_history_entity_1 = require("../modules/auth/entities/login-history.entity");
const device_session_entity_1 = require("../modules/auth/entities/device-session.entity");
const user_activity_entity_1 = require("../modules/users/entities/user-activity.entity");
const audit_log_entity_1 = require("../modules/bnpl/entities/audit-log.entity");
const support_ticket_entity_1 = require("../modules/bnpl/entities/support-ticket.entity");
const in_app_notification_entity_1 = require("../modules/notifications/entities/in-app-notification.entity");
const sms_log_entity_1 = require("../modules/sms/entities/sms-log.entity");
const webhook_log_entity_1 = require("../modules/payments/entities/webhook-log.entity");
const kyc_submission_entity_1 = require("../modules/kyc/entities/kyc-submission.entity");
const user_entity_1 = require("../modules/users/entities/user.entity");
const audit_log_entity_2 = require("../common/entities/audit-log.entity");
let RetentionModule = class RetentionModule {
};
exports.RetentionModule = RetentionModule;
exports.RetentionModule = RetentionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                login_history_entity_1.LoginHistory,
                device_session_entity_1.DeviceSession,
                user_activity_entity_1.UserActivity,
                audit_log_entity_1.AuditLog,
                support_ticket_entity_1.SupportTicket,
                in_app_notification_entity_1.InAppNotification,
                sms_log_entity_1.SmsLog,
                webhook_log_entity_1.WebhookLog,
                kyc_submission_entity_1.KycSubmission,
                user_entity_1.User,
                audit_log_entity_2.AuditLog,
            ]),
        ],
        providers: [retention_service_1.RetentionService, audit_service_1.AuditService],
        exports: [retention_service_1.RetentionService, audit_service_1.AuditService],
    })
], RetentionModule);
//# sourceMappingURL=retention.module.js.map