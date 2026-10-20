import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
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
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

interface LoginDeviceInfo {
  deviceFingerprint?: string;
  deviceName?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
}

const FIRST_LOGIN_FAILURE_LIMIT = 5;

function safeEqualTokens(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

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
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
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

    // "stale/incomplete" registrations: an INACTIVE user who never paid the
    // registration fee. Those must NOT block a fresh registration with the same
    // email/phone — the account was never completed, so it is reset and reused
    // so the member can pay the fee and finish registering.
    const isStalePending = (u?: User) =>
      !!u && !u.isActive && !u.registrationFeePaid;

    const isEmailMatch = (u: User) =>
      dto.email ? u.emailHash === hashForLookup(email) : false;

    if (existing && !isStalePending(existing)) {
      throw new BadRequestException(
        isEmailMatch(existing)
          ? 'Email already registered'
          : 'Phone number already registered',
      );
    }

    const legacyMatch =
      existing && isStalePending(existing) ? existing : undefined;

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
    const reuse = legacyMatch;

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

  async login(
    emailOrPhone: string,
    password: string,
    meta?: { ip?: string; userAgent?: string; deviceInfo?: LoginDeviceInfo },
  ): Promise<{
    user: Partial<User>;
    accessToken?: string;
    refreshToken?: string;
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
    const user = await this.userRepository.findOne({
      where: [
        { emailHash: lookupHash, isActive: true },
        { phoneHash: lookupHash, isActive: true },
        ...(phoneLookupHash
          ? [{ phoneHash: phoneLookupHash, isActive: true }]
          : []),
      ],
    });
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
      throw new UnauthorizedException('Invalid credentials');
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
      };
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

    await this.notifications.create({
      userId: user.id,
      title: 'New sign-in',
      message: `You signed in successfully${meta?.deviceInfo?.deviceName ? ` from ${meta.deviceInfo.deviceName}` : ''}.`,
      type: 'success',
    });

    const deviceInfo = meta?.deviceInfo;
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

    await this.notifications.create({
      userId,
      title: 'Password changed',
      message: 'Your password was changed successfully.',
      type: 'success',
    });
  }

  async completeFirstLogin(
    emailOrPhone: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const normalizedPhone = emailOrPhone.includes('@')
      ? null
      : normalizePhoneForSms(emailOrPhone);
    const throttleKey = `first-login:${hashForLookup(
      normalizedPhone ?? emailOrPhone,
    )}`;
    await this.ensureFirstLoginNotThrottled(throttleKey);

    const lookupHash = hashForLookup(emailOrPhone);
    const phoneLookupHash =
      normalizedPhone && normalizedPhone !== emailOrPhone
        ? hashForLookup(normalizedPhone)
        : null;
    const user = await this.userRepository.findOne({
      where: [
        { emailHash: lookupHash, isActive: true },
        { phoneHash: lookupHash, isActive: true },
        ...(phoneLookupHash
          ? [{ phoneHash: phoneLookupHash, isActive: true }]
          : []),
      ],
    });
    if (!user) {
      return this.rejectFirstLoginPassword(throttleKey);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.rejectFirstLoginPassword(throttleKey);
    }

    await this.ensureFirstLoginNotThrottled(throttleKey);
    await this.userRepository.query(
      'DELETE FROM throttle_counters WHERE key = $1',
      [throttleKey],
    );
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

    await this.notifications.create({
      userId: user.id,
      title: 'Password set',
      message:
        'Your password was set successfully. Please sign in with your new password.',
      type: 'success',
    });

    return {
      message:
        'Password set successfully. Please sign in with your new password.',
    };
  }

  private async ensureFirstLoginNotThrottled(key: string): Promise<void> {
    const rows: Array<{ blocked: boolean }> = await this.userRepository.query(
      `SELECT blocked_until > now() AS blocked
       FROM throttle_counters
       WHERE key = $1`,
      [key],
    );
    if (rows[0]?.blocked) {
      throw new HttpException(
        'Too many attempts. Try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async rejectFirstLoginPassword(key: string): Promise<never> {
    const rows: Array<{ blocked: boolean }> = await this.userRepository.query(
      `INSERT INTO throttle_counters AS counter
         (key, count, expires_at, blocked_until)
       VALUES ($1, 1, now() + interval '15 minutes', NULL)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE
           WHEN counter.expires_at <= now() THEN 1
           ELSE counter.count + 1
         END,
         expires_at = CASE
           WHEN counter.expires_at <= now()
             OR (counter.blocked_until IS NULL
                 AND counter.count + 1 >= $2)
             THEN now() + interval '15 minutes'
           ELSE counter.expires_at
         END,
         blocked_until = CASE
           WHEN counter.expires_at <= now() THEN NULL
           WHEN counter.blocked_until > now() THEN counter.blocked_until
           WHEN counter.count + 1 >= $2
             THEN now() + interval '15 minutes'
           ELSE counter.blocked_until
         END
       RETURNING blocked_until > now() AS blocked`,
      [key, FIRST_LOGIN_FAILURE_LIMIT],
    );
    if (rows[0]?.blocked) {
      throw new HttpException(
        'Too many attempts. Try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    throw new BadRequestException('Current password is incorrect');
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
    emailOrPhone: string,
  ): Promise<{ message: string; token?: string }> {
    // The exact same response shape is returned for unknown, cooling-down, and
    // rate-limited identifiers so an unauthenticated caller can never tell
    // which emails or phone numbers are registered (account enumeration).
    const generic = {
      message: 'If that account exists, a reset code has been sent',
    } as const;

    const user = await this.findUserByIdentifier(emailOrPhone);
    if (!user) {
      return generic;
    }

    // Per-account rate limiting (independent of IP throttling): max 1 code per
    // 60s and max 5 per rolling hour, so an attacker cannot SMS-bomb a victim
    // or rotate out a legitimate pending reset code. Capped accounts get the
    // generic response and no code is sent; the throttling only shows up in
    // internal audit/metrics, never in the HTTP response.
    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    const lastResetAt = user.lastResetAt ? Number(user.lastResetAt) : 0;
    if (now - lastResetAt < 60 * 1000) {
      return generic;
    }
    const sameHour =
      lastResetAt > 0 &&
      Math.floor(lastResetAt / HOUR) === Math.floor(now / HOUR);
    const hourlyCount = sameHour ? Number(user.resetHourlyCount ?? 0) : 0;
    if (hourlyCount >= 5) {
      return generic;
    }

    const token = crypto.randomInt(0, 100000000).toString().padStart(8, '0');
    const expiry = new Date(now + 15 * 60 * 1000);

    await this.userRepository.update(user.id, {
      resetToken: token,
      resetTokenExpiry: expiry,
      resetAttempts: 0,
      lastResetAt: new Date(now),
      resetHourlyCount: hourlyCount + 1,
    });

    await this.deliverResetCode(user, token);

    // Development convenience only — never return the code over the API. Gated
    // behind an explicit opt-in flag rather than NODE_ENV so a mislabeled
    // staging/development instance can never leak live reset codes.
    if (process.env.ENABLE_DEV_RESET_CODE === '1') {
      return { ...generic, token };
    }
    return generic;
  }

  /**
   * Locate an account by the identifier members actually sign in with —
   * either email or phone (some members register with only a phone number).
   */
  private async findUserByIdentifier(
    emailOrPhone: string,
  ): Promise<User | null> {
    const raw = (emailOrPhone || '').trim();
    if (!raw) return null;

    const email = raw.includes('@') ? raw.toLowerCase() : null;
    const phone = email ? null : normalizePhoneForSms(raw);

    if (email) {
      const byHash = await this.userRepository.findOne({
        where: { emailHash: hashForLookup(email) },
      });
      if (byHash) return byHash;
    }
    if (phone) {
      const byHash = await this.userRepository.findOne({
        where: { phoneHash: hashForLookup(phone) },
      });
      if (byHash) return byHash;
    }

    return null;
  }

  /**
   * Send the reset code to the member's registered email and/or phone.
   * Uses the platform's email/SMS providers, which fall back to stub logging
   * when credentials are not configured (see EmailService / SmsService).
   */
  private async deliverResetCode(user: User, token: string): Promise<void> {
    // Members who registered with only a phone get a synthetic @coop.local
    // email — never deliver the code to that placeholder address.
    const hasRealEmail =
      Boolean(user.email) &&
      user.email.includes('@') &&
      !user.email.endsWith('@coop.local');
    const hasPhone = Boolean(user.phone);
    if (!hasRealEmail && !hasPhone) return;

    const appName = 'Coop BNPL';
    const text =
      `Your ${appName} password reset code is ${token}. ` +
      'It expires in 15 minutes. If you did not request this, please ignore this message.';

    try {
      if (hasRealEmail && user.email) {
        await this.emailService.send({
          to: user.email,
          subject: 'Your password reset code',
          text,
        });
      }
    } catch (e) {
      this.logger.error('Failed to send password reset email', e as Error);
    }

    try {
      if (hasPhone && user.phone) {
        await this.smsService.send(user.phone, text, 'password_reset');
      }
    } catch (e) {
      this.logger.error('Failed to send password reset SMS', e as Error);
    }
  }

  async resetPassword(
    emailOrPhone: string,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findUserByIdentifier(emailOrPhone);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const codeIsValid = Boolean(
      user.resetToken &&
      user.resetTokenExpiry &&
      user.resetTokenExpiry >= new Date() &&
      safeEqualTokens(user.resetToken, token),
    );

    if (!codeIsValid) {
      if (user.resetToken) {
        await this.countFailedResetAttempt(user);
      }
      throw new BadRequestException('Invalid or expired reset code');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const consumed = await this.consumeResetCode(user, passwordHash);
    if (!consumed) {
      // A concurrent request already used or rotated this code — never reset
      // twice, and never reuse a consumed token.
      throw new BadRequestException('Invalid or expired reset code');
    }

    return { message: 'Password reset successfully' };
  }

  /**
   * Count a failed reset guess atomically in the database. The increment is a
   * single conditional UPDATE ... RETURNING, so concurrent requests cannot all
   * read the same starting count and each write 1 (the classic cap bypass).
   * When the returned count reaches the cap, the token is burned in the same
   * transaction so a race between "count reached five" and "invalidate code"
   * cannot leave the code guessable.
   */
  private async countFailedResetAttempt(user: User): Promise<void> {
    const activeCode = user.resetToken;
    await this.userRepository.manager.transaction(async (em) => {
      const repo = em.getRepository(User);
      const result = await repo
        .createQueryBuilder()
        .update(User)
        .set({ resetAttempts: () => '"reset_attempts" + 1' })
        .where(
          'id = :id AND reset_token = :code AND reset_token_expiry > :now',
          {
            id: user.id,
            code: activeCode,
            now: new Date(),
          },
        )
        .returning('reset_attempts')
        .execute();

      const attempts = this.readReturnedInt(result, 'reset_attempts');
      if (attempts >= 5) {
        await repo
          .createQueryBuilder()
          .update(User)
          .set({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            resetToken: null as any,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            resetTokenExpiry: null as any,
          })
          .where('id = :id AND reset_token = :code', {
            id: user.id,
            code: activeCode,
          })
          .execute();
      }
    });
  }

  /**
   * Apply the password change and consume the reset code in one conditional
   * UPDATE. The WHERE guards on the same unexpired token that was validated,
   * so a parallel successful reset that already consumed the code makes this
   * update affect zero rows and the token can never be reused.
   */
  private async consumeResetCode(
    user: User,
    passwordHash: string,
  ): Promise<boolean> {
    const activeCode = user.resetToken;
    let affected = 0;
    await this.userRepository.manager.transaction(async (em) => {
      const repo = em.getRepository(User);
      const result = await repo
        .createQueryBuilder()
        .update(User)
        .set({
          passwordHash,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          resetToken: null as any,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          resetTokenExpiry: null as any,
          resetAttempts: 0,
        })
        .where(
          'id = :id AND reset_token = :code AND reset_token_expiry > :now',
          {
            id: user.id,
            code: activeCode,
            now: new Date(),
          },
        )
        .execute();
      affected = result.affected ?? 0;
    });
    return affected === 1;
  }

  private readReturnedInt(result: UpdateResult, column: string): number {
    const rows =
      (Array.isArray(result.raw) ? result.raw : undefined) ??
      result.generatedMaps ??
      [];
    const first = rows[0] as Record<string, unknown> | undefined;
    if (!first) return 0;
    return Number(first[column] ?? 0);
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

    await this.activityService
      .log(user.id, `social_login_${provider}`, { provider }, meta?.ip)
      .catch(() => {});

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
