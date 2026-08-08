import { Repository } from 'typeorm';
import { LoginHistory } from '../../modules/auth/entities/login-history.entity';
import { AlertService } from './alert.service';
export declare class SecurityMonitorService {
    private readonly loginRepo;
    private readonly alert;
    private readonly logger;
    constructor(loginRepo: Repository<LoginHistory>, alert: AlertService);
    checkLoginAttempt(ipAddress?: string, userId?: string): Promise<void>;
    checkSuspiciousUserId(ipAddress: string, userIds: string[]): Promise<void>;
    periodicScan(): Promise<void>;
    private checkAbnormalPatterns;
}
