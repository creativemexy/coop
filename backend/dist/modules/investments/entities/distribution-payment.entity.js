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
exports.DistributionPayment = void 0;
const typeorm_1 = require("typeorm");
const distribution_entity_1 = require("./distribution.entity");
let DistributionPayment = class DistributionPayment {
    id;
    userId;
    holdingId;
    distributionId;
    distribution;
    amount;
    unitsAtRecord;
    isPaid;
    paidAt;
    createdAt;
};
exports.DistributionPayment = DistributionPayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DistributionPayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], DistributionPayment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'holding_id' }),
    __metadata("design:type", String)
], DistributionPayment.prototype, "holdingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'distribution_id' }),
    __metadata("design:type", String)
], DistributionPayment.prototype, "distributionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => distribution_entity_1.Distribution),
    (0, typeorm_1.JoinColumn)({ name: 'distribution_id' }),
    __metadata("design:type", distribution_entity_1.Distribution)
], DistributionPayment.prototype, "distribution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], DistributionPayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'units_at_record' }),
    __metadata("design:type", Number)
], DistributionPayment.prototype, "unitsAtRecord", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false, name: 'is_paid' }),
    __metadata("design:type", Boolean)
], DistributionPayment.prototype, "isPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'paid_at', nullable: true }),
    __metadata("design:type", Object)
], DistributionPayment.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DistributionPayment.prototype, "createdAt", void 0);
exports.DistributionPayment = DistributionPayment = __decorate([
    (0, typeorm_1.Entity)('distribution_payments')
], DistributionPayment);
//# sourceMappingURL=distribution-payment.entity.js.map