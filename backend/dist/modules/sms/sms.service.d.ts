import { Repository } from 'typeorm';
import { SmsLog } from './entities/sms-log.entity';
import { TermiiClient } from './termii/termii.client';
export declare class SmsService {
    private readonly repo;
    private readonly termiiClient;
    private readonly logger;
    constructor(repo: Repository<SmsLog>, termiiClient: TermiiClient);
    send(recipient: string, message: string, eventType: string): Promise<void>;
}
