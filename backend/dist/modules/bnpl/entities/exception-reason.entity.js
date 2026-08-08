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
exports.ExceptionReason = exports.EscalationAction = exports.ExceptionCategory = void 0;
const typeorm_1 = require("typeorm");
var ExceptionCategory;
(function (ExceptionCategory) {
    ExceptionCategory["FAILED_PAYMENT"] = "failed_payment";
    ExceptionCategory["LATE_PAYMENT"] = "late_payment";
    ExceptionCategory["MISMATCH_AMOUNT"] = "mismatch_amount";
    ExceptionCategory["MISSING_WEBHOOK"] = "missing_webhook";
    ExceptionCategory["ELIGIBILITY_EXCEPTION"] = "eligibility_exception";
    ExceptionCategory["OTHER"] = "other";
})(ExceptionCategory || (exports.ExceptionCategory = ExceptionCategory = {}));
var EscalationAction;
(function (EscalationAction) {
    EscalationAction["AUTO_RESOLVE"] = "auto_resolve";
    EscalationAction["MANUAL_REVIEW"] = "manual_review";
    EscalationAction["SUPERVISOR_ESCALATION"] = "supervisor_escalation";
    EscalationAction["WRITE_OFF"] = "write_off";
})(EscalationAction || (exports.EscalationAction = EscalationAction = {}));
let ExceptionReason = class ExceptionReason {
    id;
    title;
    description;
    category;
    escalationThresholdDays;
    escalationThresholdCount;
    escalationAction;
    status;
    createdBy;
    createdAt;
    updatedAt;
};
exports.ExceptionReason = ExceptionReason;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExceptionReason.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ExceptionReason.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExceptionReason.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ExceptionCategory, name: 'category', default: ExceptionCategory.OTHER }),
    __metadata("design:type", String)
], ExceptionReason.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'escalation_threshold_days', nullable: true }),
    __metadata("design:type", Number)
], ExceptionReason.prototype, "escalationThresholdDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'escalation_threshold_count', nullable: true }),
    __metadata("design:type", Number)
], ExceptionReason.prototype, "escalationThresholdCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: EscalationAction, name: 'escalation_action', default: EscalationAction.MANUAL_REVIEW }),
    __metadata("design:type", String)
], ExceptionReason.prototype, "escalationAction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'active' }),
    __metadata("design:type", String)
], ExceptionReason.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], ExceptionReason.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ExceptionReason.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ExceptionReason.prototype, "updatedAt", void 0);
exports.ExceptionReason = ExceptionReason = __decorate([
    (0, typeorm_1.Entity)('bnpl_exception_reasons')
], ExceptionReason);
//# sourceMappingURL=exception-reason.entity.js.map