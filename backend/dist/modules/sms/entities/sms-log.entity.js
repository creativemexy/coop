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
exports.SmsLog = void 0;
const typeorm_1 = require("typeorm");
const status_enum_1 = require("../../../common/enums/status.enum");
let SmsLog = class SmsLog {
    id;
    recipient;
    message;
    eventType;
    provider;
    status;
    providerResponse;
    createdAt;
};
exports.SmsLog = SmsLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SmsLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], SmsLog.prototype, "recipient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SmsLog.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'event_type', length: 50 }),
    __metadata("design:type", String)
], SmsLog.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: status_enum_1.SmsProvider, default: status_enum_1.SmsProvider.TERMII }),
    __metadata("design:type", String)
], SmsLog.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: status_enum_1.SmsStatus, default: status_enum_1.SmsStatus.SENT }),
    __metadata("design:type", String)
], SmsLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'provider_response', nullable: true }),
    __metadata("design:type", Object)
], SmsLog.prototype, "providerResponse", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SmsLog.prototype, "createdAt", void 0);
exports.SmsLog = SmsLog = __decorate([
    (0, typeorm_1.Entity)('sms_logs')
], SmsLog);
//# sourceMappingURL=sms-log.entity.js.map