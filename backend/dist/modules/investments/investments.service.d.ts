import { Repository } from 'typeorm';
import { InvestmentProduct, InvestmentType, RiskTier, ProductStatus, DistributionFrequency } from './entities/investment-product.entity';
import { InvestmentProductVersion } from './entities/investment-product-version.entity';
import { InvestmentEligibilityRule, KycLevel } from './entities/investment-eligibility-rule.entity';
import { ShareIssuanceCycle } from './entities/share-issuance-cycle.entity';
import { InvestmentOrder, OrderStatus } from './entities/investment-order.entity';
import { InvestmentHolding } from './entities/investment-holding.entity';
import { Distribution, DistributionType } from './entities/distribution.entity';
import { DistributionPayment } from './entities/distribution-payment.entity';
import { DistributionRun } from './entities/distribution-run.entity';
import { RedemptionRequest, RedemptionStatus } from './entities/redemption-request.entity';
import { PricingConfig, PricingFormula, NavSchedule, AccrualMethod } from './entities/pricing-config.entity';
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { CorporateAction, CorporateActionType } from './entities/corporate-action.entity';
import { Payment } from '../payments/entities/payment.entity';
import { KycStatus } from '../../common/enums/status.enum';
import { UsersService } from '../users/users.service';
export declare class InvestmentsService {
    private readonly usersService;
    private readonly productRepo;
    private readonly versionRepo;
    private readonly orderRepo;
    private readonly holdingRepo;
    private readonly distRepo;
    private readonly distPayRepo;
    private readonly eligibilityRepo;
    private readonly cycleRepo;
    private readonly redemptionRepo;
    private readonly paymentRepo;
    private readonly pricingRepo;
    private readonly navRepo;
    private readonly corpActionRepo;
    private readonly distRunRepo;
    constructor(usersService: UsersService, productRepo: Repository<InvestmentProduct>, versionRepo: Repository<InvestmentProductVersion>, orderRepo: Repository<InvestmentOrder>, holdingRepo: Repository<InvestmentHolding>, distRepo: Repository<Distribution>, distPayRepo: Repository<DistributionPayment>, eligibilityRepo: Repository<InvestmentEligibilityRule>, cycleRepo: Repository<ShareIssuanceCycle>, redemptionRepo: Repository<RedemptionRequest>, paymentRepo: Repository<Payment>, pricingRepo: Repository<PricingConfig>, navRepo: Repository<NavSnapshot>, corpActionRepo: Repository<CorporateAction>, distRunRepo: Repository<DistributionRun>);
    listProducts(filters?: {
        type?: string;
        riskTier?: string;
        isOpen?: boolean;
    }): Promise<InvestmentProduct[]>;
    getProduct(id: string): Promise<InvestmentProduct>;
    placeOrder(userId: string, dto: {
        productId: string;
        amount: number;
    }): Promise<InvestmentOrder>;
    confirmPayment(orderId: string, paymentReference: string, paymentId: string): Promise<{
        order: InvestmentOrder;
        holding: InvestmentHolding;
    }>;
    getMyOrders(userId: string): Promise<InvestmentOrder[]>;
    getMyHoldings(userId: string): Promise<InvestmentHolding[]>;
    getPortfolioSummary(userId: string): Promise<{
        totalInvested: number;
        currentValue: number;
        unrealizedReturn: number;
        unrealizedReturnPct: number;
        totalEarned: number;
        lockedValue: number;
        availableValue: number;
        holdingCount: number;
    }>;
    getDistributions(productId?: string): Promise<Distribution[]>;
    getMyDistributionHistory(userId: string): Promise<DistributionPayment[]>;
    getPendingDistributions(userId: string): Promise<DistributionPayment[]>;
    requestRedemption(userId: string, dto: {
        holdingId: string;
        units: number;
        reason?: string;
    }): Promise<RedemptionRequest>;
    createProduct(dto: {
        name: string;
        description?: string;
        type: InvestmentType;
        riskTier?: RiskTier;
        minimumInvestment: number;
        maximumInvestment?: number;
        unitPrice?: number;
        lockInDays?: number;
        tenorDays?: number;
        managementFeeRate?: number;
        expectedReturnRate?: number;
        profitSharingRules?: string;
        distributionFrequency?: DistributionFrequency;
        totalUnits?: number;
        availableUnits?: number;
        createdBy: string;
    }): Promise<InvestmentProduct>;
    updateProduct(id: string, dto: Partial<{
        name: string;
        description: string;
        type: InvestmentType;
        riskTier: RiskTier;
        minimumInvestment: number;
        maximumInvestment: number;
        unitPrice: number;
        lockInDays: number;
        tenorDays: number;
        managementFeeRate: number;
        expectedReturnRate: number;
        profitSharingRules: string;
        distributionFrequency: DistributionFrequency;
        totalUnits: number;
        availableUnits: number;
        isOpen: boolean;
        changeSummary: string;
    }>, changedBy: string): Promise<InvestmentProduct>;
    setProductStatus(id: string, status: ProductStatus, changedBy: string): Promise<InvestmentProduct>;
    getProductVersions(id: string): Promise<InvestmentProductVersion[]>;
    listAllProducts(filters?: {
        type?: string;
        riskTier?: string;
        status?: string;
    }): Promise<InvestmentProduct[]>;
    private _snapshotVersion;
    getEligibilityRules(productId: string): Promise<InvestmentEligibilityRule>;
    updateEligibilityRules(productId: string, dto: Partial<{
        kycRequiredLevel: KycLevel;
        requireMembership: boolean;
        allowedGeographies: string[];
        accreditationRequired: boolean;
        investorWhitelist: string[];
        investorBlacklist: string[];
    }>): Promise<InvestmentEligibilityRule>;
    setCapacity(id: string, dto: {
        totalCapacity?: number;
        perInvestorCaps?: {
            min?: number;
            max?: number;
        };
    }): Promise<InvestmentProduct>;
    createIssuanceCycle(productId: string, dto: {
        cycleName: string;
        totalUnits: number;
        unitPrice: number;
        totalValue: number;
        openDate?: string;
        closeDate?: string;
        createdBy: string;
    }): Promise<ShareIssuanceCycle>;
    approveIssuanceCycle(cycleId: string, approvedBy: string): Promise<ShareIssuanceCycle>;
    getIssuanceCycles(productId: string): Promise<ShareIssuanceCycle[]>;
    listAllIssuanceCycles(): Promise<ShareIssuanceCycle[]>;
    isInvestorAllowed(productId: string, userId: string): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    checkFullEligibility(userId: string, productId: string): Promise<{
        allowed: boolean;
        reasons: {
            key: string;
            label: string;
            passed: boolean;
            detail?: string;
        }[];
    }>;
    getCompliance(userId: string, productId?: string): Promise<{
        kycStatus: KycStatus;
        kycApproved: boolean;
        eligible: boolean;
        requirements: {
            key: string;
            label: string;
            met: boolean;
            status?: string;
        }[];
    }>;
    getMyRedemptions(userId: string): Promise<RedemptionRequest[]>;
    getInvestmentStatement(userId: string): Promise<{
        portfolio: {
            totalInvested: number;
            currentValue: number;
            unrealizedReturn: number;
            unrealizedReturnPct: number;
            totalEarned: number;
            lockedValue: number;
            availableValue: number;
            holdingCount: number;
        };
        holdings: {
            id: string;
            productName: string;
            units: number;
            costBasis: number;
            currentValue: number;
            isLocked: boolean;
            lockedUntil: Date | null;
            maturityDate: Date | null;
            createdAt: Date;
        }[];
        orders: {
            id: string;
            productName: string;
            amount: number;
            units: number | null;
            unitPrice: number;
            fee: number;
            status: OrderStatus;
            createdAt: Date;
        }[];
        distributions: {
            id: string;
            type: DistributionType;
            amount: number;
            unitsAtRecord: number;
            isPaid: boolean;
            paidAt: Date | null;
            createdAt: Date;
        }[];
        redemptions: {
            id: string;
            productName: string;
            units: number;
            amount: number;
            status: RedemptionStatus;
            reason: string | null;
            rejectionReason: string | null;
            createdAt: Date;
        }[];
    }>;
    getPricingConfig(productId: string): Promise<PricingConfig>;
    updatePricingConfig(productId: string, dto: Partial<{
        formulaType: PricingFormula;
        minUnitPrice: number;
        maxUnitPrice: number;
        navSchedule: NavSchedule;
        allowCorporateActions: boolean;
        distributionApprovalRequired: boolean;
        accrualMethod: AccrualMethod;
    }>): Promise<PricingConfig>;
    recordNavSnapshot(productId: string, dto: {
        nav: number;
        unitPrice: number;
        snapshotDate: string;
    }, createdBy: string): Promise<NavSnapshot>;
    getNavSnapshots(productId: string): Promise<NavSnapshot[]>;
    getLatestNavSnapshot(productId: string): Promise<NavSnapshot | null>;
    createCorporateAction(productId: string, dto: {
        type: CorporateActionType;
        description?: string;
        ratioNumerator: number;
        ratioDenominator: number;
        effectiveDate: string;
    }, createdBy: string): Promise<CorporateAction>;
    approveCorporateAction(actionId: string, approvedBy: string): Promise<CorporateAction>;
    executeCorporateAction(actionId: string, executedBy: string): Promise<{
        action: CorporateAction;
        affectedHoldings: number;
    }>;
    listCorporateActions(productId?: string): Promise<CorporateAction[]>;
    createDistribution(dto: {
        productId: string;
        type: DistributionType;
        amountPerUnit: number;
        totalPool: number;
        recordDate: string;
        payDate: string;
        description?: string;
    }, createdBy: string): Promise<Distribution>;
    submitDistributionForApproval(distId: string): Promise<Distribution>;
    approveDistribution(distId: string, approvedBy: string): Promise<Distribution>;
    computeDistributionRun(distId: string, createdBy: string): Promise<DistributionRun>;
    approveDistributionRun(runId: string, approvedBy: string): Promise<DistributionRun>;
    executeDistributionRun(runId: string, executedBy: string): Promise<{
        run: DistributionRun;
        paid: number;
        failed: number;
    }>;
    listDistributionRuns(productId?: string): Promise<DistributionRun[]>;
    listAllAdminDistributions(productId?: string): Promise<Distribution[]>;
    getDistributionPayouts(distributionId: string): Promise<DistributionPayment[]>;
    markPayoutStatus(payoutId: string, isPaid: boolean): Promise<DistributionPayment>;
    getAdminDistributions(productId?: string): Promise<Distribution[]>;
}
