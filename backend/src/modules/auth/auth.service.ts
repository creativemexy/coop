import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserActivityService } from '../users/user-activity.service';
import { LoginHistory } from './entities/login-history.entity';
import { hashForLookup } from '../../common/encryption.service';
import { normalizePhoneForSms } from '../../common/temp-password.util';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Role } from '../../common/enums/role.enum';
import { SettingsService } from '../settings/settings.service';
import { DeviceSessionService } from './device-session.service';
import { AuditService } from '../../common/audit.service';
import { AuditAction } from '../../common/entities/audit-log.entity';
import { SecurityMonitorService } from '../../common/monitoring/security-monitor.service';
import { MonitoringService } from '../../common/monitoring/monitoring.service';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { VirtualAccountsService } from '../first-virtual/virtual-accounts.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepo: Repository<LoginHistory>,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
    private readonly activityService: UserActivityService,
    private readonly deviceSessionService: DeviceSessionService,
    private readonly auditService: AuditService,
    private readonly securityMonitor: SecurityMonitorService,
    private readonly monitoring: MonitoringService,
    private readonly virtualAccountService: VirtualAccountsService,
  ) {}

  async register(dto: {
    email?: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    organizationCode?: string;
  }): Promise<{
    registrationFeeRequired: boolean;
    registrationFeeAmount: number;
    pendingUserId?: string;
    user?: Partial<User>;
    accessToken?: string;
    refreshToken?: string;
  }> {
    const email = dto.email
      ? dto.email.toLowerCase().trim()
      : `member-${crypto.randomUUID()}@coop.local`;
    const phone = dto.phone ? normalizePhoneForSms(dto.phone) : undefined;

    if (!dto.email && !phone) {
      throw new BadRequestException('Email or phone number is required');
    }

    const existing = await this.userRepository.findOne({
      where: [
        ...(dto.email ? [{ emailHash: hashForLookup(email) }] : []),
        ...(phone ? [{ phoneHash: hashForLookup(phone) }] : []),
      ],
    });

    // Fallback for users without hashes (pre-encryption migration)
    const legacy = await this.userRepository.find({
      where: { emailHash: IsNull() },
    });

    // An "stale/incomplete" registration is an INACTIVE user who never paid the
    // registration fee. Those must NOT block a fresh registration with the same
    // email/phone — the account was never completed, so it is reset and reused
    // so the member can pay the fee and finish registering.
    const isStalePending = (u?: User) =>
      !!u && !u.isActive && !u.registrationFeePaid;

    const legacyMatch = ((): User | undefined => {
      if (dto.email) {
        const u = legacy.find(
          (x) => x.email?.toLowerCase() === dto.email!.toLowerCase(),
        );
        if (u) return u;
      }
      if (phone) {
        const u = legacy.find((x) => x.phone === phone);
        if (u) return u;
      }
      return undefined;
    })();

    const isEmailMatch = (u: User) =>
      dto.email
        ? u.emailHash === hashForLookup(email) ||
          u.email?.toLowerCase() === dto.email.toLowerCase()
        : false;

    if (existing && !isStalePending(existing)) {
      throw new BadRequestException(
        isEmailMatch(existing)
          ? 'Email already registered'
          : 'Phone number already registered',
      );
    }
    if (legacyMatch && !isStalePending(legacyMatch)) {
      throw new BadRequestException(
        dto.email &&
          legacyMatch.email?.toLowerCase() === dto.email.toLowerCase()
          ? 'Email already registered'
          : 'Phone number already registered',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const registrationFeeAmount = await this.settingsService.getNumber(
      'registration_fee',
      0,
    );
    const feeRequired = registrationFeeAmount > 0;

    let organizationId: string | undefined;
    let apexOrgId: string | undefined;

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

    // Reuse the previously incomplete (unpaid) registration, or create a fresh one.
    const reuse = existing && isStalePending(existing) ? existing : legacyMatch;

    const user = reuse
      ? Object.assign(reuse, {
          email,
          emailHash: hashForLookup(email),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: phone ?? null,
          phoneHash: phone ? hashForLookup(phone) : null,
          organizationId,
          apexOrgId,
          isActive: !feeRequired,
          registrationFeePaid: false,
        })
      : this.userRepository.create({
          email,
          emailHash: hashForLookup(email),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: phone ?? null,
          phoneHash: phone ? hashForLookup(phone) : null,
          role: Role.INDIVIDUAL,
          organizationId,
          apexOrgId,
          isActive: !feeRequired,
          registrationFeePaid: false,
        });

    await this.userRepository.save(user);

    // Fire-and-forget: every individual member gets a persistent virtual
    // account (FirstCheckout) which they keep for bank-transfer deposits.
    this.provisionVirtualAccount(user.id);

    await this.auditService.log(AuditAction.USER_CREATE, {
      entityType: 'User',
      entityId: user.id,
      performedBy: user.id,
      metadata: {
        email: dto.email,
        role: Role.INDIVIDUAL,
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

  private provisionVirtualAccount(userId: string): void {
    this.virtualAccountService
      .provisionForUser(userId)
      .then((account) => {
        if (account) {
          this.logger.log(
            `Provisioned virtual account ${account.accountNumber} for user ${userId}`,
          );
        }
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Virtual account provisioning deferred for ${userId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });
  }

  async login(
    emailOrPhone: string,
    password: string,
    meta?: { ip?: string; userAgent?: string; deviceInfo?: any },
  ): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
    isNewDevice?: boolean;
    passwordChangeRequired?: boolean;
  }> {
    const lookupHash = hashForLookup(emailOrPhone);
    const isPhoneInput = /^\+?[\d\s()-]+$/.test(emailOrPhone.trim());
    const normalizedPhone = isPhoneInput
      ? normalizePhoneForSms(emailOrPhone)
      : emailOrPhone;
    const phoneLookupHash =
      normalizedPhone !== emailOrPhone ? hashForLookup(normalizedPhone) : null;
    let user = await this.userRepository.findOne({
      where: [
        { emailHash: lookupHash, isActive: true },
        { phoneHash: lookupHash, isActive: true },
        ...(phoneLookupHash
          ? [{ phoneHash: phoneLookupHash, isActive: true }]
          : []),
      ],
    });
    // Fallback for users without a hash (pre-encryption migration)
    if (!user) {
      const all = await this.userRepository.find({ where: { isActive: true } });
      user =
        all.find(
          (u) =>
            u.email?.toLowerCase() === emailOrPhone.toLowerCase() ||
            (u.phone &&
              (u.phone === emailOrPhone || u.phone === normalizedPhone)),
        ) ?? null;
    }
    if (!user) {
      await this.loginHistoryRepo.save({
        userId: 'unknown',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        success: false,
        reason: 'Invalid credentials',
      } as LoginHistory);
      await this.securityMonitor.checkLoginAttempt(meta?.ip);
      this.monitoring.captureSecurityEvent(
        'LOGIN_FAILED_UNKNOWN_USER',
        undefined,
        {
          ipAddress: meta?.ip,
          userAgent: meta?.userAgent,
        },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil(
        (Number(user.lockedUntil) - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked. Try again in ${remaining} minute(s)`,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const attempts = Number(user.failedAttempts ?? 0) + 1;
      const update: Partial<User> = { failedAttempts: attempts };
      if (attempts >= 5) {
        update.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await this.userRepository.update(user.id, update);
      await this.auditService.log(AuditAction.LOGIN_FAILED, {
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
      } as LoginHistory);
      await this.securityMonitor.checkLoginAttempt(meta?.ip, user.id);
      this.monitoring.captureSecurityEvent(
        'LOGIN_FAILED_WRONG_PASSWORD',
        user.id,
        {
          ipAddress: meta?.ip,
          attempt: attempts,
        },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.update(user.id, {
      failedAttempts: 0,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      lockedUntil: null as any,
    });

    if (user.mustChangePassword) {
      await this.loginHistoryRepo.save({
        userId: user.id,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        success: true,
      } as LoginHistory);
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
      } as any;
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    await this.loginHistoryRepo.save({
      userId: user.id,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      success: true,
    } as LoginHistory);

    await this.auditService.log(AuditAction.LOGIN, {
      entityType: 'User',
      entityId: user.id,
      performedBy: user.id,
      ipAddress: meta?.ip,
      metadata: {},
    });

    await this.activityService.log(
      user.id,
      'login',
      { ip: meta?.ip },
      meta?.ip,
    );

    const deviceInfo = (
      meta as {
        deviceInfo?: {
          deviceFingerprint?: string;
          deviceName?: string;
          deviceType?: string;
          os?: string;
          browser?: string;
        };
      }
    )?.deviceInfo;
    let isNewDevice = false;
    if (deviceInfo?.deviceFingerprint) {
      const deviceResult = await this.deviceSessionService.checkDevice(
        user.id,
        deviceInfo.deviceFingerprint,
        deviceInfo,
      );
      isNewDevice = deviceResult.isNewDevice;
      if (isNewDevice) {
        this.logger.warn(
          `New device login for user ${user.email}: ${deviceInfo.deviceName || 'Unknown'}`,
        );
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

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        where: { id: payload.sub as string, isActive: true },
      });
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, {
      passwordHash,
      mustChangePassword: false,
    });

    await this.auditService.log(AuditAction.PASSWORD_CHANGE, {
      entityType: 'User',
      entityId: userId,
      performedBy: userId,
    });
  }

  async completeFirstLogin(
    emailOrPhone: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const lookupHash = hashForLookup(emailOrPhone);
    let user = await this.userRepository.findOne({
      where: [
        { emailHash: lookupHash, isActive: true },
        { phoneHash: lookupHash, isActive: true },
      ],
    });
    if (!user) {
      const all = await this.userRepository.find({ where: { isActive: true } });
      user =
        all.find(
          (u) =>
            u.email?.toLowerCase() === emailOrPhone.toLowerCase() ||
            u.phone === emailOrPhone,
        ) ?? null;
    }
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, {
      passwordHash,
      mustChangePassword: false,
      failedAttempts: 0,
    });

    await this.auditService.log(AuditAction.PASSWORD_CHANGE, {
      entityType: 'User',
      entityId: user.id,
      performedBy: user.id,
      metadata: { reason: 'first_login' },
    });

    return {
      message:
        'Password set successfully. Please sign in with your new password.',
    };
  }

  async adminResetPassword(
    userId: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { passwordHash });

    await this.auditService.log(AuditAction.PASSWORD_RESET, {
      entityType: 'User',
      entityId: userId,
      performedBy: userId,
    });

    return { message: 'Password reset successfully' };
  }

  async revokeSessions(userId: string): Promise<{ message: string }> {
    await this.userRepository.update(userId, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      refreshTokenHash: null as any,
    });
    return { message: 'All sessions revoked' };
  }

  async forgotPassword(
    email: string,
  ): Promise<{ message: string; token?: string }> {
    let user = await this.userRepository.findOne({
      where: { emailHash: hashForLookup(email) },
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

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    let user = await this.userRepository.findOne({
      where: { emailHash: hashForLookup(email) },
    });
    if (!user) {
      const all = await this.userRepository.find();
      user =
        all.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
    }
    if (
      !user ||
      !user.resetToken ||
      !user.resetTokenExpiry ||
      user.resetToken !== token ||
      user.resetTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, {
      passwordHash,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      resetToken: null as any,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      resetTokenExpiry: null as any,
    });

    return { message: 'Password reset successfully' };
  }

  async logout(userId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    await this.userRepository.update(userId, { refreshTokenHash: null as any });
    await this.auditService.log(AuditAction.LOGOUT, {
      entityType: 'User',
      entityId: userId,
      performedBy: userId,
    });
    await this.activityService.log(userId, 'logout');
  }

  async socialExchange(
    provider: 'google' | 'apple',
    idToken: string,
    meta?: {
      ip?: string;
      userAgent?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    if (!idToken) {
      throw new BadRequestException('Missing idToken');
    }

    const profile = await this.verifyProviderToken(provider, idToken);
    if (!profile.email) {
      throw new BadRequestException(
        `Sign in with ${provider} did not provide an email. Please approve the email scope.`,
      );
    }

    let user = await this.userRepository.findOne({
      where: { socialProvider: provider, socialId: profile.socialId },
    });
    if (!user) {
      user = await this.userRepository.findOne({
        where: { emailHash: hashForLookup(profile.email) },
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
        emailHash: hashForLookup(profile.email),
        firstName: profile.firstName || meta?.firstName || 'User',
        lastName: profile.lastName || meta?.lastName || '',
        passwordHash: '',
        role: Role.INDIVIDUAL,
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
    } as LoginHistory);

    await this.auditService.log(AuditAction.LOGIN, {
      entityType: 'User',
      entityId: user.id,
      performedBy: user.id,
      ipAddress: meta?.ip,
      metadata: { provider },
    });

    if (typeof (this.activityService as any).log === 'function') {
      await this.activityService
        .log(user.id, `social_login_${provider}`, { provider }, meta?.ip)
        .catch(() => {});
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

  private async verifyProviderToken(
    provider: 'google' | 'apple',
    idToken: string,
  ): Promise<{
    socialId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }> {
    const defaultAudience =
      provider === 'apple'
        ? undefined
        : this.configService.get<string>('GOOGLE_CLIENT_ID');
    const jwksUri =
      provider === 'apple'
        ? 'https://appleid.apple.com/auth/keys'
        : 'https://www.googleapis.com/oauth2/v3/certs';

    try {
      const JWKS = createRemoteJWKSet(new URL(jwksUri));
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer:
          provider === 'apple'
            ? ['https://appleid.apple.com', 'https://appleid.apple.com/']
            : 'https://accounts.google.com',
        audience: defaultAudience,
      });
      return {
        socialId: String(payload.sub),
        email: (payload.email as string) ?? '',
        firstName: payload['given_name'] as string,
        lastName: payload['family_name'] as string,
      };
    } catch (e) {
      this.logger.error(`Invalid ${provider} id token`, e as Error);
      throw new UnauthorizedException(`Invalid ${provider} sign-in token`);
    }
  }

  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      apexOrgId: user.apexOrgId ?? undefined,
      organizationId: user.organizationId ?? undefined,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expiresIn: (this.configService.get<string>('jwt.refreshExpiry') ||
          '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshTokenHash: hash });
  }

  async getLoginHistory(userId: string, limit = 50) {
    return this.loginHistoryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
