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
exports.RepaymentController = void 0;
const common_1 = require("@nestjs/common");
const repayment_service_1 = require("../services/repayment.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
let RepaymentController = class RepaymentController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSchedule(orderId) {
        return this.service.getRepaymentSchedule(orderId);
    }
    async safeRetry(installmentId, userId) {
        return this.service.safeRetry(installmentId, userId);
    }
    async reconcile(installmentId, dto, userId) {
        return this.service.reconcile(installmentId, {
            status: dto.status,
            paymentReference: dto.paymentReference,
            paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
            note: dto.note,
        }, userId);
    }
    async updateMetadata(installmentId, dto, userId) {
        return this.service.updateMetadata(installmentId, dto, userId);
    }
    async partialPayment(installmentId, dto, userId) {
        return this.service.handlePartialPayment(installmentId, dto.amount, dto.paymentReference, userId);
    }
};
exports.RepaymentController = RepaymentController;
__decorate([
    (0, common_1.Get)('schedule/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RepaymentController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Post)(':installmentId/retry'),
    __param(0, (0, common_1.Param)('installmentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RepaymentController.prototype, "safeRetry", null);
__decorate([
    (0, common_1.Post)(':installmentId/reconcile'),
    __param(0, (0, common_1.Param)('installmentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], RepaymentController.prototype, "reconcile", null);
__decorate([
    (0, common_1.Patch)(':installmentId/metadata'),
    __param(0, (0, common_1.Param)('installmentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], RepaymentController.prototype, "updateMetadata", null);
__decorate([
    (0, common_1.Post)(':installmentId/partial-payment'),
    __param(0, (0, common_1.Param)('installmentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], RepaymentController.prototype, "partialPayment", null);
exports.RepaymentController = RepaymentController = __decorate([
    (0, common_1.Controller)('api/v1/bnpl/repayments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [repayment_service_1.RepaymentService])
], RepaymentController);
//# sourceMappingURL=repayment.controller.js.map