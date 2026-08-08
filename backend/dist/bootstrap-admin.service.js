"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BootstrapAdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapAdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./modules/users/entities/user.entity");
const role_enum_1 = require("./common/enums/role.enum");
const encryption_service_1 = require("./common/encryption.service");
let BootstrapAdminService = BootstrapAdminService_1 = class BootstrapAdminService {
    userRepo;
    logger = new common_1.Logger(BootstrapAdminService_1.name);
    constructor(userRepo) {
        this.userRepo = userRepo;
    }
    async onApplicationBootstrap() {
        try {
            await this.ensureSuperAdmin();
        }
        catch (err) {
            this.logger.error(`Failed to ensure super admin: ${err.message}`);
        }
    }
    async ensureSuperAdmin() {
        const existing = await this.userRepo.findOne({
            where: { role: role_enum_1.Role.SUPER_ADMIN },
        });
        if (existing) {
            if (!existing.emailHash) {
                await this.userRepo.update(existing.id, {
                    emailHash: (0, encryption_service_1.hashForLookup)(existing.email ?? ''),
                });
            }
            return;
        }
        const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@coop.com';
        const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
        const passwordHash = await bcrypt.hash(password, 10);
        await this.userRepo.save({
            email,
            emailHash: (0, encryption_service_1.hashForLookup)(email),
            passwordHash,
            firstName: 'Super',
            lastName: 'Admin',
            phone: '08000000000',
            phoneHash: (0, encryption_service_1.hashForLookup)('08000000000'),
            role: role_enum_1.Role.SUPER_ADMIN,
            isActive: true,
            registrationFeePaid: true,
        });
        this.logger.warn(`Super admin auto-provisioned: ${email} (default credentials — change in production via SUPER_ADMIN_* env vars)`);
    }
};
exports.BootstrapAdminService = BootstrapAdminService;
exports.BootstrapAdminService = BootstrapAdminService = BootstrapAdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BootstrapAdminService);
//# sourceMappingURL=bootstrap-admin.service.js.map