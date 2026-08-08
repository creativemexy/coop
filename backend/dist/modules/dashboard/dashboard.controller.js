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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let DashboardController = class DashboardController {
    service;
    constructor(service) {
        this.service = service;
    }
    superAdmin() {
        return this.service.getSuperAdminDashboard();
    }
    admin(apexOrgId) {
        return this.service.getAdminDashboard(apexOrgId);
    }
    accountant(organizationId) {
        return this.service.getAccountantDashboard(organizationId);
    }
    businessManager(organizationId) {
        return this.service.getBusinessManagerDashboard(organizationId);
    }
    businessManagerBank(organizationId, dto) {
        return this.service.updateBusinessManagerOrgBank(organizationId, dto);
    }
    businessManagerMemberFinancials(bmUserId, memberId) {
        return this.service.getMemberFinancials(bmUserId, memberId);
    }
    businessManagerMemberTransactions(bmUserId) {
        return this.service.getBusinessManagerMemberTransactions(bmUserId);
    }
    bnplManager(organizationId) {
        return this.service.getBnplManagerDashboard(organizationId);
    }
    individual(userId) {
        return this.service.getIndividualDashboard(userId);
    }
    individualTransactions(userId) {
        return this.service.getUnifiedTransactions(userId);
    }
    memberStatement(userId) {
        return this.service.getMemberStatement(userId);
    }
    async exportMemberStatement(res, userId) {
        const csv = await this.service.exportMemberStatementCsv(userId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="member-statement.csv"');
        res.send(csv);
    }
    repaymentSchedule(userId) {
        return this.service.getRepaymentSchedule(userId);
    }
    memberTickets(userId) {
        return this.service.getMemberTickets(userId);
    }
    createMemberTicket(userId, dto) {
        return this.service.createMemberTicket({ ...dto, createdBy: userId });
    }
    memberTicketMessages(id, userId) {
        return this.service.getMemberTicketMessages(id, userId);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('super-admin'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "superAdmin", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.OPERATIONAL_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('apexOrgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "admin", null);
__decorate([
    (0, common_1.Get)('accountant'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ACCOUNTANT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "accountant", null);
__decorate([
    (0, common_1.Get)('business-manager'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "businessManager", null);
__decorate([
    (0, common_1.Patch)('business-manager/bank'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('organizationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "businessManagerBank", null);
__decorate([
    (0, common_1.Get)('business-manager/members/:id/financials'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "businessManagerMemberFinancials", null);
__decorate([
    (0, common_1.Get)('business-manager/members/transactions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "businessManagerMemberTransactions", null);
__decorate([
    (0, common_1.Get)('bnpl-manager'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "bnplManager", null);
__decorate([
    (0, common_1.Get)('individual'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "individual", null);
__decorate([
    (0, common_1.Get)('individual/transactions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "individualTransactions", null);
__decorate([
    (0, common_1.Get)('individual/statement'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "memberStatement", null);
__decorate([
    (0, common_1.Get)('individual/statement/export'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "exportMemberStatement", null);
__decorate([
    (0, common_1.Get)('individual/repayments'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "repaymentSchedule", null);
__decorate([
    (0, common_1.Get)('individual/tickets'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "memberTickets", null);
__decorate([
    (0, common_1.Post)('individual/tickets'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "createMemberTicket", null);
__decorate([
    (0, common_1.Get)('individual/tickets/:id/messages'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "memberTicketMessages", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('api/v1/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map