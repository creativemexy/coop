export declare enum PlaybookTrigger {
    FIRST_DELINQUENCY = "first_delinquency",
    REPEATED_DELINQUENCY = "repeated_delinquency",
    HIGH_RISK = "high_risk",
    PAYMENT_FAILURE = "payment_failure",
    EXCEPTION_CASE = "exception_case"
}
export declare class CollectionPlaybook {
    id: string;
    title: string;
    description: string;
    triggerEvent: PlaybookTrigger;
    recommendedActions: {
        step: number;
        action: string;
        note?: string;
    }[];
    requiresApproval: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
