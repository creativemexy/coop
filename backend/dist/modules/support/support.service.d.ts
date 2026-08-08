import { Repository } from 'typeorm';
import { WebhookLog } from '../payments/entities/webhook-log.entity';
import { SupportTicket, TicketStatus, TicketCategory } from '../bnpl/entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../../common/enums/status.enum';
export declare class SupportService {
    private readonly webhookLogRepo;
    private readonly ticketRepo;
    private readonly msgRepo;
    private readonly auditRepo;
    private readonly subRepo;
    private readonly instRepo;
    private readonly paymentRepo;
    constructor(webhookLogRepo: Repository<WebhookLog>, ticketRepo: Repository<SupportTicket>, msgRepo: Repository<TicketMessage>, auditRepo: Repository<AuditLog>, subRepo: Repository<BnplSubscription>, instRepo: Repository<BnplInstallment>, paymentRepo: Repository<Payment>);
    listOrders(): Promise<BnplSubscription[]>;
    getOrder(id: string): Promise<BnplSubscription>;
    getRepaymentSchedule(orderId: string): Promise<{
        orderId: string;
        totalAmount: number;
        amountPaid: number;
        outstanding: number;
        status: import("../../common/enums/status.enum").SubscriptionStatus;
        installments: {
            id: string;
            dueDate: Date;
            amount: number;
            lateFee: number;
            status: import("../../common/enums/status.enum").InstallmentStatus;
            paidAt: Date;
            paymentReference: string;
            isOverdue: boolean;
        }[];
        paymentAttempts: {
            id: string;
            amount: number;
            provider: import("../../common/enums/status.enum").PaymentProvider;
            providerReference: string;
            status: PaymentStatus;
            createdAt: Date;
        }[];
    }>;
    getWebhookLogs(filters?: {
        provider?: string;
        status?: string;
        limit?: number;
    }): Promise<WebhookLog[]>;
    getWebhookLog(id: string): Promise<WebhookLog>;
    resubmitWebhook(paymentId: string, performedBy: string): Promise<{
        message: string;
        providerReference: string;
        paymentId: string;
    }>;
    triggerReconciliation(performedBy: string): Promise<{
        message: string;
        pendingCount: number;
        auditId: string;
    }>;
    createTicket(dto: {
        subject: string;
        description?: string;
        category?: TicketCategory;
        relatedOrderId?: string;
        relatedPaymentId?: string;
        createdBy: string;
    }): Promise<SupportTicket>;
    listTickets(filters?: {
        status?: string;
        category?: string;
    }): Promise<SupportTicket[]>;
    updateTicketStatus(id: string, status: TicketStatus, note?: string): Promise<SupportTicket>;
    getTicketMessages(ticketId: string): Promise<TicketMessage[]>;
    addTicketMessage(ticketId: string, senderId: string, senderRole: string, message: string): Promise<TicketMessage>;
}
