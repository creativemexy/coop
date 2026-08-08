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
exports.Dispute = exports.DisputeStatus = exports.DisputeType = void 0;
const typeorm_1 = require("typeorm");
var DisputeType;
(function (DisputeType) {
    DisputeType["BNPL"] = "bnpl";
    DisputeType["INVESTMENT"] = "investment";
    DisputeType["PAYMENT"] = "payment";
    DisputeType["OTHER"] = "other";
})(DisputeType || (exports.DisputeType = DisputeType = {}));
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["OPENED"] = "opened";
    DisputeStatus["INVESTIGATING"] = "investigating";
    DisputeStatus["RESOLVED"] = "resolved";
    DisputeStatus["DISMISSED"] = "dismissed";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
let Dispute = class Dispute {
    id;
    type;
    referenceId;
    userId;
    reason;
    status;
    resolution;
    resolvedBy;
    resolvedAt;
    createdAt;
    updatedAt;
};
exports.Dispute = Dispute;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Dispute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DisputeType }),
    __metadata("design:type", String)
], Dispute.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'reference_id' }),
    __metadata("design:type", String)
], Dispute.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], Dispute.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Dispute.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.OPENED }),
    __metadata("design:type", String)
], Dispute.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Dispute.prototype, "resolution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'resolved_by', nullable: true }),
    __metadata("design:type", Object)
], Dispute.prototype, "resolvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Object)
], Dispute.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Dispute.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Dispute.prototype, "updatedAt", void 0);
exports.Dispute = Dispute = __decorate([
    (0, typeorm_1.Entity)('disputes')
], Dispute);
//# sourceMappingURL=dispute.entity.js.map