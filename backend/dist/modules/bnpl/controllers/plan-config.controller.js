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
exports.PlanConfigController = void 0;
const common_1 = require("@nestjs/common");
const plan_config_service_1 = require("../services/plan-config.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
let PlanConfigController = class PlanConfigController {
    service;
    constructor(service) {
        this.service = service;
    }
    async get(organizationId) {
        const config = await this.service.get(organizationId);
        if (!config)
            return { configured: false };
        return { configured: true, ...config };
    }
    async upsert(organizationId, dto, userId) {
        return this.service.upsert(organizationId, { ...dto, updatedBy: userId });
    }
};
exports.PlanConfigController = PlanConfigController;
__decorate([
    (0, common_1.Get)(':organizationId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlanConfigController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(':organizationId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], PlanConfigController.prototype, "upsert", null);
exports.PlanConfigController = PlanConfigController = __decorate([
    (0, common_1.Controller)('api/v1/bnpl/plan-config'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [plan_config_service_1.PlanConfigService])
], PlanConfigController);
//# sourceMappingURL=plan-config.controller.js.map