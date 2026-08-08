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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const mask_util_1 = require("../../common/mask.util");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async resetPassword(id, dto) {
        return this.adminService.resetPassword(id, dto.newPassword);
    }
    async revokeSessions(id) {
        return this.adminService.revokeSessions(id);
    }
    async assignRole(id, dto, user) {
        return this.adminService.assignRole(id, dto.role, user.role, dto.organizationId, dto.apexOrgId);
    }
    async listTenants() {
        return this.adminService.listTenants();
    }
    async getTenant(id) {
        return this.adminService.getTenantDetail(id);
    }
    async getTenantHealth(id) {
        return this.adminService.getTenantHealth(id);
    }
    async updateTenantSettings(id, dto) {
        return this.adminService.updateTenantSettings(id, dto);
    }
    async getTenantSettings(id) {
        return this.adminService.getTenantSettings(id);
    }
    async getTenantConfig(id) {
        return this.adminService.getTenantConfig(id);
    }
    async updateTenantConfig(id, dto) {
        return this.adminService.updateTenantConfig(id, dto);
    }
    async getOverview() {
        return this.adminService.getAdminOverview();
    }
    async getTenantsHealthTable() {
        return this.adminService.getTenantsHealthTable();
    }
    async getFinancialReports() {
        return this.adminService.getFinancialReports();
    }
    async getUsersByOrg(user) {
        const orgs = await this.adminService.getUsersByOrganization();
        if (user?.role === role_enum_1.Role.SUPER_ADMIN)
            return orgs;
        return orgs.map((org) => ({
            ...org,
            users: org.users.map((u) => ({
                ...u,
                email: (0, mask_util_1.maskEmail)(u.email),
                firstName: (0, mask_util_1.maskName)(u.firstName),
                lastName: (0, mask_util_1.maskName)(u.lastName),
            })),
        }));
    }
    async getAdminAuditLogs(tenantId, actorId, action, days) {
        return this.adminService.getAdminAuditLogs({
            tenantId,
            actorId,
            action,
            days: days ? Number(days) : undefined,
        });
    }
    async getOrderVolume(id) {
        return this.adminService.getTenantOrderVolume(id);
    }
    async getRepaymentKpis(id) {
        return this.adminService.getTenantRepaymentKpis(id);
    }
    async getDelinquency(id) {
        return this.adminService.getTenantDelinquencySnapshot(id);
    }
    async exportTenantReport(id, res) {
        const csv = await this.adminService.exportTenantReport(id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="tenant-${id}-report.csv"`);
        res.send(csv);
    }
    async getMemberStatement(userId) {
        return this.adminService.getMemberStatement(userId);
    }
    async getWebhookDeliveryStatus(days) {
        return this.adminService.getWebhookDeliveryStatus(undefined, days ? Number(days) : 7);
    }
    async getFailedJobs(days) {
        return this.adminService.getFailedJobs(undefined, days ? Number(days) : 7);
    }
    async getQueueStatus() {
        return this.adminService.getQueueStatus();
    }
    async getSystemLogs(days) {
        return this.adminService.getSystemLogs(undefined, days ? Number(days) : 7);
    }
    async getDisputes(status, type, page, limit) {
        return this.adminService.getDisputes({
            status,
            type,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async resolveDispute(id, dto, user) {
        return this.adminService.resolveDispute(id, dto, user.sub);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('users/:id/reset-password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('users/:id/revoke-sessions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "revokeSessions", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Get)('tenants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listTenants", null);
__decorate([
    (0, common_1.Get)('tenants/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenant", null);
__decorate([
    (0, common_1.Get)('tenants/:id/health'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenantHealth", null);
__decorate([
    (0, common_1.Patch)('tenants/:id/settings'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTenantSettings", null);
__decorate([
    (0, common_1.Get)('tenants/:id/settings'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenantSettings", null);
__decorate([
    (0, common_1.Get)('tenants/:id/config'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenantConfig", null);
__decorate([
    (0, common_1.Patch)('tenants/:id/config'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTenantConfig", null);
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('tenants-health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTenantsHealthTable", null);
__decorate([
    (0, common_1.Get)('financial-reports'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFinancialReports", null);
__decorate([
    (0, common_1.Get)('users-by-org'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsersByOrg", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)('tenantId')),
    __param(1, (0, common_1.Query)('actorId')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminAuditLogs", null);
__decorate([
    (0, common_1.Get)('tenants/:id/reports/order-volume'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getOrderVolume", null);
__decorate([
    (0, common_1.Get)('tenants/:id/reports/repayment-kpis'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRepaymentKpis", null);
__decorate([
    (0, common_1.Get)('tenants/:id/reports/delinquency'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDelinquency", null);
__decorate([
    (0, common_1.Get)('tenants/:id/reports/export'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportTenantReport", null);
__decorate([
    (0, common_1.Get)('tenants/reports/member-statement'),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMemberStatement", null);
__decorate([
    (0, common_1.Get)('monitoring/webhooks'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWebhookDeliveryStatus", null);
__decorate([
    (0, common_1.Get)('monitoring/failed-jobs'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getFailedJobs", null);
__decorate([
    (0, common_1.Get)('monitoring/queues'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getQueueStatus", null);
__decorate([
    (0, common_1.Get)('monitoring/logs'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemLogs", null);
__decorate([
    (0, common_1.Get)('disputes'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDisputes", null);
__decorate([
    (0, common_1.Patch)('disputes/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveDispute", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('api/v1/admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map