import { Repository } from 'typeorm';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { FeeShareLedger } from '../ledger/entities/fee-share-ledger.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';
export declare class ApexBusinessManagerService {
    private readonly apexOrgRepo;
    private readonly orgRepo;
    private readonly userRepo;
    private readonly ledgerRepo;
    private readonly potRepo;
    constructor(apexOrgRepo: Repository<ApexOrganization>, orgRepo: Repository<Organization>, userRepo: Repository<User>, ledgerRepo: Repository<FeeShareLedger>, potRepo: Repository<FeePot>);
    listUsers(apexOrgId: string, search?: string): Promise<{
        organizations: {
            id: string;
            name: string;
            code: string;
            status: import("../../common/enums/status.enum").OrgStatus;
            memberCount: number;
        }[];
        individuals: User[];
    }>;
    getDashboard(apexOrgId: string): Promise<{
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
        recentLedger: FeeShareLedger[];
    }>;
    updateBankDetails(apexOrgId: string, dto: {
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        sortCode?: string;
        bankCode?: string;
    }): Promise<ApexOrganization | null>;
}
