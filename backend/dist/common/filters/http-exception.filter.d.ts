import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { MonitoringService } from '../monitoring/monitoring.service';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly monitoring;
    constructor(monitoring: MonitoringService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
