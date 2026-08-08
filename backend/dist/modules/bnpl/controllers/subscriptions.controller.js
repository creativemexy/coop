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
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const subscriptions_service_1 = require("../services/subscriptions.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const kyc_guard_1 = require("../../../common/guards/kyc.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
let SubscriptionsController = class SubscriptionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async subscribe(dto, userId) {
        return this.service.subscribe(userId, dto.planId);
    }
    async findMySubscriptions(user) {
        if (user.role === role_enum_1.Role.INDIVIDUAL) {
            return this.service.findByUser(user.sub);
        }
        if (user.organizationId) {
            return this.service.findByOrg(user.organizationId);
        }
        return [];
    }
    async listOrders(status, payoutStatus, search, product, tenor, dateFrom, dateTo) {
        return this.service.listOrders({
            status,
            payoutStatus,
            search,
            product,
            tenor: tenor ? parseInt(tenor, 10) : undefined,
            dateFrom,
            dateTo,
        });
    }
    async getOrderPayments(id) {
        return this.service.getOrderPayments(id);
    }
    async updateOrderStatus(id, dto, userId) {
        return this.service.updateOrderStatus(id, dto.status, userId, dto.reason);
    }
    async markDisbursed(id, dto, userId) {
        return this.service.markDisbursed(id, dto.disbursementReference, userId, dto.reason);
    }
    async markSettled(id, dto, userId) {
        return this.service.markSettled(id, userId, dto?.reason);
    }
    async searchUsers(query) {
        return this.service.searchUsers(query);
    }
    async findById(id) {
        return this.service.findById(id);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.INDIVIDUAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "findMySubscriptions", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('payoutStatus')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('product')),
    __param(4, (0, common_1.Query)('tenor')),
    __param(5, (0, common_1.Query)('dateFrom')),
    __param(6, (0, common_1.Query)('dateTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id/payments'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getOrderPayments", null);
__decorate([
    (0, common_1.Patch)('orders/:id/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Patch)('orders/:id/disburse'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "markDisbursed", null);
__decorate([
    (0, common_1.Patch)('orders/:id/settle'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "markSettled", null);
__decorate([
    (0, common_1.Get)('search-users'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "findById", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('api/v1/bnpl/subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, kyc_guard_1.KycGuard),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map