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
exports.RedemptionRequest = exports.RedemptionStatus = void 0;
const typeorm_1 = require("typeorm");
const investment_holding_entity_1 = require("./investment-holding.entity");
var RedemptionStatus;
(function (RedemptionStatus) {
    RedemptionStatus["REQUESTED"] = "requested";
    RedemptionStatus["APPROVED"] = "approved";
    RedemptionStatus["PROCESSED"] = "processed";
    RedemptionStatus["PAID"] = "paid";
    RedemptionStatus["REJECTED"] = "rejected";
})(RedemptionStatus || (exports.RedemptionStatus = RedemptionStatus = {}));
let RedemptionRequest = class RedemptionRequest {
    id;
    userId;
    holdingId;
    holding;
    units;
    amount;
    status;
    reason;
    rejectionReason;
    processedAt;
    createdAt;
    updatedAt;
};
exports.RedemptionRequest = RedemptionRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RedemptionRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], RedemptionRequest.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'holding_id' }),
    __metadata("design:type", String)
], RedemptionRequest.prototype, "holdingId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => investment_holding_entity_1.InvestmentHolding),
    (0, typeorm_1.JoinColumn)({ name: 'holding_id' }),
    __metadata("design:type", investment_holding_entity_1.InvestmentHolding)
], RedemptionRequest.prototype, "holding", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'units' }),
    __metadata("design:type", Number)
], RedemptionRequest.prototype, "units", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], RedemptionRequest.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RedemptionStatus, default: RedemptionStatus.REQUESTED }),
    __metadata("design:type", String)
], RedemptionRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RedemptionRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'rejection_reason' }),
    __metadata("design:type", Object)
], RedemptionRequest.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'processed_at', nullable: true }),
    __metadata("design:type", Object)
], RedemptionRequest.prototype, "processedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RedemptionRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RedemptionRequest.prototype, "updatedAt", void 0);
exports.RedemptionRequest = RedemptionRequest = __decorate([
    (0, typeorm_1.Entity)('redemption_requests')
], RedemptionRequest);
//# sourceMappingURL=redemption-request.entity.js.map