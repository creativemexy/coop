export declare enum InterestModel {
    FIXED_MONTHLY_FEE = "fixed_monthly_fee",
    REDUCING_BALANCE = "reducing_balance",
    SIMPLE = "simple"
}
export declare enum DueDateRule {
    SAME_DAY_MONTHLY = "same_day_monthly",
    END_OF_MONTH = "end_of_month"
}
export declare enum LateFeeType {
    PERCENTAGE = "percentage",
    FLAT = "flat"
}
export declare class BnplPlanConfig {
    id: string;
    organizationId: string;
    availableTenors: {
        installmentCount: number;
        frequency: 'weekly' | 'biweekly' | 'monthly';
        label: string;
    }[];
    interestModel: InterestModel;
    maxPrincipal: number;
    requireMembership: boolean;
    dueDateRule: DueDateRule;
    gracePeriodDays: number;
    lateFeeType: LateFeeType;
    lateFeeValue: number;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
