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
exports.FeePotsController = void 0;
const common_1 = require("@nestjs/common");
const fee_pot_service_1 = require("../services/fee-pot.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
let FeePotsController = class FeePotsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getPots() {
        return this.service.getPots();
    }
    async getMyFeeSummary(user) {
        return this.service.getScopedFeeSummary({
            organizationId: user?.organizationId,
            apexOrgId: user?.apexOrgId,
        });
    }
    async listBanks() {
        return this.service.listBanks();
    }
    async getFeeShareLedger() {
        return this.service.getFeeShareLedger();
    }
    async withdrawShare(user) {
        return this.service.withdrawShare({
            userId: user?.sub,
            role: user?.role,
            organizationId: user?.organizationId,
            apexOrgId: user?.apexOrgId,
        });
    }
    async withdrawAdmin(userId, dto) {
        return this.service.withdrawAdmin({ ...dto, userId });
    }
    async requestPlatformWithdrawal(userId, dto) {
        return this.service.requestPlatformWithdrawal(userId, dto);
    }
    async getWithdrawalRequests() {
        return this.service.getWithdrawalRequests();
    }
    async approveWithdrawal(id, userId, dto) {
        return this.service.approveWithdrawal(id, userId, dto);
    }
    async rejectWithdrawal(id) {
        return this.service.rejectWithdrawal(id);
    }
};
exports.FeePotsController = FeePotsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.APEX_BUSINESS_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "getPots", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.APEX_BUSINESS_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "getMyFeeSummary", null);
__decorate([
    (0, common_1.Get)('banks'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "listBanks", null);
__decorate([
    (0, common_1.Get)('ledger'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.APEX_BUSINESS_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "getFeeShareLedger", null);
__decorate([
    (0, common_1.Post)('withdraw/share'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.APEX_BUSINESS_MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "withdrawShare", null);
__decorate([
    (0, common_1.Post)('withdraw/admin'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "withdrawAdmin", null);
__decorate([
    (0, common_1.Post)('withdraw/platform/request'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ACCOUNTANT),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "requestPlatformWithdrawal", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.ACCOUNTANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "getWithdrawalRequests", null);
__decorate([
    (0, common_1.Patch)('withdrawals/:id/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "approveWithdrawal", null);
__decorate([
    (0, common_1.Patch)('withdrawals/:id/reject'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeePotsController.prototype, "rejectWithdrawal", null);
exports.FeePotsController = FeePotsController = __decorate([
    (0, common_1.Controller)('api/v1/ledger/fee-pots'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [fee_pot_service_1.FeePotService])
], FeePotsController);
//# sourceMappingURL=fee-pots.controller.js.map