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
exports.BnplPlanConfig = exports.LateFeeType = exports.DueDateRule = exports.InterestModel = void 0;
const typeorm_1 = require("typeorm");
var InterestModel;
(function (InterestModel) {
    InterestModel["FIXED_MONTHLY_FEE"] = "fixed_monthly_fee";
    InterestModel["REDUCING_BALANCE"] = "reducing_balance";
    InterestModel["SIMPLE"] = "simple";
})(InterestModel || (exports.InterestModel = InterestModel = {}));
var DueDateRule;
(function (DueDateRule) {
    DueDateRule["SAME_DAY_MONTHLY"] = "same_day_monthly";
    DueDateRule["END_OF_MONTH"] = "end_of_month";
})(DueDateRule || (exports.DueDateRule = DueDateRule = {}));
var LateFeeType;
(function (LateFeeType) {
    LateFeeType["PERCENTAGE"] = "percentage";
    LateFeeType["FLAT"] = "flat";
})(LateFeeType || (exports.LateFeeType = LateFeeType = {}));
let BnplPlanConfig = class BnplPlanConfig {
    id;
    organizationId;
    availableTenors;
    interestModel;
    maxPrincipal;
    requireMembership;
    dueDateRule;
    gracePeriodDays;
    lateFeeType;
    lateFeeValue;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
};
exports.BnplPlanConfig = BnplPlanConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BnplPlanConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'organization_id', unique: true }),
    __metadata("design:type", String)
], BnplPlanConfig.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'available_tenors' }),
    __metadata("design:type", Array)
], BnplPlanConfig.prototype, "availableTenors", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InterestModel,
        name: 'interest_model',
        default: InterestModel.SIMPLE,
    }),
    __metadata("design:type", String)
], BnplPlanConfig.prototype, "interestModel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        name: 'max_principal',
        precision: 15,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], BnplPlanConfig.prototype, "maxPrincipal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'require_membership', default: false }),
    __metadata("design:type", Boolean)
], BnplPlanConfig.prototype, "requireMembership", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DueDateRule,
        name: 'due_date_rule',
        default: DueDateRule.SAME_DAY_MONTHLY,
    }),
    __metadata("design:type", String)
], BnplPlanConfig.prototype, "dueDateRule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'grace_period_days', default: 0 }),
    __metadata("design:type", Number)
], BnplPlanConfig.prototype, "gracePeriodDays", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LateFeeType,
        name: 'late_fee_type',
        default: LateFeeType.PERCENTAGE,
    }),
    __metadata("design:type", String)
], BnplPlanConfig.prototype, "lateFeeType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        name: 'late_fee_value',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], BnplPlanConfig.prototype, "lateFeeValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], BnplPlanConfig.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'updated_by', nullable: true }),
    __metadata("design:type", String)
], BnplPlanConfig.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BnplPlanConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BnplPlanConfig.prototype, "updatedAt", void 0);
exports.BnplPlanConfig = BnplPlanConfig = __decorate([
    (0, typeorm_1.Entity)('bnpl_plan_configs')
], BnplPlanConfig);
//# sourceMappingURL=bnpl-plan-config.entity.js.map