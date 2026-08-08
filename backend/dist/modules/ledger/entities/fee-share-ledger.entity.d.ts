import { FeeSource } from '../../../common/enums/status.enum';
export declare class FeeShareLedger {
    id: string;
    paymentId: string;
    source: FeeSource;
    totalFee: number;
    superAdminShare: number;
    superAdminUserId: string;
    platformShare: number;
    organizationShare: number;
    organizationId: string;
    apexShare: number;
    apexOrgId: string;
    createdAt: Date;
}
