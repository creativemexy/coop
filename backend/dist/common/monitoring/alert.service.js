"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AlertService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const monitoring_service_1 = require("./monitoring.service");
let AlertService = AlertService_1 = class AlertService {
    configService;
    monitoring;
    logger = new common_1.Logger(AlertService_1.name);
    channels;
    constructor(configService, monitoring) {
        this.configService = configService;
        this.monitoring = monitoring;
        this.channels = [];
        const slackUrl = this.configService.get('ALERT_SLACK_WEBHOOK');
        if (slackUrl) {
            this.channels.push({ type: 'slack_webhook', target: slackUrl });
        }
        const alertEmail = this.configService.get('ALERT_EMAIL');
        if (alertEmail) {
            this.channels.push({ type: 'email', target: alertEmail });
        }
    }
    async alertCritical(error, context) {
        this.monitoring.captureException(error, { ...context, critical: true });
        await this.sendAlert('CRITICAL', error.message, context);
    }
    async alertWarning(message, context) {
        this.monitoring.captureMessage(message, 'warning', context);
        await this.sendAlert('WARNING', message, context);
    }
    async alertSecurity(event, userId, metadata) {
        this.monitoring.captureSecurityEvent(event, userId, metadata);
        await this.sendAlert('SECURITY', `Security event: ${event}`, { userId, ...metadata });
    }
    async sendAlert(level, message, context) {
        for (const channel of this.channels) {
            try {
                if (channel.type === 'slack_webhook') {
                    await this.sendSlack(channel.target, level, message, context);
                }
            }
            catch (err) {
                this.logger.error(`Failed to send alert via ${channel.type}: ${err.message}`);
            }
        }
    }
    async sendSlack(webhookUrl, level, message, context) {
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
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = AlertService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        monitoring_service_1.MonitoringService])
], AlertService);
//# sourceMappingURL=alert.service.js.map