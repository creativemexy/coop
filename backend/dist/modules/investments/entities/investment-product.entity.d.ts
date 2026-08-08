export declare enum InvestmentType {
    SHARES = "shares",
    FIXED_INCOME = "fixed_income",
    POOLED = "pooled"
}
export declare enum RiskTier {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export declare enum DistributionFrequency {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    ANNUALLY = "annually",
    MATURITY = "maturity"
}
export declare enum ProductStatus {
    DRAFT = "draft",
    PENDING_REVIEW = "pending_review",
    ACTIVE = "active",
    SUSPENDED = "suspended",
    CLOSED = "closed",
    ARCHIVED = "archived"
}
export declare const VALID_LIFECYCLE_TRANSITIONS: Record<ProductStatus, ProductStatus[]>;
export declare class InvestmentProduct {
    id: string;
    name: string;
    description: string | null;
    type: InvestmentType;
    riskTier: RiskTier;
    minimumInvestment: number;
    maximumInvestment: number | null;
    totalCapacity: number | null;
    currentCapacity: number | null;
    perInvestorCaps: {
        min?: number;
        max?: number;
    } | null;
    unitPrice: number | null;
    lockInDays: number;
    tenorDays: number | null;
    managementFeeRate: number;
    expectedReturnRate: number;
    profitSharingRules: string | null;
    distributionFrequency: DistributionFrequency;
    totalUnits: number | null;
    availableUnits: number | null;
    isOpen: boolean;
    status: ProductStatus;
    version: number;
    organizationId: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}
