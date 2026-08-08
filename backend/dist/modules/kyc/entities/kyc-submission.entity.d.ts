import { KycProvider } from '../../../common/enums/status.enum';
import { KycStatus } from '../../../common/enums/status.enum';
export declare class KycSubmission {
    id: string;
    userId: string;
    provider: KycProvider;
    identityType: string;
    reference: string;
    status: KycStatus;
    rejectionReason: string;
    providerResponse: Record<string, any>;
    submittedAt: Date;
    processedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
