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
exports.CorporateAction = exports.CorporateActionStatus = exports.CorporateActionType = void 0;
const typeorm_1 = require("typeorm");
var CorporateActionType;
(function (CorporateActionType) {
    CorporateActionType["SPLIT"] = "split";
    CorporateActionType["BONUS"] = "bonus";
    CorporateActionType["DIVIDEND"] = "dividend";
    CorporateActionType["BUYBACK"] = "buyback";
})(CorporateActionType || (exports.CorporateActionType = CorporateActionType = {}));
var CorporateActionStatus;
(function (CorporateActionStatus) {
    CorporateActionStatus["PENDING"] = "pending";
    CorporateActionStatus["APPROVED"] = "approved";
    CorporateActionStatus["EXECUTED"] = "executed";
    CorporateActionStatus["CANCELLED"] = "cancelled";
})(CorporateActionStatus || (exports.CorporateActionStatus = CorporateActionStatus = {}));
let CorporateAction = class CorporateAction {
    id;
    productId;
    type;
    description;
    ratioNumerator;
    ratioDenominator;
    effectiveDate;
    status;
    executionResult;
    approvedBy;
    approvedAt;
    executedBy;
    executedAt;
    createdBy;
    createdAt;
    updatedAt;
};
exports.CorporateAction = CorporateAction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CorporateAction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'product_id' }),
    __metadata("design:type", String)
], CorporateAction.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CorporateActionType }),
    __metadata("design:type", String)
], CorporateAction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], CorporateAction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 4, name: 'ratio_numerator', default: 1 }),
    __metadata("design:type", Number)
], CorporateAction.prototype, "ratioNumerator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 4, name: 'ratio_denominator', default: 1 }),
    __metadata("design:type", Number)
], CorporateAction.prototype, "ratioDenominator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'effective_date' }),
    __metadata("design:type", Date)
], CorporateAction.prototype, "effectiveDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: CorporateActionStatus, default: CorporateActionStatus.PENDING }),
    __metadata("design:type", String)
], CorporateAction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', name: 'execution_result', nullable: true }),
    __metadata("design:type", Object)
], CorporateAction.prototype, "executionResult", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'approved_by', nullable: true }),
    __metadata("design:type", Object)
], CorporateAction.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'approved_at', nullable: true }),
    __metadata("design:type", Object)
], CorporateAction.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'executed_by', nullable: true }),
    __metadata("design:type", Object)
], CorporateAction.prototype, "executedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'executed_at', nullable: true }),
    __metadata("design:type", Object)
], CorporateAction.prototype, "executedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], CorporateAction.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CorporateAction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CorporateAction.prototype, "updatedAt", void 0);
exports.CorporateAction = CorporateAction = __decorate([
    (0, typeorm_1.Entity)('investment_corporate_actions')
], CorporateAction);
//# sourceMappingURL=corporate-action.entity.js.map