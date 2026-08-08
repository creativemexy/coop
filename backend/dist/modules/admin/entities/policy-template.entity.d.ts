export declare enum PolicyTemplateType {
    BNPL_PRODUCT = "bnpl_product",
    KYC_REQUIREMENT = "kyc_requirement",
    MANAGER_ACTION = "manager_action",
    INTEREST_RATE = "interest_rate",
    COLLECTION = "collection"
}
export declare enum PolicyTemplateStatus {
    DRAFT = "draft",
    PENDING_APPROVAL = "pending_approval",
    ACTIVE = "active",
    SUPERSEDED = "superseded",
    REJECTED = "rejected"
}
export declare class PolicyTemplate {
    id: string;
    name: string;
    description: string;
    templateType: PolicyTemplateType;
    version: number;
    status: PolicyTemplateStatus;
    rules: Record<string, any>;
    metadata: Record<string, any>;
    createdBy: string;
    approvedBy: string;
    approvedAt: Date;
    changeSummary: string;
    supersededBy: string;
    parentTemplateId: string;
    isApplicableToAllTenants: boolean;
    applicableTenantIds: string[];
    createdAt: Date;
    updatedAt: Date;
}
