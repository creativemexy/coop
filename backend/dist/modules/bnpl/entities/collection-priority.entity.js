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
exports.CollectionPriority = exports.PriorityEntityType = exports.PriorityLevel = void 0;
const typeorm_1 = require("typeorm");
var PriorityLevel;
(function (PriorityLevel) {
    PriorityLevel["LOW"] = "low";
    PriorityLevel["MEDIUM"] = "medium";
    PriorityLevel["HIGH"] = "high";
    PriorityLevel["CRITICAL"] = "critical";
})(PriorityLevel || (exports.PriorityLevel = PriorityLevel = {}));
var PriorityEntityType;
(function (PriorityEntityType) {
    PriorityEntityType["SUBSCRIPTION"] = "subscription";
    PriorityEntityType["USER"] = "user";
})(PriorityEntityType || (exports.PriorityEntityType = PriorityEntityType = {}));
let CollectionPriority = class CollectionPriority {
    id;
    entityType;
    entityId;
    priority;
    reason;
    assignedBy;
    expiresAt;
    createdAt;
    updatedAt;
};
exports.CollectionPriority = CollectionPriority;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CollectionPriority.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PriorityEntityType, name: 'entity_type' }),
    __metadata("design:type", String)
], CollectionPriority.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'entity_id' }),
    __metadata("design:type", String)
], CollectionPriority.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PriorityLevel }),
    __metadata("design:type", String)
], CollectionPriority.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CollectionPriority.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assigned_by' }),
    __metadata("design:type", String)
], CollectionPriority.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expires_at', nullable: true }),
    __metadata("design:type", Date)
], CollectionPriority.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CollectionPriority.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CollectionPriority.prototype, "updatedAt", void 0);
exports.CollectionPriority = CollectionPriority = __decorate([
    (0, typeorm_1.Entity)('bnpl_collection_priorities')
], CollectionPriority);
//# sourceMappingURL=collection-priority.entity.js.map