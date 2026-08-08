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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const user_entity_1 = require("../users/entities/user.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_activity_service_1 = require("../users/user-activity.service");
const login_history_entity_1 = require("./entities/login-history.entity");
const encryption_service_1 = require("../../common/encryption.service");
const temp_password_util_1 = require("../../common/temp-password.util");
const role_enum_1 = require("../../common/enums/role.enum");
const settings_service_1 = require("../settings/settings.service");
const device_session_service_1 = require("./device-session.service");
const audit_service_1 = require("../../common/audit.service");
const audit_log_entity_1 = require("../../common/entities/audit-log.entity");
const security_monitor_service_1 = require("../../common/monitoring/security-monitor.service");
const monitoring_service_1 = require("../../common/monitoring/monitoring.service");
const jose_1 = require("jose");
const virtual_accounts_service_1 = require("../first-virtual/virtual-accounts.service");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    loginHistoryRepo;
    orgRepository;
    jwtService;
    configService;
    settingsService;
    activityService;
    deviceSessionService;
    auditService;
    securityMonitor;
    monitoring;
    virtualAccountService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepository, loginHistoryRepo, orgRepository, jwtService, configService, settingsService, activityService, deviceSessionService, auditService, securityMonitor, monitoring, virtualAccountService) {
        this.userRepository = userRepository;
        this.loginHistoryRepo = loginHistoryRepo;
        this.orgRepository = orgRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.settingsService = settingsService;
        this.activityService = activityService;
        this.deviceSessionService = deviceSessionService;
        this.auditService = auditService;
        this.securityMonitor = securityMonitor;
        this.monitoring = monitoring;
        this.virtualAccountService = virtualAccountService;
    }
    async register(dto) {
        const email = dto.email
            ? dto.email.toLowerCase().trim()
            : `member-${crypto.randomUUID()}@coop.local`;
        const phone = dto.phone ? (0, temp_password_util_1.normalizePhoneForSms)(dto.phone) : undefined;
        if (!dto.email && !phone) {
            throw new common_1.BadRequestException('Email or phone number is required');
        }
        const existing = await this.userRepository.findOne({
            where: [
                ...(dto.email ? [{ emailHash: (0, encryption_service_1.hashForLookup)(email) }] : []),
                ...(phone ? [{ phoneHash: (0, encryption_service_1.hashForLookup)(phone) }] : []),
            ],
        });
        const legacy = await this.userRepository.find({
            where: { emailHash: (0, typeorm_2.IsNull)() },
        });
        const isStalePending = (u) => !!u && !u.isActive && !u.registrationFeePaid;
        const legacyMatch = (() => {
            if (dto.email) {
                const u = legacy.find((x) => x.email?.toLowerCase() === dto.email.toLowerCase());
                if (u)
                    return u;
            }
            if (phone) {
                const u = legacy.find((x) => x.phone === phone);
                if (u)
                    return u;
            }
            return undefined;
        })();
        const isEmailMatch = (u) => dto.email
            ? u.emailHash === (0, encryption_service_1.hashForLookup)(email) ||
                u.email?.toLowerCase() === dto.email.toLowerCase()
            : false;
        if (existing && !isStalePending(existing)) {
            throw new common_1.BadRequestException(isEmailMatch(existing)
                ? 'Email already registered'
                : 'Phone number already registered');
        }
        if (legacyMatch && !isStalePending(legacyMatch)) {
            throw new common_1.BadRequestException(dto.email &&
                legacyMatch.email?.toLowerCase() === dto.email.toLowerCase()
                ? 'Email already registered'
                : 'Phone number already registered');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const registrationFeeAmount = await this.settingsService.getNumber('registration_fee', 0);
        const feeRequired = registrationFeeAmount > 0;
        let organizationId;
        let apexOrgId;
        if (dto.organizationCode) {
            const org = await this.orgRepository.findOne({
                where: { code: dto.organizationCode },
                select: { id: true, apexOrgId: true },
            });
            if (org) {
                organizationId = org.id;
                apexOrgId = org.apexOrgId;
            }
        }
        const reuse = existing && isStalePending(existing) ? existing : legacyMatch;
        const user = reuse
            ? Object.assign(reuse, {
                email,
                emailHash: (0, encryption_service_1.hashForLookup)(email),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: phone ?? null,
                phoneHash: phone ? (0, encryption_service_1.hashForLookup)(phone) : null,
                organizationId,
                apexOrgId,
                isActive: !feeRequired,
                registrationFeePaid: false,
            })
            : this.userRepository.create({
                email,
                emailHash: (0, encryption_service_1.hashForLookup)(email),
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: phone ?? null,
                phoneHash: phone ? (0, encryption_service_1.hashForLookup)(phone) : null,
                role: role_enum_1.Role.INDIVIDUAL,
                organizationId,
                apexOrgId,
                isActive: !feeRequired,
                registrationFeePaid: false,
            });
        await this.userRepository.save(user);
        this.provisionVirtualAccount(user.id);
        await this.auditService.log(audit_log_entity_1.AuditAction.USER_CREATE, {
            entityType: 'User',
            entityId: user.id,
            performedBy: user.id,
            metadata: {
                email: dto.email,
                role: role_enum_1.Role.INDIVIDUAL,
                pendingPayment: feeRequired,
            },
        });
        if (feeRequired) {
            return {
                registrationFeeRequired: true,
                registrationFeeAmount,
                pendingUserId: user.id,
            };
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
        return {
            registrationFeeRequired: false,
            registrationFeeAmount: 0,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                kycStatus: user.kycStatus,
                registrationFeePaid: user.registrationFeePaid,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    provisionVirtualAccount(userId) {
        this.virtualAccountService
            .provisionForUser(userId)
            .then((account) => {
            if (account) {
                this.logger.log(`Provisioned virtual account ${account.accountNumber} for user ${userId}`);
            }
        })
            .catch((error) => {
            this.logger.warn(`Virtual account provisioning deferred for ${userId}: ${error instanceof Error ? error.message : 'unknown error'}`);
        });
    }
    async login(emailOrPhone, password, meta) {
        const lookupHash = (0, encryption_service_1.hashForLookup)(emailOrPhone);
        const isPhoneInput = /^\+?[\d\s()-]+$/.test(emailOrPhone.trim());
        const normalizedPhone = isPhoneInput
            ? (0, temp_password_util_1.normalizePhoneForSms)(emailOrPhone)
            : emailOrPhone;
        const phoneLookupHash = normalizedPhone !== emailOrPhone ? (0, encryption_service_1.hashForLookup)(normalizedPhone) : null;
        let user = await this.userRepository.findOne({
            where: [
                { emailHash: lookupHash, isActive: true },
                { phoneHash: lookupHash, isActive: true },
                ...(phoneLookupHash
                    ? [{ phoneHash: phoneLookupHash, isActive: true }]
                    : []),
            ],
        });
        if (!user) {
            const all = await this.userRepository.find({ where: { isActive: true } });
            user =
                all.find((u) => u.email?.toLowerCase() === emailOrPhone.toLowerCase() ||
                    (u.phone &&
                        (u.phone === emailOrPhone || u.phone === normalizedPhone))) ?? null;
        }
        if (!user) {
            await this.loginHistoryRepo.save({
                userId: 'unknown',
                ipAddress: meta?.ip,
                userAgent: meta?.userAgent,
                success: false,
                reason: 'Invalid credentials',
            });
            await this.securityMonitor.checkLoginAttempt(meta?.ip);
            this.monitoring.captureSecurityEvent('LOGIN_FAILED_UNKNOWN_USER', undefined, {
                ipAddress: meta?.ip,
                userAgent: meta?.userAgent,
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const remaining = Math.ceil((Number(user.lockedUntil) - Date.now()) / 60000);
            throw new common_1.UnauthorizedException(`Account locked. Try again in ${remaining} minute(s)`);
        }
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            const attempts = Number(user.failedAttempts ?? 0) + 1;
            const update = { failedAttempts: attempts };
            if (attempts >= 5) {
                update.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
            }
            await this.userRepository.update(user.id, update);
            await this.auditService.log(audit_log_entity_1.AuditAction.LOGIN_FAILED, {
                entityType: 'User',
                entityId: user.id,
                ipAddress: meta?.ip,
                metadata: { reason: 'Invalid password', attempt: attempts },
            });
            await this.loginHistoryRepo.save({
                userId: user.id,
                ipAddress: meta?.ip,
                userAgent: meta?.userAgent,
                success: false,
                reason: 'Invalid password',
            });
            await this.securityMonitor.checkLoginAttempt(meta?.ip, user.id);
            this.monitoring.captureSecurityEvent('LOGIN_FAILED_WRONG_PASSWORD', user.id, {
                ipAddress: meta?.ip,
                attempt: attempts,
            });
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.userRepository.update(user.id, {
            failedAttempts: 0,
            lockedUntil: null,
        });
        if (user.mustChangePassword) {
            await this.loginHistoryRepo.save({
                userId: user.id,
                ipAddress: meta?.ip,
                userAgent: meta?.userAgent,
                success: true,
            });
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    apexOrgId: user.apexOrgId,
                    organizationId: user.organizationId,
                },
                passwordChangeRequired: true,
            };
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
        await this.loginHistoryRepo.save({
            userId: user.id,
            ipAddress: meta?.ip,
            userAgent: meta?.userAgent,
            success: true,
        });
        await this.auditService.log(audit_log_entity_1.AuditAction.LOGIN, {
            entityType: 'User',
            entityId: user.id,
            performedBy: user.id,
            ipAddress: meta?.ip,
            metadata: {},
        });
        await this.activityService.log(user.id, 'login', { ip: meta?.ip }, meta?.ip);
        const deviceInfo = meta?.deviceInfo;
        let isNewDevice = false;
        if (deviceInfo?.deviceFingerprint) {
            const deviceResult = await this.deviceSessionService.checkDevice(user.id, deviceInfo.deviceFingerprint, deviceInfo);
            isNewDevice = deviceResult.isNewDevice;
            if (isNewDevice) {
                this.logger.warn(`New device login for user ${user.email}: ${deviceInfo.deviceName || 'Unknown'}`);
            }
        }
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                kycStatus: user.kycStatus,
                apexOrgId: user.apexOrgId,
                organizationId: user.organizationId,
                registrationFeePaid: user.registrationFeePaid,
            },
            ...tokens,
            isNewDevice,
        };
    }
    async refreshTokens(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('jwt.refreshSecret'),
            });
            const user = await this.userRepository.findOne({
                where: { id: payload.sub, isActive: true },
            });
            if (!user || !user.refreshTokenHash) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const isTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
            if (!isTokenValid) {
                throw new common_1.UnauthorizedException('Invalid refresh token');
            }
            const tokens = await this.generateTokens(user);
            await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
            return tokens;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(userId, {
            passwordHash,
            mustChangePassword: false,
        });
        await this.auditService.log(audit_log_entity_1.AuditAction.PASSWORD_CHANGE, {
            entityType: 'User',
            entityId: userId,
            performedBy: userId,
        });
    }
    async completeFirstLogin(emailOrPhone, currentPassword, newPassword) {
        const lookupHash = (0, encryption_service_1.hashForLookup)(emailOrPhone);
        let user = await this.userRepository.findOne({
            where: [
                { emailHash: lookupHash, isActive: true },
                { phoneHash: lookupHash, isActive: true },
            ],
        });
        if (!user) {
            const all = await this.userRepository.find({ where: { isActive: true } });
            user =
                all.find((u) => u.email?.toLowerCase() === emailOrPhone.toLowerCase() ||
                    u.phone === emailOrPhone) ?? null;
        }
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(user.id, {
            passwordHash,
            mustChangePassword: false,
            failedAttempts: 0,
        });
        await this.auditService.log(audit_log_entity_1.AuditAction.PASSWORD_CHANGE, {
            entityType: 'User',
            entityId: user.id,
            performedBy: user.id,
            metadata: { reason: 'first_login' },
        });
        return {
            message: 'Password set successfully. Please sign in with your new password.',
        };
    }
    async adminResetPassword(userId, newPassword) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(userId, { passwordHash });
        await this.auditService.log(audit_log_entity_1.AuditAction.PASSWORD_RESET, {
            entityType: 'User',
            entityId: userId,
            performedBy: userId,
        });
        return { message: 'Password reset successfully' };
    }
    async revokeSessions(userId) {
        await this.userRepository.update(userId, {
            refreshTokenHash: null,
        });
        return { message: 'All sessions revoked' };
    }
    async forgotPassword(email) {
        let user = await this.userRepository.findOne({
            where: { emailHash: (0, encryption_service_1.hashForLookup)(email) },
        });
        if (!user) {
            const all = await this.userRepository.find();
            user =
                all.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
        }
        if (!user) {
            return { message: 'If that email exists, a reset code has been sent' };
        }
        const token = crypto.randomBytes(3).toString('hex').toUpperCase();
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        await this.userRepository.update(user.id, {
            resetToken: token,
            resetTokenExpiry: expiry,
        });
        return {
            message: 'If that email exists, a reset code has been sent',
            token,
        };
    }
    async resetPassword(email, token, newPassword) {
        let user = await this.userRepository.findOne({
            where: { emailHash: (0, encryption_service_1.hashForLookup)(email) },
        });
        if (!user) {
            const all = await this.userRepository.find();
            user =
                all.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
        }
        if (!user ||
            !user.resetToken ||
            !user.resetTokenExpiry ||
            user.resetToken !== token ||
            user.resetTokenExpiry < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired reset code');
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(user.id, {
            passwordHash,
            resetToken: null,
            resetTokenExpiry: null,
        });
        return { message: 'Password reset successfully' };
    }
    async logout(userId) {
        await this.userRepository.update(userId, { refreshTokenHash: null });
        await this.auditService.log(audit_log_entity_1.AuditAction.LOGOUT, {
            entityType: 'User',
            entityId: userId,
            performedBy: userId,
        });
        await this.activityService.log(userId, 'logout');
    }
    async socialExchange(provider, idToken, meta) {
        if (!idToken) {
            throw new common_1.BadRequestException('Missing idToken');
        }
        const profile = await this.verifyProviderToken(provider, idToken);
        if (!profile.email) {
            throw new common_1.BadRequestException(`Sign in with ${provider} did not provide an email. Please approve the email scope.`);
        }
        let user = await this.userRepository.findOne({
            where: { socialProvider: provider, socialId: profile.socialId },
        });
        if (!user) {
            user = await this.userRepository.findOne({
                where: { emailHash: (0, encryption_service_1.hashForLookup)(profile.email) },
            });
            if (user) {
                user.socialProvider = provider;
                user.socialId = profile.socialId;
                await this.userRepository.save(user);
            }
        }
        if (!user) {
            user = this.userRepository.create({
                email: profile.email,
                emailHash: (0, encryption_service_1.hashForLookup)(profile.email),
                firstName: profile.firstName || meta?.firstName || 'User',
                lastName: profile.lastName || meta?.lastName || '',
                passwordHash: '',
                role: role_enum_1.Role.INDIVIDUAL,
                socialProvider: provider,
                socialId: profile.socialId,
                registrationFeePaid: true,
                isActive: true,
            });
            await this.userRepository.save(user);
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
        await this.loginHistoryRepo.save({
            userId: user.id,
            ipAddress: meta?.ip,
            userAgent: meta?.userAgent,
            success: true,
        });
        await this.auditService.log(audit_log_entity_1.AuditAction.LOGIN, {
            entityType: 'User',
            entityId: user.id,
            performedBy: user.id,
            ipAddress: meta?.ip,
            metadata: { provider },
        });
        if (typeof this.activityService.log === 'function') {
            await this.activityService
                .log(user.id, `social_login_${provider}`, { provider }, meta?.ip)
                .catch(() => { });
        }
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                kycStatus: user.kycStatus,
                apexOrgId: user.apexOrgId,
                organizationId: user.organizationId,
                registrationFeePaid: user.registrationFeePaid,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }
    async verifyProviderToken(provider, idToken) {
        const defaultAudience = provider === 'apple'
            ? undefined
            : this.configService.get('GOOGLE_CLIENT_ID');
        const jwksUri = provider === 'apple'
            ? 'https://appleid.apple.com/auth/keys'
            : 'https://www.googleapis.com/oauth2/v3/certs';
        try {
            const JWKS = (0, jose_1.createRemoteJWKSet)(new URL(jwksUri));
            const { payload } = await (0, jose_1.jwtVerify)(idToken, JWKS, {
                issuer: provider === 'apple'
                    ? ['https://appleid.apple.com', 'https://appleid.apple.com/']
                    : 'https://accounts.google.com',
                audience: defaultAudience,
            });
            return {
                socialId: String(payload.sub),
                email: payload.email ?? '',
                firstName: payload['given_name'],
                lastName: payload['family_name'],
            };
        }
        catch (e) {
            this.logger.error(`Invalid ${provider} id token`, e);
            throw new common_1.UnauthorizedException(`Invalid ${provider} sign-in token`);
        }
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            apexOrgId: user.apexOrgId ?? undefined,
            organizationId: user.organizationId ?? undefined,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.refreshSecret'),
                expiresIn: (this.configService.get('jwt.refreshExpiry') ||
                    '7d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async updateRefreshTokenHash(userId, refreshToken) {
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.userRepository.update(userId, { refreshTokenHash: hash });
    }
    async getLoginHistory(userId, limit = 50) {
        return this.loginHistoryRepo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(login_history_entity_1.LoginHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        settings_service_1.SettingsService,
        user_activity_service_1.UserActivityService,
        device_session_service_1.DeviceSessionService,
        audit_service_1.AuditService,
        security_monitor_service_1.SecurityMonitorService,
        monitoring_service_1.MonitoringService,
        virtual_accounts_service_1.VirtualAccountsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map