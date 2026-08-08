export declare enum SecretCategory {
    API_KEY = "api_key",
    WEBHOOK_SECRET = "webhook_secret",
    ENCRYPTION_KEY = "encryption_key",
    DATABASE = "database",
    SMTP = "smtp",
    PAYMENT_GATEWAY = "payment_gateway",
    OTHER = "other"
}
export declare class Secret {
    id: string;
    key: string;
    encryptedValue: string;
    category: SecretCategory;
    description: string;
    tenantId: string;
    isRotationEnabled: boolean;
    lastRotatedAt: Date;
    rotationIntervalDays: number;
    createdBy: string;
    updatedBy: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
