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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const role_enum_1 = require("../../../common/enums/role.enum");
const status_enum_1 = require("../../../common/enums/status.enum");
const apex_organization_entity_1 = require("../../apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("../../organizations/entities/organization.entity");
const encryption_transformer_1 = require("../../../common/encryption.transformer");
let User = class User {
    id;
    email;
    emailHash;
    passwordHash;
    firstName;
    lastName;
    phone;
    phoneHash;
    role;
    apexOrgId;
    apexOrg;
    organizationId;
    organization;
    kycStatus;
    kycReference;
    kycImage;
    kycVerifiedAt;
    socialProvider;
    socialId;
    registrationFeePaid;
    isActive;
    mustChangePassword;
    notificationPreferences;
    referralCode;
    referredBy;
    referralCount;
    referralEarnings;
    refreshTokenHash;
    failedAttempts;
    lockedUntil;
    resetToken;
    resetTokenExpiry;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true, transformer: encryption_transformer_1.encryptColumn }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'email_hash', length: 64, unique: true, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "emailHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'password_hash', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'first_name', length: 255, transformer: encryption_transformer_1.encryptColumn, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'last_name', length: 255, transformer: encryption_transformer_1.encryptColumn, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, transformer: encryption_transformer_1.encryptColumn }),
    __metadata("design:type", Object)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'phone_hash', length: 64, nullable: true, unique: true }),
    __metadata("design:type", Object)
], User.prototype, "phoneHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: role_enum_1.Role }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'apex_org_id', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "apexOrgId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => apex_organization_entity_1.ApexOrganization, (apex) => apex.users),
    (0, typeorm_1.JoinColumn)({ name: 'apex_org_id' }),
    __metadata("design:type", Object)
], User.prototype, "apexOrg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'organization_id', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (org) => org.users),
    (0, typeorm_1.JoinColumn)({ name: 'organization_id' }),
    __metadata("design:type", organization_entity_1.Organization)
], User.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: status_enum_1.KycStatus,
        default: status_enum_1.KycStatus.NONE,
        name: 'kyc_status',
    }),
    __metadata("design:type", String)
], User.prototype, "kycStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'kyc_reference', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "kycReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'kyc_image', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "kycImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'kyc_verified_at', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "kycVerifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'social_provider', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "socialProvider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'social_id', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "socialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'registration_fee_paid', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "registrationFeePaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'must_change_password', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "mustChangePassword", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'notification_preferences', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "notificationPreferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'referral_code', length: 20, nullable: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "referralCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'referred_by', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "referredBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'referral_count', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "referralCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'referral_earnings', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "referralEarnings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'refresh_token_hash', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "refreshTokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'failed_attempts', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "failedAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'locked_until', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'reset_token', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "resetToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'reset_token_expiry', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "resetTokenExpiry", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'deleted_at', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "deletedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map