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
exports.BusinessManagerController = void 0;
const common_1 = require("@nestjs/common");
const business_manager_service_1 = require("./business-manager.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const mask_util_1 = require("../../common/mask.util");
let BusinessManagerController = class BusinessManagerController {
    service;
    constructor(service) {
        this.service = service;
    }
    async lookupOrder(reference, organizationId) {
        return this.service.lookupOrder(reference, organizationId);
    }
    async getWebhookStatus(limit, offset, organizationId) {
        return this.service.getWebhookStatus(limit ? parseInt(limit, 10) : 20, offset ? parseInt(offset, 10) : 0, organizationId);
    }
    async resubmitWebhook(paymentId, userId, organizationId) {
        return this.service.resubmitWebhook(paymentId, organizationId, userId);
    }
    async getLogs(type, limit, offset, organizationId) {
        const logs = await this.service.getLogs(type || 'all', limit ? parseInt(limit, 10) : 50, offset ? parseInt(offset, 10) : 0, organizationId);
        return {
            ...logs,
            smsLogs: logs.smsLogs.map((l) => ({ ...l, recipient: (0, mask_util_1.maskPhone)(l.recipient) })),
        };
    }
    async markInstallmentAsPaid(dto, user) {
        const userId = user.sub;
        const role = user.role;
        const organizationId = user.organizationId;
        return this.service.markInstallmentAsPaidOrRequestApproval(dto.installmentId, dto.providerReference, userId, role, organizationId, dto.reason);
    }
};
exports.BusinessManagerController = BusinessManagerController;
__decorate([
    (0, common_1.Get)('orders/lookup/:reference'),
    __param(0, (0, common_1.Param)('reference')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BusinessManagerController.prototype, "lookupOrder", null);
__decorate([
    (0, common_1.Get)('webhooks/status'),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('offset')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BusinessManagerController.prototype, "getWebhookStatus", null);
__decorate([
    (0, common_1.Post)('webhooks/resubmit/:paymentId'),
    __param(0, (0, common_1.Param)('paymentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BusinessManagerController.prototype, "resubmitWebhook", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], BusinessManagerController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Post)('installments/mark-paid'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BusinessManagerController.prototype, "markInstallmentAsPaid", null);
exports.BusinessManagerController = BusinessManagerController = __decorate([
    (0, common_1.Controller)('api/v1/business-manager'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPERVISOR, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [business_manager_service_1.BusinessManagerService])
], BusinessManagerController);
//# sourceMappingURL=business-manager.controller.js.map