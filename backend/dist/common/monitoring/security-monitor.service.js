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
var SecurityMonitorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityMonitorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const login_history_entity_1 = require("../../modules/auth/entities/login-history.entity");
const alert_service_1 = require("./alert.service");
const SUSPICIOUS_THRESHOLD = 10;
const RAPID_FAIL_WINDOW_MS = 5 * 60 * 1000;
let SecurityMonitorService = SecurityMonitorService_1 = class SecurityMonitorService {
    loginRepo;
    alert;
    logger = new common_1.Logger(SecurityMonitorService_1.name);
    constructor(loginRepo, alert) {
        this.loginRepo = loginRepo;
        this.alert = alert;
    }
    async checkLoginAttempt(ipAddress, userId) {
        const since = new Date(Date.now() - RAPID_FAIL_WINDOW_MS);
        const where = [{ createdAt: (0, typeorm_2.LessThan)(since) }];
        if (ipAddress)
            where[0].ipAddress = ipAddress;
        if (userId)
            where[0].userId = userId;
        const recentFails = await this.loginRepo.count({
            where: { ...where[0], success: false },
        });
        if (recentFails >= SUSPICIOUS_THRESHOLD) {
            await this.alert.alertSecurity('Rapid failed login attempts', userId, { ipAddress, count: recentFails, windowMinutes: 5 });
        }
    }
    async checkSuspiciousUserId(ipAddress, userIds) {
        if (userIds.length <= 1)
            return;
        await this.alert.alertSecurity('Multiple user accounts from same IP', undefined, { ipAddress, userIds, count: userIds.length });
    }
    async periodicScan() {
        this.logger.log('Running security scan...');
        try {
            await this.checkAbnormalPatterns();
        }
        catch (err) {
            this.logger.error(`Security scan failed: ${err.message}`);
        }
    }
    async checkAbnormalPatterns() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const highFailIps = await this.loginRepo
            .createQueryBuilder('lh')
            .select('lh.ip_address', 'ip')
            .addSelect('COUNT(*)', 'cnt')
            .where('lh.created_at > :since', { since: oneHourAgo })
            .andWhere('lh.success = :success', { success: false })
            .groupBy('lh.ip_address')
            .having('COUNT(*) > :threshold', { threshold: 20 })
            .getRawMany();
        for (const row of highFailIps) {
            await this.alert.alertSecurity(`Suspicious IP: ${row.ip} - ${row.cnt} failed logins in 1 hour`, undefined, { ipAddress: row.ip, count: row.cnt, windowHours: 1 });
        }
    }
};
exports.SecurityMonitorService = SecurityMonitorService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityMonitorService.prototype, "periodicScan", null);
exports.SecurityMonitorService = SecurityMonitorService = SecurityMonitorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(login_history_entity_1.LoginHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        alert_service_1.AlertService])
], SecurityMonitorService);
//# sourceMappingURL=security-monitor.service.js.map