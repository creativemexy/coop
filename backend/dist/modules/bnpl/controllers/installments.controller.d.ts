import { InstallmentsService } from '../services/installments.service';
export declare class InstallmentsController {
    private readonly service;
    constructor(service: InstallmentsService);
    findBySubscription(subscriptionId: string): Promise<import("../entities/bnpl-installment.entity").BnplInstallment[]>;
    listAll(status?: string, overdue?: string): Promise<import("../entities/bnpl-installment.entity").BnplInstallment[]>;
    getReconciliation(subscriptionId: string): Promise<{
        subscriptionId: string;
        catalogItem: string;
        status: import("../../../common/enums/status.enum").SubscriptionStatus;
        expectedTotal: number;
        receivedTotal: number;
        outstanding: number;
        paidCount: number;
        pendingCount: number;
        overdueCount: number;
        totalInstallments: number;
        installments: {
            id: string;
            dueDate: Date;
            amount: number;
            status: import("../../../common/enums/status.enum").InstallmentStatus;
            paidAt: Date;
            paymentReference: string;
            isOverdue: boolean;
        }[];
    }>;
    markAsPaid(id: string, dto: {
        paymentReference: string;
    }): Promise<import("../entities/bnpl-installment.entity").BnplInstallment>;
    retryInstallment(id: string): Promise<import("../entities/bnpl-installment.entity").BnplInstallment>;
}
