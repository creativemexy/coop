export declare enum ExceptionCategory {
    FAILED_PAYMENT = "failed_payment",
    LATE_PAYMENT = "late_payment",
    MISMATCH_AMOUNT = "mismatch_amount",
    MISSING_WEBHOOK = "missing_webhook",
    ELIGIBILITY_EXCEPTION = "eligibility_exception",
    OTHER = "other"
}
export declare enum EscalationAction {
    AUTO_RESOLVE = "auto_resolve",
    MANUAL_REVIEW = "manual_review",
    SUPERVISOR_ESCALATION = "supervisor_escalation",
    WRITE_OFF = "write_off"
}
export declare class ExceptionReason {
    id: string;
    title: string;
    description: string;
    category: ExceptionCategory;
    escalationThresholdDays: number;
    escalationThresholdCount: number;
    escalationAction: EscalationAction;
    status: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
