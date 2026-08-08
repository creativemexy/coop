import { Repository } from 'typeorm';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { ApprovalService } from '../bnpl/services/approval.service';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus, PayoutStatus, PaymentProvider } from '../../common/enums/status.enum';
import { SmsLog } from '../sms/entities/sms-log.entity';
import { UsersService } from '../users/users.service';
export declare class BusinessManagerService {
    private readonly subRepo;
    private readonly instRepo;
    private readonly planRepo;
    private readonly catalogRepo;
    private readonly auditRepo;
    private readonly paymentRepo;
    private readonly smsLogRepo;
    private readonly usersService;
    private readonly approvalService;
    private readonly logger;
    constructor(subRepo: Repository<BnplSubscription>, instRepo: Repository<BnplInstallment>, planRepo: Repository<BnplPlan>, catalogRepo: Repository<BnplCatalogItem>, auditRepo: Repository<AuditLog>, paymentRepo: Repository<Payment>, smsLogRepo: Repository<SmsLog>, usersService: UsersService, approvalService: ApprovalService);
    private _log;
    lookupOrder(reference: string, organizationId?: string): Promise<{
        subscription: BnplSubscription;
        payments: {
            id: string;
            amount: number;
            fee: number;
            provider: PaymentProvider;
            providerReference: string;
            status: PaymentStatus;
            payoutStatus: PayoutStatus;
            createdAt: Date;
        }[];
    }>;
    getWebhookStatus(limit?: number, offset?: number, organizationId?: string): Promise<{
        total: number;
        payments: {
            id: string;
            providerReference: string;
            provider: PaymentProvider;
            status: PaymentStatus;
            payoutStatus: PayoutStatus;
            amount: number;
            createdAt: Date;
            webhookReceived: boolean;
        }[];
    }>;
    resubmitWebhook(paymentId: string, organizationId?: string, performedBy?: string): Promise<{
        message: string;
        provider: PaymentProvider;
        providerReference: string;
        paymentId: string;
        status: PaymentStatus;
    }>;
    getLogs(type?: 'sms' | 'payment' | 'all', limit?: number, offset?: number, organizationId?: string): Promise<{
        smsLogs: {
            id: string;
            recipient: string;
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
    markInstallmentAsPaid(installmentId: string, providerReference: string, performedBy?: string, organizationId?: string): Promise<{
        message: string;
        installmentId: string;
        providerReference: string;
        amount: number;
        paymentId: string;
    }>;
    markInstallmentAsPaidOrRequestApproval(installmentId: string, providerReference: string, performedBy: string, role: string, organizationId?: string, reason?: string): Promise<import("../bnpl/entities/approval-request.entity").ApprovalRequest | {
        message: string;
        installmentId: string;
        providerReference: string;
        amount: number;
        paymentId: string;
    }>;
}
