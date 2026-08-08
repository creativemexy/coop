import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { UserActivityService } from '../users/user-activity.service';
import { LoginHistory } from './entities/login-history.entity';
import { SettingsService } from '../settings/settings.service';
import { DeviceSessionService } from './device-session.service';
import { AuditService } from '../../common/audit.service';
import { SecurityMonitorService } from '../../common/monitoring/security-monitor.service';
import { MonitoringService } from '../../common/monitoring/monitoring.service';
import { VirtualAccountsService } from '../first-virtual/virtual-accounts.service';
export declare class AuthService {
    private readonly userRepository;
    private readonly loginHistoryRepo;
    private readonly orgRepository;
    private readonly jwtService;
    private readonly configService;
    private readonly settingsService;
    private readonly activityService;
    private readonly deviceSessionService;
    private readonly auditService;
    private readonly securityMonitor;
    private readonly monitoring;
    private readonly virtualAccountService;
    private readonly logger;
    constructor(userRepository: Repository<User>, loginHistoryRepo: Repository<LoginHistory>, orgRepository: Repository<Organization>, jwtService: JwtService, configService: ConfigService, settingsService: SettingsService, activityService: UserActivityService, deviceSessionService: DeviceSessionService, auditService: AuditService, securityMonitor: SecurityMonitorService, monitoring: MonitoringService, virtualAccountService: VirtualAccountsService);
    register(dto: {
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
    }>;
    private provisionVirtualAccount;
    login(emailOrPhone: string, password: string, meta?: {
        ip?: string;
        userAgent?: string;
        deviceInfo?: any;
    }): Promise<{
        user: Partial<User>;
        accessToken: string;
        refreshToken: string;
        isNewDevice?: boolean;
        passwordChangeRequired?: boolean;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    completeFirstLogin(emailOrPhone: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    adminResetPassword(userId: string, newPassword: string): Promise<{
        message: string;
    }>;
    revokeSessions(userId: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
        token?: string;
    }>;
    resetPassword(email: string, token: string, newPassword: string): Promise<{
        message: string;
    }>;
    logout(userId: string): Promise<void>;
    socialExchange(provider: 'google' | 'apple', idToken: string, meta?: {
        ip?: string;
        userAgent?: string;
        firstName?: string;
        lastName?: string;
    }): Promise<{
        user: Partial<User>;
        accessToken: string;
        refreshToken: string;
    }>;
    private verifyProviderToken;
    generateTokens(user: User): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void>;
    getLoginHistory(userId: string, limit?: number): Promise<LoginHistory[]>;
}
