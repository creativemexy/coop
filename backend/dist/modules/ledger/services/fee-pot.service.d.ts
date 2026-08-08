import { FeeShareService } from './fee-share.service';
import { FeeWithdrawalRequest } from '../entities/fee-withdrawal-request.entity';
export declare class FeePotService {
    private readonly feeShareService;
    constructor(feeShareService: FeeShareService);
    getPots(): Promise<import("../entities/fee-pot.entity").FeePot[]>;
    listBanks(): Promise<{
        code: string;
        name: string;
        slug?: string;
    }[]>;
    getFeeShareLedger(): Promise<import("../entities/fee-share-ledger.entity").FeeShareLedger[]>;
    getScopedFeeSummary(ctx: {
        organizationId?: string;
        apexOrgId?: string;
    }): Promise<{
        scope: string;
        organizationId: string;
        potBalance: number;
        totalFees: number;
        organizationShare: number;
        registrationShare: number;
        bnplShare: number;
        recentLedger: import("../entities/fee-share-ledger.entity").FeeShareLedger[];
        apexOrgId?: undefined;
        apexShare?: undefined;
    } | {
        scope: string;
        apexOrgId: string;
        potBalance: number;
        totalFees: number;
        apexShare: number;
        recentLedger: import("../entities/fee-share-ledger.entity").FeeShareLedger[];
        organizationId?: undefined;
        organizationShare?: undefined;
        registrationShare?: undefined;
        bnplShare?: undefined;
    } | {
        scope: string;
        potBalance: number;
        totalFees: number;
        organizationShare: number;
        registrationShare: number;
        bnplShare: number;
        recentLedger: never[];
        organizationId?: undefined;
        apexOrgId?: undefined;
        apexShare?: undefined;
    }>;
    withdrawShare(ctx: {
        userId: string;
        role: string;
        organizationId?: string;
        apexOrgId?: string;
    }): Promise<{
        withdrawn: number;
        remaining: number;
    }>;
    withdrawAdmin(dto: {
        accountNumber: string;
        bankCode: string;
        bankName: string;
        userId: string;
    }): Promise<FeeWithdrawalRequest>;
    requestPlatformWithdrawal(userId: string, dto?: {
        accountNumber?: string;
        bankCode?: string;
        bankName?: string;
    }): Promise<FeeWithdrawalRequest>;
    getWithdrawalRequests(): Promise<FeeWithdrawalRequest[]>;
    approveWithdrawal(id: string, approvedBy: string, dto?: {
        accountNumber?: string;
        bankCode?: string;
        bankName?: string;
    }): Promise<FeeWithdrawalRequest>;
    rejectWithdrawal(id: string): Promise<FeeWithdrawalRequest>;
}
