import { InvestmentsService } from './investments.service';
export declare class InvestmentsController {
    private readonly svc;
    constructor(svc: InvestmentsService);
    listProducts(type?: string, riskTier?: string): Promise<import("./entities/investment-product.entity").InvestmentProduct[]>;
    getProduct(id: string): Promise<import("./entities/investment-product.entity").InvestmentProduct>;
    placeOrder(userId: string, dto: {
        productId: string;
        amount: number;
    }): Promise<import("./entities/investment-order.entity").InvestmentOrder>;
    myOrders(userId: string): Promise<import("./entities/investment-order.entity").InvestmentOrder[]>;
    confirmPayment(id: string, dto: {
        paymentReference: string;
        paymentId: string;
    }): Promise<{
        order: import("./entities/investment-order.entity").InvestmentOrder;
        holding: import("./entities/investment-holding.entity").InvestmentHolding;
    }>;
    myHoldings(userId: string): Promise<import("./entities/investment-holding.entity").InvestmentHolding[]>;
    portfolioSummary(userId: string): Promise<{
        totalInvested: number;
        currentValue: number;
        unrealizedReturn: number;
        unrealizedReturnPct: number;
        totalEarned: number;
        lockedValue: number;
        availableValue: number;
        holdingCount: number;
    }>;
    listDistributions(productId?: string): Promise<import("./entities/distribution.entity").Distribution[]>;
    myDistributions(userId: string): Promise<import("./entities/distribution-payment.entity").DistributionPayment[]>;
    pendingDistributions(userId: string): Promise<import("./entities/distribution-payment.entity").DistributionPayment[]>;
    requestRedemption(userId: string, dto: {
        holdingId: string;
        units: number;
        reason?: string;
    }): Promise<import("./entities/redemption-request.entity").RedemptionRequest>;
    myRedemptions(userId: string): Promise<import("./entities/redemption-request.entity").RedemptionRequest[]>;
    compliance(userId: string, productId?: string): Promise<{
        kycStatus: import("../../common/enums/status.enum").KycStatus;
        kycApproved: boolean;
        eligible: boolean;
        requirements: {
            key: string;
            label: string;
            met: boolean;
            status?: string;
        }[];
    }>;
    createProduct(dto: {
        name: string;
        description?: string;
        type: string;
        riskTier?: string;
        minimumInvestment: number;
        maximumInvestment?: number;
        unitPrice?: number;
        lockInDays?: number;
        tenorDays?: number;
        managementFeeRate?: number;
        expectedReturnRate?: number;
        profitSharingRules?: string;
        distributionFrequency?: string;
        totalUnits?: number;
        availableUnits?: number;
    }, userId: string): Promise<import("./entities/investment-product.entity").InvestmentProduct>;
    updateProduct(id: string, dto: Record<string, any>, userId: string): Promise<import("./entities/investment-product.entity").InvestmentProduct>;
    setProductStatus(id: string, dto: {
        status: string;
    }, userId: string): Promise<import("./entities/investment-product.entity").InvestmentProduct>;
    adminListProducts(type?: string, riskTier?: string, status?: string): Promise<import("./entities/investment-product.entity").InvestmentProduct[]>;
    getProductVersions(id: string): Promise<import("./entities/investment-product-version.entity").InvestmentProductVersion[]>;
    getEligibility(id: string): Promise<import("./entities/investment-eligibility-rule.entity").InvestmentEligibilityRule>;
    updateEligibility(id: string, dto: Record<string, any>): Promise<import("./entities/investment-eligibility-rule.entity").InvestmentEligibilityRule>;
    setCapacity(id: string, dto: {
        totalCapacity?: number;
        perInvestorCaps?: {
            min?: number;
            max?: number;
        };
    }): Promise<import("./entities/investment-product.entity").InvestmentProduct>;
    createIssuanceCycle(id: string, dto: {
        cycleName: string;
        totalUnits: number;
        unitPrice: number;
        totalValue: number;
        openDate?: string;
        closeDate?: string;
    }, userId: string): Promise<import("./entities/share-issuance-cycle.entity").ShareIssuanceCycle>;
    getIssuanceCycles(id: string): Promise<import("./entities/share-issuance-cycle.entity").ShareIssuanceCycle[]>;
    approveIssuanceCycle(cycleId: string, userId: string): Promise<import("./entities/share-issuance-cycle.entity").ShareIssuanceCycle>;
    listAllIssuanceCycles(): Promise<import("./entities/share-issuance-cycle.entity").ShareIssuanceCycle[]>;
    statement(userId: string): Promise<{
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
            status: import("./entities/investment-order.entity").OrderStatus;
            createdAt: Date;
        }[];
        distributions: {
            id: string;
            type: import("./entities/distribution.entity").DistributionType;
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
            status: import("./entities/redemption-request.entity").RedemptionStatus;
            reason: string | null;
            rejectionReason: string | null;
            createdAt: Date;
        }[];
    }>;
    getPricingConfig(id: string): Promise<import("./entities/pricing-config.entity").PricingConfig>;
    updatePricingConfig(id: string, dto: Record<string, any>): Promise<import("./entities/pricing-config.entity").PricingConfig>;
    recordNavSnapshot(id: string, dto: {
        nav: number;
        unitPrice: number;
        snapshotDate: string;
    }, userId: string): Promise<import("./entities/nav-snapshot.entity").NavSnapshot>;
    getNavSnapshots(id: string): Promise<import("./entities/nav-snapshot.entity").NavSnapshot[]>;
    createCorporateAction(id: string, dto: {
        type: string;
        description?: string;
        ratioNumerator: number;
        ratioDenominator: number;
        effectiveDate: string;
    }, userId: string): Promise<import("./entities/corporate-action.entity").CorporateAction>;
    listCorporateActions(productId?: string): Promise<import("./entities/corporate-action.entity").CorporateAction[]>;
    listProductCorporateActions(id: string): Promise<import("./entities/corporate-action.entity").CorporateAction[]>;
    approveCorporateAction(actionId: string, userId: string): Promise<import("./entities/corporate-action.entity").CorporateAction>;
    executeCorporateAction(actionId: string, userId: string): Promise<{
        action: import("./entities/corporate-action.entity").CorporateAction;
        affectedHoldings: number;
    }>;
    createDistribution(dto: {
        productId: string;
        type: string;
        amountPerUnit: number;
        totalPool: number;
        recordDate: string;
        payDate: string;
        description?: string;
    }, userId: string): Promise<import("./entities/distribution.entity").Distribution>;
    listAdminDistributions(productId?: string): Promise<import("./entities/distribution.entity").Distribution[]>;
    submitDistribution(id: string): Promise<import("./entities/distribution.entity").Distribution>;
    approveDistribution(id: string, userId: string): Promise<import("./entities/distribution.entity").Distribution>;
    computeDistributionRun(id: string, userId: string): Promise<import("./entities/distribution-run.entity").DistributionRun>;
    listDistributionRuns(productId?: string): Promise<import("./entities/distribution-run.entity").DistributionRun[]>;
    approveDistributionRun(runId: string, userId: string): Promise<import("./entities/distribution-run.entity").DistributionRun>;
    executeDistributionRun(runId: string, userId: string): Promise<{
        run: import("./entities/distribution-run.entity").DistributionRun;
        paid: number;
        failed: number;
    }>;
    getDistributionPayouts(id: string): Promise<import("./entities/distribution-payment.entity").DistributionPayment[]>;
    markPayoutStatus(payoutId: string, dto: {
        isPaid: boolean;
    }): Promise<import("./entities/distribution-payment.entity").DistributionPayment>;
}
