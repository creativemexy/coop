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
exports.AccountantController = void 0;
const common_1 = require("@nestjs/common");
const accountant_service_1 = require("./accountant.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const reconciliation_result_entity_1 = require("./entities/reconciliation-result.entity");
const adjustment_request_entity_1 = require("./entities/adjustment-request.entity");
let AccountantController = class AccountantController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async getOrderLedger(orgId, days) {
        return this.svc.getOrderLedger(orgId, days ? Number(days) : undefined);
    }
    async exportOrderLedger(orgId = '', days = '', res) {
        const csv = await this.svc.exportOrderLedgerCsv(orgId || undefined, days ? Number(days) : undefined);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bnpl-order-ledger.csv"');
        res.send(csv);
    }
    async getInstallmentLedger(orgId, days) {
        return this.svc.getInstallmentLedger(orgId, days ? Number(days) : undefined);
    }
    async exportInstallmentLedger(orgId = '', days = '', res) {
        const csv = await this.svc.exportInstallmentLedgerCsv(orgId || undefined, days ? Number(days) : undefined);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bnpl-installment-ledger.csv"');
        res.send(csv);
    }
    async getPaymentReferences(orgId, days) {
        return this.svc.getPaymentReferences(orgId, days ? Number(days) : undefined);
    }
    async exportPaymentReferences(orgId = '', days = '', res) {
        const csv = await this.svc.exportPaymentReferencesCsv(orgId || undefined, days ? Number(days) : undefined);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bnpl-payment-references.csv"');
        res.send(csv);
    }
    async getSettlementReferences(orgId, days) {
        return this.svc.getSettlementReferences(orgId, days ? Number(days) : undefined);
    }
    async exportSettlementReferences(orgId = '', days = '', res) {
        const csv = await this.svc.exportSettlementReferencesCsv(orgId || undefined, days ? Number(days) : undefined);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="bnpl-settlement-references.csv"');
        res.send(csv);
    }
    async getTenants() {
        return this.svc.getTenants();
    }
    async runReconciliation(dto, user) {
        return this.svc.runReconciliation({ ...dto, runBy: user.sub });
    }
    async getReconciliationRuns(orgId) {
        return this.svc.getReconciliationRuns(orgId);
    }
    async getReconciliationRun(id) {
        return this.svc.getReconciliationRun(id);
    }
    async getReconciliationResults(runId, status) {
        return this.svc.getReconciliationResults(runId, status);
    }
    async updateReconciliationResult(id, dto) {
        return this.svc.updateReconciliationResult(id, dto);
    }
    async exportReconciliation(runId, res) {
        const csv = await this.svc.exportReconciliationCsv(runId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="reconciliation-${runId.slice(0, 8)}.csv"`);
        res.send(csv);
    }
    async createAdjustment(dto, user) {
        return this.svc.createAdjustmentRequest({ ...dto, requestedBy: user.sub });
    }
    async listAdjustments(status) {
        return this.svc.listAdjustmentRequests(status);
    }
    async getAdjustment(id) {
        return this.svc.getAdjustmentRequest(id);
    }
    async approveAdjustment(id, user) {
        return this.svc.approveAdjustmentRequest(id, user.sub);
    }
    async rejectAdjustment(id, dto, user) {
        return this.svc.rejectAdjustmentRequest(id, user.sub, dto.reason);
    }
    async getMemberStatement(userId, days) {
        return this.svc.getMemberStatement(userId, days ? Number(days) : undefined);
    }
    async exportMemberStatement(userId, res) {
        const csv = await this.svc.exportMemberStatementCsv(userId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="member-statement-${userId.slice(0, 8)}.csv"`);
        res.send(csv);
    }
    async getCooperativeStatement(orgId, days) {
        return this.svc.getCooperativeStatement(orgId, days ? Number(days) : undefined);
    }
    async exportCooperativeStatement(orgId, res) {
        const csv = await this.svc.exportCooperativeStatementCsv(orgId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="cooperative-statement-${orgId.slice(0, 8)}.csv"`);
        res.send(csv);
    }
    async getTransactionRegister(source, days, limit, offset) {
        return this.svc.getTransactionRegister({
            source,
            days: days ? Number(days) : undefined,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }
    async exportTransactionRegister(res, source, days) {
        const csv = await this.svc.exportTransactionRegisterCsv({ source, days: days ? Number(days) : undefined });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="transaction-register.csv"');
        res.send(csv);
    }
    async getFinancialAudit(days, action, limit) {
        return this.svc.getFinancialAuditLog(days ? Number(days) : undefined, action, limit ? Number(limit) : undefined);
    }
    async getDashboard() {
        return this.svc.getDashboard();
    }
};
exports.AccountantController = AccountantController;
__decorate([
    (0, common_1.Get)('bnpl/orders'),
    __param(0, (0, common_1.Query)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getOrderLedger", null);
__decorate([
    (0, common_1.Get)('bnpl/orders/export'),
    __param(0, (0, common_1.Query)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "exportOrderLedger", null);
__decorate([
    (0, common_1.Get)('bnpl/installments'),
    __param(0, (0, common_1.Query)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getInstallmentLedger", null);
__decorate([
    (0, common_1.Get)('bnpl/installments/export'),
    __param(0, (0, common_1.Query)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "exportInstallmentLedger", null);
__decorate([
    (0, common_1.Get)('bnpl/payments'),
    __param(0, (0, common_1.Query)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getPaymentReferences", null);
__decorate([
    (0, common_1.Get)('bnpl/payments/export'),
    __param(0, (0, common_1.Query)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "exportPaymentReferences", null);
__decorate([
    (0, common_1.Get)('bnpl/settlements'),
    __param(0, (0, common_1.Query)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getSettlementReferences", null);
__decorate([
    (0, common_1.Get)('bnpl/settlements/export'),
    __param(0, (0, common_1.Query)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "exportSettlementReferences", null);
__decorate([
    (0, common_1.Get)('tenants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getTenants", null);
__decorate([
    (0, common_1.Post)('reconciliation/run'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "runReconciliation", null);
__decorate([
    (0, common_1.Get)('reconciliation/runs'),
    __param(0, (0, common_1.Query)('orgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getReconciliationRuns", null);
__decorate([
    (0, common_1.Get)('reconciliation/runs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getReconciliationRun", null);
__decorate([
    (0, common_1.Get)('reconciliation/results'),
    __param(0, (0, common_1.Query)('runId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getReconciliationResults", null);
__decorate([
    (0, common_1.Patch)('reconciliation/results/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "updateReconciliationResult", null);
__decorate([
    (0, common_1.Get)('reconciliation/export/:runId'),
    __param(0, (0, common_1.Param)('runId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "exportReconciliation", null);
__decorate([
    (0, common_1.Post)('adjustments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "createAdjustment", null);
__decorate([
    (0, common_1.Get)('adjustments'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "listAdjustments", null);
__decorate([
    (0, common_1.Get)('adjustments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getAdjustment", null);
__decorate([
    (0, common_1.Post)('adjustments/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "approveAdjustment", null);
__decorate([
    (0, common_1.Post)('adjustments/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "rejectAdjustment", null);
__decorate([
    (0, common_1.Get)('statements/member/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getMemberStatement", null);
__decorate([
    (0, common_1.Get)('statements/member/:userId/export'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "exportMemberStatement", null);
__decorate([
    (0, common_1.Get)('statements/cooperative/:orgId'),
    __param(0, (0, common_1.Param)('orgId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getCooperativeStatement", null);
__decorate([
    (0, common_1.Get)('statements/cooperative/:orgId/export'),
    __param(0, (0, common_1.Param)('orgId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "exportCooperativeStatement", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)('source')),
    __param(1, (0, common_1.Query)('days')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getTransactionRegister", null);
__decorate([
    (0, common_1.Get)('transactions/export'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('source')),
    __param(2, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "exportTransactionRegister", null);
__decorate([
    (0, common_1.Get)('audit/financial'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getFinancialAudit", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccountantController.prototype, "getDashboard", null);
exports.AccountantController = AccountantController = __decorate([
    (0, common_1.Controller)('api/v1/accountant'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [accountant_service_1.AccountantService])
], AccountantController);
//# sourceMappingURL=accountant.controller.js.map