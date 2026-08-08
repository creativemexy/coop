import { PaymentsService } from './payments.service';
import { PaymentProvider } from '../../common/enums/status.enum';
export declare class PaymentsController {
    private readonly service;
    constructor(service: PaymentsService);
    initiate(dto: {
        subscriptionId?: string;
        amount: number;
        provider?: PaymentProvider;
        purpose?: string;
        callbackUrl?: string;
    }, userId: string): Promise<{
        payment: import("./entities/payment.entity").Payment;
        authorizationUrl?: string;
    }>;
    initiateRegistration(dto: {
        userId: string;
        amount: number;
        callbackUrl?: string;
    }): Promise<{
        payment: import("./entities/payment.entity").Payment;
        authorizationUrl?: string;
    }>;
    findByUser(userId: string): Promise<import("./entities/payment.entity").Payment[]>;
    verify(reference: string): Promise<{
        status: string;
        payment?: import("./entities/payment.entity").Payment;
    }>;
}
