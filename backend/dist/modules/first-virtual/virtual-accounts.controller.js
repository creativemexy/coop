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
exports.VirtualAccountsController = void 0;
const common_1 = require("@nestjs/common");
const virtual_accounts_service_1 = require("./virtual-accounts.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
let VirtualAccountsController = class VirtualAccountsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getMine(userId) {
        const account = await this.service.getForUser(userId);
        if (!account) {
            return null;
        }
        return {
            id: account.id,
            accountNumber: account.accountNumber,
            accountName: account.accountName,
            bankName: account.bankName,
            status: account.status,
            provider: account.provider,
        };
    }
    async initiateDeposit(userId, body) {
        const type = body.type === 'goal' ? 'goal' : 'general';
        if (body.amount === undefined || body.amount === null) {
            throw new common_1.BadRequestException('Amount is required');
        }
        const deposit = await this.service.initiateDeposit(userId, body.amount, type);
        return this.toDto(deposit);
    }
    async getLatestDeposit(userId) {
        const deposit = await this.service.findMyPending(userId);
        if (!deposit) {
            return null;
        }
        return this.toDto(deposit);
    }
    async verifyDeposit(userId, depositId) {
        const deposit = await this.service.verifyDeposit(userId, depositId);
        return this.toDto(deposit);
    }
    async initiateLoanRepayment(userId, repaymentId) {
        const pending = await this.service.initiateLoanRepayment(userId, repaymentId);
        return this.toDto(pending);
    }
    async getLoanRepaymentInstruction(userId, repaymentId) {
        const pending = await this.service.findLoanRepaymentInstruction(userId, repaymentId);
        return pending ? this.toDto(pending) : null;
    }
    async verifyLoanRepayment(userId, repaymentId) {
        const pending = await this.service.verifyLoanRepayment(userId, repaymentId);
        return this.toDto(pending);
    }
    toDto(deposit) {
        return {
            id: deposit.id,
            amount: Number(deposit.amount),
            type: deposit.type,
            reference: deposit.reference,
            accountNumber: deposit.accountNumber,
            accountName: deposit.accountName,
            bankName: deposit.bankName,
            status: deposit.status,
            expiresAt: deposit.expiresAt,
            creditedAt: deposit.creditedAt,
        };
    }
};
exports.VirtualAccountsController = VirtualAccountsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VirtualAccountsController.prototype, "getMine", null);
__decorate([
    (0, common_1.Post)('deposits/initiate'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VirtualAccountsController.prototype, "initiateDeposit", null);
__decorate([
    (0, common_1.Get)('deposits/latest'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VirtualAccountsController.prototype, "getLatestDeposit", null);
__decorate([
    (0, common_1.Post)('deposits/:id/verify'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VirtualAccountsController.prototype, "verifyDeposit", null);
__decorate([
    (0, common_1.Post)('loan-repayments/:repaymentId/initiate'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('repaymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VirtualAccountsController.prototype, "initiateLoanRepayment", null);
__decorate([
    (0, common_1.Get)('loan-repayments/:repaymentId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('repaymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VirtualAccountsController.prototype, "getLoanRepaymentInstruction", null);
__decorate([
    (0, common_1.Post)('loan-repayments/:repaymentId/verify'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('repaymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VirtualAccountsController.prototype, "verifyLoanRepayment", null);
exports.VirtualAccountsController = VirtualAccountsController = __decorate([
    (0, common_1.Controller)('api/v1/virtual-accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [virtual_accounts_service_1.VirtualAccountsService])
], VirtualAccountsController);
//# sourceMappingURL=virtual-accounts.controller.js.map