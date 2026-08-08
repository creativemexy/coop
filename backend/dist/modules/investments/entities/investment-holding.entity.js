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
exports.InvestmentHolding = void 0;
const typeorm_1 = require("typeorm");
const investment_product_entity_1 = require("./investment-product.entity");
let InvestmentHolding = class InvestmentHolding {
    id;
    userId;
    productId;
    product;
    orderId;
    units;
    costBasis;
    currentValue;
    lockedUntil;
    maturityDate;
    isLocked;
    isActive;
    createdAt;
    updatedAt;
};
exports.InvestmentHolding = InvestmentHolding;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InvestmentHolding.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], InvestmentHolding.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id' }),
    __metadata("design:type", String)
], InvestmentHolding.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => investment_product_entity_1.InvestmentProduct),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", investment_product_entity_1.InvestmentProduct)
], InvestmentHolding.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'order_id' }),
    __metadata("design:type", String)
], InvestmentHolding.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InvestmentHolding.prototype, "units", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'cost_basis' }),
    __metadata("design:type", Number)
], InvestmentHolding.prototype, "costBasis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'current_value', nullable: true }),
    __metadata("design:type", Object)
], InvestmentHolding.prototype, "currentValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'locked_until', nullable: true }),
    __metadata("design:type", Object)
], InvestmentHolding.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'maturity_date', nullable: true }),
    __metadata("design:type", Object)
], InvestmentHolding.prototype, "maturityDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_locked' }),
    __metadata("design:type", Boolean)
], InvestmentHolding.prototype, "isLocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true, name: 'is_active' }),
    __metadata("design:type", Boolean)
], InvestmentHolding.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InvestmentHolding.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InvestmentHolding.prototype, "updatedAt", void 0);
exports.InvestmentHolding = InvestmentHolding = __decorate([
    (0, typeorm_1.Entity)('investment_holdings')
], InvestmentHolding);
//# sourceMappingURL=investment-holding.entity.js.map