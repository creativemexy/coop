import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    if (dsn) {
      Sentry.init({
        dsn,
        environment: this.configService.get<string>('NODE_ENV') || 'development',
        tracesSampleRate: 0.1,
        integrations: [],
      });
      this.initialized = true;
      this.logger.log('Sentry initialized');
    }
  }

  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      this.logger.error(`[UNHANDLED] ${error.message}`, error.stack);
      return;
    }
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
    if (!this.initialized) {
      this.logger.log(`[${level}] ${message}`);
      return;
    }
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureMessage(message, level);
    });
  }

  captureSecurityEvent(event: string, userId?: string, metadata?: Record<string, any>): void {
    this.captureMessage(`[SECURITY] ${event}`, 'warning', {
      userId,
      ...metadata,
      securityEvent: true,
    });
  }

  setUser(userId: string, email?: string): void {
    if (!this.initialized) return;
    Sentry.setUser({ id: userId, email });
  }

  clearUser(): void {
    if (!this.initialized) return;
    Sentry.setUser(null);
  }
}
