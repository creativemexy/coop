export declare class VirtualAccount {
    id: string;
    userId: string;
    provider: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    status: string;
    bankReference: string;
    token: string | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
