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
exports.Distribution = exports.DistributionStatus = exports.DistributionType = void 0;
const typeorm_1 = require("typeorm");
var DistributionType;
(function (DistributionType) {
    DistributionType["DIVIDEND"] = "dividend";
    DistributionType["INTEREST"] = "interest";
    DistributionType["PROFIT_SHARE"] = "profit_share";
})(DistributionType || (exports.DistributionType = DistributionType = {}));
var DistributionStatus;
(function (DistributionStatus) {
    DistributionStatus["DRAFT"] = "draft";
    DistributionStatus["PENDING_APPROVAL"] = "pending_approval";
    DistributionStatus["APPROVED"] = "approved";
    DistributionStatus["EXECUTED"] = "executed";
    DistributionStatus["FAILED"] = "failed";
})(DistributionStatus || (exports.DistributionStatus = DistributionStatus = {}));
let Distribution = class Distribution {
    id;
    productId;
    type;
    amountPerUnit;
    totalPool;
    recordDate;
    payDate;
    description;
    status;
    approvedBy;
    approvedAt;
    isPaid;
    createdBy;
    createdAt;
};
exports.Distribution = Distribution;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Distribution.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id' }),
    __metadata("design:type", String)
], Distribution.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DistributionType }),
    __metadata("design:type", String)
], Distribution.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'amount_per_unit' }),
    __metadata("design:type", Number)
], Distribution.prototype, "amountPerUnit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'total_pool' }),
    __metadata("design:type", Number)
], Distribution.prototype, "totalPool", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'record_date' }),
    __metadata("design:type", Date)
], Distribution.prototype, "recordDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'pay_date' }),
    __metadata("design:type", Date)
], Distribution.prototype, "payDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Distribution.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DistributionStatus, default: DistributionStatus.DRAFT }),
    __metadata("design:type", String)
], Distribution.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'approved_by', nullable: true }),
    __metadata("design:type", Object)
], Distribution.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'approved_at', nullable: true }),
    __metadata("design:type", Object)
], Distribution.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_paid' }),
    __metadata("design:type", Boolean)
], Distribution.prototype, "isPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by', nullable: true }),
    __metadata("design:type", Object)
], Distribution.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Distribution.prototype, "createdAt", void 0);
exports.Distribution = Distribution = __decorate([
    (0, typeorm_1.Entity)('distributions')
], Distribution);
//# sourceMappingURL=distribution.entity.js.map