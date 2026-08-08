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
exports.ApprovalRequest = exports.ApprovalStatus = exports.ApprovalRequestType = void 0;
const typeorm_1 = require("typeorm");
var ApprovalRequestType;
(function (ApprovalRequestType) {
    ApprovalRequestType["PRODUCT_CHANGE"] = "product_change";
    ApprovalRequestType["MANUAL_OVERRIDE"] = "manual_override";
    ApprovalRequestType["USER_SUSPENSION"] = "user_suspension";
    ApprovalRequestType["WRITE_OFF"] = "write_off";
    ApprovalRequestType["RESTRUCTURING"] = "restructuring";
    ApprovalRequestType["ELIGIBILITY_EXCEPTION"] = "eligibility_exception";
    ApprovalRequestType["TENANT_PRODUCT_ENABLEMENT"] = "tenant_product_enablement";
    ApprovalRequestType["POLICY_TEMPLATE_CHANGE"] = "policy_template_change";
})(ApprovalRequestType || (exports.ApprovalRequestType = ApprovalRequestType = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "pending";
    ApprovalStatus["APPROVED"] = "approved";
    ApprovalStatus["REJECTED"] = "rejected";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
let ApprovalRequest = class ApprovalRequest {
    id;
    requestType;
    status;
    requestData;
    reason;
    rejectionReason;
    requestedBy;
    reviewedBy;
    reviewedAt;
    createdAt;
    updatedAt;
};
exports.ApprovalRequest = ApprovalRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ApprovalRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ApprovalRequestType,
        name: 'request_type',
    }),
    __metadata("design:type", String)
], ApprovalRequest.prototype, "requestType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ApprovalStatus,
        default: ApprovalStatus.PENDING,
    }),
    __metadata("design:type", String)
], ApprovalRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'request_data' }),
    __metadata("design:type", Object)
], ApprovalRequest.prototype, "requestData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ApprovalRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'rejection_reason', nullable: true }),
    __metadata("design:type", String)
], ApprovalRequest.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'requested_by' }),
    __metadata("design:type", String)
], ApprovalRequest.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reviewed_by', nullable: true }),
    __metadata("design:type", String)
], ApprovalRequest.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'reviewed_at', nullable: true }),
    __metadata("design:type", Date)
], ApprovalRequest.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ApprovalRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ApprovalRequest.prototype, "updatedAt", void 0);
exports.ApprovalRequest = ApprovalRequest = __decorate([
    (0, typeorm_1.Entity)('bnpl_approval_requests')
], ApprovalRequest);
//# sourceMappingURL=approval-request.entity.js.map