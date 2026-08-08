import { BusinessManagerService } from './business-manager.service';
export declare class BusinessManagerController {
    private readonly service;
    constructor(service: BusinessManagerService);
    lookupOrder(reference: string, organizationId?: string): Promise<{
        subscription: import("../bnpl/entities/bnpl-subscription.entity").BnplSubscription;
        payments: {
            id: string;
            amount: number;
            fee: number;
            provider: import("../../common/enums/status.enum").PaymentProvider;
            providerReference: string;
            status: import("../../common/enums/status.enum").PaymentStatus;
            payoutStatus: import("../../common/enums/status.enum").PayoutStatus;
            createdAt: Date;
        }[];
    }>;
    getWebhookStatus(limit?: string, offset?: string, organizationId?: string): Promise<{
        total: number;
        payments: {
            id: string;
            providerReference: string;
            provider: import("../../common/enums/status.enum").PaymentProvider;
            status: import("../../common/enums/status.enum").PaymentStatus;
            payoutStatus: import("../../common/enums/status.enum").PayoutStatus;
            amount: number;
            createdAt: Date;
            webhookReceived: boolean;
        }[];
    }>;
    resubmitWebhook(paymentId: string, userId: string, organizationId?: string): Promise<{
        message: string;
        provider: import("../../common/enums/status.enum").PaymentProvider;
        providerReference: string;
        paymentId: string;
        status: import("../../common/enums/status.enum").PaymentStatus;
    }>;
    getLogs(type?: 'sms' | 'payment' | 'all', limit?: string, offset?: string, organizationId?: string): Promise<{
        smsLogs: {
            recipient: string | null;
            id: string;
            eventType: string;
            provider: import("../../common/enums/status.enum").SmsProvider;
            status: import("../../common/enums/status.enum").SmsStatus;
            createdAt: Date;
        }[];
        paymentLogs: {
            id: any;
            providerReference: any;
            provider: any;
            status: any;
            payoutStatus: any;
            amount: any;
            createdAt: any;
        }[];
    }>;
    markInstallmentAsPaid(dto: {
        installmentId: string;
        providerReference: string;
        reason?: string;
    }, user: Record<string, unknown>): Promise<import("../bnpl/entities/approval-request.entity").ApprovalRequest | {
        message: string;
        installmentId: string;
        providerReference: string;
        amount: number;
        paymentId: string;
    }>;
}
