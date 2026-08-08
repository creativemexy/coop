export declare enum OnboardingStatus {
    DRAFT = "draft",
    SUBMITTED = "submitted",
    COMPLIANCE_REVIEW = "compliance_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    ONBOARDED = "onboarded"
}
export declare class TenantOnboardingRequest {
    id: string;
    orgName: string;
    orgCode: string;
    apexOrgId: string;
    status: OnboardingStatus;
    complianceDocs: Record<string, any>;
    kycRequirements: Record<string, any>;
    productConfig: Record<string, any>;
    contactInfo: Record<string, any>;
    rejectionReason: string;
    reviewNotes: string;
    submittedBy: string;
    reviewedBy: string;
    reviewedAt: Date;
    onboardedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
