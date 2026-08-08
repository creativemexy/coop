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
exports.ShareIssuanceCycle = exports.CycleStatus = void 0;
const typeorm_1 = require("typeorm");
const investment_product_entity_1 = require("./investment-product.entity");
var CycleStatus;
(function (CycleStatus) {
    CycleStatus["PENDING"] = "pending";
    CycleStatus["APPROVED"] = "approved";
    CycleStatus["ACTIVE"] = "active";
    CycleStatus["CLOSED"] = "closed";
})(CycleStatus || (exports.CycleStatus = CycleStatus = {}));
let ShareIssuanceCycle = class ShareIssuanceCycle {
    id;
    productId;
    product;
    cycleName;
    totalUnits;
    allocatedUnits;
    unitPrice;
    totalValue;
    openDate;
    closeDate;
    status;
    approvedBy;
    approvedAt;
    createdBy;
    createdAt;
    updatedAt;
};
exports.ShareIssuanceCycle = ShareIssuanceCycle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ShareIssuanceCycle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id' }),
    __metadata("design:type", String)
], ShareIssuanceCycle.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => investment_product_entity_1.InvestmentProduct),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", investment_product_entity_1.InvestmentProduct)
], ShareIssuanceCycle.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'cycle_name' }),
    __metadata("design:type", String)
], ShareIssuanceCycle.prototype, "cycleName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_units' }),
    __metadata("design:type", Number)
], ShareIssuanceCycle.prototype, "totalUnits", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'allocated_units', default: 0 }),
    __metadata("design:type", Number)
], ShareIssuanceCycle.prototype, "allocatedUnits", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'unit_price' }),
    __metadata("design:type", Number)
], ShareIssuanceCycle.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'total_value' }),
    __metadata("design:type", Number)
], ShareIssuanceCycle.prototype, "totalValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'open_date', nullable: true }),
    __metadata("design:type", Object)
], ShareIssuanceCycle.prototype, "openDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'close_date', nullable: true }),
    __metadata("design:type", Object)
], ShareIssuanceCycle.prototype, "closeDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CycleStatus, default: CycleStatus.PENDING }),
    __metadata("design:type", String)
], ShareIssuanceCycle.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'approved_by', nullable: true }),
    __metadata("design:type", Object)
], ShareIssuanceCycle.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'approved_at', nullable: true }),
    __metadata("design:type", Object)
], ShareIssuanceCycle.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], ShareIssuanceCycle.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ShareIssuanceCycle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ShareIssuanceCycle.prototype, "updatedAt", void 0);
exports.ShareIssuanceCycle = ShareIssuanceCycle = __decorate([
    (0, typeorm_1.Entity)('share_issuance_cycles')
], ShareIssuanceCycle);
//# sourceMappingURL=share-issuance-cycle.entity.js.map