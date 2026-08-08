import { SubscriptionStatus, PayoutStatus } from '../../../common/enums/status.enum';
import { BnplPlan } from './bnpl-plan.entity';
import { BnplInstallment } from './bnpl-installment.entity';
export declare class BnplSubscription {
    id: string;
    userId: string;
    planId: string;
    plan: BnplPlan;
    status: SubscriptionStatus;
    downPayment: number;
    totalAmount: number;
    amountPaid: number;
    nextInstallmentDate: Date;
    providerReference: string;
    payoutStatus: PayoutStatus;
    disbursementReference: string;
    disbursedAt: Date;
    settledAt: Date;
    approvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    installments: BnplInstallment[];
}
