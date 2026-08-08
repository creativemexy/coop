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
exports.PricingConfig = exports.AccrualMethod = exports.NavSchedule = exports.PricingFormula = void 0;
const typeorm_1 = require("typeorm");
var PricingFormula;
(function (PricingFormula) {
    PricingFormula["SIMPLE"] = "simple";
    PricingFormula["NAV_BASED"] = "nav_based";
})(PricingFormula || (exports.PricingFormula = PricingFormula = {}));
var NavSchedule;
(function (NavSchedule) {
    NavSchedule["DAILY"] = "daily";
    NavSchedule["WEEKLY"] = "weekly";
    NavSchedule["MONTHLY"] = "monthly";
})(NavSchedule || (exports.NavSchedule = NavSchedule = {}));
var AccrualMethod;
(function (AccrualMethod) {
    AccrualMethod["SIMPLE"] = "simple";
    AccrualMethod["COMPOUND"] = "compound";
})(AccrualMethod || (exports.AccrualMethod = AccrualMethod = {}));
let PricingConfig = class PricingConfig {
    id;
    productId;
    formulaType;
    minUnitPrice;
    maxUnitPrice;
    navSchedule;
    allowCorporateActions;
    distributionApprovalRequired;
    accrualMethod;
    createdAt;
    updatedAt;
};
exports.PricingConfig = PricingConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PricingConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id', unique: true }),
    __metadata("design:type", String)
], PricingConfig.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PricingFormula, default: PricingFormula.SIMPLE, name: 'formula_type' }),
    __metadata("design:type", String)
], PricingConfig.prototype, "formulaType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'min_unit_price', nullable: true }),
    __metadata("design:type", Object)
], PricingConfig.prototype, "minUnitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'max_unit_price', nullable: true }),
    __metadata("design:type", Object)
], PricingConfig.prototype, "maxUnitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: NavSchedule, nullable: true, name: 'nav_schedule' }),
    __metadata("design:type", Object)
], PricingConfig.prototype, "navSchedule", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'allow_corporate_actions' }),
    __metadata("design:type", Boolean)
], PricingConfig.prototype, "allowCorporateActions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'distribution_approval_required' }),
    __metadata("design:type", Boolean)
], PricingConfig.prototype, "distributionApprovalRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AccrualMethod, default: AccrualMethod.SIMPLE, name: 'accrual_method' }),
    __metadata("design:type", String)
], PricingConfig.prototype, "accrualMethod", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PricingConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PricingConfig.prototype, "updatedAt", void 0);
exports.PricingConfig = PricingConfig = __decorate([
    (0, typeorm_1.Entity)('investment_pricing_config')
], PricingConfig);
//# sourceMappingURL=pricing-config.entity.js.map