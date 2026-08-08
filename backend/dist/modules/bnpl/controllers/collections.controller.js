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
exports.CollectionsController = void 0;
const common_1 = require("@nestjs/common");
const collections_service_1 = require("../services/collections.service");
const collection_priority_entity_1 = require("../entities/collection-priority.entity");
const exception_case_entity_1 = require("../entities/exception-case.entity");
const collection_playbook_entity_1 = require("../entities/collection-playbook.entity");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
let CollectionsController = class CollectionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getCohorts() {
        return this.service.getDelinquencyCohorts();
    }
    async assignPriority(dto, userId) {
        return this.service.assignPriority(dto.entityType, dto.entityId, dto.priority, dto.reason, userId);
    }
    async getPriorities(entityType) {
        return this.service.getPriorities(entityType);
    }
    async getExceptionReasons() {
        return this.service.getExceptionReasons();
    }
    async createExceptionCase(dto, userId) {
        return this.service.createExceptionCase({ ...dto, createdBy: userId });
    }
    async resolveExceptionCase(id, dto, userId) {
        return this.service.resolveExceptionCase(id, dto.resolution, userId);
    }
    async getExceptionCases(status, subscriptionId) {
        return this.service.getExceptionCases({ status, subscriptionId });
    }
    async getPlaybooks(triggerEvent) {
        return this.service.getPlaybooks(triggerEvent);
    }
    async getRecommendedActions(subscriptionId) {
        return this.service.getRecommendedActions(subscriptionId);
    }
    async seedPlaybooks() {
        return this.service.seedPlaybooks();
    }
};
exports.CollectionsController = CollectionsController;
__decorate([
    (0, common_1.Get)('cohorts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "getCohorts", null);
__decorate([
    (0, common_1.Post)('priority'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "assignPriority", null);
__decorate([
    (0, common_1.Get)('priorities'),
    __param(0, (0, common_1.Query)('entityType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "getPriorities", null);
__decorate([
    (0, common_1.Get)('exception-reasons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "getExceptionReasons", null);
__decorate([
    (0, common_1.Post)('exception-cases'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "createExceptionCase", null);
__decorate([
    (0, common_1.Patch)('exception-cases/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "resolveExceptionCase", null);
__decorate([
    (0, common_1.Get)('exception-cases'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "getExceptionCases", null);
__decorate([
    (0, common_1.Get)('playbooks'),
    __param(0, (0, common_1.Query)('triggerEvent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "getPlaybooks", null);
__decorate([
    (0, common_1.Get)('recommended-actions/:subscriptionId'),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "getRecommendedActions", null);
__decorate([
    (0, common_1.Post)('playbooks/seed'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CollectionsController.prototype, "seedPlaybooks", null);
exports.CollectionsController = CollectionsController = __decorate([
    (0, common_1.Controller)('api/v1/bnpl/collections'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [collections_service_1.CollectionsService])
], CollectionsController);
//# sourceMappingURL=collections.controller.js.map