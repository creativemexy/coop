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
exports.CollectionQueue = exports.QueuePriority = exports.QueueStatus = void 0;
const typeorm_1 = require("typeorm");
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["PENDING"] = "pending";
    QueueStatus["CONTACTED"] = "contacted";
    QueueStatus["IN_NEGOTIATION"] = "in_negotiation";
    QueueStatus["ESCALATED"] = "escalated";
    QueueStatus["RESOLVED"] = "resolved";
    QueueStatus["CLOSED"] = "closed";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
var QueuePriority;
(function (QueuePriority) {
    QueuePriority["LOW"] = "low";
    QueuePriority["MEDIUM"] = "medium";
    QueuePriority["HIGH"] = "high";
    QueuePriority["CRITICAL"] = "critical";
})(QueuePriority || (exports.QueuePriority = QueuePriority = {}));
let CollectionQueue = class CollectionQueue {
    id;
    subscriptionId;
    userId;
    status;
    priority;
    daysOverdue;
    totalOverdueAmount;
    outstandingPrincipal;
    lastContactedAt;
    agentNote;
    assignedTo;
    assignedBy;
    resolvedAt;
    createdAt;
    updatedAt;
};
exports.CollectionQueue = CollectionQueue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CollectionQueue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'subscription_id' }),
    __metadata("design:type", String)
], CollectionQueue.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], CollectionQueue.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: QueueStatus, default: QueueStatus.PENDING }),
    __metadata("design:type", String)
], CollectionQueue.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: QueuePriority, default: QueuePriority.MEDIUM }),
    __metadata("design:type", String)
], CollectionQueue.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'days_overdue' }),
    __metadata("design:type", Number)
], CollectionQueue.prototype, "daysOverdue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'total_overdue_amount', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CollectionQueue.prototype, "totalOverdueAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'outstanding_principal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CollectionQueue.prototype, "outstandingPrincipal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'last_contacted_at', nullable: true }),
    __metadata("design:type", Date)
], CollectionQueue.prototype, "lastContactedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'agent_note' }),
    __metadata("design:type", String)
], CollectionQueue.prototype, "agentNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assigned_to', nullable: true }),
    __metadata("design:type", String)
], CollectionQueue.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assigned_by' }),
    __metadata("design:type", String)
], CollectionQueue.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Date)
], CollectionQueue.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CollectionQueue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CollectionQueue.prototype, "updatedAt", void 0);
exports.CollectionQueue = CollectionQueue = __decorate([
    (0, typeorm_1.Entity)('bnpl_collection_queues')
], CollectionQueue);
//# sourceMappingURL=collection-queue.entity.js.map