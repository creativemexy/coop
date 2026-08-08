import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { KorapayIdentityType, KorapayLookupData, KorapayWebhookPayload } from './korapay.types';
export declare class KorapayClient {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly baseUrl;
    private readonly secretKey;
    constructor(configService: ConfigService, httpService: HttpService);
    verifyIdentity(params: {
        id: string;
        type: KorapayIdentityType;
        reference: string;
    }): Promise<KorapayLookupData>;
    verifyWebhookSignature(rawBody: string, signature: string): boolean;
    parseWebhookPayload(payload: any): KorapayWebhookPayload | null;
}
