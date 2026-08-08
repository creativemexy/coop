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
exports.JournalController = void 0;
const common_1 = require("@nestjs/common");
const journal_service_1 = require("../services/journal.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../common/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const role_enum_1 = require("../../../common/enums/role.enum");
const PLATFORM_ROLES = [role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.SUPER_ADMIN];
let JournalController = class JournalController {
    service;
    constructor(service) {
        this.service = service;
    }
    async postEntry(dto, user) {
        const isPlatform = PLATFORM_ROLES.includes(user.role);
        const lines = dto.lines.map((l) => ({
            ...l,
            organizationId: isPlatform ? l.organizationId : (l.organizationId || user.organizationId),
        }));
        return this.service.postEntry({
            ...dto,
            lines,
            entryDate: new Date(dto.entryDate),
            postedBy: user.sub,
        });
    }
    async findEntries(user) {
        const isPlatform = PLATFORM_ROLES.includes(user.role);
        return this.service.findEntries(isPlatform ? undefined : user.organizationId);
    }
};
exports.JournalController = JournalController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ACCOUNTANT, role_enum_1.Role.SUPER_ADMIN, role_enum_1.Role.BNPL_MANAGER, role_enum_1.Role.BUSINESS_MANAGER),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JournalController.prototype, "postEntry", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JournalController.prototype, "findEntries", null);
exports.JournalController = JournalController = __decorate([
    (0, common_1.Controller)('api/v1/ledger/journal-entries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [journal_service_1.JournalService])
], JournalController);
//# sourceMappingURL=journal.controller.js.map