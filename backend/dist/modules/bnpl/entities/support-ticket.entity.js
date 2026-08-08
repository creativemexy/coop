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
exports.SupportTicket = exports.TicketCategory = exports.TicketStatus = void 0;
const typeorm_1 = require("typeorm");
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["RESOLVED"] = "resolved";
    TicketStatus["CLOSED"] = "closed";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TicketCategory;
(function (TicketCategory) {
    TicketCategory["ORDER_INQUIRY"] = "order_inquiry";
    TicketCategory["REPAYMENT_ISSUE"] = "repayment_issue";
    TicketCategory["TECHNICAL_GLITCH"] = "technical_glitch";
    TicketCategory["RECONCILIATION"] = "reconciliation";
    TicketCategory["INVESTMENT_ISSUE"] = "investment_issue";
    TicketCategory["OTHER"] = "other";
})(TicketCategory || (exports.TicketCategory = TicketCategory = {}));
let SupportTicket = class SupportTicket {
    id;
    subject;
    description;
    status;
    category;
    relatedOrderId;
    relatedPaymentId;
    createdBy;
    assignedTo;
    resolutionNote;
    resolvedAt;
    createdAt;
    updatedAt;
};
exports.SupportTicket = SupportTicket;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SupportTicket.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SupportTicket.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SupportTicket.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TicketStatus,
        default: TicketStatus.OPEN,
    }),
    __metadata("design:type", String)
], SupportTicket.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TicketCategory,
        default: TicketCategory.OTHER,
    }),
    __metadata("design:type", String)
], SupportTicket.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'related_order_id', nullable: true }),
    __metadata("design:type", String)
], SupportTicket.prototype, "relatedOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'related_payment_id', nullable: true }),
    __metadata("design:type", String)
], SupportTicket.prototype, "relatedPaymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'created_by' }),
    __metadata("design:type", String)
], SupportTicket.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'assigned_to', nullable: true }),
    __metadata("design:type", String)
], SupportTicket.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'resolution_note' }),
    __metadata("design:type", String)
], SupportTicket.prototype, "resolutionNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'resolved_at', nullable: true }),
    __metadata("design:type", Date)
], SupportTicket.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SupportTicket.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SupportTicket.prototype, "updatedAt", void 0);
exports.SupportTicket = SupportTicket = __decorate([
    (0, typeorm_1.Entity)('support_tickets')
], SupportTicket);
//# sourceMappingURL=support-ticket.entity.js.map