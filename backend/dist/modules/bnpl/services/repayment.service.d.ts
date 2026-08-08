import { Repository } from 'typeorm';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { InstallmentStatus, SubscriptionStatus, PaymentStatus } from '../../../common/enums/status.enum';
export declare class RepaymentService {
    private readonly instRepo;
    private readonly subRepo;
    private readonly paymentRepo;
    private readonly auditRepo;
    constructor(instRepo: Repository<BnplInstallment>, subRepo: Repository<BnplSubscription>, paymentRepo: Repository<Payment>, auditRepo: Repository<AuditLog>);
    getRepaymentSchedule(orderId: string): Promise<{
        orderId: string;
        catalogItem: string;
        totalAmount: number;
        amountPaid: number;
        outstanding: number;
        status: SubscriptionStatus;
        installments: {
            id: string;
            dueDate: Date;
            amount: number;
            lateFee: number;
            status: InstallmentStatus;
            paidAt: Date;
            paymentReference: string;
            gracePeriodEnd: Date;
            isOverdue: boolean;
            daysLate: number;
        }[];
        paymentAttempts: {
            id: string;
            amount: number;
            provider: import("../../../common/enums/status.enum").PaymentProvider;
            providerReference: string;
            status: PaymentStatus;
            createdAt: Date;
            metadata: Record<string, any>;
        }[];
    }>;
    safeRetry(installmentId: string, performedBy: string): Promise<BnplInstallment>;
    reconcile(installmentId: string, data: {
        status?: InstallmentStatus;
        paymentReference?: string;
        paidAt?: Date;
        note?: string;
    }, performedBy: string): Promise<BnplInstallment>;
    updateMetadata(installmentId: string, metadata: Record<string, any>, performedBy: string): Promise<BnplInstallment>;
    handlePartialPayment(installmentId: string, amount: number, paymentReference: string, performedBy: string): Promise<BnplInstallment>;
    private _updateSubscriptionPaidAmount;
}
