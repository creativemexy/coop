export declare enum PricingFormula {
    SIMPLE = "simple",
    NAV_BASED = "nav_based"
}
export declare enum NavSchedule {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare enum AccrualMethod {
    SIMPLE = "simple",
    COMPOUND = "compound"
}
export declare class PricingConfig {
    id: string;
    productId: string;
    formulaType: PricingFormula;
    minUnitPrice: number | null;
    maxUnitPrice: number | null;
    navSchedule: NavSchedule | null;
    allowCorporateActions: boolean;
    distributionApprovalRequired: boolean;
    accrualMethod: AccrualMethod;
    createdAt: Date;
    updatedAt: Date;
}
