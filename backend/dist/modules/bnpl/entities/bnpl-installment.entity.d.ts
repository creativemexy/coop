import { InstallmentStatus } from '../../../common/enums/status.enum';
import { BnplSubscription } from './bnpl-subscription.entity';
export declare class BnplInstallment {
    id: string;
    subscriptionId: string;
    subscription: BnplSubscription;
    dueDate: Date;
    lateFeeAmount: number;
    gracePeriodEnd: Date;
    amount: number;
    status: InstallmentStatus;
    paidAt: Date;
    paymentReference: string;
    createdAt: Date;
    updatedAt: Date;
}
