import { BnplCatalogItem } from './bnpl-catalog-item.entity';
import { BnplSubscription } from './bnpl-subscription.entity';
export declare enum InterestType {
    FLAT = "flat",
    MONTHLY_FEE = "monthly_fee",
    REDUCING_BALANCE = "reducing_balance"
}
export declare enum PlanStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    RETIRED = "retired"
}
export declare class BnplPlan {
    id: string;
    organizationId: string;
    catalogItemId: string;
    catalogItem: BnplCatalogItem;
    tenorOptions: number[];
    minPrincipal: number;
    maxPrincipal: number;
    eligibilityBands: Array<{
        minScore: number;
        maxScore: number;
        maxPrincipal: number;
    }>;
    downPaymentPercent: number;
    installmentCount: number;
    installmentFrequency: string;
    interestType: InterestType;
    interestRate: number;
    monthlyFeeRate: number;
    gracePeriodDays: number;
    lateFeeRate: number;
    lateFeeCapDays: number;
    isEnabled: boolean;
    status: PlanStatus;
    version: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    subscriptions: BnplSubscription[];
}
