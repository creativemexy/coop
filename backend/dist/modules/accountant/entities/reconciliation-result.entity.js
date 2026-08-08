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
exports.ReconciliationResult = exports.ResultStatus = void 0;
const typeorm_1 = require("typeorm");
const reconciliation_run_entity_1 = require("./reconciliation-run.entity");
var ResultStatus;
(function (ResultStatus) {
    ResultStatus["MATCHED"] = "matched";
    ResultStatus["UNMATCHED"] = "unmatched";
    ResultStatus["NEEDS_REVIEW"] = "needs_review";
})(ResultStatus || (exports.ResultStatus = ResultStatus = {}));
let ReconciliationResult = class ReconciliationResult {
    id;
    runId;
    run;
    subscriptionId;
    installmentId;
    expectedAmount;
    actualAmount;
    discrepancy;
    expectedDate;
    actualDate;
    status;
    notes;
    flags;
    organizationId;
    createdAt;
};
exports.ReconciliationResult = ReconciliationResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReconciliationResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'run_id' }),
    __metadata("design:type", String)
], ReconciliationResult.prototype, "runId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reconciliation_run_entity_1.ReconciliationRun, (r) => r.results),
    (0, typeorm_1.JoinColumn)({ name: 'run_id' }),
    __metadata("design:type", reconciliation_run_entity_1.ReconciliationRun)
], ReconciliationResult.prototype, "run", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'subscription_id' }),
    __metadata("design:type", String)
], ReconciliationResult.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'installment_id', nullable: true }),
    __metadata("design:type", String)
], ReconciliationResult.prototype, "installmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'expected_amount', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], ReconciliationResult.prototype, "expectedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'actual_amount', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ReconciliationResult.prototype, "actualAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ReconciliationResult.prototype, "discrepancy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'expected_date', nullable: true }),
    __metadata("design:type", Date)
], ReconciliationResult.prototype, "expectedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'actual_date', nullable: true }),
    __metadata("design:type", Date)
], ReconciliationResult.prototype, "actualDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ResultStatus,
        default: ResultStatus.UNMATCHED,
    }),
    __metadata("design:type", String)
], ReconciliationResult.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ReconciliationResult.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', name: 'flags', nullable: true }),
    __metadata("design:type", Array)
], ReconciliationResult.prototype, "flags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'organization_id', nullable: true }),
    __metadata("design:type", Object)
], ReconciliationResult.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ReconciliationResult.prototype, "createdAt", void 0);
exports.ReconciliationResult = ReconciliationResult = __decorate([
    (0, typeorm_1.Entity)('reconciliation_results')
], ReconciliationResult);
//# sourceMappingURL=reconciliation-result.entity.js.map