import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';

interface AlertChannel {
  type: 'slack_webhook' | 'email';
  target: string;
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly channels: AlertChannel[];

  constructor(
    private readonly configService: ConfigService,
    private readonly monitoring: MonitoringService,
  ) {
    this.channels = [];
    const slackUrl = this.configService.get<string>('ALERT_SLACK_WEBHOOK');
    if (slackUrl) {
      this.channels.push({ type: 'slack_webhook', target: slackUrl });
    }
    const alertEmail = this.configService.get<string>('ALERT_EMAIL');
    if (alertEmail) {
      this.channels.push({ type: 'email', target: alertEmail });
    }
  }

  async alertCritical(error: Error, context?: Record<string, any>): Promise<void> {
    this.monitoring.captureException(error, { ...context, critical: true });
    await this.sendAlert('CRITICAL', error.message, context);
  }

  async alertWarning(message: string, context?: Record<string, any>): Promise<void> {
    this.monitoring.captureMessage(message, 'warning', context);
    await this.sendAlert('WARNING', message, context);
  }

  async alertSecurity(event: string, userId?: string, metadata?: Record<string, any>): Promise<void> {
    this.monitoring.captureSecurityEvent(event, userId, metadata);
    await this.sendAlert('SECURITY', `Security event: ${event}`, { userId, ...metadata });
  }

  private async sendAlert(level: string, message: string, context?: Record<string, any>): Promise<void> {
    for (const channel of this.channels) {
      try {
        if (channel.type === 'slack_webhook') {
          await this.sendSlack(channel.target, level, message, context);
        }
      } catch (err) {
        this.logger.error(`Failed to send alert via ${channel.type}: ${(err as Error).message}`);
      }
    }
  }

  private async sendSlack(webhookUrl: string, level: string, message: string, context?: Record<string, any>): Promise<void> {
    const color = level === 'CRITICAL' ? '#ff0000' : level === 'SECURITY' ? '#ff9900' : '#ffcc00';
    const blocks = [
      { type: 'section', text: { type: 'mrkdwn', text: `*[${level}]* ${message}` } },
    ];
    if (context && Object.keys(context).length > 0) {
      const fieldsText = Object.entries(context)
        .map(([k, v]) => `*${k}:* ${JSON.stringify(v)}`)
        .join('\n');
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: fieldsText },
      });
    }
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachments: [{ color, blocks }] }),
    });
  }
}
