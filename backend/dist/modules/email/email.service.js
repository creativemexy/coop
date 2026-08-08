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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = require("nodemailer");
const mask_util_1 = require("../../common/mask.util");
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    transporter = null;
    configured = false;
    constructor(configService) {
        this.configService = configService;
        const host = this.configService.get('smtp.host');
        const port = this.configService.get('smtp.port');
        const user = this.configService.get('smtp.user');
        const pass = this.configService.get('smtp.pass');
        const from = this.configService.get('smtp.from');
        if (host && user && pass) {
            this.transporter = (0, nodemailer_1.createTransport)({
                host,
                port: port || 587,
                secure: (port || 587) === 465,
                auth: { user, pass },
            });
            this.configured = true;
            this.logger.log(`SMTP configured: ${host}:${port}`);
        }
        else {
            this.logger.warn('SMTP not configured — emails will be logged only');
        }
    }
    async send(options) {
        if (!this.configured || !this.transporter) {
            this.logger.log(`[EMAIL LOG] To: ${(0, mask_util_1.maskEmail)(options.to)} | Subject: ${options.subject}`);
            return;
        }
        try {
            const from = this.configService.get('smtp.from') || 'noreply@coop.com';
            await this.transporter.sendMail({ from, ...options });
            this.logger.log(`Email sent to ${(0, mask_util_1.maskEmail)(options.to)}: ${options.subject}`);
        }
        catch (err) {
            this.logger.error(`Failed to send email to ${(0, mask_util_1.maskEmail)(options.to)}: ${err.message}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map