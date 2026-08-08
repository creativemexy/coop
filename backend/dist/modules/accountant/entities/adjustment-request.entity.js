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
exports.AdjustmentRequest = exports.AdjustmentStatus = exports.AdjustmentType = void 0;
const typeorm_1 = require("typeorm");
var AdjustmentType;
(function (AdjustmentType) {
    AdjustmentType["METADATA_CORRECTION"] = "metadata_correction";
    AdjustmentType["JOURNAL_ENTRY"] = "journal_entry";
})(AdjustmentType || (exports.AdjustmentType = AdjustmentType = {}));
var AdjustmentStatus;
(function (AdjustmentStatus) {
    AdjustmentStatus["PENDING"] = "pending";
    AdjustmentStatus["APPROVED"] = "approved";
    AdjustmentStatus["REJECTED"] = "rejected";
})(AdjustmentStatus || (exports.AdjustmentStatus = AdjustmentStatus = {}));
let AdjustmentRequest = class AdjustmentRequest {
    id;
    adjustmentType;
    description;
    reasonCode;
    changes;
    referenceType;
    referenceId;
    status;
    rejectionReason;
    requestedBy;
    reviewedBy;
    reviewedAt;
    createdAt;
    updatedAt;
};
exports.AdjustmentRequest = AdjustmentRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AdjustmentType,
        name: 'adjustment_type',
    }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "adjustmentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'reason_code' }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "reasonCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'changes' }),
    __metadata("design:type", Object)
], AdjustmentRequest.prototype, "changes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'reference_type', nullable: true }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reference_id', nullable: true }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AdjustmentStatus,
        default: AdjustmentStatus.PENDING,
    }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'rejection_reason', nullable: true }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'requested_by' }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reviewed_by', nullable: true }),
    __metadata("design:type", String)
], AdjustmentRequest.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'reviewed_at', nullable: true }),
    __metadata("design:type", Date)
], AdjustmentRequest.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], AdjustmentRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], AdjustmentRequest.prototype, "updatedAt", void 0);
exports.AdjustmentRequest = AdjustmentRequest = __decorate([
    (0, typeorm_1.Entity)('adjustment_requests')
], AdjustmentRequest);
//# sourceMappingURL=adjustment-request.entity.js.map