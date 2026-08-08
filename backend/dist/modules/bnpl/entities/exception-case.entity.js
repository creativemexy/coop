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
exports.ExceptionCase = exports.ExceptionCaseStatus = void 0;
const typeorm_1 = require("typeorm");
var ExceptionCaseStatus;
(function (ExceptionCaseStatus) {
    ExceptionCaseStatus["OPEN"] = "open";
    ExceptionCaseStatus["INVESTIGATING"] = "investigating";
    ExceptionCaseStatus["RESOLVED"] = "resolved";
    ExceptionCaseStatus["ESCALATED"] = "escalated";
})(ExceptionCaseStatus || (exports.ExceptionCaseStatus = ExceptionCaseStatus = {}));
let ExceptionCase = class ExceptionCase {
    id;
    subscriptionId;
    reasonId;
    description;
    status;
    createdBy;
    assignedTo;
    resolution;
    resolvedAt;
    createdAt;
    updatedAt;
};
exports.ExceptionCase = ExceptionCase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ExceptionCase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'subscription_id' }),
    __metadata("design:type", String)
], ExceptionCase.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reason_id' }),
    __metadata("design:type", String)
], ExceptionCase.prototype, "reasonId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExceptionCase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ExceptionCaseStatus,
        default: ExceptionCaseStatus.OPEN,
    }),
    __metadata("design:type", String)
], ExceptionCase.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], ExceptionCase.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assigned_to', nullable: true }),
    __metadata("design:type", String)
], ExceptionCase.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ExceptionCase.prototype, "resolution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Date)
], ExceptionCase.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ExceptionCase.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ExceptionCase.prototype, "updatedAt", void 0);
exports.ExceptionCase = ExceptionCase = __decorate([
    (0, typeorm_1.Entity)('bnpl_exception_cases')
], ExceptionCase);
//# sourceMappingURL=exception-case.entity.js.map