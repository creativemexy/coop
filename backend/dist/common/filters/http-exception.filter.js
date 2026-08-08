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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const monitoring_service_1 = require("../monitoring/monitoring.service");
let AllExceptionsFilter = class AllExceptionsFilter {
    monitoring;
    constructor(monitoring) {
        this.monitoring = monitoring;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            message = exception.getResponse();
        }
        const errorMessage = exception instanceof Error ? exception.message : 'Unknown error';
        const errorResponse = {
            statusCode: status,
            message: typeof message === 'string' ? message : message.message || message,
            error: typeof message === 'string' ? undefined : message.error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        if (status >= 500 && this.monitoring) {
            const context = {
                url: request.url,
                method: request.method,
                ip: request.ip,
                body: request.body,
                query: request.query,
                params: request.params,
            };
            if (exception instanceof Error) {
                this.monitoring.captureException(exception, context);
            }
        }
        response.status(status).json(errorResponse);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [monitoring_service_1.MonitoringService])
], AllExceptionsFilter);
//# sourceMappingURL=http-exception.filter.js.map