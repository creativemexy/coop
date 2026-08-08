import { SupportService } from './support.service';
import { TicketStatus, TicketCategory } from '../bnpl/entities/support-ticket.entity';
export declare class SupportController {
    private readonly service;
    constructor(service: SupportService);
    listOrders(): Promise<import("../bnpl/entities/bnpl-subscription.entity").BnplSubscription[]>;
    getOrder(id: string): Promise<import("../bnpl/entities/bnpl-subscription.entity").BnplSubscription>;
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
            status: import("../../common/enums/status.enum").PaymentStatus;
            createdAt: Date;
        }[];
    }>;
    getWebhookLogs(provider?: string, status?: string, limit?: string): Promise<import("../payments/entities/webhook-log.entity").WebhookLog[]>;
    getWebhookLog(id: string): Promise<import("../payments/entities/webhook-log.entity").WebhookLog>;
    resubmitWebhook(paymentId: string, userId: string): Promise<{
        message: string;
        providerReference: string;
        paymentId: string;
    }>;
    triggerReconciliation(userId: string): Promise<{
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
    }, userId: string): Promise<import("../bnpl/entities/support-ticket.entity").SupportTicket>;
    listTickets(status?: string, category?: string): Promise<import("../bnpl/entities/support-ticket.entity").SupportTicket[]>;
    updateTicketStatus(id: string, dto: {
        status: TicketStatus;
        note?: string;
    }): Promise<import("../bnpl/entities/support-ticket.entity").SupportTicket>;
    getTicketMessages(id: string): Promise<import("./entities/ticket-message.entity").TicketMessage[]>;
    addTicketMessage(id: string, dto: {
        message: string;
    }, userId: string): Promise<import("./entities/ticket-message.entity").TicketMessage>;
}
