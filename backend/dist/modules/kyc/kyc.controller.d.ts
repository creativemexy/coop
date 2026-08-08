import { KycService } from './kyc.service';
import { KycStatus } from '../../common/enums/status.enum';
import { KorapayIdentityType } from './korapay/korapay.types';
export declare class KycController {
    private readonly service;
    constructor(service: KycService);
    initiate(userId: string, body: {
        id: string;
        type?: KorapayIdentityType;
    }): Promise<{
        status: KycStatus;
        reference: string;
        match?: any;
        korapayData?: any;
    }>;
    webhook(req: any, signature: string): Promise<{
        status: string;
    }>;
    getStatus(userId: string): Promise<{
        kycStatus: KycStatus;
        lastSubmission: import("./entities/kyc-submission.entity").KycSubmission | null;
    }>;
    listSubmissions(status?: string, search?: string): Promise<import("./entities/kyc-submission.entity").KycSubmission[]>;
    reviewSubmission(id: string, dto: {
        status: KycStatus;
        rejectionReason?: string;
    }): Promise<import("./entities/kyc-submission.entity").KycSubmission>;
    export(res: any): Promise<void>;
}
