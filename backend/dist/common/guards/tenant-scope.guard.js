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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantScopeGuard = exports.AllowRoles = exports.ALLOWED_ROLES_KEY = exports.TenantScoped = exports.TENANT_SCOPED_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const role_enum_1 = require("../enums/role.enum");
exports.TENANT_SCOPED_KEY = 'tenant_scoped';
const TenantScoped = () => Reflect.metadata(exports.TENANT_SCOPED_KEY, true);
exports.TenantScoped = TenantScoped;
exports.ALLOWED_ROLES_KEY = 'allowed_roles';
const AllowRoles = (...roles) => Reflect.metadata(exports.ALLOWED_ROLES_KEY, roles);
exports.AllowRoles = AllowRoles;
let TenantScopeGuard = class TenantScopeGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const isTenantScoped = this.reflector.get(exports.TENANT_SCOPED_KEY, context.getHandler());
        if (!isTenantScoped) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const params = request.params;
        if (user.role === role_enum_1.Role.SUPER_ADMIN) {
            return true;
        }
        if (user.role === role_enum_1.Role.BUSINESS_MANAGER) {
            return true;
        }
        if (user.role === role_enum_1.Role.OPERATIONAL_ADMIN) {
            if (params.apexOrgId && params.apexOrgId !== user.apexOrgId) {
                throw new common_1.ForbiddenException('Access denied to this apex organization');
            }
            return true;
        }
        const orgScopedRoles = [
            role_enum_1.Role.ACCOUNTANT,
            role_enum_1.Role.LOAN_MANAGER,
            role_enum_1.Role.BNPL_MANAGER,
            role_enum_1.Role.INVESTMENT_MANAGER,
        ];
        if (orgScopedRoles.includes(user.role)) {
            if (params.organizationId &&
                params.organizationId !== user.organizationId) {
                throw new common_1.ForbiddenException('Access denied to this organization');
            }
            return true;
        }
        if (user.role === role_enum_1.Role.INDIVIDUAL) {
            if (params.userId && params.userId !== user.sub) {
                throw new common_1.ForbiddenException('Access denied');
            }
            return true;
        }
        return true;
    }
};
exports.TenantScopeGuard = TenantScopeGuard;
exports.TenantScopeGuard = TenantScopeGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], TenantScopeGuard);
//# sourceMappingURL=tenant-scope.guard.js.map