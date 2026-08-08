import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { AppSetting } from '../settings/entities/app-setting.entity';
import { PolicyTemplate, PolicyTemplateType, PolicyTemplateStatus } from './entities/policy-template.entity';
import { TenantOnboardingRequest, OnboardingStatus } from './entities/tenant-onboarding-request.entity';
import { FeatureFlag, FeatureFlagStatus } from './entities/feature-flag.entity';
import { Incident, IncidentSeverity, IncidentStatus, IncidentSource } from './entities/incident.entity';
import { GlobalSecurityConfig } from './entities/global-security-config.entity';
import { Secret, SecretCategory } from './entities/secret.entity';
import { NotificationTemplate, TemplateType } from './entities/notification-template.entity';
import { GlobalRiskRule } from './entities/global-risk-rule.entity';
import { Dispute, DisputeStatus } from './entities/dispute.entity';
import { KycSubmission } from '../kyc/entities/kyc-submission.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Role } from '../../common/enums/role.enum';
export declare class SuperAdminService {
    private readonly configService;
    private readonly emailService;
    private readonly orgRepo;
    private readonly userRepo;
    private readonly auditRepo;
    private readonly settingRepo;
    private readonly policyRepo;
    private readonly onboardingRepo;
    private readonly flagRepo;
    private readonly incidentRepo;
    private readonly securityRepo;
    private readonly secretRepo;
    private readonly templateRepo;
    private readonly riskRepo;
    private readonly disputeRepo;
    private readonly kycRepo;
    private readonly paymentRepo;
    private readonly backupDir;
    constructor(configService: ConfigService, emailService: EmailService, orgRepo: Repository<Organization>, userRepo: Repository<User>, auditRepo: Repository<AuditLog>, settingRepo: Repository<AppSetting>, policyRepo: Repository<PolicyTemplate>, onboardingRepo: Repository<TenantOnboardingRequest>, flagRepo: Repository<FeatureFlag>, incidentRepo: Repository<Incident>, securityRepo: Repository<GlobalSecurityConfig>, secretRepo: Repository<Secret>, templateRepo: Repository<NotificationTemplate>, riskRepo: Repository<GlobalRiskRule>, disputeRepo: Repository<Dispute>, kycRepo: Repository<KycSubmission>, paymentRepo: Repository<Payment>);
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
    createPolicyTemplate(dto: {
        name: string;
        description?: string;
        templateType: PolicyTemplateType;
        rules: Record<string, any>;
        metadata?: Record<string, any>;
        createdBy: string;
        isApplicableToAllTenants?: boolean;
        applicableTenantIds?: string[];
    }): Promise<PolicyTemplate>;
    listPolicyTemplates(type?: PolicyTemplateType, status?: PolicyTemplateStatus): Promise<PolicyTemplate[]>;
    getPolicyTemplate(id: string): Promise<PolicyTemplate>;
    updatePolicyTemplate(id: string, dto: Partial<{
        name: string;
        description: string;
        rules: Record<string, any>;
        metadata: Record<string, any>;
        isApplicableToAllTenants: boolean;
        applicableTenantIds: string[];
        changeSummary: string;
        updatedBy: string;
    }>): Promise<PolicyTemplate>;
    createPolicyVersion(id: string, dto: {
        rules: Record<string, any>;
        changeSummary: string;
        createdBy: string;
    }): Promise<PolicyTemplate>;
    approvePolicyTemplate(id: string, approvedBy: string): Promise<PolicyTemplate>;
    rejectPolicyTemplate(id: string, reason: string): Promise<PolicyTemplate>;
    submitPolicyForApproval(id: string): Promise<PolicyTemplate>;
    createOnboardingRequest(dto: {
        orgName: string;
        orgCode: string;
        apexOrgId: string;
        complianceDocs?: Record<string, any>;
        kycRequirements?: Record<string, any>;
        productConfig?: Record<string, any>;
        contactInfo?: Record<string, any>;
        submittedBy: string;
    }): Promise<TenantOnboardingRequest>;
    listOnboardingRequests(status?: OnboardingStatus): Promise<TenantOnboardingRequest[]>;
    getOnboardingRequest(id: string): Promise<TenantOnboardingRequest>;
    submitOnboardingRequest(id: string): Promise<TenantOnboardingRequest>;
    approveOnboardingRequest(id: string, reviewedBy: string, reviewNotes?: string): Promise<TenantOnboardingRequest>;
    rejectOnboardingRequest(id: string, reviewedBy: string, reason: string): Promise<TenantOnboardingRequest>;
    completeOnboarding(id: string): Promise<Organization>;
    updateOnboardingRequest(id: string, dto: Partial<{
        complianceDocs: Record<string, any>;
        kycRequirements: Record<string, any>;
        productConfig: Record<string, any>;
        contactInfo: Record<string, any>;
    }>): Promise<TenantOnboardingRequest>;
    createFeatureFlag(dto: {
        key: string;
        name: string;
        description?: string;
        createdBy: string;
        environments?: Record<string, boolean>;
        isKillSwitch?: boolean;
        metadata?: Record<string, any>;
    }): Promise<FeatureFlag>;
    listFeatureFlags(status?: FeatureFlagStatus): Promise<FeatureFlag[]>;
    getFeatureFlag(id: string): Promise<FeatureFlag>;
    updateFeatureFlag(id: string, dto: Partial<{
        name: string;
        description: string;
        status: FeatureFlagStatus;
        environments: Record<string, boolean>;
        cohortRules: Record<string, any>;
        rolloutPercentage: number;
        updatedBy: string;
        metadata: Record<string, any>;
    }>): Promise<FeatureFlag>;
    deleteFeatureFlag(id: string): Promise<FeatureFlag>;
    toggleFeatureFlag(id: string, enabled: boolean, updatedBy: string): Promise<FeatureFlag>;
    createIncident(dto: {
        title: string;
        description?: string;
        severity: IncidentSeverity;
        source: IncidentSource;
        tenantId?: string;
        affectedSystems?: string[];
        metrics?: Record<string, any>;
        reportedBy: string;
    }): Promise<Incident>;
    listIncidents(status?: IncidentStatus | IncidentStatus[], severity?: IncidentSeverity): Promise<Incident[]>;
    getIncident(id: string): Promise<Incident>;
    updateIncident(id: string, dto: Partial<{
        status: IncidentStatus;
        assignedTo: string;
        resolutionSteps: Record<string, any>[];
        rootCause: string;
        actionItems: string;
        resolvedBy: string;
    }>): Promise<Incident>;
    assignIncident(id: string, assignedTo: string): Promise<Incident>;
    getIncidentStats(): Promise<{
        total: number;
        open: number;
        critical: number;
        bySeverity: Record<string, number>;
        bySource: Record<string, number>;
    }>;
    getSecurityConfig(): Promise<Record<string, {
        value: string;
        description: string;
        valueType: string;
        updatedAt: Date;
    }>>;
    setSecurityConfig(key: string, dto: {
        value: string;
        description?: string;
        valueType?: string;
        updatedBy: string;
    }): Promise<GlobalSecurityConfig | null>;
    deleteSecurityConfig(key: string): Promise<GlobalSecurityConfig>;
    createSecret(dto: {
        key: string;
        encryptedValue: string;
        category: SecretCategory;
        description?: string;
        tenantId?: string;
        createdBy: string;
        expiresAt?: Date;
    }): Promise<Secret>;
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
    updateSecret(id: string, dto: Partial<{
        encryptedValue: string;
        description: string;
        category: SecretCategory;
        isRotationEnabled: boolean;
        rotationIntervalDays: number;
        updatedBy: string;
        expiresAt: Date;
    }>): Promise<Secret>;
    deleteSecret(id: string): Promise<Secret>;
    rotateSecret(id: string, newEncryptedValue: string, updatedBy: string): Promise<Secret>;
    getGlobalAuditLog(filters?: {
        days?: number;
        action?: string;
        actorId?: string;
        limit?: number;
    }): Promise<AuditLog[]>;
    getKycOverview(): Promise<{
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        recentSubmissions: KycSubmission[];
    }>;
    getPaymentTransactions(query: {
        search?: string;
        type?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Payment[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getTemplates(): Promise<NotificationTemplate[]>;
    getTemplate(id: string): Promise<NotificationTemplate>;
    createTemplate(dto: {
        key: string;
        type: TemplateType;
        subject?: string;
        body: string;
        variables?: string[];
    }): Promise<NotificationTemplate>;
    updateTemplate(id: string, dto: Partial<{
        subject: string;
        body: string;
        variables: string[];
    }>): Promise<NotificationTemplate>;
    deleteTemplate(id: string): Promise<NotificationTemplate>;
    getRiskRules(): Promise<GlobalRiskRule[]>;
    updateRiskRule(id: string, dto: Partial<{
        enabled: boolean;
        config: Record<string, any>;
        description: string;
    }>): Promise<GlobalRiskRule>;
    createRiskRule(dto: {
        ruleKey: string;
        description: string;
        enabled: boolean;
        config: Record<string, any>;
    }): Promise<GlobalRiskRule>;
    deleteRiskRule(id: string): Promise<GlobalRiskRule>;
    getFinancialConfig(): Promise<Record<string, string>>;
    updateFinancialConfig(dto: Record<string, string>): Promise<Record<string, string>>;
    getDisputes(query: {
        status?: string;
        type?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: Dispute[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    resolveDispute(id: string, dto: {
        status: DisputeStatus;
        resolution: string;
    }, resolvedBy: string): Promise<Dispute>;
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
    getBackupPath(filename: string): string;
    getBackupStream(filename: string): import("fs").ReadStream;
    deleteBackup(filename: string): Promise<{
        message: string;
    }>;
    restoreBackup(filename: string): Promise<{
        message: string;
    }>;
    getRolePermissions(): Promise<any>;
    updateRolePermissions(dto: Record<string, {
        disabledFeatures: string[];
        disabledMenuItems: string[];
    }>): Promise<Record<string, {
        disabledFeatures: string[];
        disabledMenuItems: string[];
    }>>;
    getSystemOverview(): Promise<{
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
}
