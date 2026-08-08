import { SmsService } from './sms.service';
export declare class SmsEventDispatcher {
    private readonly smsService;
    private readonly logger;
    constructor(smsService: SmsService);
    emit(event: string, data: {
        userId: string;
        [key: string]: unknown;
    }): Promise<void>;
}
