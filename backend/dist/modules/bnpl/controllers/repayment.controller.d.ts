import { RepaymentService } from '../services/repayment.service';
export declare class RepaymentController {
    private readonly service;
    constructor(service: RepaymentService);
    getSchedule(orderId: string): Promise<{
        orderId: string;
        catalogItem: string;
        totalAmount: number;
        amountPaid: number;
        outstanding: number;
        status: import("../../../common/enums/status.enum").SubscriptionStatus;
        installments: {
            id: string;
            dueDate: Date;
            amount: number;
            lateFee: number;
            status: import("../../../common/enums/status.enum").InstallmentStatus;
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
            status: import("../../../common/enums/status.enum").PaymentStatus;
            createdAt: Date;
            metadata: Record<string, any>;
        }[];
    }>;
    safeRetry(installmentId: string, userId: string): Promise<import("../entities/bnpl-installment.entity").BnplInstallment>;
    reconcile(installmentId: string, dto: {
        status?: string;
        paymentReference?: string;
        paidAt?: string;
        note?: string;
    }, userId: string): Promise<import("../entities/bnpl-installment.entity").BnplInstallment>;
    updateMetadata(installmentId: string, dto: Record<string, any>, userId: string): Promise<import("../entities/bnpl-installment.entity").BnplInstallment>;
    partialPayment(installmentId: string, dto: {
        amount: number;
        paymentReference: string;
    }, userId: string): Promise<import("../entities/bnpl-installment.entity").BnplInstallment>;
}
