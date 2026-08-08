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
exports.InvestmentEligibilityRule = exports.KycLevel = void 0;
const typeorm_1 = require("typeorm");
const investment_product_entity_1 = require("./investment-product.entity");
var KycLevel;
(function (KycLevel) {
    KycLevel["NONE"] = "none";
    KycLevel["BASIC"] = "basic";
    KycLevel["ADVANCED"] = "advanced";
})(KycLevel || (exports.KycLevel = KycLevel = {}));
let InvestmentEligibilityRule = class InvestmentEligibilityRule {
    id;
    productId;
    product;
    kycRequiredLevel;
    requireMembership;
    allowedGeographies;
    accreditationRequired;
    investorWhitelist;
    investorBlacklist;
    createdAt;
    updatedAt;
};
exports.InvestmentEligibilityRule = InvestmentEligibilityRule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InvestmentEligibilityRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id' }),
    __metadata("design:type", String)
], InvestmentEligibilityRule.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => investment_product_entity_1.InvestmentProduct),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", investment_product_entity_1.InvestmentProduct)
], InvestmentEligibilityRule.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: KycLevel, name: 'kyc_required_level', default: KycLevel.BASIC }),
    __metadata("design:type", String)
], InvestmentEligibilityRule.prototype, "kycRequiredLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'require_membership', default: false }),
    __metadata("design:type", Boolean)
], InvestmentEligibilityRule.prototype, "requireMembership", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'allowed_geographies', nullable: true }),
    __metadata("design:type", Object)
], InvestmentEligibilityRule.prototype, "allowedGeographies", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'accreditation_required', default: false }),
    __metadata("design:type", Boolean)
], InvestmentEligibilityRule.prototype, "accreditationRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'investor_whitelist', nullable: true }),
    __metadata("design:type", Object)
], InvestmentEligibilityRule.prototype, "investorWhitelist", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'investor_blacklist', nullable: true }),
    __metadata("design:type", Object)
], InvestmentEligibilityRule.prototype, "investorBlacklist", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InvestmentEligibilityRule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InvestmentEligibilityRule.prototype, "updatedAt", void 0);
exports.InvestmentEligibilityRule = InvestmentEligibilityRule = __decorate([
    (0, typeorm_1.Entity)('investment_eligibility_rules')
], InvestmentEligibilityRule);
//# sourceMappingURL=investment-eligibility-rule.entity.js.map