import { ApexBusinessManagerService } from './apex-business-manager.service';
export declare class ApexBusinessManagerController {
    private readonly service;
    constructor(service: ApexBusinessManagerService);
    getDashboard(user: any): Promise<{
        apexOrg: {
            id: string;
            name: string;
            code: string;
            bankName: string;
            accountName: string;
            accountNumber: string;
            sortCode: string;
            bankCode: string;
        };
        stats: {
            organizations: number;
            members: number;
        };
        fees: {
            totalFees: number;
            apexShare: number;
            orgShares: number;
            apexBalance: number;
            ledgerEntries: number;
        };
        recentLedger: import("../ledger/entities/fee-share-ledger.entity").FeeShareLedger[];
    }>;
    listUsers(user: any, search?: string): Promise<{
        organizations: {
            id: string;
            name: string;
            code: string;
            status: import("../../common/enums/status.enum").OrgStatus;
            memberCount: number;
        }[];
        individuals: import("../users/entities/user.entity").User[];
    }>;
    updateBankDetails(user: any, dto: {
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        sortCode?: string;
        bankCode?: string;
    }): Promise<import("../apex-organizations/entities/apex-organization.entity").ApexOrganization | null>;
}
