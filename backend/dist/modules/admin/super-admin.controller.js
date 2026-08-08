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
exports.SuperAdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const super_admin_service_1 = require("./super-admin.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const policy_template_entity_1 = require("./entities/policy-template.entity");
const tenant_onboarding_request_entity_1 = require("./entities/tenant-onboarding-request.entity");
const feature_flag_entity_1 = require("./entities/feature-flag.entity");
const incident_entity_1 = require("./entities/incident.entity");
const secret_entity_1 = require("./entities/secret.entity");
let SuperAdminController = class SuperAdminController {
    sa;
    constructor(sa) {
        this.sa = sa;
    }
    async createUser(dto) {
        return this.sa.createUser(dto);
    }
    async getOverview() {
        return this.sa.getSystemOverview();
    }
    async getAuditLog(days, action, actorId) {
        return this.sa.getGlobalAuditLog({
            days: days ? Number(days) : undefined,
            action,
            actorId,
        });
    }
    async createPolicy(dto, user) {
        return this.sa.createPolicyTemplate({ ...dto, createdBy: user.sub });
    }
    async listPolicies(type, status) {
        return this.sa.listPolicyTemplates(type, status);
    }
    async getPolicy(id) {
        return this.sa.getPolicyTemplate(id);
    }
    async updatePolicy(id, dto, user) {
        return this.sa.updatePolicyTemplate(id, { ...dto, updatedBy: user.sub });
    }
    async createPolicyVersion(id, dto, user) {
        return this.sa.createPolicyVersion(id, { ...dto, createdBy: user.sub });
    }
    async submitPolicy(id) {
        return this.sa.submitPolicyForApproval(id);
    }
    async approvePolicy(id, user) {
        return this.sa.approvePolicyTemplate(id, user.sub);
    }
    async rejectPolicy(id, dto) {
        return this.sa.rejectPolicyTemplate(id, dto.reason);
    }
    async createOnboarding(dto, user) {
        return this.sa.createOnboardingRequest({ ...dto, submittedBy: user.sub });
    }
    async listOnboarding(status) {
        return this.sa.listOnboardingRequests(status);
    }
    async getOnboarding(id) {
        return this.sa.getOnboardingRequest(id);
    }
    async updateOnboarding(id, dto) {
        return this.sa.updateOnboardingRequest(id, dto);
    }
    async submitOnboarding(id) {
        return this.sa.submitOnboardingRequest(id);
    }
    async approveOnboarding(id, dto, user) {
        return this.sa.approveOnboardingRequest(id, user.sub, dto.reviewNotes);
    }
    async rejectOnboarding(id, dto, user) {
        return this.sa.rejectOnboardingRequest(id, user.sub, dto.reason);
    }
    async completeOnboarding(id) {
        return this.sa.completeOnboarding(id);
    }
    async createFeatureFlag(dto, user) {
        return this.sa.createFeatureFlag({ ...dto, createdBy: user.sub });
    }
    async listFeatureFlags(status) {
        return this.sa.listFeatureFlags(status);
    }
    async getFeatureFlag(id) {
        return this.sa.getFeatureFlag(id);
    }
    async updateFeatureFlag(id, dto, user) {
        return this.sa.updateFeatureFlag(id, { ...dto, updatedBy: user.sub });
    }
    async deleteFeatureFlag(id) {
        return this.sa.deleteFeatureFlag(id);
    }
    async toggleFeatureFlag(id, dto, user) {
        return this.sa.toggleFeatureFlag(id, dto.enabled, user.sub);
    }
    async createIncident(dto, user) {
        return this.sa.createIncident({ ...dto, reportedBy: user.sub });
    }
    async listIncidents(status, severity) {
        const statusArray = typeof status === 'string' && status.includes(',')
            ? status.split(',').map((s) => s.trim())
            : status;
        return this.sa.listIncidents(statusArray, severity);
    }
    async getIncidentStats() {
        return this.sa.getIncidentStats();
    }
    async getIncident(id) {
        return this.sa.getIncident(id);
    }
    async updateIncident(id, dto, user) {
        return this.sa.updateIncident(id, { ...dto, resolvedBy: user.sub });
    }
    async assignIncident(id, dto) {
        return this.sa.assignIncident(id, dto.assignedTo);
    }
    async getSecurityConfig() {
        return this.sa.getSecurityConfig();
    }
    async setSecurityConfig(dto, user) {
        return this.sa.setSecurityConfig(dto.key, { ...dto, updatedBy: user.sub });
    }
    async deleteSecurityConfig(key) {
        return this.sa.deleteSecurityConfig(key);
    }
    async createSecret(dto, user) {
        return this.sa.createSecret({ ...dto, createdBy: user.sub });
    }
    async listSecrets(category) {
        return this.sa.listSecrets(category);
    }
    async getSecret(id) {
        return this.sa.getSecret(id);
    }
    async updateSecret(id, dto, user) {
        return this.sa.updateSecret(id, { ...dto, updatedBy: user.sub });
    }
    async deleteSecret(id) {
        return this.sa.deleteSecret(id);
    }
    async rotateSecret(id, dto, user) {
        return this.sa.rotateSecret(id, dto.encryptedValue, user.sub);
    }
    async getKycOverview() {
        return this.sa.getKycOverview();
    }
    async getPaymentTransactions(search, type, status, startDate, endDate, page, limit) {
        return this.sa.getPaymentTransactions({
            search,
            type,
            status,
            startDate,
            endDate,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async getTemplates() {
        return this.sa.getTemplates();
    }
    async getTemplate(id) {
        return this.sa.getTemplate(id);
    }
    async createTemplate(dto) {
        return this.sa.createTemplate(dto);
    }
    async updateTemplate(id, dto) {
        return this.sa.updateTemplate(id, dto);
    }
    async deleteTemplate(id) {
        return this.sa.deleteTemplate(id);
    }
    async getRiskRules() {
        return this.sa.getRiskRules();
    }
    async createRiskRule(dto) {
        return this.sa.createRiskRule(dto);
    }
    async updateRiskRule(id, dto) {
        return this.sa.updateRiskRule(id, dto);
    }
    async deleteRiskRule(id) {
        return this.sa.deleteRiskRule(id);
    }
    async getFinancialConfig() {
        return this.sa.getFinancialConfig();
    }
    async updateFinancialConfig(dto) {
        return this.sa.updateFinancialConfig(dto);
    }
    async getDisputes(status, type, page, limit) {
        return this.sa.getDisputes({
            status,
            type,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        });
    }
    async resolveDispute(id, dto, user) {
        return this.sa.resolveDispute(id, dto, user.sub);
    }
    async getSystemConfig() {
        return this.sa.getSystemConfig();
    }
    async updateSystemConfig(dto) {
        return this.sa.updateSystemConfig(dto);
    }
    async triggerBackup() {
        return this.sa.triggerBackup();
    }
    async listBackups() {
        return this.sa.listBackups();
    }
    async downloadBackup(filename) {
        const stream = this.sa.getBackupStream(filename);
        return new common_1.StreamableFile(stream);
    }
    async deleteBackup(filename) {
        return this.sa.deleteBackup(filename);
    }
    async restoreBackup(filename) {
        return this.sa.restoreBackup(filename);
    }
    async uploadBackup(file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        return { message: 'File uploaded', filename: file.filename, size: file.size };
    }
    async getRolePermissions() {
        return this.sa.getRolePermissions();
    }
    async updateRolePermissions(dto) {
        return this.sa.updateRolePermissions(dto);
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('audit-log'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('actorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getAuditLog", null);
__decorate([
    (0, common_1.Post)('policies'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createPolicy", null);
__decorate([
    (0, common_1.Get)('policies'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "listPolicies", null);
__decorate([
    (0, common_1.Get)('policies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getPolicy", null);
__decorate([
    (0, common_1.Patch)('policies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updatePolicy", null);
__decorate([
    (0, common_1.Post)('policies/:id/versions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createPolicyVersion", null);
__decorate([
    (0, common_1.Post)('policies/:id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "submitPolicy", null);
__decorate([
    (0, common_1.Post)('policies/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "approvePolicy", null);
__decorate([
    (0, common_1.Post)('policies/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "rejectPolicy", null);
__decorate([
    (0, common_1.Post)('onboarding'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createOnboarding", null);
__decorate([
    (0, common_1.Get)('onboarding'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "listOnboarding", null);
__decorate([
    (0, common_1.Get)('onboarding/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getOnboarding", null);
__decorate([
    (0, common_1.Patch)('onboarding/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateOnboarding", null);
__decorate([
    (0, common_1.Post)('onboarding/:id/submit'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "submitOnboarding", null);
__decorate([
    (0, common_1.Post)('onboarding/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "approveOnboarding", null);
__decorate([
    (0, common_1.Post)('onboarding/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "rejectOnboarding", null);
__decorate([
    (0, common_1.Post)('onboarding/:id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "completeOnboarding", null);
__decorate([
    (0, common_1.Post)('feature-flags'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createFeatureFlag", null);
__decorate([
    (0, common_1.Get)('feature-flags'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "listFeatureFlags", null);
__decorate([
    (0, common_1.Get)('feature-flags/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getFeatureFlag", null);
__decorate([
    (0, common_1.Patch)('feature-flags/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateFeatureFlag", null);
__decorate([
    (0, common_1.Delete)('feature-flags/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteFeatureFlag", null);
__decorate([
    (0, common_1.Post)('feature-flags/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "toggleFeatureFlag", null);
__decorate([
    (0, common_1.Post)('incidents'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createIncident", null);
__decorate([
    (0, common_1.Get)('incidents'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('severity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "listIncidents", null);
__decorate([
    (0, common_1.Get)('incidents/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getIncidentStats", null);
__decorate([
    (0, common_1.Get)('incidents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getIncident", null);
__decorate([
    (0, common_1.Patch)('incidents/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateIncident", null);
__decorate([
    (0, common_1.Post)('incidents/:id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "assignIncident", null);
__decorate([
    (0, common_1.Get)('security'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getSecurityConfig", null);
__decorate([
    (0, common_1.Post)('security'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "setSecurityConfig", null);
__decorate([
    (0, common_1.Delete)('security/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteSecurityConfig", null);
__decorate([
    (0, common_1.Post)('secrets'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createSecret", null);
__decorate([
    (0, common_1.Get)('secrets'),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "listSecrets", null);
__decorate([
    (0, common_1.Get)('secrets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getSecret", null);
__decorate([
    (0, common_1.Patch)('secrets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateSecret", null);
__decorate([
    (0, common_1.Delete)('secrets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteSecret", null);
__decorate([
    (0, common_1.Post)('secrets/:id/rotate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "rotateSecret", null);
__decorate([
    (0, common_1.Get)('kyc-overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getKycOverview", null);
__decorate([
    (0, common_1.Get)('payment-transactions'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getPaymentTransactions", null);
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)('risk-rules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getRiskRules", null);
__decorate([
    (0, common_1.Post)('risk-rules'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createRiskRule", null);
__decorate([
    (0, common_1.Patch)('risk-rules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateRiskRule", null);
__decorate([
    (0, common_1.Delete)('risk-rules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteRiskRule", null);
__decorate([
    (0, common_1.Get)('financial-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getFinancialConfig", null);
__decorate([
    (0, common_1.Patch)('financial-config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateFinancialConfig", null);
__decorate([
    (0, common_1.Get)('disputes'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getDisputes", null);
__decorate([
    (0, common_1.Patch)('disputes/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Get)('system-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getSystemConfig", null);
__decorate([
    (0, common_1.Patch)('system-config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateSystemConfig", null);
__decorate([
    (0, common_1.Post)('backup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "triggerBackup", null);
__decorate([
    (0, common_1.Get)('backups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "listBackups", null);
__decorate([
    (0, common_1.Get)('backups/:filename/download'),
    (0, common_1.Header)('Content-Type', 'application/gzip'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="backup.sql.gz"'),
    __param(0, (0, common_1.Param)('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "downloadBackup", null);
__decorate([
    (0, common_1.Delete)('backups/:filename'),
    __param(0, (0, common_1.Param)('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteBackup", null);
__decorate([
    (0, common_1.Post)('backups/:filename/restore'),
    __param(0, (0, common_1.Param)('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "restoreBackup", null);
__decorate([
    (0, common_1.Post)('backups/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (0, path_1.join)(process.cwd(), 'storage', 'backups'),
            filename: (_req, file, cb) => {
                const timestamp = Date.now();
                const originalName = file.originalname.replace(/\s+/g, '_');
                cb(null, `${timestamp}-${originalName}`);
            },
        }),
        limits: { fileSize: 500 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.originalname.endsWith('.sql.gz') && !file.originalname.endsWith('.sql')) {
                cb(new common_1.BadRequestException('Only .sql.gz and .sql files are allowed'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "uploadBackup", null);
__decorate([
    (0, common_1.Get)('role-permissions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getRolePermissions", null);
__decorate([
    (0, common_1.Put)('role-permissions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateRolePermissions", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, common_1.Controller)('api/v1/admin/super'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [super_admin_service_1.SuperAdminService])
], SuperAdminController);
//# sourceMappingURL=super-admin.controller.js.map