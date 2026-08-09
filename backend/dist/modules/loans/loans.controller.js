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
exports.LoansController = void 0;
const common_1 = require("@nestjs/common");
const loans_service_1 = require("./loans.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const kyc_guard_1 = require("../../common/guards/kyc.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let LoansController = class LoansController {
    service;
    constructor(service) {
        this.service = service;
    }
    apply(userId, dto) {
        return this.service.apply(userId, dto);
    }
    eligibility(userId) {
        return this.service.checkEligibility(userId);
    }
    findStage(stage, reviewer) {
        return this.service.getStageLoans(stage || 'apex', reviewer);
    }
    findPending() {
        return this.service.findPending();
    }
    findDefaulted() {
        return this.service.getDefaultedLoans();
    }
    findAll(userId) {
        return this.service.findByUser(userId);
    }
    findOne(userId, id) {
        return this.service.findOne(id, userId);
    }
    approveApex(reviewer, loanId) {
        return this.service.approveApex(loanId, reviewer);
    }
    approveOrg(reviewer, loanId) {
        return this.service.approveOrganization(loanId, reviewer);
    }
    approveAdmin(reviewer, loanId) {
        return this.service.approveFinal(loanId, reviewer);
    }
    disburse(reviewer, loanId) {
        return this.service.disburse(loanId, reviewer);
    }
    reject(reviewer, loanId, dto) {
        return this.service.reject(loanId, reviewer.sub, dto?.reason);
    }
};
exports.LoansController = LoansController;
__decorate([
    (0, common_1.Post)('apply'),
    (0, common_1.UseGuards)(kyc_guard_1.KycGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "apply", null);
__decorate([
    (0, common_1.Get)('eligibility'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "eligibility", null);
__decorate([
    (0, common_1.Get)('stage'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APEX_BUSINESS_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('stage')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "findStage", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "findPending", null);
__decorate([
    (0, common_1.Get)('defaulted'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "findDefaulted", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL, role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.APEX_BUSINESS_MANAGER, role_enum_1.Role.OPERATIONAL_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL, role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.APEX_BUSINESS_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':loanId/apex-approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APEX_BUSINESS_MANAGER, role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "approveApex", null);
__decorate([
    (0, common_1.Post)(':loanId/org-approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "approveOrg", null);
__decorate([
    (0, common_1.Post)(':loanId/admin-approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "approveAdmin", null);
__decorate([
    (0, common_1.Post)(':loanId/disburse'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "disburse", null);
__decorate([
    (0, common_1.Post)(':loanId/reject'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APEX_BUSINESS_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.LOAN_MANAGER, role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('loanId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], LoansController.prototype, "reject", null);
exports.LoansController = LoansController = __decorate([
    (0, common_1.Controller)('api/v1/loans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [loans_service_1.LoansService])
], LoansController);
//# sourceMappingURL=loans.controller.js.map