import { SupportTicket } from '../../bnpl/entities/support-ticket.entity';
export declare class TicketMessage {
    id: string;
    ticketId: string;
    ticket: SupportTicket;
    senderId: string;
    senderRole: string;
    message: string;
    createdAt: Date;
}
