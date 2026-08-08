import { Repository } from 'typeorm';
import { FeeShareLedger } from '../entities/fee-share-ledger.entity';
import { FeePot } from '../entities/fee-pot.entity';
import { FeeWithdrawalRequest } from '../entities/fee-withdrawal-request.entity';
import { PotType } from '../../../common/enums/status.enum';
import { SettingsService } from '../../settings/settings.service';
import { Organization } from '../../organizations/entities/organization.entity';
import { ApexOrganization } from '../../apex-organizations/entities/apex-organization.entity';
import { PaystackClient } from '../../payments/providers/paystack/paystack.client';
export declare class FeeShareService {
    private readonly ledgerRepo;
    private readonly potRepo;
    private readonly withdrawalRepo;
    private readonly orgRepo;
    private readonly apexOrgRepo;
    private readonly settingsService;
    private readonly paystackClient;
    private readonly logger;
    private readonly payoutInFlight;
    constructor(ledgerRepo: Repository<FeeShareLedger>, potRepo: Repository<FeePot>, withdrawalRepo: Repository<FeeWithdrawalRequest>, orgRepo: Repository<Organization>, apexOrgRepo: Repository<ApexOrganization>, settingsService: SettingsService, paystackClient: PaystackClient);
    private potLockKey;
    private settleAmbiguousOutcome;
    recordRegistrationFee(params: {
        paymentId: string;
        totalFee: number;
        organizationId?: string;
        apexOrgId?: string;
    }): Promise<FeeShareLedger>;
    creditPot(potType: PotType, entityId: string, amount: number): Promise<void>;
    getFeeShareLedger(): Promise<FeeShareLedger[]>;
    hasRegistrationRecord(paymentId: string): Promise<boolean>;
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
        recentLedger: FeeShareLedger[];
        apexOrgId?: undefined;
        apexShare?: undefined;
    } | {
        scope: string;
        apexOrgId: string;
        potBalance: number;
        totalFees: number;
        apexShare: number;
        recentLedger: FeeShareLedger[];
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
    getPots(): Promise<FeePot[]>;
    listBanks(): Promise<{
        code: string;
        name: string;
        slug?: string;
    }[]>;
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
