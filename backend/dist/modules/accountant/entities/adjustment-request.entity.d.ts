export declare enum AdjustmentType {
    METADATA_CORRECTION = "metadata_correction",
    JOURNAL_ENTRY = "journal_entry"
}
export declare enum AdjustmentStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class AdjustmentRequest {
    id: string;
    adjustmentType: AdjustmentType;
    description: string;
    reasonCode: string;
    changes: Record<string, any>;
    referenceType: string;
    referenceId: string;
    status: AdjustmentStatus;
    rejectionReason: string;
    requestedBy: string;
    reviewedBy: string;
    reviewedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
