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
exports.KycGuard = exports.KYC_SKIP_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_enum_1 = require("../enums/role.enum");
const status_enum_1 = require("../enums/status.enum");
const user_entity_1 = require("../../modules/users/entities/user.entity");
exports.KYC_SKIP_KEY = 'kyc_skip';
const KYC_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000;
let KycGuard = class KycGuard {
    reflector;
    entityManager;
    constructor(reflector, entityManager) {
        this.reflector = reflector;
        this.entityManager = entityManager;
    }
    async canActivate(context) {
        const skip = this.reflector.getAllAndOverride(exports.KYC_SKIP_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skip)
            return true;
        const request = context.switchToHttp().getRequest();
        const tokenUser = request.user;
        if (!tokenUser)
            return true;
        if (tokenUser.role !== role_enum_1.Role.INDIVIDUAL)
            return true;
        const user = await this.entityManager.findOne(user_entity_1.User, { where: { id: tokenUser.sub } });
        if (!user)
            return true;
        if (user.kycStatus !== status_enum_1.KycStatus.APPROVED) {
            throw new common_1.ForbiddenException('KYC verification required to access this feature');
        }
        if (user.kycVerifiedAt && Date.now() - user.kycVerifiedAt.getTime() > KYC_EXPIRY_MS) {
            throw new common_1.ForbiddenException('KYC verification has expired. Please re-verify');
        }
        return true;
    }
};
exports.KycGuard = KycGuard;
exports.KycGuard = KycGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectEntityManager)()),
    __metadata("design:paramtypes", [core_1.Reflector,
        typeorm_2.EntityManager])
], KycGuard);
//# sourceMappingURL=kyc.guard.js.map