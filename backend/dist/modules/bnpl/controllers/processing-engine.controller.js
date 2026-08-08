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
exports.ProcessingEngineController = void 0;
const common_1 = require("@nestjs/common");
const processing_engine_service_1 = require("../services/processing-engine.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
let ProcessingEngineController = class ProcessingEngineController {
    service;
    constructor(service) {
        this.service = service;
    }
    async createPaymentIntent(subscriptionId, idempotencyKey) {
        return this.service.createPaymentIntent(subscriptionId, idempotencyKey);
    }
    async disburse(subscriptionId, dto) {
        return this.service.executeDisbursement(subscriptionId, dto.disbursementReference, dto.idempotencyKey);
    }
    async getSteps(subscriptionId) {
        return this.service.getProcessingSteps(subscriptionId);
    }
    async retryStep(stepId) {
        return this.service.retryStep(stepId);
    }
};
exports.ProcessingEngineController = ProcessingEngineController;
__decorate([
    (0, common_1.Post)(':subscriptionId/payment-intent'),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __param(1, (0, common_1.Body)('idempotencyKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcessingEngineController.prototype, "createPaymentIntent", null);
__decorate([
    (0, common_1.Post)(':subscriptionId/disburse'),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProcessingEngineController.prototype, "disburse", null);
__decorate([
    (0, common_1.Get)(':subscriptionId/steps'),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProcessingEngineController.prototype, "getSteps", null);
__decorate([
    (0, common_1.Post)('steps/:stepId/retry'),
    __param(0, (0, common_1.Param)('stepId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProcessingEngineController.prototype, "retryStep", null);
exports.ProcessingEngineController = ProcessingEngineController = __decorate([
    (0, common_1.Controller)('api/v1/bnpl/processing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [processing_engine_service_1.ProcessingEngineService])
], ProcessingEngineController);
//# sourceMappingURL=processing-engine.controller.js.map