export declare enum ApprovalRequestType {
    PRODUCT_CHANGE = "product_change",
    MANUAL_OVERRIDE = "manual_override",
    USER_SUSPENSION = "user_suspension",
    WRITE_OFF = "write_off",
    RESTRUCTURING = "restructuring",
    ELIGIBILITY_EXCEPTION = "eligibility_exception",
    TENANT_PRODUCT_ENABLEMENT = "tenant_product_enablement",
    POLICY_TEMPLATE_CHANGE = "policy_template_change"
}
export declare enum ApprovalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class ApprovalRequest {
    id: string;
    requestType: ApprovalRequestType;
    status: ApprovalStatus;
    requestData: Record<string, any>;
    reason: string;
    rejectionReason: string;
    requestedBy: string;
    reviewedBy: string;
    reviewedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
