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
exports.PolicyTemplate = exports.PolicyTemplateStatus = exports.PolicyTemplateType = void 0;
const typeorm_1 = require("typeorm");
var PolicyTemplateType;
(function (PolicyTemplateType) {
    PolicyTemplateType["BNPL_PRODUCT"] = "bnpl_product";
    PolicyTemplateType["KYC_REQUIREMENT"] = "kyc_requirement";
    PolicyTemplateType["MANAGER_ACTION"] = "manager_action";
    PolicyTemplateType["INTEREST_RATE"] = "interest_rate";
    PolicyTemplateType["COLLECTION"] = "collection";
})(PolicyTemplateType || (exports.PolicyTemplateType = PolicyTemplateType = {}));
var PolicyTemplateStatus;
(function (PolicyTemplateStatus) {
    PolicyTemplateStatus["DRAFT"] = "draft";
    PolicyTemplateStatus["PENDING_APPROVAL"] = "pending_approval";
    PolicyTemplateStatus["ACTIVE"] = "active";
    PolicyTemplateStatus["SUPERSEDED"] = "superseded";
    PolicyTemplateStatus["REJECTED"] = "rejected";
})(PolicyTemplateStatus || (exports.PolicyTemplateStatus = PolicyTemplateStatus = {}));
let PolicyTemplate = class PolicyTemplate {
    id;
    name;
    description;
    templateType;
    version;
    status;
    rules;
    metadata;
    createdBy;
    approvedBy;
    approvedAt;
    changeSummary;
    supersededBy;
    parentTemplateId;
    isApplicableToAllTenants;
    applicableTenantIds;
    createdAt;
    updatedAt;
};
exports.PolicyTemplate = PolicyTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PolicyTemplateType,
        name: 'template_type',
    }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "templateType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'version', default: 1 }),
    __metadata("design:type", Number)
], PolicyTemplate.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PolicyTemplateStatus,
        default: PolicyTemplateStatus.DRAFT,
    }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'rules' }),
    __metadata("design:type", Object)
], PolicyTemplate.prototype, "rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'metadata', nullable: true }),
    __metadata("design:type", Object)
], PolicyTemplate.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'approved_by', nullable: true }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'approved_at', nullable: true }),
    __metadata("design:type", Date)
], PolicyTemplate.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'change_summary', nullable: true }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "changeSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'superseded_by', nullable: true }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "supersededBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'parent_template_id', nullable: true }),
    __metadata("design:type", String)
], PolicyTemplate.prototype, "parentTemplateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_applicable_to_all_tenants', default: true }),
    __metadata("design:type", Boolean)
], PolicyTemplate.prototype, "isApplicableToAllTenants", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', name: 'applicable_tenant_ids', nullable: true }),
    __metadata("design:type", Array)
], PolicyTemplate.prototype, "applicableTenantIds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PolicyTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PolicyTemplate.prototype, "updatedAt", void 0);
exports.PolicyTemplate = PolicyTemplate = __decorate([
    (0, typeorm_1.Entity)('policy_templates')
], PolicyTemplate);
//# sourceMappingURL=policy-template.entity.js.map