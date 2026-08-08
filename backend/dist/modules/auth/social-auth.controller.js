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
exports.SocialAuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const csrf_guard_1 = require("../../common/guards/csrf.guard");
let SocialAuthController = class SocialAuthController {
    authService;
    usersService;
    constructor(authService, usersService) {
        this.authService = authService;
        this.usersService = usersService;
    }
    googleAuth() { }
    async socialExchange(req, dto) {
        const ip = req.ip || req.socket?.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';
        return this.authService.socialExchange(dto.provider, dto.idToken, {
            ip,
            userAgent,
            firstName: dto.firstName,
            lastName: dto.lastName,
        });
    }
    async googleCallback(req, res) {
        const profile = req.user;
        const result = await this.findOrCreateUser(profile);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/auth/social-callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`);
    }
    appleAuth() { }
    async appleCallback(req, res) {
        const profile = req.user;
        const result = await this.findOrCreateUser(profile);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/auth/social-callback?token=${result.accessToken}&refreshToken=${result.refreshToken}`);
    }
    async findOrCreateUser(profile) {
        let user = await this.usersService.findBySocial(profile.provider, profile.socialId);
        if (!user && profile.email) {
            user = await this.usersService.findByEmail(profile.email);
            if (user) {
                await this.usersService.updateUser(user.id, {
                    socialProvider: profile.provider,
                    socialId: profile.socialId,
                });
            }
        }
        if (!user) {
            user = await this.usersService.createSocialUser({
                email: profile.email,
                firstName: profile.firstName || 'User',
                lastName: profile.lastName || '',
                socialProvider: profile.provider,
                socialId: profile.socialId,
            });
        }
        const tokens = await this.authService.generateTokens(user);
        await this.authService.updateRefreshTokenHash(user.id, tokens.refreshToken);
        return tokens;
    }
};
exports.SocialAuthController = SocialAuthController;
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SocialAuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Post)('social/exchange'),
    (0, csrf_guard_1.SkipCsrf)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocialAuthController.prototype, "socialExchange", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocialAuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('apple'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('apple')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SocialAuthController.prototype, "appleAuth", null);
__decorate([
    (0, common_1.Get)('apple/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('apple')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocialAuthController.prototype, "appleCallback", null);
exports.SocialAuthController = SocialAuthController = __decorate([
    (0, common_1.Controller)('api/v1/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService])
], SocialAuthController);
//# sourceMappingURL=social-auth.controller.js.map