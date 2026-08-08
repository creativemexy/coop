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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfGuard = exports.SkipCsrf = exports.SKIP_CSRF_KEY = exports.CSRF_HEADER = exports.CSRF_COOKIE = void 0;
exports.generateCsrfSecret = generateCsrfSecret;
exports.generateCsrfToken = generateCsrfToken;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const csrf_1 = __importDefault(require("csrf"));
const tokens = new csrf_1.default();
function generateCsrfSecret() {
    return tokens.secretSync();
}
function generateCsrfToken(secret) {
    return tokens.create(secret);
}
function validateCsrfToken(secret, token) {
    return tokens.verify(secret, token);
}
exports.CSRF_COOKIE = 'csrf-secret';
exports.CSRF_HEADER = 'x-csrf-token';
exports.SKIP_CSRF_KEY = 'skipCsrf';
const SkipCsrf = () => (0, common_1.SetMetadata)(exports.SKIP_CSRF_KEY, true);
exports.SkipCsrf = SkipCsrf;
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
let CsrfGuard = class CsrfGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const skip = this.reflector.getAllAndOverride(exports.SKIP_CSRF_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skip)
            return true;
        const req = context.switchToHttp().getRequest();
        if (SAFE_METHODS.includes(req.method))
            return true;
        const secret = req.cookies?.[exports.CSRF_COOKIE];
        if (!secret) {
            throw new common_1.ForbiddenException('CSRF token missing');
        }
        const headerToken = req.headers[exports.CSRF_HEADER];
        if (!headerToken || !validateCsrfToken(secret, headerToken)) {
            throw new common_1.ForbiddenException('Invalid CSRF token');
        }
        return true;
    }
};
exports.CsrfGuard = CsrfGuard;
exports.CsrfGuard = CsrfGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CsrfGuard);
//# sourceMappingURL=csrf.guard.js.map