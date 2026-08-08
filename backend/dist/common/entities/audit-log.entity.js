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
exports.AuditLog = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
var AuditAction;
(function (AuditAction) {
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGIN_FAILED"] = "LOGIN_FAILED";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
    AuditAction["PASSWORD_RESET"] = "PASSWORD_RESET";
    AuditAction["USER_CREATE"] = "USER_CREATE";
    AuditAction["USER_UPDATE"] = "USER_UPDATE";
    AuditAction["USER_DEACTIVATE"] = "USER_DEACTIVATE";
    AuditAction["USER_DELETE"] = "USER_DELETE";
    AuditAction["ROLE_CHANGE"] = "ROLE_CHANGE";
    AuditAction["KYC_SUBMIT"] = "KYC_SUBMIT";
    AuditAction["KYC_APPROVE"] = "KYC_APPROVE";
    AuditAction["KYC_REJECT"] = "KYC_REJECT";
    AuditAction["SETTINGS_CHANGE"] = "SETTINGS_CHANGE";
    AuditAction["BRANDING_CHANGE"] = "BRANDING_CHANGE";
    AuditAction["RETENTION_PURGE"] = "RETENTION_PURGE";
    AuditAction["LOAN_APPROVE"] = "LOAN_APPROVE";
    AuditAction["LOAN_REJECT"] = "LOAN_REJECT";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditLog = class AuditLog {
    id;
    action;
    entityType;
    entityId;
    performedBy;
    metadata;
    ipAddress;
    createdAt;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AuditAction }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'performed_by', nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "performedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs')
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map