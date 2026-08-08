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
exports.DistributionRun = exports.DistRunStatus = void 0;
const typeorm_1 = require("typeorm");
var DistRunStatus;
(function (DistRunStatus) {
    DistRunStatus["COMPUTING"] = "computing";
    DistRunStatus["PAYOUTS_READY"] = "payouts_ready";
    DistRunStatus["APPROVED"] = "approved";
    DistRunStatus["PAID"] = "paid";
    DistRunStatus["FAILED"] = "failed";
})(DistRunStatus || (exports.DistRunStatus = DistRunStatus = {}));
let DistributionRun = class DistributionRun {
    id;
    distributionId;
    productId;
    periodStart;
    periodEnd;
    totalAccrued;
    totalHoldings;
    payoutCount;
    successCount;
    failedCount;
    status;
    runSummary;
    approvedBy;
    approvedAt;
    executedBy;
    executedAt;
    createdBy;
    createdAt;
};
exports.DistributionRun = DistributionRun;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DistributionRun.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'distribution_id' }),
    __metadata("design:type", String)
], DistributionRun.prototype, "distributionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id' }),
    __metadata("design:type", String)
], DistributionRun.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'period_start' }),
    __metadata("design:type", Date)
], DistributionRun.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'period_end' }),
    __metadata("design:type", Date)
], DistributionRun.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'total_accrued' }),
    __metadata("design:type", Number)
], DistributionRun.prototype, "totalAccrued", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_holdings' }),
    __metadata("design:type", Number)
], DistributionRun.prototype, "totalHoldings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'payout_count', default: 0 }),
    __metadata("design:type", Number)
], DistributionRun.prototype, "payoutCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'success_count', default: 0 }),
    __metadata("design:type", Number)
], DistributionRun.prototype, "successCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'failed_count', default: 0 }),
    __metadata("design:type", Number)
], DistributionRun.prototype, "failedCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DistRunStatus, default: DistRunStatus.COMPUTING }),
    __metadata("design:type", String)
], DistributionRun.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'run_summary', nullable: true }),
    __metadata("design:type", Object)
], DistributionRun.prototype, "runSummary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'approved_by', nullable: true }),
    __metadata("design:type", Object)
], DistributionRun.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'approved_at', nullable: true }),
    __metadata("design:type", Object)
], DistributionRun.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'executed_by', nullable: true }),
    __metadata("design:type", Object)
], DistributionRun.prototype, "executedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'executed_at', nullable: true }),
    __metadata("design:type", Object)
], DistributionRun.prototype, "executedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], DistributionRun.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DistributionRun.prototype, "createdAt", void 0);
exports.DistributionRun = DistributionRun = __decorate([
    (0, typeorm_1.Entity)('distribution_runs')
], DistributionRun);
//# sourceMappingURL=distribution-run.entity.js.map