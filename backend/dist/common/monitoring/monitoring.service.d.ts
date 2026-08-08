import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
export declare class MonitoringService {
    private readonly configService;
    private readonly logger;
    private initialized;
    constructor(configService: ConfigService);
    captureException(error: Error, context?: Record<string, any>): void;
    captureMessage(message: string, level?: Sentry.SeverityLevel, context?: Record<string, any>): void;
    captureSecurityEvent(event: string, userId?: string, metadata?: Record<string, any>): void;
    setUser(userId: string, email?: string): void;
    clearUser(): void;
}
