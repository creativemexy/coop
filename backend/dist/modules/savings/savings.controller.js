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
exports.SavingsController = void 0;
const common_1 = require("@nestjs/common");
const savings_service_1 = require("./savings.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const kyc_guard_1 = require("../../common/guards/kyc.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let SavingsController = class SavingsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getAccount(userId) {
        const account = await this.service.getAccount(userId);
        const withdrawalsEnabled = await this.service.areWithdrawalsEnabled();
        return { ...account, withdrawalsEnabled };
    }
    async getTransactions(userId) {
        return this.service.getTransactions(userId);
    }
    async deposit(userId, dto) {
        return this.service.deposit(userId, dto.amount, dto.description, dto.type);
    }
    async withdraw(userId, dto) {
        return this.service.withdraw(userId, dto.amount, dto.description, dto.type);
    }
    async setTarget(userId, dto) {
        return this.service.setTarget(userId, dto.targetAmount);
    }
};
exports.SavingsController = SavingsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "getAccount", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)('deposit'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "deposit", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    (0, common_1.UseGuards)(kyc_guard_1.KycGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Post)('target'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SavingsController.prototype, "setTarget", null);
exports.SavingsController = SavingsController = __decorate([
    (0, common_1.Controller)('api/v1/savings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [savings_service_1.SavingsService])
], SavingsController);
//# sourceMappingURL=savings.controller.js.map