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
exports.TenantOnboardingRequest = exports.OnboardingStatus = void 0;
const typeorm_1 = require("typeorm");
var OnboardingStatus;
(function (OnboardingStatus) {
    OnboardingStatus["DRAFT"] = "draft";
    OnboardingStatus["SUBMITTED"] = "submitted";
    OnboardingStatus["COMPLIANCE_REVIEW"] = "compliance_review";
    OnboardingStatus["APPROVED"] = "approved";
    OnboardingStatus["REJECTED"] = "rejected";
    OnboardingStatus["ONBOARDED"] = "onboarded";
})(OnboardingStatus || (exports.OnboardingStatus = OnboardingStatus = {}));
let TenantOnboardingRequest = class TenantOnboardingRequest {
    id;
    orgName;
    orgCode;
    apexOrgId;
    status;
    complianceDocs;
    kycRequirements;
    productConfig;
    contactInfo;
    rejectionReason;
    reviewNotes;
    submittedBy;
    reviewedBy;
    reviewedAt;
    onboardedAt;
    createdAt;
    updatedAt;
};
exports.TenantOnboardingRequest = TenantOnboardingRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'org_name' }),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "orgName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'org_code' }),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "orgCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'apex_org_id' }),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "apexOrgId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: OnboardingStatus,
        default: OnboardingStatus.DRAFT,
    }),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'compliance_docs', nullable: true }),
    __metadata("design:type", Object)
], TenantOnboardingRequest.prototype, "complianceDocs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'kyc_requirements', nullable: true }),
    __metadata("design:type", Object)
], TenantOnboardingRequest.prototype, "kycRequirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'product_config', nullable: true }),
    __metadata("design:type", Object)
], TenantOnboardingRequest.prototype, "productConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'contact_info', nullable: true }),
    __metadata("design:type", Object)
], TenantOnboardingRequest.prototype, "contactInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'rejection_reason', nullable: true }),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'review_notes', nullable: true }),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "reviewNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'submitted_by' }),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "submittedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reviewed_by', nullable: true }),
    __metadata("design:type", String)
], TenantOnboardingRequest.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'reviewed_at', nullable: true }),
    __metadata("design:type", Date)
], TenantOnboardingRequest.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'onboarded_at', nullable: true }),
    __metadata("design:type", Date)
], TenantOnboardingRequest.prototype, "onboardedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TenantOnboardingRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TenantOnboardingRequest.prototype, "updatedAt", void 0);
exports.TenantOnboardingRequest = TenantOnboardingRequest = __decorate([
    (0, typeorm_1.Entity)('tenant_onboarding_requests')
], TenantOnboardingRequest);
//# sourceMappingURL=tenant-onboarding-request.entity.js.map