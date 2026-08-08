import { ConfigService } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';
export declare class AlertService {
    private readonly configService;
    private readonly monitoring;
    private readonly logger;
    private readonly channels;
    constructor(configService: ConfigService, monitoring: MonitoringService);
    alertCritical(error: Error, context?: Record<string, any>): Promise<void>;
    alertWarning(message: string, context?: Record<string, any>): Promise<void>;
    alertSecurity(event: string, userId?: string, metadata?: Record<string, any>): Promise<void>;
    private sendAlert;
    private sendSlack;
}
