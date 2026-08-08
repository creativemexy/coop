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
exports.KycSubmission = void 0;
const typeorm_1 = require("typeorm");
const status_enum_1 = require("../../../common/enums/status.enum");
const status_enum_2 = require("../../../common/enums/status.enum");
let KycSubmission = class KycSubmission {
    id;
    userId;
    provider;
    identityType;
    reference;
    status;
    rejectionReason;
    providerResponse;
    submittedAt;
    processedAt;
    createdAt;
    updatedAt;
};
exports.KycSubmission = KycSubmission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], KycSubmission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], KycSubmission.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: status_enum_1.KycProvider, default: status_enum_1.KycProvider.KORAPAY }),
    __metadata("design:type", String)
], KycSubmission.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'bvn' }),
    __metadata("design:type", String)
], KycSubmission.prototype, "identityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], KycSubmission.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: status_enum_2.KycStatus, default: status_enum_2.KycStatus.PENDING }),
    __metadata("design:type", String)
], KycSubmission.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'rejection_reason', nullable: true }),
    __metadata("design:type", String)
], KycSubmission.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'provider_response', nullable: true }),
    __metadata("design:type", Object)
], KycSubmission.prototype, "providerResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        name: 'submitted_at',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], KycSubmission.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'processed_at', nullable: true }),
    __metadata("design:type", Date)
], KycSubmission.prototype, "processedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], KycSubmission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], KycSubmission.prototype, "updatedAt", void 0);
exports.KycSubmission = KycSubmission = __decorate([
    (0, typeorm_1.Entity)('kyc_submissions')
], KycSubmission);
//# sourceMappingURL=kyc-submission.entity.js.map