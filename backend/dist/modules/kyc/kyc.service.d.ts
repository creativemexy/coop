import { Repository } from 'typeorm';
import { KycSubmission } from './entities/kyc-submission.entity';
import { KycStatus } from '../../common/enums/status.enum';
import { UsersService } from '../users/users.service';
import { KorapayClient } from './korapay/korapay.client';
import { KorapayIdentityType } from './korapay/korapay.types';
import { NotificationsService } from '../notifications/notifications.service';
export declare class KycService {
    private readonly repo;
    private readonly usersService;
    private readonly korapayClient;
    private readonly notifications;
    private readonly logger;
    constructor(repo: Repository<KycSubmission>, usersService: UsersService, korapayClient: KorapayClient, notifications: NotificationsService);
    static isKycExpired(kycVerifiedAt: Date | null | undefined): boolean;
    verifyWebhookSignature(rawBody: string, signature: string): boolean;
    private normalize;
    private matchField;
    initiate(userId: string, id: string, identityType?: KorapayIdentityType): Promise<{
        status: KycStatus;
        reference: string;
        match?: any;
        korapayData?: any;
    }>;
    handleWebhook(payload: Record<string, unknown>): Promise<void>;
    getStatus(userId: string): Promise<{
        kycStatus: KycStatus;
        lastSubmission: KycSubmission | null;
    }>;
    listSubmissions(filters?: {
        status?: string;
        search?: string;
    }): Promise<KycSubmission[]>;
    reviewSubmission(id: string, dto: {
        status: KycStatus;
        rejectionReason?: string;
    }): Promise<KycSubmission>;
}
