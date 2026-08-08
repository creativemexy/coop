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
exports.InvestmentProduct = exports.VALID_LIFECYCLE_TRANSITIONS = exports.ProductStatus = exports.DistributionFrequency = exports.RiskTier = exports.InvestmentType = void 0;
const typeorm_1 = require("typeorm");
var InvestmentType;
(function (InvestmentType) {
    InvestmentType["SHARES"] = "shares";
    InvestmentType["FIXED_INCOME"] = "fixed_income";
    InvestmentType["POOLED"] = "pooled";
})(InvestmentType || (exports.InvestmentType = InvestmentType = {}));
var RiskTier;
(function (RiskTier) {
    RiskTier["LOW"] = "low";
    RiskTier["MEDIUM"] = "medium";
    RiskTier["HIGH"] = "high";
})(RiskTier || (exports.RiskTier = RiskTier = {}));
var DistributionFrequency;
(function (DistributionFrequency) {
    DistributionFrequency["MONTHLY"] = "monthly";
    DistributionFrequency["QUARTERLY"] = "quarterly";
    DistributionFrequency["ANNUALLY"] = "annually";
    DistributionFrequency["MATURITY"] = "maturity";
})(DistributionFrequency || (exports.DistributionFrequency = DistributionFrequency = {}));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["DRAFT"] = "draft";
    ProductStatus["PENDING_REVIEW"] = "pending_review";
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["SUSPENDED"] = "suspended";
    ProductStatus["CLOSED"] = "closed";
    ProductStatus["ARCHIVED"] = "archived";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
exports.VALID_LIFECYCLE_TRANSITIONS = {
    [ProductStatus.DRAFT]: [ProductStatus.PENDING_REVIEW, ProductStatus.ARCHIVED],
    [ProductStatus.PENDING_REVIEW]: [ProductStatus.ACTIVE, ProductStatus.DRAFT],
    [ProductStatus.ACTIVE]: [ProductStatus.SUSPENDED, ProductStatus.CLOSED],
    [ProductStatus.SUSPENDED]: [ProductStatus.ACTIVE, ProductStatus.CLOSED],
    [ProductStatus.CLOSED]: [ProductStatus.ARCHIVED],
    [ProductStatus.ARCHIVED]: [],
};
let InvestmentProduct = class InvestmentProduct {
    id;
    name;
    description;
    type;
    riskTier;
    minimumInvestment;
    maximumInvestment;
    totalCapacity;
    currentCapacity;
    perInvestorCaps;
    unitPrice;
    lockInDays;
    tenorDays;
    managementFeeRate;
    expectedReturnRate;
    profitSharingRules;
    distributionFrequency;
    totalUnits;
    availableUnits;
    isOpen;
    status;
    version;
    organizationId;
    createdBy;
    createdAt;
    updatedAt;
};
exports.InvestmentProduct = InvestmentProduct;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InvestmentProduct.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], InvestmentProduct.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: InvestmentType }),
    __metadata("design:type", String)
], InvestmentProduct.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RiskTier, default: RiskTier.MEDIUM }),
    __metadata("design:type", String)
], InvestmentProduct.prototype, "riskTier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'minimum_investment', default: 0 }),
    __metadata("design:type", Number)
], InvestmentProduct.prototype, "minimumInvestment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'maximum_investment', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "maximumInvestment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'total_capacity', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "totalCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'current_capacity', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "currentCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'per_investor_caps', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "perInvestorCaps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'lock_in_days', default: 0 }),
    __metadata("design:type", Number)
], InvestmentProduct.prototype, "lockInDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'tenor_days', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "tenorDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'management_fee_rate', default: 0 }),
    __metadata("design:type", Number)
], InvestmentProduct.prototype, "managementFeeRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'expected_return_rate', default: 0 }),
    __metadata("design:type", Number)
], InvestmentProduct.prototype, "expectedReturnRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'profit_sharing_rules', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "profitSharingRules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DistributionFrequency, default: DistributionFrequency.MATURITY }),
    __metadata("design:type", String)
], InvestmentProduct.prototype, "distributionFrequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_units', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "totalUnits", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'available_units', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "availableUnits", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_open' }),
    __metadata("design:type", Boolean)
], InvestmentProduct.prototype, "isOpen", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE }),
    __metadata("design:type", String)
], InvestmentProduct.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], InvestmentProduct.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'organization_id', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by', nullable: true }),
    __metadata("design:type", Object)
], InvestmentProduct.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InvestmentProduct.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InvestmentProduct.prototype, "updatedAt", void 0);
exports.InvestmentProduct = InvestmentProduct = __decorate([
    (0, typeorm_1.Entity)('investment_products')
], InvestmentProduct);
//# sourceMappingURL=investment-product.entity.js.map