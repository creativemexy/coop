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
exports.RiskFlag = exports.RiskFlagEntityType = exports.RiskFlagStatus = void 0;
const typeorm_1 = require("typeorm");
var RiskFlagStatus;
(function (RiskFlagStatus) {
    RiskFlagStatus["OPEN"] = "open";
    RiskFlagStatus["INVESTIGATING"] = "investigating";
    RiskFlagStatus["RESOLVED"] = "resolved";
    RiskFlagStatus["DISMISSED"] = "dismissed";
})(RiskFlagStatus || (exports.RiskFlagStatus = RiskFlagStatus = {}));
var RiskFlagEntityType;
(function (RiskFlagEntityType) {
    RiskFlagEntityType["SUBSCRIPTION"] = "subscription";
    RiskFlagEntityType["USER"] = "user";
})(RiskFlagEntityType || (exports.RiskFlagEntityType = RiskFlagEntityType = {}));
let RiskFlag = class RiskFlag {
    id;
    entityType;
    entityId;
    reason;
    description;
    flaggedBy;
    status;
    resolvedBy;
    resolutionNote;
    resolvedAt;
    createdAt;
    updatedAt;
};
exports.RiskFlag = RiskFlag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RiskFlag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RiskFlagEntityType, name: 'entity_type' }),
    __metadata("design:type", String)
], RiskFlag.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'entity_id' }),
    __metadata("design:type", String)
], RiskFlag.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], RiskFlag.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RiskFlag.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'flagged_by' }),
    __metadata("design:type", String)
], RiskFlag.prototype, "flaggedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RiskFlagStatus,
        default: RiskFlagStatus.OPEN,
    }),
    __metadata("design:type", String)
], RiskFlag.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'resolved_by', nullable: true }),
    __metadata("design:type", String)
], RiskFlag.prototype, "resolvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'resolution_note', nullable: true }),
    __metadata("design:type", String)
], RiskFlag.prototype, "resolutionNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Date)
], RiskFlag.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RiskFlag.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], RiskFlag.prototype, "updatedAt", void 0);
exports.RiskFlag = RiskFlag = __decorate([
    (0, typeorm_1.Entity)('bnpl_risk_flags')
], RiskFlag);
//# sourceMappingURL=risk-flag.entity.js.map