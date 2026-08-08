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
exports.ReconciliationRun = exports.ReconciliationStatus = void 0;
const typeorm_1 = require("typeorm");
const reconciliation_result_entity_1 = require("./reconciliation-result.entity");
var ReconciliationStatus;
(function (ReconciliationStatus) {
    ReconciliationStatus["IN_PROGRESS"] = "in_progress";
    ReconciliationStatus["COMPLETED"] = "completed";
    ReconciliationStatus["FAILED"] = "failed";
})(ReconciliationStatus || (exports.ReconciliationStatus = ReconciliationStatus = {}));
let ReconciliationRun = class ReconciliationRun {
    id;
    rangeStart;
    rangeEnd;
    status;
    totalExpected;
    totalActual;
    matchCount;
    mismatchCount;
    expectedAmount;
    actualAmount;
    discrepancy;
    organizationId;
    runBy;
    completedAt;
    results;
    createdAt;
    updatedAt;
};
exports.ReconciliationRun = ReconciliationRun;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReconciliationRun.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'range_start' }),
    __metadata("design:type", Date)
], ReconciliationRun.prototype, "rangeStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'range_end' }),
    __metadata("design:type", Date)
], ReconciliationRun.prototype, "rangeEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ReconciliationStatus,
        default: ReconciliationStatus.IN_PROGRESS,
    }),
    __metadata("design:type", String)
], ReconciliationRun.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_expected', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "totalExpected", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'total_actual', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "totalActual", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'match_count', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "matchCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'mismatch_count', default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "mismatchCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'expected_amount', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "expectedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'actual_amount', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "actualAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'discrepancy', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], ReconciliationRun.prototype, "discrepancy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'organization_id', nullable: true }),
    __metadata("design:type", String)
], ReconciliationRun.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'run_by' }),
    __metadata("design:type", String)
], ReconciliationRun.prototype, "runBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], ReconciliationRun.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reconciliation_result_entity_1.ReconciliationResult, (r) => r.run),
    __metadata("design:type", Array)
], ReconciliationRun.prototype, "results", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ReconciliationRun.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ReconciliationRun.prototype, "updatedAt", void 0);
exports.ReconciliationRun = ReconciliationRun = __decorate([
    (0, typeorm_1.Entity)('reconciliation_runs')
], ReconciliationRun);
//# sourceMappingURL=reconciliation-run.entity.js.map