import { StreamableFile } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { Role } from '../../common/enums/role.enum';
import { PolicyTemplateType, PolicyTemplateStatus } from './entities/policy-template.entity';
import { OnboardingStatus } from './entities/tenant-onboarding-request.entity';
import { FeatureFlagStatus } from './entities/feature-flag.entity';
import { IncidentStatus, IncidentSeverity, IncidentSource } from './entities/incident.entity';
import { SecretCategory } from './entities/secret.entity';
import { TemplateType } from './entities/notification-template.entity';
import { DisputeStatus } from './entities/dispute.entity';
export declare class SuperAdminController {
    private readonly sa;
    constructor(sa: SuperAdminService);
    createUser(dto: {
        email: string;
        password?: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        role: Role;
        organizationId?: string;
        apexOrgId?: string;
    }): Promise<{
        id: string;
        email: string;
        role: Role;
        isActive: boolean;
    }>;
    getOverview(): Promise<{
        tenants: {
            total: number;
        };
        users: {
            total: number;
            active: number;
        };
        onboarding: {
            thisMonth: number;
        };
        incidents: {
            active: number;
        };
        policies: {
            active: number;
        };
    }>;
    getAuditLog(days?: string, action?: string, actorId?: string): Promise<import("../bnpl/entities/audit-log.entity").AuditLog[]>;
    createPolicy(dto: {
        name: string;
        description?: string;
        templateType: PolicyTemplateType;
        rules: Record<string, any>;
        metadata?: Record<string, any>;
        isApplicableToAllTenants?: boolean;
        applicableTenantIds?: string[];
    }, user: any): Promise<import("./entities/policy-template.entity").PolicyTemplate>;
    listPolicies(type?: PolicyTemplateType, status?: PolicyTemplateStatus): Promise<import("./entities/policy-template.entity").PolicyTemplate[]>;
    getPolicy(id: string): Promise<import("./entities/policy-template.entity").PolicyTemplate>;
    updatePolicy(id: string, dto: {
        name?: string;
        description?: string;
        rules?: Record<string, any>;
        metadata?: Record<string, any>;
        isApplicableToAllTenants?: boolean;
        applicableTenantIds?: string[];
        changeSummary?: string;
    }, user: any): Promise<import("./entities/policy-template.entity").PolicyTemplate>;
    createPolicyVersion(id: string, dto: {
        rules: Record<string, any>;
        changeSummary: string;
    }, user: any): Promise<import("./entities/policy-template.entity").PolicyTemplate>;
    submitPolicy(id: string): Promise<import("./entities/policy-template.entity").PolicyTemplate>;
    approvePolicy(id: string, user: any): Promise<import("./entities/policy-template.entity").PolicyTemplate>;
    rejectPolicy(id: string, dto: {
        reason: string;
    }): Promise<import("./entities/policy-template.entity").PolicyTemplate>;
    createOnboarding(dto: {
        orgName: string;
        orgCode: string;
        apexOrgId: string;
        complianceDocs?: Record<string, any>;
        kycRequirements?: Record<string, any>;
        productConfig?: Record<string, any>;
        contactInfo?: Record<string, any>;
    }, user: any): Promise<import("./entities/tenant-onboarding-request.entity").TenantOnboardingRequest>;
    listOnboarding(status?: OnboardingStatus): Promise<import("./entities/tenant-onboarding-request.entity").TenantOnboardingRequest[]>;
    getOnboarding(id: string): Promise<import("./entities/tenant-onboarding-request.entity").TenantOnboardingRequest>;
    updateOnboarding(id: string, dto: {
        complianceDocs?: Record<string, any>;
        kycRequirements?: Record<string, any>;
        productConfig?: Record<string, any>;
        contactInfo?: Record<string, any>;
    }): Promise<import("./entities/tenant-onboarding-request.entity").TenantOnboardingRequest>;
    submitOnboarding(id: string): Promise<import("./entities/tenant-onboarding-request.entity").TenantOnboardingRequest>;
    approveOnboarding(id: string, dto: {
        reviewNotes?: string;
    }, user: any): Promise<import("./entities/tenant-onboarding-request.entity").TenantOnboardingRequest>;
    rejectOnboarding(id: string, dto: {
        reason: string;
    }, user: any): Promise<import("./entities/tenant-onboarding-request.entity").TenantOnboardingRequest>;
    completeOnboarding(id: string): Promise<import("../organizations/entities/organization.entity").Organization>;
    createFeatureFlag(dto: {
        key: string;
        name: string;
        description?: string;
        environments?: Record<string, boolean>;
        isKillSwitch?: boolean;
        metadata?: Record<string, any>;
    }, user: any): Promise<import("./entities/feature-flag.entity").FeatureFlag>;
    listFeatureFlags(status?: FeatureFlagStatus): Promise<import("./entities/feature-flag.entity").FeatureFlag[]>;
    getFeatureFlag(id: string): Promise<import("./entities/feature-flag.entity").FeatureFlag>;
    updateFeatureFlag(id: string, dto: {
        name?: string;
        description?: string;
        status?: FeatureFlagStatus;
        environments?: Record<string, boolean>;
        cohortRules?: Record<string, any>;
        rolloutPercentage?: number;
        metadata?: Record<string, any>;
    }, user: any): Promise<import("./entities/feature-flag.entity").FeatureFlag>;
    deleteFeatureFlag(id: string): Promise<import("./entities/feature-flag.entity").FeatureFlag>;
    toggleFeatureFlag(id: string, dto: {
        enabled: boolean;
    }, user: any): Promise<import("./entities/feature-flag.entity").FeatureFlag>;
    createIncident(dto: {
        title: string;
        description?: string;
        severity: IncidentSeverity;
        source: IncidentSource;
        tenantId?: string;
        affectedSystems?: string[];
        metrics?: Record<string, any>;
    }, user: any): Promise<import("./entities/incident.entity").Incident>;
    listIncidents(status?: IncidentStatus | string, severity?: IncidentSeverity): Promise<import("./entities/incident.entity").Incident[]>;
    getIncidentStats(): Promise<{
        total: number;
        open: number;
        critical: number;
        bySeverity: Record<string, number>;
        bySource: Record<string, number>;
    }>;
    getIncident(id: string): Promise<import("./entities/incident.entity").Incident>;
    updateIncident(id: string, dto: {
        status?: IncidentStatus;
        assignedTo?: string;
        resolutionSteps?: Record<string, any>[];
        rootCause?: string;
        actionItems?: string;
    }, user: any): Promise<import("./entities/incident.entity").Incident>;
    assignIncident(id: string, dto: {
        assignedTo: string;
    }): Promise<import("./entities/incident.entity").Incident>;
    getSecurityConfig(): Promise<Record<string, {
        value: string;
        description: string;
        valueType: string;
        updatedAt: Date;
    }>>;
    setSecurityConfig(dto: {
        key: string;
        value: string;
        description?: string;
        valueType?: string;
    }, user: any): Promise<import("./entities/global-security-config.entity").GlobalSecurityConfig | null>;
    deleteSecurityConfig(key: string): Promise<import("./entities/global-security-config.entity").GlobalSecurityConfig>;
    createSecret(dto: {
        key: string;
        encryptedValue: string;
        category: SecretCategory;
        description?: string;
        tenantId?: string;
        expiresAt?: Date;
    }, user: any): Promise<import("./entities/secret.entity").Secret>;
    listSecrets(category?: SecretCategory): Promise<{
        id: string;
        key: string;
        category: SecretCategory;
        description: string;
        tenantId: string;
        isRotationEnabled: boolean;
        lastRotatedAt: Date;
        rotationIntervalDays: number;
        expiresAt: Date;
        createdAt: Date;
    }[]>;
    getSecret(id: string): Promise<{
        id: string;
        key: string;
        encryptedValue: string;
        category: SecretCategory;
        description: string;
        tenantId: string;
        isRotationEnabled: boolean;
        lastRotatedAt: Date;
        rotationIntervalDays: number;
        expiresAt: Date;
        createdAt: Date;
    }>;
    updateSecret(id: string, dto: {
        encryptedValue?: string;
        description?: string;
        category?: SecretCategory;
        isRotationEnabled?: boolean;
        rotationIntervalDays?: number;
        expiresAt?: Date;
    }, user: any): Promise<import("./entities/secret.entity").Secret>;
    deleteSecret(id: string): Promise<import("./entities/secret.entity").Secret>;
    rotateSecret(id: string, dto: {
        encryptedValue: string;
    }, user: any): Promise<import("./entities/secret.entity").Secret>;
    getKycOverview(): Promise<{
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        recentSubmissions: import("../kyc/entities/kyc-submission.entity").KycSubmission[];
    }>;
    getPaymentTransactions(search?: string, type?: string, status?: string, startDate?: string, endDate?: string, page?: string, limit?: string): Promise<{
        data: import("../payments/entities/payment.entity").Payment[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getTemplates(): Promise<import("./entities/notification-template.entity").NotificationTemplate[]>;
    getTemplate(id: string): Promise<import("./entities/notification-template.entity").NotificationTemplate>;
    createTemplate(dto: {
        key: string;
        type: TemplateType;
        subject?: string;
        body: string;
        variables?: string[];
    }): Promise<import("./entities/notification-template.entity").NotificationTemplate>;
    updateTemplate(id: string, dto: Partial<{
        subject: string;
        body: string;
        variables: string[];
    }>): Promise<import("./entities/notification-template.entity").NotificationTemplate>;
    deleteTemplate(id: string): Promise<import("./entities/notification-template.entity").NotificationTemplate>;
    getRiskRules(): Promise<import("./entities/global-risk-rule.entity").GlobalRiskRule[]>;
    createRiskRule(dto: {
        ruleKey: string;
        description: string;
        enabled: boolean;
        config: Record<string, any>;
    }): Promise<import("./entities/global-risk-rule.entity").GlobalRiskRule>;
    updateRiskRule(id: string, dto: Partial<{
        enabled: boolean;
        config: Record<string, any>;
        description: string;
    }>): Promise<import("./entities/global-risk-rule.entity").GlobalRiskRule>;
    deleteRiskRule(id: string): Promise<import("./entities/global-risk-rule.entity").GlobalRiskRule>;
    getFinancialConfig(): Promise<Record<string, string>>;
    updateFinancialConfig(dto: Record<string, string>): Promise<Record<string, string>>;
    getDisputes(status?: string, type?: string, page?: string, limit?: string): Promise<{
        data: import("./entities/dispute.entity").Dispute[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    resolveDispute(id: string, dto: {
        status: DisputeStatus;
        resolution: string;
    }, user: any): Promise<import("./entities/dispute.entity").Dispute>;
    getSystemConfig(): Promise<Record<string, string>>;
    updateSystemConfig(dto: Record<string, string>): Promise<Record<string, string>>;
    triggerBackup(): Promise<{
        message: string;
        filename: string;
        size: number;
        createdAt: string;
    }>;
    listBackups(): Promise<{
        filename: string;
        size: number;
        createdAt: string;
    }[]>;
    downloadBackup(filename: string): Promise<StreamableFile>;
    deleteBackup(filename: string): Promise<{
        message: string;
    }>;
    restoreBackup(filename: string): Promise<{
        message: string;
    }>;
    uploadBackup(file: any): Promise<{
        message: string;
        filename: any;
        size: any;
    }>;
    getRolePermissions(): Promise<any>;
    updateRolePermissions(dto: Record<string, {
        disabledFeatures: string[];
        disabledMenuItems: string[];
    }>): Promise<Record<string, {
        disabledFeatures: string[];
        disabledMenuItems: string[];
    }>>;
}
