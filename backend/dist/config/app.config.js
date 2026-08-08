"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smtpConfig = void 0;
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    port: parseInt(process.env.APP_PORT || '3000', 10),
    env: process.env.APP_ENV || 'development',
}));
exports.smtpConfig = (0, config_1.registerAs)('smtp', () => ({
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@coop.com',
}));
//# sourceMappingURL=app.config.js.map