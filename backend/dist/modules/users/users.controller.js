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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const referrals_service_1 = require("./referrals.service");
const user_activity_service_1 = require("./user-activity.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const status_enum_1 = require("../../common/enums/status.enum");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const mask_util_1 = require("../../common/mask.util");
let UsersController = class UsersController {
    usersService;
    referralsService;
    activityService;
    constructor(usersService, referralsService, activityService) {
        this.usersService = usersService;
        this.referralsService = referralsService;
        this.activityService = activityService;
    }
    async getMe(userId) {
        return this.usersService.findById(userId);
    }
    async updateMe(userId, updates) {
        const user = await this.usersService.findById(userId);
        const identityUpdated = 'firstName' in updates || 'lastName' in updates || 'phone' in updates;
        if (identityUpdated && user.kycStatus === status_enum_1.KycStatus.APPROVED) {
            throw new common_1.ForbiddenException('Identity details are locked after KYC verification completes. Contact support to change them.');
        }
        return this.usersService.updateUser(userId, updates);
    }
    async listUsers(role, organizationId, kycStatus, isActive, search, user) {
        if (user?.role === role_enum_1.Role.BUSINESS_MANAGER) {
            organizationId = user.organizationId;
            role = role_enum_1.Role.INDIVIDUAL;
        }
        const users = await this.usersService.listUsers(role, organizationId, undefined, {
            kycStatus,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            search,
        });
        return users.map((u) => (0, mask_util_1.maskUser)(u, user?.role));
    }
    async getUser(id, user) {
        if (user?.role === role_enum_1.Role.INDIVIDUAL && user?.sub !== id) {
            throw new common_1.ForbiddenException('You can only access your own data');
        }
        const target = await this.usersService.findById(id);
        if (user?.sub === id)
            return target;
        return (0, mask_util_1.maskUser)(target, user?.role);
    }
    async updateUser(id, updates) {
        return this.usersService.updateUser(id, updates);
    }
    async deleteAccount(userId) {
        return this.usersService.deleteAccount(userId);
    }
    async exportData(userId) {
        return this.usersService.exportData(userId);
    }
    async getReferralCode(userId) {
        const code = await this.usersService.generateReferralCode(userId);
        return { referralCode: code };
    }
    async getReferralStats(userId) {
        return this.usersService.getReferralStats(userId);
    }
    async getMyReferrals(userId) {
        return this.referralsService.getReferrals(userId);
    }
    async createReferral(userId, dto) {
        const result = await this.referralsService.createReferral(userId, dto.refereeEmail);
        await this.activityService.log(userId, 'sent_referral', { refereeEmail: dto.refereeEmail });
        return result;
    }
    async getActivity(userId, limit, offset) {
        return this.activityService.findByUser(userId, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.BUSINESS_MANAGER),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('organizationId')),
    __param(2, (0, common_1.Query)('kycStatus')),
    __param(3, (0, common_1.Query)('isActive')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.OPERATIONAL_ADMIN, role_enum_1.Role.BUSINESS_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('me'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Get)('me/export'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "exportData", null);
__decorate([
    (0, common_1.Get)('me/referral-code'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getReferralCode", null);
__decorate([
    (0, common_1.Get)('me/referral-stats'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getReferralStats", null);
__decorate([
    (0, common_1.Get)('me/referrals'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyReferrals", null);
__decorate([
    (0, common_1.Post)('me/referrals'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createReferral", null);
__decorate([
    (0, common_1.Get)('me/activity'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getActivity", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('api/v1/users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        referrals_service_1.ReferralsService,
        user_activity_service_1.UserActivityService])
], UsersController);
//# sourceMappingURL=users.controller.js.map