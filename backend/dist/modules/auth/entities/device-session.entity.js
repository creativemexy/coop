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
exports.DeviceSession = void 0;
const typeorm_1 = require("typeorm");
let DeviceSession = class DeviceSession {
    id;
    userId;
    deviceFingerprint;
    deviceName;
    deviceType;
    os;
    browser;
    ipAddress;
    isTrusted;
    lastUsedAt;
    createdAt;
    updatedAt;
};
exports.DeviceSession = DeviceSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeviceSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], DeviceSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'device_fingerprint', length: 255 }),
    __metadata("design:type", String)
], DeviceSession.prototype, "deviceFingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'device_name', nullable: true, length: 255 }),
    __metadata("design:type", String)
], DeviceSession.prototype, "deviceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'device_type', nullable: true, length: 50 }),
    __metadata("design:type", String)
], DeviceSession.prototype, "deviceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'os', nullable: true, length: 100 }),
    __metadata("design:type", String)
], DeviceSession.prototype, "os", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'browser', nullable: true, length: 100 }),
    __metadata("design:type", String)
], DeviceSession.prototype, "browser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'ip_address', nullable: true, length: 45 }),
    __metadata("design:type", String)
], DeviceSession.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_trusted', default: false }),
    __metadata("design:type", Boolean)
], DeviceSession.prototype, "isTrusted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        name: 'last_used_at',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], DeviceSession.prototype, "lastUsedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DeviceSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DeviceSession.prototype, "updatedAt", void 0);
exports.DeviceSession = DeviceSession = __decorate([
    (0, typeorm_1.Entity)('device_sessions')
], DeviceSession);
//# sourceMappingURL=device-session.entity.js.map