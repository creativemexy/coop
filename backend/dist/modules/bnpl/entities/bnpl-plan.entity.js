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
exports.BnplPlan = exports.PlanStatus = exports.InterestType = void 0;
const typeorm_1 = require("typeorm");
const bnpl_catalog_item_entity_1 = require("./bnpl-catalog-item.entity");
const bnpl_subscription_entity_1 = require("./bnpl-subscription.entity");
var InterestType;
(function (InterestType) {
    InterestType["FLAT"] = "flat";
    InterestType["MONTHLY_FEE"] = "monthly_fee";
    InterestType["REDUCING_BALANCE"] = "reducing_balance";
})(InterestType || (exports.InterestType = InterestType = {}));
var PlanStatus;
(function (PlanStatus) {
    PlanStatus["ACTIVE"] = "active";
    PlanStatus["INACTIVE"] = "inactive";
    PlanStatus["RETIRED"] = "retired";
})(PlanStatus || (exports.PlanStatus = PlanStatus = {}));
let BnplPlan = class BnplPlan {
    id;
    organizationId;
    catalogItemId;
    catalogItem;
    tenorOptions;
    minPrincipal;
    maxPrincipal;
    eligibilityBands;
    downPaymentPercent;
    installmentCount;
    installmentFrequency;
    interestType;
    interestRate;
    monthlyFeeRate;
    gracePeriodDays;
    lateFeeRate;
    lateFeeCapDays;
    isEnabled;
    status;
    version;
    createdBy;
    createdAt;
    updatedAt;
    subscriptions;
};
exports.BnplPlan = BnplPlan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BnplPlan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'organization_id' }),
    __metadata("design:type", String)
], BnplPlan.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'catalog_item_id' }),
    __metadata("design:type", String)
], BnplPlan.prototype, "catalogItemId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bnpl_catalog_item_entity_1.BnplCatalogItem, (item) => item.plans),
    (0, typeorm_1.JoinColumn)({ name: 'catalog_item_id' }),
    __metadata("design:type", bnpl_catalog_item_entity_1.BnplCatalogItem)
], BnplPlan.prototype, "catalogItem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'tenor_options', nullable: true }),
    __metadata("design:type", Array)
], BnplPlan.prototype, "tenorOptions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, name: 'min_principal', nullable: true }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "minPrincipal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, name: 'max_principal', nullable: true }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "maxPrincipal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'eligibility_bands', nullable: true }),
    __metadata("design:type", Array)
], BnplPlan.prototype, "eligibilityBands", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        name: 'down_payment_percent',
        precision: 5,
        scale: 2,
    }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "downPaymentPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'installment_count' }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "installmentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'installment_frequency', length: 20 }),
    __metadata("design:type", String)
], BnplPlan.prototype, "installmentFrequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: InterestType, name: 'interest_type', default: InterestType.FLAT }),
    __metadata("design:type", String)
], BnplPlan.prototype, "interestType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "interestRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'monthly_fee_rate', nullable: true }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "monthlyFeeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'grace_period_days', default: 0 }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "gracePeriodDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'late_fee_rate', default: 0 }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "lateFeeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'late_fee_cap_days', nullable: true }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "lateFeeCapDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_enabled', default: true }),
    __metadata("design:type", Boolean)
], BnplPlan.prototype, "isEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PlanStatus, default: PlanStatus.ACTIVE }),
    __metadata("design:type", String)
], BnplPlan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'version', default: 1 }),
    __metadata("design:type", Number)
], BnplPlan.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], BnplPlan.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BnplPlan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BnplPlan.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bnpl_subscription_entity_1.BnplSubscription, (sub) => sub.plan),
    __metadata("design:type", Array)
], BnplPlan.prototype, "subscriptions", void 0);
exports.BnplPlan = BnplPlan = __decorate([
    (0, typeorm_1.Entity)('bnpl_plans')
], BnplPlan);
//# sourceMappingURL=bnpl-plan.entity.js.map