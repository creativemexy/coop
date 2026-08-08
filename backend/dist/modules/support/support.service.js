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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const webhook_log_entity_1 = require("../payments/entities/webhook-log.entity");
const support_ticket_entity_1 = require("../bnpl/entities/support-ticket.entity");
const ticket_message_entity_1 = require("./entities/ticket-message.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const status_enum_1 = require("../../common/enums/status.enum");
let SupportService = class SupportService {
    webhookLogRepo;
    ticketRepo;
    msgRepo;
    auditRepo;
    subRepo;
    instRepo;
    paymentRepo;
    constructor(webhookLogRepo, ticketRepo, msgRepo, auditRepo, subRepo, instRepo, paymentRepo) {
        this.webhookLogRepo = webhookLogRepo;
        this.ticketRepo = ticketRepo;
        this.msgRepo = msgRepo;
        this.auditRepo = auditRepo;
        this.subRepo = subRepo;
        this.instRepo = instRepo;
        this.paymentRepo = paymentRepo;
    }
    async listOrders() {
        return this.subRepo.find({
            relations: { plan: { catalogItem: true }, installments: true },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
    async getOrder(id) {
        const sub = await this.subRepo.findOne({
            where: { id },
            relations: { plan: { catalogItem: true }, installments: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('Order not found');
        return sub;
    }
    async getRepaymentSchedule(orderId) {
        const sub = await this.subRepo.findOne({
            where: { id: orderId },
            relations: { installments: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('Order not found');
        const payments = await this.paymentRepo.find({
            where: { subscriptionId: orderId },
            order: { createdAt: 'DESC' },
        });
        const installments = (sub.installments || []).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        return {
            orderId: sub.id,
            totalAmount: Number(sub.totalAmount),
            amountPaid: Number(sub.amountPaid),
            outstanding: Number(sub.totalAmount) - Number(sub.amountPaid),
            status: sub.status,
            installments: installments.map((inst) => ({
                id: inst.id,
                dueDate: inst.dueDate,
                amount: Number(inst.amount),
                lateFee: Number(inst.lateFeeAmount),
                status: inst.status,
                paidAt: inst.paidAt,
                paymentReference: inst.paymentReference,
                isOverdue: inst.status === 'pending' && new Date(inst.dueDate) < new Date(),
            })),
            paymentAttempts: payments.map((p) => ({
                id: p.id,
                amount: Number(p.amount),
                provider: p.provider,
                providerReference: p.providerReference,
                status: p.status,
                createdAt: p.createdAt,
            })),
        };
    }
    async getWebhookLogs(filters) {
        const qb = this.webhookLogRepo.createQueryBuilder('w');
        if (filters?.provider)
            qb.andWhere('w.provider = :provider', { provider: filters.provider });
        if (filters?.status)
            qb.andWhere('w.status = :status', { status: filters.status });
        qb.orderBy('w.created_at', 'DESC');
        qb.take(filters?.limit || 100);
        return qb.getMany();
    }
    async getWebhookLog(id) {
        const log = await this.webhookLogRepo.findOne({ where: { id } });
        if (!log)
            throw new common_1.NotFoundException('Webhook log not found');
        return log;
    }
    async resubmitWebhook(paymentId, performedBy) {
        const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        await this.auditRepo.save({
            entityType: 'payment',
            entityId: paymentId,
            action: 'webhook_resubmit_support',
            performedBy,
            changes: { providerReference: { from: null, to: payment.providerReference } },
            reason: 'Technical resubmission by operations',
        });
        return {
            message: 'Resubmission prepared. Use the provider reference to re-trigger on the payment provider dashboard.',
            providerReference: payment.providerReference,
            paymentId: payment.id,
        };
    }
    async triggerReconciliation(performedBy) {
        const pendingPayments = await this.paymentRepo.find({
            where: { status: status_enum_1.PaymentStatus.PENDING },
        });
        const log = await this.auditRepo.save({
            entityType: 'system',
            entityId: 'reconciliation',
            action: 'reconciliation_triggered',
            performedBy,
            changes: { pendingCount: { from: 0, to: pendingPayments.length } },
            reason: 'Manual reconciliation trigger by operations',
        });
        return {
            message: `Reconciliation job queued. ${pendingPayments.length} pending payments to reconcile.`,
            pendingCount: pendingPayments.length,
            auditId: log.id,
        };
    }
    async createTicket(dto) {
        const ticket = await this.ticketRepo.save({
            ...dto,
            status: support_ticket_entity_1.TicketStatus.OPEN,
        });
        return ticket;
    }
    async listTickets(filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.category)
            where.category = filters.category;
        return this.ticketRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async updateTicketStatus(id, status, note) {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        ticket.status = status;
        if (note)
            ticket.resolutionNote = note;
        if (status === support_ticket_entity_1.TicketStatus.RESOLVED || status === support_ticket_entity_1.TicketStatus.CLOSED) {
            ticket.resolvedAt = new Date();
        }
        return this.ticketRepo.save(ticket);
    }
    async getTicketMessages(ticketId) {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return this.msgRepo.find({
            where: { ticketId },
            order: { createdAt: 'ASC' },
        });
    }
    async addTicketMessage(ticketId, senderId, senderRole, message) {
        const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        await this.ticketRepo.save({ ...ticket, status: support_ticket_entity_1.TicketStatus.IN_PROGRESS });
        return this.msgRepo.save({
            ticketId,
            senderId,
            senderRole,
            message,
        });
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(webhook_log_entity_1.WebhookLog)),
    __param(1, (0, typeorm_1.InjectRepository)(support_ticket_entity_1.SupportTicket)),
    __param(2, (0, typeorm_1.InjectRepository)(ticket_message_entity_1.TicketMessage)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(4, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(5, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(6, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SupportService);
//# sourceMappingURL=support.service.js.map