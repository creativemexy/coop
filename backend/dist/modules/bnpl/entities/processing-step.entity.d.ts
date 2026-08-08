export declare enum ProcessingStepStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum ProcessingStepType {
    PAYMENT_INTENT = "payment_intent",
    DISBURSEMENT = "disbursement",
    INSTALLMENT_GENERATION = "installment_generation",
    SETTLEMENT = "settlement",
    RECONCILIATION = "reconciliation"
}
export declare class ProcessingStep {
    id: string;
    subscriptionId: string;
    stepType: ProcessingStepType;
    status: ProcessingStepStatus;
    idempotencyKey: string;
    metadata: Record<string, any>;
    errorMessage: string | null;
    retryCount: number;
    externalReference: string;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
