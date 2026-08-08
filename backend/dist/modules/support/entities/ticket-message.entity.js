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
exports.TicketMessage = void 0;
const typeorm_1 = require("typeorm");
const support_ticket_entity_1 = require("../../bnpl/entities/support-ticket.entity");
let TicketMessage = class TicketMessage {
    id;
    ticketId;
    ticket;
    senderId;
    senderRole;
    message;
    createdAt;
};
exports.TicketMessage = TicketMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TicketMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'ticket_id' }),
    __metadata("design:type", String)
], TicketMessage.prototype, "ticketId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => support_ticket_entity_1.SupportTicket, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'ticket_id' }),
    __metadata("design:type", support_ticket_entity_1.SupportTicket)
], TicketMessage.prototype, "ticket", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'sender_id' }),
    __metadata("design:type", String)
], TicketMessage.prototype, "senderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'sender_role' }),
    __metadata("design:type", String)
], TicketMessage.prototype, "senderRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TicketMessage.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TicketMessage.prototype, "createdAt", void 0);
exports.TicketMessage = TicketMessage = __decorate([
    (0, typeorm_1.Entity)('ticket_messages')
], TicketMessage);
//# sourceMappingURL=ticket-message.entity.js.map