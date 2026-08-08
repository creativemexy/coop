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
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const compliance_service_1 = require("../services/compliance.service");
const subscriptions_service_1 = require("../services/subscriptions.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
let ComplianceController = class ComplianceController {
    service;
    subsService;
    constructor(service, subsService) {
        this.service = service;
        this.subsService = subsService;
    }
    async checkEligibility(planId, userId) {
        if (!planId)
            throw new common_1.BadRequestException('planId query param is required');
        return this.subsService.checkEligibility(userId, planId);
    }
    async createFlag(dto, userId) {
        return this.service.createFlag({ ...dto, flaggedBy: userId });
    }
    async listFlags(status, entityType) {
        return this.service.listFlags({ status, entityType });
    }
    async resolveFlag(id, dto, userId) {
        return this.service.resolveFlag(id, { ...dto, resolvedBy: userId });
    }
    async listExceptionReasons() {
        return this.service.listExceptionReasons();
    }
    async createExceptionReason(dto, userId) {
        return this.service.createExceptionReason({ ...dto, createdBy: userId });
    }
    async updateExceptionReason(id, dto) {
        return this.service.updateExceptionReason(id, dto);
    }
    async deleteExceptionReason(id) {
        await this.service.deleteExceptionReason(id);
        return { message: 'Deleted' };
    }
    async getPortfolioSummary() {
        return this.service.getPortfolioSummary();
    }
    async getPortfolioKpis() {
        return this.service.getPortfolioKpis();
    }
    async getRevenueSummary() {
        return this.service.getRevenueSummary();
    }
    async export(res) {
        const csv = await this.service.exportCsv();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bnpl-report.csv"');
        res.send(csv);
    }
    async listAuditLogs(entityType, entityId, action, category) {
        return this.service.listAuditLogs({ entityType, entityId, action, category });
    }
    async getAuditLog(id) {
        return this.service.getAuditLog(id);
    }
    async getAuditEvidence(id) {
        const evidence = await this.service.getAuditEvidence(id);
        if (!evidence)
            return { evidence: null };
        return { evidence };
    }
    async getDelinquencyCohorts() {
        return this.service.getDelinquencyCohorts();
    }
    async getDelinquencyTrends() {
        return this.service.getDelinquencyTrends();
    }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, common_1.Get)('eligibility'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, common_1.Query)('planId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "checkEligibility", null);
__decorate([
    (0, common_1.Post)('flags'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "createFlag", null);
__decorate([
    (0, common_1.Get)('flags'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('entityType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "listFlags", null);
__decorate([
    (0, common_1.Patch)('flags/:id/resolve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "resolveFlag", null);
__decorate([
    (0, common_1.Get)('exception-reasons'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "listExceptionReasons", null);
__decorate([
    (0, common_1.Post)('exception-reasons'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "createExceptionReason", null);
__decorate([
    (0, common_1.Patch)('exception-reasons/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "updateExceptionReason", null);
__decorate([
    (0, common_1.Delete)('exception-reasons/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "deleteExceptionReason", null);
__decorate([
    (0, common_1.Get)('portfolio-summary'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getPortfolioSummary", null);
__decorate([
    (0, common_1.Get)('portfolio-kpis'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getPortfolioKpis", null);
__decorate([
    (0, common_1.Get)('revenue-summary'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getRevenueSummary", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "export", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('entityType')),
    __param(1, (0, common_1.Query)('entityId')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "listAuditLogs", null);
__decorate([
    (0, common_1.Get)('audit-logs/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getAuditLog", null);
__decorate([
    (0, common_1.Get)('audit-logs/:id/evidence'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getAuditEvidence", null);
__decorate([
    (0, common_1.Get)('delinquency-cohorts'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getDelinquencyCohorts", null);
__decorate([
    (0, common_1.Get)('delinquency-trends'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ComplianceController.prototype, "getDelinquencyTrends", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, common_1.Controller)('api/v1/bnpl/compliance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService,
        subscriptions_service_1.SubscriptionsService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map