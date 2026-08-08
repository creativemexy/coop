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
exports.ProcessingStep = exports.ProcessingStepType = exports.ProcessingStepStatus = void 0;
const typeorm_1 = require("typeorm");
var ProcessingStepStatus;
(function (ProcessingStepStatus) {
    ProcessingStepStatus["PENDING"] = "pending";
    ProcessingStepStatus["IN_PROGRESS"] = "in_progress";
    ProcessingStepStatus["COMPLETED"] = "completed";
    ProcessingStepStatus["FAILED"] = "failed";
})(ProcessingStepStatus || (exports.ProcessingStepStatus = ProcessingStepStatus = {}));
var ProcessingStepType;
(function (ProcessingStepType) {
    ProcessingStepType["PAYMENT_INTENT"] = "payment_intent";
    ProcessingStepType["DISBURSEMENT"] = "disbursement";
    ProcessingStepType["INSTALLMENT_GENERATION"] = "installment_generation";
    ProcessingStepType["SETTLEMENT"] = "settlement";
    ProcessingStepType["RECONCILIATION"] = "reconciliation";
})(ProcessingStepType || (exports.ProcessingStepType = ProcessingStepType = {}));
let ProcessingStep = class ProcessingStep {
    id;
    subscriptionId;
    stepType;
    status;
    idempotencyKey;
    metadata;
    errorMessage;
    retryCount;
    externalReference;
    completedAt;
    createdAt;
    updatedAt;
};
exports.ProcessingStep = ProcessingStep;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProcessingStep.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'subscription_id' }),
    __metadata("design:type", String)
], ProcessingStep.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProcessingStepType, name: 'step_type' }),
    __metadata("design:type", String)
], ProcessingStep.prototype, "stepType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProcessingStepStatus,
        default: ProcessingStepStatus.PENDING,
    }),
    __metadata("design:type", String)
], ProcessingStep.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'idempotency_key', nullable: true, unique: true }),
    __metadata("design:type", String)
], ProcessingStep.prototype, "idempotencyKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ProcessingStep.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'error_message' }),
    __metadata("design:type", Object)
], ProcessingStep.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'retry_count' }),
    __metadata("design:type", Number)
], ProcessingStep.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'external_reference', nullable: true }),
    __metadata("design:type", String)
], ProcessingStep.prototype, "externalReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], ProcessingStep.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ProcessingStep.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ProcessingStep.prototype, "updatedAt", void 0);
exports.ProcessingStep = ProcessingStep = __decorate([
    (0, typeorm_1.Entity)('bnpl_processing_steps')
], ProcessingStep);
//# sourceMappingURL=processing-step.entity.js.map