import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export interface PaystackInitResponse {
    status: boolean;
    message: string;
    data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}
export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data?: {
        status: string;
        reference: string;
        amount: number;
        fees: number;
        paid_at: string;
        channel: string;
        customer: {
            email: string;
        };
    };
}
export interface BankResolveResult {
    accountName: string;
    accountNumber: string;
    bankId?: number;
}
export interface PaystackTransferResult {
    reference: string;
    status: string;
    recipientCode: string;
}
export interface PaystackBalanceEntry {
    currency: string;
    available: number;
    balance: number;
}
export declare class PaystackClient {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly secretKey;
    private readonly baseUrl;
    constructor(configService: ConfigService, httpService: HttpService);
    initializeTransaction(params: {
        email: string;
        amount: number;
        reference: string;
        callbackUrl?: string;
        metadata?: Record<string, unknown>;
    }): Promise<{
        authorizationUrl: string;
        accessCode: string;
    }>;
    verifyTransaction(reference: string): Promise<PaystackVerifyResponse['data']>;
    resolveBankAccount(accountNumber: string, bankCode: string): Promise<BankResolveResult | null>;
    getBalance(): Promise<PaystackBalanceEntry[]>;
    listBanks(): Promise<{
        code: string;
        name: string;
        slug?: string;
    }[]>;
    createTransferRecipient(params: {
        name: string;
        accountNumber: string;
        bankCode: string;
    }): Promise<string>;
    initiateTransfer(params: {
        amount: number;
        recipient: string;
        reason?: string;
        reference?: string;
    }): Promise<PaystackTransferResult>;
    verifyTransfer(reference: string): Promise<PaystackTransferResult | null>;
}
