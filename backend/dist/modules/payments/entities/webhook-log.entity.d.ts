export declare class WebhookLog {
    id: string;
    provider: string;
    eventType: string;
    eventId: string;
    paymentId: string;
    status: string;
    payload: Record<string, any>;
    errorMessage: string;
    retryCount: number;
    createdAt: Date;
}
