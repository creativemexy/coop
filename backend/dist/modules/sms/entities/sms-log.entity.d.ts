import { SmsProvider, SmsStatus } from '../../../common/enums/status.enum';
export declare class SmsLog {
    id: string;
    recipient: string;
    message: string;
    eventType: string;
    provider: SmsProvider;
    status: SmsStatus;
    providerResponse: Record<string, any>;
    createdAt: Date;
}
