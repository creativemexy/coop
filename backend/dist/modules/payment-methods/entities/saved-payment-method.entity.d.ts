export declare enum PaymentMethodType {
    CARD = "card",
    BANK = "bank"
}
export declare class SavedPaymentMethod {
    id: string;
    userId: string;
    type: PaymentMethodType;
    provider: string;
    providerToken: string;
    last4: string;
    cardBrand: string;
    expiryMonth: string;
    expiryYear: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
