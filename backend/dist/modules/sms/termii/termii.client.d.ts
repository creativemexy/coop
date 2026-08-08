import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export declare class TermiiClient {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly apiKey;
    private readonly senderId;
    private readonly baseUrl;
    constructor(configService: ConfigService, httpService: HttpService);
    sendSms(recipient: string, message: string): Promise<boolean>;
}
