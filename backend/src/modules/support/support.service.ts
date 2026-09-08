import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WebhookLog } from '../payments/entities/webhook-log.entity';
import { SupportTicket, TicketStatus, TicketCategory } from '../bnpl/entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeService } from '../realtime/realtime.service';
import { maskEmail } from '../../common/mask.util';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepo: Repository<WebhookLog>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(TicketMessage)
    private readonly msgRepo: Repository<TicketMessage>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeService,
  ) {}

  /* ── Orders (read-only) ── */

  async listOrders() {
    return this.subRepo.find({
      relations: { plan: { catalogItem: true }, installments: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getOrder(id: string) {
    const sub = await this.subRepo.findOne({
      where: { id },
      relations: { plan: { catalogItem: true }, installments: true },
    });
    if (!sub) throw new NotFoundException('Order not found');
    return sub;
  }

  /* ── Repayments (read-only) ── */

  async getRepaymentSchedule(orderId: string) {
    const sub = await this.subRepo.findOne({
      where: { id: orderId },
      relations: { installments: true },
    });
    if (!sub) throw new NotFoundException('Order not found');

    const payments = await this.paymentRepo.find({
      where: { subscriptionId: orderId },
      order: { createdAt: 'DESC' },
    });

    const installments = (sub.installments || []).sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

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

  /* ── Webhook Logs ── */

  async getWebhookLogs(filters?: {
    provider?: string;
    status?: string;
    limit?: number;
  }) {
    const qb = this.webhookLogRepo.createQueryBuilder('w');
    if (filters?.provider) qb.andWhere('w.provider = :provider', { provider: filters.provider });
    if (filters?.status) qb.andWhere('w.status = :status', { status: filters.status });
    qb.orderBy('w.created_at', 'DESC');
    qb.take(filters?.limit || 100);
    return qb.getMany();
  }

  async getWebhookLog(id: string) {
    const log = await this.webhookLogRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Webhook log not found');
    return log;
  }

  /* ── Resubmit / Reconciliation ── */

  async resubmitWebhook(paymentId: string, performedBy: string) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    await this.auditRepo.save({
      entityType: 'payment',
      entityId: paymentId,
      action: 'webhook_resubmit_support',
      performedBy,
      changes: { providerReference: { from: null, to: payment.providerReference } },
      reason: 'Technical resubmission by operations',
    } as unknown as AuditLog);

    return {
      message: 'Resubmission prepared. Use the provider reference to re-trigger on the payment provider dashboard.',
      providerReference: payment.providerReference,
      paymentId: payment.id,
    };
  }

  async triggerReconciliation(performedBy: string) {
    const pendingPayments = await this.paymentRepo.find({
      where: { status: PaymentStatus.PENDING },
    });

    const log = await this.auditRepo.save({
      entityType: 'system',
      entityId: 'reconciliation',
      action: 'reconciliation_triggered',
      performedBy,
      changes: { pendingCount: { from: 0, to: pendingPayments.length } },
      reason: 'Manual reconciliation trigger by operations',
    } as unknown as AuditLog);

    return {
      message: `Reconciliation job queued. ${pendingPayments.length} pending payments to reconcile.`,
      pendingCount: pendingPayments.length,
      auditId: log.id,
    };
  }

  /* ── Tickets ── */

  async createTicket(dto: {
    subject: string;
    description?: string;
    category?: TicketCategory;
    relatedOrderId?: string;
    relatedPaymentId?: string;
    createdBy: string;
  }) {
    const ticket = await this.ticketRepo.save({
      ...dto,
      status: TicketStatus.OPEN,
    } as SupportTicket);
    return ticket;
  }

  async listTickets(filters?: { status?: string; category?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    const tickets = await this.ticketRepo.find({ where, order: { createdAt: 'DESC' } });

    const creatorIds = [...new Set(tickets.map((t) => t.createdBy))];
    const users = creatorIds.length
      ? await this.userRepo.find({ where: { id: In(creatorIds) } })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    return tickets.map((t) => {
      const u = userById.get(t.createdBy);
      return {
        ...t,
        sender: u
          ? {
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              phone: u.phone,
              role: u.role,
            }
          : null,
        senderName: u ? [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Member' : 'Unknown',
        senderEmail: u ? maskEmail(u.email) : null,
      };
    });
  }

  async updateTicketStatus(id: string, status: TicketStatus, note?: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = status;
    if (note) ticket.resolutionNote = note;
    if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
      ticket.resolvedAt = new Date();
    }
    const saved = await this.ticketRepo.save(ticket);

    this.realtime.publish(id, {
      type: 'status',
      status: saved.status,
      createdBy: ticket.createdBy,
    });
    return saved;
  }

  /* ── Messages ── */

  async getTicketMessages(ticketId: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const messages = await this.msgRepo.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });

    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const users = senderIds.length
      ? await this.userRepo.find({ where: { id: In(senderIds) } })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    const creator = await this.userRepo.findOne({ where: { id: ticket.createdBy } });

    return {
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        status: ticket.status,
        resolutionNote: ticket.resolutionNote,
        createdAt: ticket.createdAt,
        senderName: creator
          ? [creator.firstName, creator.lastName].filter(Boolean).join(' ') || 'Member'
          : 'Unknown',
        senderEmail: creator ? maskEmail(creator.email) : null,
      },
      messages: messages.map((m) => {
        const u = userById.get(m.senderId);
        return {
          ...m,
          senderName: u
            ? [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Support'
            : m.senderRole === 'super_admin' || m.senderRole === 'customer_care'
              ? 'Support'
              : 'Member',
        };
      }),
    };
  }

  async addTicketMessage(ticketId: string, senderId: string, senderRole: string, message: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('This ticket is closed and can no longer receive replies.');
    }

    await this.ticketRepo.save({ ...ticket, status: TicketStatus.IN_PROGRESS });

    const saved = await this.msgRepo.save({
      ticketId,
      senderId,
      senderRole,
      message,
    } as TicketMessage);

    this.realtime.publish(ticketId, {
      type: 'message',
      message: {
        id: saved.id,
        message: saved.message,
        senderId: saved.senderId,
        senderRole: saved.senderRole,
        createdAt: saved.createdAt,
      },
      senderId: saved.senderId,
      senderRole: saved.senderRole,
      createdBy: ticket.createdBy,
    });

    // Notify the user who opened the ticket when support replies.
    if (
      (senderRole === 'super_admin' || senderRole === 'customer_care') &&
      ticket.createdBy !== senderId
    ) {
      await this.notifications.create({
        userId: ticket.createdBy,
        title: 'Support reply',
        message: `A support agent replied to your ticket "${ticket.subject}".`,
        type: 'info',
        link: '/individual/support',
      });
    }

    return saved;
  }
}
