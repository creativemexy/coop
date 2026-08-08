import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments.service';
import { WebhookLog } from '../entities/webhook-log.entity';
import { User } from '../../users/entities/user.entity';
import { DoubleEntryService } from '../../ledger/services/double-entry.service';
import { FeeShareService } from '../../ledger/services/fee-share.service';
import { AccountsService } from '../../ledger/services/accounts.service';
export declare class WebhooksController {
    private readonly paymentsService;
    private readonly configService;
    private readonly doubleEntryService;
    private readonly feeShareService;
    private readonly accountsService;
    private readonly userRepo;
    private readonly webhookLogRepo;
    private readonly logger;
    private readonly secretKey;
    constructor(paymentsService: PaymentsService, configService: ConfigService, doubleEntryService: DoubleEntryService, feeShareService: FeeShareService, accountsService: AccountsService, userRepo: Repository<User>, webhookLogRepo: Repository<WebhookLog>);
    handlePaystackWebhook(payload: Record<string, unknown>, signature: string): Promise<{
        status: string;
    }>;
}
