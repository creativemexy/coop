import { ConfigService } from '@nestjs/config';
import { VirtualAccountsService } from './virtual-accounts.service';
export declare class VirtualAccountWebhookController {
    private readonly service;
    private readonly configService;
    private readonly secretKey;
    constructor(service: VirtualAccountsService, configService: ConfigService);
    handleDeposit(payload: Record<string, unknown>, signature?: string, altSignature?: string): Promise<{
        status: "processed" | "duplicate" | "unknown_account" | "invalid_amount" | "ignored";
        creditedAmount?: number;
    } | {
        status: string;
    }>;
}
