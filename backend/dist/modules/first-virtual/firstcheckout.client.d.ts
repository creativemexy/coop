import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export interface VirtualAccountDraft {
    accountNumber: string;
    accountName?: string;
    bankName?: string;
    token?: string;
}
export interface FirstCheckoutTxResult {
    accessCode: string;
}
export interface DepositNotificationData {
    amount: string | number;
    currency?: string;
    requestReference: string;
    payerBankCode?: string;
    payerAccountName?: string;
    recipientAccountNumber: string;
}
export declare class FirstCheckoutClient {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly enabled;
    private readonly apiUrl;
    private readonly publicKey;
    private readonly secretKey;
    private readonly merchantId;
    private readonly clientId;
    private readonly clientSecret;
    private accessToken;
    private accessTokenAt;
    constructor(configService: ConfigService, httpService: HttpService);
    private get isStub();
    isStubbed(): boolean;
    createDepositVirtualAccount(params: {
        reference: string;
        amount: number;
        email: string;
        name?: string;
        purpose?: string;
    }): Promise<VirtualAccountDraft & {
        accessCode: string;
    }>;
    private getAccessToken;
    private stubAccount;
    initiateTransaction(params: {
        reference: string;
        amount: number;
        email: string;
        name?: string;
        purpose?: string;
    }): Promise<FirstCheckoutTxResult>;
    initiatePayWithTransfer(params: {
        transactionReference: string;
        typeId?: number;
    }): Promise<VirtualAccountDraft>;
    queryTransaction(reference: string): Promise<{
        transactionReference?: string;
        status?: string;
        amount?: number;
    }>;
    confirmPayWithTransfer(params: {
        reference: string;
        accountNumber: string;
        token?: string;
    }): Promise<{
        paymentStatus?: string;
        amount?: number;
        message?: string;
    }>;
}
