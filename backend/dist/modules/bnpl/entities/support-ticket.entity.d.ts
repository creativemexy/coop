export declare enum TicketStatus {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    RESOLVED = "resolved",
    CLOSED = "closed"
}
export declare enum TicketCategory {
    ORDER_INQUIRY = "order_inquiry",
    REPAYMENT_ISSUE = "repayment_issue",
    TECHNICAL_GLITCH = "technical_glitch",
    RECONCILIATION = "reconciliation",
    INVESTMENT_ISSUE = "investment_issue",
    OTHER = "other"
}
export declare class SupportTicket {
    id: string;
    subject: string;
    description: string;
    status: TicketStatus;
    category: TicketCategory;
    relatedOrderId: string;
    relatedPaymentId: string;
    createdBy: string;
    assignedTo: string;
    resolutionNote: string;
    resolvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
