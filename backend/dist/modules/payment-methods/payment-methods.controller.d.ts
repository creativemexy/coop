import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodType } from './entities/saved-payment-method.entity';
export declare class PaymentMethodsController {
    private readonly service;
    constructor(service: PaymentMethodsService);
    findAll(userId: string): Promise<import("./entities/saved-payment-method.entity").SavedPaymentMethod[]>;
    create(userId: string, dto: {
        type: PaymentMethodType;
        provider: string;
        providerToken?: string;
        last4?: string;
        cardBrand?: string;
        expiryMonth?: string;
        expiryYear?: string;
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
        isDefault?: boolean;
    }): Promise<import("./entities/saved-payment-method.entity").SavedPaymentMethod>;
    update(id: string, userId: string, dto: {
        isDefault?: boolean;
    }): Promise<import("./entities/saved-payment-method.entity").SavedPaymentMethod | null>;
    remove(id: string, userId: string): Promise<void>;
}
