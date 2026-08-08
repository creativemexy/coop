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
exports.CollectionQueueController = void 0;
const common_1 = require("@nestjs/common");
const collection_queue_service_1 = require("../services/collection-queue.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
let CollectionQueueController = class CollectionQueueController {
    service;
    constructor(service) {
        this.service = service;
    }
    async addToQueue(subscriptionId, userId) {
        return this.service.addToQueue(subscriptionId, userId);
    }
    async listQueued(status, priority, assignedTo) {
        return this.service.listQueued({ status, priority, assignedTo });
    }
    async updateStatus(id, dto) {
        return this.service.updateStatus(id, dto.status, dto.note);
    }
    async assignTo(id, dto) {
        return this.service.assignTo(id, dto.assignedTo);
    }
    async getAgingSummary() {
        return this.service.getAgingSummary();
    }
};
exports.CollectionQueueController = CollectionQueueController;
__decorate([
    (0, common_1.Post)(':subscriptionId/add'),
    __param(0, (0, common_1.Param)('subscriptionId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollectionQueueController.prototype, "addToQueue", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('priority')),
    __param(2, (0, common_1.Query)('assignedTo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CollectionQueueController.prototype, "listQueued", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CollectionQueueController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CollectionQueueController.prototype, "assignTo", null);
__decorate([
    (0, common_1.Get)('aging'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CollectionQueueController.prototype, "getAgingSummary", null);
exports.CollectionQueueController = CollectionQueueController = __decorate([
    (0, common_1.Controller)('api/v1/bnpl/collection-queue'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER, role_enum_1.Role.SUPER_ADMIN),
    __metadata("design:paramtypes", [collection_queue_service_1.CollectionQueueService])
], CollectionQueueController);
//# sourceMappingURL=collection-queue.controller.js.map