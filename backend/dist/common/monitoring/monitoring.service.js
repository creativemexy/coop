"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Sentry = __importStar(require("@sentry/node"));
let MonitoringService = MonitoringService_1 = class MonitoringService {
    configService;
    logger = new common_1.Logger(MonitoringService_1.name);
    initialized = false;
    constructor(configService) {
        this.configService = configService;
        const dsn = this.configService.get('SENTRY_DSN');
        if (dsn) {
            Sentry.init({
                dsn,
                environment: this.configService.get('NODE_ENV') || 'development',
                tracesSampleRate: 0.1,
                integrations: [],
            });
            this.initialized = true;
            this.logger.log('Sentry initialized');
        }
    }
    captureException(error, context) {
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
    captureMessage(message, level = 'info', context) {
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
    captureSecurityEvent(event, userId, metadata) {
        this.captureMessage(`[SECURITY] ${event}`, 'warning', {
            userId,
            ...metadata,
            securityEvent: true,
        });
    }
    setUser(userId, email) {
        if (!this.initialized)
            return;
        Sentry.setUser({ id: userId, email });
    }
    clearUser() {
        if (!this.initialized)
            return;
        Sentry.setUser(null);
    }
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = MonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map