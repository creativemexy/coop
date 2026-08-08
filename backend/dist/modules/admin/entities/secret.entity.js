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
exports.Secret = exports.SecretCategory = void 0;
const typeorm_1 = require("typeorm");
var SecretCategory;
(function (SecretCategory) {
    SecretCategory["API_KEY"] = "api_key";
    SecretCategory["WEBHOOK_SECRET"] = "webhook_secret";
    SecretCategory["ENCRYPTION_KEY"] = "encryption_key";
    SecretCategory["DATABASE"] = "database";
    SecretCategory["SMTP"] = "smtp";
    SecretCategory["PAYMENT_GATEWAY"] = "payment_gateway";
    SecretCategory["OTHER"] = "other";
})(SecretCategory || (exports.SecretCategory = SecretCategory = {}));
let Secret = class Secret {
    id;
    key;
    encryptedValue;
    category;
    description;
    tenantId;
    isRotationEnabled;
    lastRotatedAt;
    rotationIntervalDays;
    createdBy;
    updatedBy;
    expiresAt;
    createdAt;
    updatedAt;
};
exports.Secret = Secret;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Secret.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], Secret.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'encrypted_value' }),
    __metadata("design:type", String)
], Secret.prototype, "encryptedValue", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SecretCategory,
        default: SecretCategory.OTHER,
    }),
    __metadata("design:type", String)
], Secret.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Secret.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'tenant_id', nullable: true }),
    __metadata("design:type", String)
], Secret.prototype, "tenantId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_rotation_enabled', default: false }),
    __metadata("design:type", Boolean)
], Secret.prototype, "isRotationEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'last_rotated_at', nullable: true }),
    __metadata("design:type", Date)
], Secret.prototype, "lastRotatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'rotation_interval_days', nullable: true }),
    __metadata("design:type", Number)
], Secret.prototype, "rotationIntervalDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], Secret.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'updated_by', nullable: true }),
    __metadata("design:type", String)
], Secret.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expires_at', nullable: true }),
    __metadata("design:type", Date)
], Secret.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Secret.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Secret.prototype, "updatedAt", void 0);
exports.Secret = Secret = __decorate([
    (0, typeorm_1.Entity)('secrets')
], Secret);
//# sourceMappingURL=secret.entity.js.map