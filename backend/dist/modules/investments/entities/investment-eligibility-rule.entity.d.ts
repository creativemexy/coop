import { InvestmentProduct } from './investment-product.entity';
export declare enum KycLevel {
    NONE = "none",
    BASIC = "basic",
    ADVANCED = "advanced"
}
export declare class InvestmentEligibilityRule {
    id: string;
    productId: string;
    product: InvestmentProduct;
    kycRequiredLevel: KycLevel;
    requireMembership: boolean;
    allowedGeographies: string[] | null;
    accreditationRequired: boolean;
    investorWhitelist: string[] | null;
    investorBlacklist: string[] | null;
    createdAt: Date;
    updatedAt: Date;
}
