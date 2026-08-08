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
exports.InvestmentsController = void 0;
const common_1 = require("@nestjs/common");
const investments_service_1 = require("./investments.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const kyc_guard_1 = require("../../common/guards/kyc.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let InvestmentsController = class InvestmentsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async listProducts(type, riskTier) {
        return this.svc.listProducts({ type, riskTier, isOpen: true });
    }
    async getProduct(id) {
        return this.svc.getProduct(id);
    }
    async placeOrder(userId, dto) {
        return this.svc.placeOrder(userId, dto);
    }
    async myOrders(userId) {
        return this.svc.getMyOrders(userId);
    }
    async confirmPayment(id, dto) {
        return this.svc.confirmPayment(id, dto.paymentReference, dto.paymentId);
    }
    async myHoldings(userId) {
        return this.svc.getMyHoldings(userId);
    }
    async portfolioSummary(userId) {
        return this.svc.getPortfolioSummary(userId);
    }
    async listDistributions(productId) {
        return this.svc.getDistributions(productId);
    }
    async myDistributions(userId) {
        return this.svc.getMyDistributionHistory(userId);
    }
    async pendingDistributions(userId) {
        return this.svc.getPendingDistributions(userId);
    }
    async requestRedemption(userId, dto) {
        return this.svc.requestRedemption(userId, dto);
    }
    async myRedemptions(userId) {
        return this.svc.getMyRedemptions(userId);
    }
    async compliance(userId, productId) {
        return this.svc.getCompliance(userId, productId);
    }
    async createProduct(dto, userId) {
        return this.svc.createProduct({ ...dto, type: dto.type, riskTier: dto.riskTier, distributionFrequency: dto.distributionFrequency, createdBy: userId });
    }
    async updateProduct(id, dto, userId) {
        const changeSummary = dto.changeSummary || '';
        delete dto.changeSummary;
        return this.svc.updateProduct(id, dto, userId);
    }
    async setProductStatus(id, dto, userId) {
        return this.svc.setProductStatus(id, dto.status, userId);
    }
    async adminListProducts(type, riskTier, status) {
        return this.svc.listAllProducts({ type, riskTier, status });
    }
    async getProductVersions(id) {
        return this.svc.getProductVersions(id);
    }
    async getEligibility(id) {
        return this.svc.getEligibilityRules(id);
    }
    async updateEligibility(id, dto) {
        return this.svc.updateEligibilityRules(id, dto);
    }
    async setCapacity(id, dto) {
        return this.svc.setCapacity(id, dto);
    }
    async createIssuanceCycle(id, dto, userId) {
        return this.svc.createIssuanceCycle(id, { ...dto, createdBy: userId });
    }
    async getIssuanceCycles(id) {
        return this.svc.getIssuanceCycles(id);
    }
    async approveIssuanceCycle(cycleId, userId) {
        return this.svc.approveIssuanceCycle(cycleId, userId);
    }
    async listAllIssuanceCycles() {
        return this.svc.listAllIssuanceCycles();
    }
    async statement(userId) {
        return this.svc.getInvestmentStatement(userId);
    }
    async getPricingConfig(id) {
        return this.svc.getPricingConfig(id);
    }
    async updatePricingConfig(id, dto) {
        return this.svc.updatePricingConfig(id, dto);
    }
    async recordNavSnapshot(id, dto, userId) {
        return this.svc.recordNavSnapshot(id, dto, userId);
    }
    async getNavSnapshots(id) {
        return this.svc.getNavSnapshots(id);
    }
    async createCorporateAction(id, dto, userId) {
        return this.svc.createCorporateAction(id, dto, userId);
    }
    async listCorporateActions(productId) {
        return this.svc.listCorporateActions(productId);
    }
    async listProductCorporateActions(id) {
        return this.svc.listCorporateActions(id);
    }
    async approveCorporateAction(actionId, userId) {
        return this.svc.approveCorporateAction(actionId, userId);
    }
    async executeCorporateAction(actionId, userId) {
        return this.svc.executeCorporateAction(actionId, userId);
    }
    async createDistribution(dto, userId) {
        return this.svc.createDistribution(dto, userId);
    }
    async listAdminDistributions(productId) {
        return this.svc.listAllAdminDistributions(productId);
    }
    async submitDistribution(id) {
        return this.svc.submitDistributionForApproval(id);
    }
    async approveDistribution(id, userId) {
        return this.svc.approveDistribution(id, userId);
    }
    async computeDistributionRun(id, userId) {
        return this.svc.computeDistributionRun(id, userId);
    }
    async listDistributionRuns(productId) {
        return this.svc.listDistributionRuns(productId);
    }
    async approveDistributionRun(runId, userId) {
        return this.svc.approveDistributionRun(runId, userId);
    }
    async executeDistributionRun(runId, userId) {
        return this.svc.executeDistributionRun(runId, userId);
    }
    async getDistributionPayouts(id) {
        return this.svc.getDistributionPayouts(id);
    }
    async markPayoutStatus(payoutId, dto) {
        return this.svc.markPayoutStatus(payoutId, dto.isPaid);
    }
};
exports.InvestmentsController = InvestmentsController;
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('riskTier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Post)('orders'),
    (0, common_1.UseGuards)(kyc_guard_1.KycGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "placeOrder", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "myOrders", null);
__decorate([
    (0, common_1.Post)('orders/:id/confirm'),
    (0, common_1.UseGuards)(kyc_guard_1.KycGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.Get)('holdings'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "myHoldings", null);
__decorate([
    (0, common_1.Get)('portfolio'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "portfolioSummary", null);
__decorate([
    (0, common_1.Get)('distributions'),
    __param(0, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "listDistributions", null);
__decorate([
    (0, common_1.Get)('distributions/mine'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "myDistributions", null);
__decorate([
    (0, common_1.Get)('distributions/pending'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "pendingDistributions", null);
__decorate([
    (0, common_1.Post)('redemptions'),
    (0, common_1.UseGuards)(kyc_guard_1.KycGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "requestRedemption", null);
__decorate([
    (0, common_1.Get)('redemptions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "myRedemptions", null);
__decorate([
    (0, common_1.Get)('compliance'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "compliance", null);
__decorate([
    (0, common_1.Post)('admin/products'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Patch)('admin/products/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Patch)('admin/products/:id/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "setProductStatus", null);
__decorate([
    (0, common_1.Get)('admin/products'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('riskTier')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "adminListProducts", null);
__decorate([
    (0, common_1.Get)('admin/products/:id/versions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getProductVersions", null);
__decorate([
    (0, common_1.Get)('admin/products/:id/eligibility'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getEligibility", null);
__decorate([
    (0, common_1.Patch)('admin/products/:id/eligibility'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "updateEligibility", null);
__decorate([
    (0, common_1.Patch)('admin/products/:id/capacity'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "setCapacity", null);
__decorate([
    (0, common_1.Post)('admin/products/:id/issuance-cycles'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "createIssuanceCycle", null);
__decorate([
    (0, common_1.Get)('admin/products/:id/issuance-cycles'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getIssuanceCycles", null);
__decorate([
    (0, common_1.Patch)('admin/issuance-cycles/:cycleId/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "approveIssuanceCycle", null);
__decorate([
    (0, common_1.Get)('admin/issuance-cycles'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "listAllIssuanceCycles", null);
__decorate([
    (0, common_1.Get)('statement'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "statement", null);
__decorate([
    (0, common_1.Get)('admin/products/:id/pricing'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getPricingConfig", null);
__decorate([
    (0, common_1.Patch)('admin/products/:id/pricing'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "updatePricingConfig", null);
__decorate([
    (0, common_1.Post)('admin/products/:id/nav-snapshots'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "recordNavSnapshot", null);
__decorate([
    (0, common_1.Get)('admin/products/:id/nav-snapshots'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getNavSnapshots", null);
__decorate([
    (0, common_1.Post)('admin/products/:id/corporate-actions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "createCorporateAction", null);
__decorate([
    (0, common_1.Get)('admin/corporate-actions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "listCorporateActions", null);
__decorate([
    (0, common_1.Get)('admin/products/:id/corporate-actions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "listProductCorporateActions", null);
__decorate([
    (0, common_1.Patch)('admin/corporate-actions/:actionId/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('actionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "approveCorporateAction", null);
__decorate([
    (0, common_1.Post)('admin/corporate-actions/:actionId/execute'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('actionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "executeCorporateAction", null);
__decorate([
    (0, common_1.Post)('admin/distributions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "createDistribution", null);
__decorate([
    (0, common_1.Get)('admin/distributions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "listAdminDistributions", null);
__decorate([
    (0, common_1.Patch)('admin/distributions/:id/submit'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "submitDistribution", null);
__decorate([
    (0, common_1.Patch)('admin/distributions/:id/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "approveDistribution", null);
__decorate([
    (0, common_1.Post)('admin/distributions/:id/compute-run'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "computeDistributionRun", null);
__decorate([
    (0, common_1.Get)('admin/distribution-runs'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "listDistributionRuns", null);
__decorate([
    (0, common_1.Patch)('admin/distribution-runs/:runId/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('runId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "approveDistributionRun", null);
__decorate([
    (0, common_1.Post)('admin/distribution-runs/:runId/execute'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('runId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "executeDistributionRun", null);
__decorate([
    (0, common_1.Get)('admin/distributions/:id/payouts'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "getDistributionPayouts", null);
__decorate([
    (0, common_1.Patch)('admin/payouts/:payoutId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('payoutId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentsController.prototype, "markPayoutStatus", null);
exports.InvestmentsController = InvestmentsController = __decorate([
    (0, common_1.Controller)('api/v1/investments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [investments_service_1.InvestmentsService])
], InvestmentsController);
//# sourceMappingURL=investments.controller.js.map