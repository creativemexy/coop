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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DeviceSessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceSessionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const device_session_entity_1 = require("./entities/device-session.entity");
let DeviceSessionService = DeviceSessionService_1 = class DeviceSessionService {
    repo;
    logger = new common_1.Logger(DeviceSessionService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async checkDevice(userId, deviceFingerprint, deviceInfo) {
        const existing = await this.repo.findOne({
            where: { userId, deviceFingerprint },
        });
        if (existing) {
            existing.lastUsedAt = new Date();
            if (deviceInfo?.ipAddress)
                existing.ipAddress = deviceInfo.ipAddress;
            await this.repo.save(existing);
            return {
                isNewDevice: false,
                isTrusted: existing.isTrusted,
                deviceSession: existing,
            };
        }
        const session = this.repo.create({
            userId,
            deviceFingerprint,
            deviceName: deviceInfo?.deviceName || 'Unknown',
            deviceType: deviceInfo?.deviceType || 'unknown',
            os: deviceInfo?.os || '',
            browser: deviceInfo?.browser || '',
            ipAddress: deviceInfo?.ipAddress || '',
            isTrusted: false,
            lastUsedAt: new Date(),
        });
        const saved = await this.repo.save(session);
        this.logger.warn(`New device login detected for user ${userId}: ${saved.deviceName} (${saved.deviceType})`);
        return { isNewDevice: true, isTrusted: false, deviceSession: saved };
    }
    async trustDevice(userId, deviceFingerprint) {
        await this.repo.update({ userId, deviceFingerprint }, { isTrusted: true });
    }
    async removeDevice(userId, deviceFingerprint) {
        await this.repo.delete({ userId, deviceFingerprint });
    }
    async getUserDevices(userId) {
        return this.repo.find({
            where: { userId },
            order: { lastUsedAt: 'DESC' },
        });
    }
    async removeAllDevices(userId, exceptFingerprint) {
        if (exceptFingerprint) {
            await this.repo.delete({ userId, deviceFingerprint: exceptFingerprint });
        }
        else {
            await this.repo.delete({ userId });
        }
    }
};
exports.DeviceSessionService = DeviceSessionService;
exports.DeviceSessionService = DeviceSessionService = DeviceSessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(device_session_entity_1.DeviceSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DeviceSessionService);
//# sourceMappingURL=device-session.service.js.map