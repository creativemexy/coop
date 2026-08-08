import { Repository } from 'typeorm';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { InstallmentStatus, SubscriptionStatus } from '../../../common/enums/status.enum';
export declare class InstallmentsService {
    private readonly repo;
    private readonly subRepo;
    constructor(repo: Repository<BnplInstallment>, subRepo: Repository<BnplSubscription>);
    findBySubscription(subscriptionId: string): Promise<BnplInstallment[]>;
    markAsPaid(id: string, paymentReference: string): Promise<BnplInstallment>;
    listAll(filters?: {
        status?: string;
        overdue?: boolean;
    }): Promise<BnplInstallment[]>;
    retryInstallment(id: string): Promise<BnplInstallment>;
    getReconciliation(subscriptionId: string): Promise<{
        subscriptionId: string;
        catalogItem: string;
        status: SubscriptionStatus;
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
            status: InstallmentStatus;
            paidAt: Date;
            paymentReference: string;
            isOverdue: boolean;
        }[];
    }>;
    private _updateSubscriptionPaidAmount;
}
