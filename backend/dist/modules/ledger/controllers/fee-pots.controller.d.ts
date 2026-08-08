import { FeePotService } from '../services/fee-pot.service';
export declare class FeePotsController {
    private readonly service;
    constructor(service: FeePotService);
    getPots(): Promise<import("../entities/fee-pot.entity").FeePot[]>;
    getMyFeeSummary(user: any): Promise<{
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
    listBanks(): Promise<{
        code: string;
        name: string;
        slug?: string;
    }[]>;
    getFeeShareLedger(): Promise<import("../entities/fee-share-ledger.entity").FeeShareLedger[]>;
    withdrawShare(user: any): Promise<{
        withdrawn: number;
        remaining: number;
    }>;
    withdrawAdmin(userId: string, dto: {
        accountNumber: string;
        bankCode: string;
        bankName: string;
    }): Promise<import("../entities/fee-withdrawal-request.entity").FeeWithdrawalRequest>;
    requestPlatformWithdrawal(userId: string, dto?: {
        accountNumber?: string;
        bankCode?: string;
        bankName?: string;
    }): Promise<import("../entities/fee-withdrawal-request.entity").FeeWithdrawalRequest>;
    getWithdrawalRequests(): Promise<import("../entities/fee-withdrawal-request.entity").FeeWithdrawalRequest[]>;
    approveWithdrawal(id: string, userId: string, dto?: {
        accountNumber?: string;
        bankCode?: string;
        bankName?: string;
    }): Promise<import("../entities/fee-withdrawal-request.entity").FeeWithdrawalRequest>;
    rejectWithdrawal(id: string): Promise<import("../entities/fee-withdrawal-request.entity").FeeWithdrawalRequest>;
}
