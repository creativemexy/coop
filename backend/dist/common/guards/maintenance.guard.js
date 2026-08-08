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
exports.MaintenanceGuard = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("../../modules/settings/settings.service");
const ALLOWED_PATHS = [
    { method: 'GET', path: '/api/v1/savings' },
    { method: 'POST', path: '/api/v1/savings/deposit' },
];
let MaintenanceGuard = class MaintenanceGuard {
    settings;
    constructor(settings) {
        this.settings = settings;
    }
    async canActivate(context) {
        const maintenanceMode = await this.settings.getValue('maintenance_mode');
        if (maintenanceMode !== 'true')
            return true;
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (user?.role === 'super_admin')
            return true;
        const method = req.method;
        const path = req.path || req.route?.path || '';
        for (const allowed of ALLOWED_PATHS) {
            if (method === allowed.method && path.startsWith(allowed.path)) {
                return true;
            }
        }
        throw new common_1.ServiceUnavailableException('Platform is under maintenance. Only savings and deposits are available.');
    }
};
exports.MaintenanceGuard = MaintenanceGuard;
exports.MaintenanceGuard = MaintenanceGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], MaintenanceGuard);
//# sourceMappingURL=maintenance.guard.js.map