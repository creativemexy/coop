import { PaymentStatus, PayoutStatus, PaymentProvider } from '../../../common/enums/status.enum';
export declare class Payment {
    id: string;
    userId: string;
    subscriptionId: string;
    purpose: string;
    amount: number;
    fee: number;
    provider: PaymentProvider;
    providerReference: string;
    status: PaymentStatus;
    metadata: Record<string, any>;
    payoutStatus: PayoutStatus;
    payoutReference: string;
    createdAt: Date;
    updatedAt: Date;
}
