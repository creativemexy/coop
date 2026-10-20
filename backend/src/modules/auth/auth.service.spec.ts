import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { LoginHistory } from './entities/login-history.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { SettingsService } from '../settings/settings.service';
import { UserActivityService } from '../users/user-activity.service';
import { DeviceSessionService } from './device-session.service';
import { AuditService } from '../../common/audit.service';
import { SecurityMonitorService } from '../../common/monitoring/security-monitor.service';
import { MonitoringService } from '../../common/monitoring/monitoring.service';
import { VirtualAccountsService } from '../first-virtual/virtual-accounts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    emailHash: 'abc123hash',
    passwordHash: 'hashed-password',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    phoneHash: null,
    role: 'individual',
    kycStatus: 'none',
    isActive: true,
    apexOrgId: null,
    organizationId: null,
    refreshTokenHash: null,
    failedAttempts: 0,
    lockedUntil: null,
    resetToken: null,
    resetTokenExpiry: null,
    referralCode: null,
    referredBy: null,
    referralCount: 0,
    referralEarnings: '0',
    registrationFeePaid: false,
    notificationPreferences: null,
    socialProvider: null,
    socialId: null,
    kycReference: null,
    apexOrg: null,
    organization: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User;

  beforeEach(async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LoginHistory),
          useValue: { save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'jwt.refreshSecret') return 'refresh-secret';
              if (key === 'jwt.refreshExpiry') return '7d';
              return null;
            }),
          },
        },
        {
          provide: SettingsService,
          useValue: { getNumber: jest.fn().mockResolvedValue(0) },
        },
        {
          provide: UserActivityService,
          useValue: { log: jest.fn() },
        },
        {
          provide: DeviceSessionService,
          useValue: { checkDevice: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: SecurityMonitorService,
          useValue: { checkLoginAttempt: jest.fn() },
        },
        {
          provide: MonitoringService,
          useValue: { captureSecurityEvent: jest.fn() },
        },
        {
          provide: VirtualAccountsService,
          useValue: { provisionForUser: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: NotificationsService,
          useValue: { create: jest.fn() },
        },
        { provide: EmailService, useValue: {} },
        { provide: SmsService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should throw if email already exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      await expect(
        service.register({
          email: 'test@test.com',
          password: 'Password1',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register a new user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'new@test.com',
        password: 'Password1',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.user.email).toBe('test@test.com');
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });
  });

  describe('login', () => {
    it('should throw if credentials are invalid', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login('test@test.com', 'wrong'),
      ).rejects.toMatchObject({ response: 'Invalid credentials' });
    });

    it('returns a generic error for an incorrect password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('test@test.com', 'wrong'),
      ).rejects.toMatchObject({ response: 'Invalid credentials' });
    });

    it('returns a generic error for a locked account', async () => {
      userRepo.findOne.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(
        service.login('test@test.com', 'wrong'),
      ).rejects.toMatchObject({ response: 'Invalid credentials' });
    });

    it('should login with phone number', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.login('+1234567890', 'Password1');
      expect(result.accessToken).toBe('mock-token');
    });

    it('should login successfully', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.login('test@test.com', 'Password1');
      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('refreshTokens', () => {
    it('should throw on invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await expect(service.refreshTokens('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should refresh tokens', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1' });
      userRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.refreshTokens('valid-token');
      expect(result.accessToken).toBe('mock-token');
    });
  });

  describe('completeFirstLogin', () => {
    it('blocks after five incorrect temporary passwords', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      let failedAttempts = 0;
      userRepo.query.mockImplementation(async (query) => {
        if (query.startsWith('SELECT')) return [{ blocked: false }];
        failedAttempts++;
        return [{ blocked: failedAttempts >= 5 }];
      });

      for (let attempt = 1; attempt < 5; attempt++) {
        await expect(
          service.completeFirstLogin(
            'test@test.com',
            'wrong-password',
            'NewPassword123!',
          ),
        ).rejects.toThrow('Current password is incorrect');
      }

      await expect(
        service.completeFirstLogin(
          'test@test.com',
          'wrong-password',
          'NewPassword123!',
        ),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
      const failureQueries = userRepo.query.mock.calls.filter(([query]) =>
        query.startsWith('INSERT'),
      );
      expect(failureQueries).toHaveLength(5);
      expect(
        failureQueries.every(
          ([, parameters]) => !parameters?.includes('test@test.com'),
        ),
      ).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear refresh token hash', async () => {
      userRepo.update.mockResolvedValue({ affected: 1 } as any);
      await service.logout('user-1');
      expect(userRepo.update).toHaveBeenCalledWith('user-1', {
        refreshTokenHash: null,
      });
    });
  });
});
