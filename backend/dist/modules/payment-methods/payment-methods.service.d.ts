import { Repository } from 'typeorm';
import { SavedPaymentMethod, PaymentMethodType } from './entities/saved-payment-method.entity';
export declare class PaymentMethodsService {
    private readonly repo;
    constructor(repo: Repository<SavedPaymentMethod>);
    findByUser(userId: string): Promise<SavedPaymentMethod[]>;
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
    }): Promise<SavedPaymentMethod>;
    update(id: string, userId: string, dto: Partial<{
        isDefault: boolean;
    }>): Promise<SavedPaymentMethod | null>;
    remove(id: string, userId: string): Promise<void>;
}
