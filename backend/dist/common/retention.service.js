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
var RetentionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetentionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const typeorm_2 = require("typeorm");
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
const audit_service_1 = require("./audit.service");
const audit_log_entity_2 = require("./entities/audit-log.entity");
const ANONYMIZED_EMAIL = 'anonymized@deleted.user';
const ANONYMIZED_PREFIX = 'ANONYMIZED_';
let RetentionService = RetentionService_1 = class RetentionService {
    config;
    auditService;
    loginRepo;
    deviceRepo;
    activityRepo;
    auditRepo;
    ticketRepo;
    notifRepo;
    smsRepo;
    webhookRepo;
    kycRepo;
    userRepo;
    logger = new common_1.Logger(RetentionService_1.name);
    defaults = {
        login_history: 90,
        device_sessions: 180,
        user_activities: 90,
        sms_logs: 90,
        webhook_logs: 30,
        bnpl_audit_logs: 365,
        support_tickets: 365,
        in_app_notifications: 30,
        kyc_submissions: 1825,
    };
    constructor(config, auditService, loginRepo, deviceRepo, activityRepo, auditRepo, ticketRepo, notifRepo, smsRepo, webhookRepo, kycRepo, userRepo) {
        this.config = config;
        this.auditService = auditService;
        this.loginRepo = loginRepo;
        this.deviceRepo = deviceRepo;
        this.activityRepo = activityRepo;
        this.auditRepo = auditRepo;
        this.ticketRepo = ticketRepo;
        this.notifRepo = notifRepo;
        this.smsRepo = smsRepo;
        this.webhookRepo = webhookRepo;
        this.kycRepo = kycRepo;
        this.userRepo = userRepo;
    }
    daysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d;
    }
    retentionDays(key) {
        const envKey = `RETENTION_${key.toUpperCase()}_DAYS`;
        return Number(this.config.get(envKey)) || this.defaults[key] || 365;
    }
    async purgeAll() {
        const results = {};
        const purge = async (key, repo) => {
            const days = this.retentionDays(key);
            const deleted = await repo.delete({
                createdAt: (0, typeorm_2.LessThan)(this.daysAgo(days)),
            });
            return deleted.affected ?? 0;
        };
        results.login_history = await purge('login_history', this.loginRepo);
        results.device_sessions = await purge('device_sessions', this.deviceRepo);
        results.user_activities = await purge('user_activities', this.activityRepo);
        results.sms_logs = await purge('sms_logs', this.smsRepo);
        results.webhook_logs = await purge('webhook_logs', this.webhookRepo);
        results.bnpl_audit_logs = await purge('bnpl_audit_logs', this.auditRepo);
        results.support_tickets = await purge('support_tickets', this.ticketRepo);
        results.in_app_notifications = await purge('in_app_notifications', this.notifRepo);
        results.kyc_anonymized = await this.anonymizeKycDocuments();
        results.kyc_submissions = await purge('kyc_submissions', this.kycRepo);
        const anonymized = await this.anonymizeInactiveUsers();
        await this.auditService.log(audit_log_entity_2.AuditAction.RETENTION_PURGE, {
            metadata: { purged: results, anonymized },
        });
        this.logger.log(`Retention purge complete: ${JSON.stringify(results)}, anonymized: ${anonymized}`);
        return { ...results, users_anonymized: anonymized };
    }
    async anonymizeKycDocuments() {
        const days = this.retentionDays('kyc_submissions');
        const cutoff = this.daysAgo(days);
        const result = await this.kycRepo
            .createQueryBuilder()
            .update()
            .set({ providerResponse: null, rejectionReason: null })
            .where('created_at < :cutoff', { cutoff })
            .andWhere('provider_response IS NOT NULL')
            .execute();
        return result.affected ?? 0;
    }
    async anonymizeInactiveUsers() {
        const retentionDays = Number(this.config.get('RETENTION_USER_ACCOUNT_DAYS')) || 730;
        const cutoff = this.daysAgo(retentionDays);
        const users = await this.userRepo.find({
            where: [
                { isActive: false, updatedAt: (0, typeorm_2.LessThan)(cutoff), emailHash: (0, typeorm_2.IsNull)() },
                { isActive: false, updatedAt: (0, typeorm_2.LessThan)(cutoff), email: (0, typeorm_2.IsNull)() },
            ],
        });
        for (const user of users) {
            Object.assign(user, {
                email: ANONYMIZED_EMAIL,
                emailHash: `anonymized_${user.id}`,
                phone: null,
                phoneHash: null,
                firstName: ANONYMIZED_PREFIX,
                lastName: ANONYMIZED_PREFIX,
                passwordHash: ANONYMIZED_PREFIX,
                refreshTokenHash: null,
                resetToken: null,
                resetTokenExpiry: null,
                socialProvider: null,
                socialId: null,
                kycReference: null,
                notificationPreferences: null,
                referralCode: null,
                referredBy: null,
                referralCount: 0,
                referralEarnings: 0,
                failedAttempts: 0,
                lockedUntil: null,
            });
            await this.userRepo.save(user);
        }
        return users.length;
    }
};
exports.RetentionService = RetentionService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RetentionService.prototype, "purgeAll", null);
exports.RetentionService = RetentionService = RetentionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(login_history_entity_1.LoginHistory)),
    __param(3, (0, typeorm_1.InjectRepository)(device_session_entity_1.DeviceSession)),
    __param(4, (0, typeorm_1.InjectRepository)(user_activity_entity_1.UserActivity)),
    __param(5, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(6, (0, typeorm_1.InjectRepository)(support_ticket_entity_1.SupportTicket)),
    __param(7, (0, typeorm_1.InjectRepository)(in_app_notification_entity_1.InAppNotification)),
    __param(8, (0, typeorm_1.InjectRepository)(sms_log_entity_1.SmsLog)),
    __param(9, (0, typeorm_1.InjectRepository)(webhook_log_entity_1.WebhookLog)),
    __param(10, (0, typeorm_1.InjectRepository)(kyc_submission_entity_1.KycSubmission)),
    __param(11, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        audit_service_1.AuditService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RetentionService);
//# sourceMappingURL=retention.service.js.map