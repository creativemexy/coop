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
exports.InvestmentOrder = exports.OrderStatus = void 0;
const typeorm_1 = require("typeorm");
const investment_product_entity_1 = require("./investment-product.entity");
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PLACED"] = "placed";
    OrderStatus["PAYMENT_CONFIRMED"] = "payment_confirmed";
    OrderStatus["INVESTED"] = "invested";
    OrderStatus["ALLOCATED"] = "allocated";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["FAILED"] = "failed";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
let InvestmentOrder = class InvestmentOrder {
    id;
    userId;
    productId;
    product;
    amount;
    units;
    unitPrice;
    fee;
    productVersion;
    status;
    paymentReference;
    paymentId;
    createdAt;
    updatedAt;
};
exports.InvestmentOrder = InvestmentOrder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InvestmentOrder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], InvestmentOrder.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id' }),
    __metadata("design:type", String)
], InvestmentOrder.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => investment_product_entity_1.InvestmentProduct),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", investment_product_entity_1.InvestmentProduct)
], InvestmentOrder.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], InvestmentOrder.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, name: 'units' }),
    __metadata("design:type", Object)
], InvestmentOrder.prototype, "units", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price', nullable: true }),
    __metadata("design:type", Object)
], InvestmentOrder.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'fee', default: 0 }),
    __metadata("design:type", Number)
], InvestmentOrder.prototype, "fee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'product_version', nullable: true }),
    __metadata("design:type", Object)
], InvestmentOrder.prototype, "productVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: OrderStatus, default: OrderStatus.PLACED }),
    __metadata("design:type", String)
], InvestmentOrder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'payment_reference', nullable: true }),
    __metadata("design:type", Object)
], InvestmentOrder.prototype, "paymentReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'payment_id', nullable: true }),
    __metadata("design:type", Object)
], InvestmentOrder.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InvestmentOrder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InvestmentOrder.prototype, "updatedAt", void 0);
exports.InvestmentOrder = InvestmentOrder = __decorate([
    (0, typeorm_1.Entity)('investment_orders')
], InvestmentOrder);
//# sourceMappingURL=investment-order.entity.js.map