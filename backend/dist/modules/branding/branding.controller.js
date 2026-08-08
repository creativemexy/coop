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
exports.BrandingController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const role_enum_1 = require("../../common/enums/role.enum");
const settings_service_1 = require("../settings/settings.service");
const sanitize_util_1 = require("../../common/sanitize.util");
const file_validator_util_1 = require("../../common/file-validator.util");
let BrandingController = class BrandingController {
    settings;
    constructor(settings) {
        this.settings = settings;
    }
    async get() {
        const [organizationName, logoPath, primaryColor, accentColor] = await Promise.all([
            this.settings.getValue('organization_name'),
            this.settings.getValue('logo_path'),
            this.settings.getValue('brand_primary_color'),
            this.settings.getValue('brand_accent_color'),
        ]);
        return {
            organizationName: organizationName || 'Coop BNPL',
            logoUrl: logoPath ? `/uploads/branding/${logoPath}` : null,
            primaryColor: primaryColor || '#2563eb',
            accentColor: accentColor || '#7c3aed',
        };
    }
    async updateName(dto) {
        if (!dto.name || dto.name.trim().length === 0) {
            throw new common_1.BadRequestException('Organization name is required');
        }
        const sanitized = (0, sanitize_util_1.sanitizeInput)(dto.name);
        if (!sanitized) {
            throw new common_1.BadRequestException('Organization name is required');
        }
        await this.settings.set('organization_name', sanitized);
        return { organizationName: sanitized };
    }
    async updateColors(dto) {
        if (!dto.primaryColor?.startsWith('#') ||
            !dto.accentColor?.startsWith('#')) {
            throw new common_1.BadRequestException('Colors must be hex values (e.g. #2563eb)');
        }
        await Promise.all([
            this.settings.set('brand_primary_color', dto.primaryColor),
            this.settings.set('brand_accent_color', dto.accentColor),
        ]);
        return { primaryColor: dto.primaryColor, accentColor: dto.accentColor };
    }
    async uploadLogo(file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        (0, file_validator_util_1.validateImageFile)(file.path);
        await this.settings.set('logo_path', file.filename);
        return { logoUrl: `/uploads/branding/${file.filename}` };
    }
};
exports.BrandingController = BrandingController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "get", null);
__decorate([
    (0, common_1.Put)('name'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "updateName", null);
__decorate([
    (0, common_1.Put)('colors'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "updateColors", null);
__decorate([
    (0, common_1.Post)('logo'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (0, path_1.join)(process.cwd(), 'uploads', 'branding'),
            filename: (_req, file, cb) => {
                const ext = (0, path_1.extname)(file.originalname);
                cb(null, `logo${ext}`);
            },
        }),
        limits: { fileSize: 2 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.match(/^image\/(png|jpeg|jpg|svg|webp)$/)) {
                cb(new common_1.BadRequestException('Only image files (PNG, JPG, SVG, WebP) are allowed'), false);
                return;
            }
            if (!(0, file_validator_util_1.isAllowedExtension)(file.originalname)) {
                cb(new common_1.BadRequestException('File extension does not match allowed image formats'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandingController.prototype, "uploadLogo", null);
exports.BrandingController = BrandingController = __decorate([
    (0, common_1.Controller)('api/v1/branding'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], BrandingController);
//# sourceMappingURL=branding.controller.js.map