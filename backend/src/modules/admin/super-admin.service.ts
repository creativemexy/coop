import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { exec } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync, readdirSync, createReadStream, statSync, unlinkSync } from 'fs';
import * as bcrypt from 'bcrypt';
import { hashForLookup } from '../../common/encryption.service';
import { generateTemporaryPassword } from '../../common/temp-password.util';
import { EmailService } from '../email/email.service';

function execShell(cmd: string, timeout: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = exec(cmd, { shell: true } as any, (err: any, _stdout: any, stderr: any) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve();
    });
    if (timeout > 0) {
      const timer = setTimeout(() => { child.kill(); reject(new Error('Command timed out')); }, timeout);
      child.on('close', () => clearTimeout(timer));
    }
  });
}
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
import { Dispute, DisputeType, DisputeStatus } from './entities/dispute.entity';
import { KycSubmission } from '../kyc/entities/kyc-submission.entity';
import { KycStatus } from '../../common/enums/status.enum';
import { Payment } from '../payments/entities/payment.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class SuperAdminService {
  private readonly backupDir: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(AppSetting)
    private readonly settingRepo: Repository<AppSetting>,
    @InjectRepository(PolicyTemplate)
    private readonly policyRepo: Repository<PolicyTemplate>,
    @InjectRepository(TenantOnboardingRequest)
    private readonly onboardingRepo: Repository<TenantOnboardingRequest>,
    @InjectRepository(FeatureFlag)
    private readonly flagRepo: Repository<FeatureFlag>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(GlobalSecurityConfig)
    private readonly securityRepo: Repository<GlobalSecurityConfig>,
    @InjectRepository(Secret)
    private readonly secretRepo: Repository<Secret>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(GlobalRiskRule)
    private readonly riskRepo: Repository<GlobalRiskRule>,
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(KycSubmission)
    private readonly kycRepo: Repository<KycSubmission>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {
    this.backupDir = join(process.cwd(), 'storage', 'backups');
    if (!existsSync(this.backupDir)) mkdirSync(this.backupDir, { recursive: true });
  }

  // ─── User Management ─────────────────────────────────────────

  async createUser(dto: {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: Role;
    organizationId?: string;
    apexOrgId?: string;
  }) {
    const email = dto.email?.trim().toLowerCase();
    if (!email) throw new BadRequestException('Email is required');

    const existing = await this.userRepo.findOne({
      where: [{ emailHash: hashForLookup(email) }, { email }],
    });
    if (existing) throw new BadRequestException('A user with that email already exists');

    const role = dto.role;
    if (role === Role.SUPER_ADMIN || role === Role.INDIVIDUAL) {
      throw new BadRequestException('Super admin accounts cannot be created here');
    }

    const coopRoles = [
      Role.BUSINESS_MANAGER,
      Role.BNPL_MANAGER,
      Role.ACCOUNTANT,
      Role.LOAN_MANAGER,
      Role.INVESTMENT_MANAGER,
      Role.SUPERVISOR,
      Role.OPERATIONS,
    ];
    if (coopRoles.includes(role) && !dto.organizationId && !dto.apexOrgId) {
      throw new BadRequestException(
        `${role} requires an organizationId or apexOrgId`,
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const user = this.userRepo.create({
      email,
      emailHash: hashForLookup(email),
      passwordHash,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      phone: dto.phone ?? null,
      phoneHash: dto.phone ? hashForLookup(dto.phone) : null,
      role,
      organizationId: dto.organizationId ?? null,
      apexOrgId: dto.apexOrgId ?? null,
      isActive: true,
      kycStatus: KycStatus.NONE,
      registrationFeePaid: true,
      mustChangePassword: true,
    });
    await this.userRepo.save(user);

    await this.emailService.send({
      to: email,
      subject: 'Your Coop BNPL account credentials',
      text: [
        `Dear ${[dto.firstName, dto.lastName].filter(Boolean).join(' ') || email},`,
        '',
        `An account with the role "${role.replace(/_/g, ' ')}" has been created for you.`,
        '',
        'Login credentials:',
        `Email: ${email}`,
        `Temporary Password: ${temporaryPassword}`,
        '',
        'You will be required to change this password on first login.',
        '',
        'Regards,',
        'Coop BNPL Team',
      ].join('\n'),
    });

    return { id: user.id, email: user.email, role: user.role, isActive: user.isActive };
  }

  // ─── Policy Templates ─────────────────────────────────────────

  async createPolicyTemplate(dto: {
    name: string;
    description?: string;
    templateType: PolicyTemplateType;
    rules: Record<string, any>;
    metadata?: Record<string, any>;
    createdBy: string;
    isApplicableToAllTenants?: boolean;
    applicableTenantIds?: string[];
  }) {
    const template = this.policyRepo.create({
      name: dto.name,
      description: dto.description,
      templateType: dto.templateType,
      rules: dto.rules,
      metadata: dto.metadata,
      createdBy: dto.createdBy,
      version: 1,
      isApplicableToAllTenants: dto.isApplicableToAllTenants ?? true,
      applicableTenantIds: dto.applicableTenantIds || [],
    });
    return this.policyRepo.save(template);
  }

  async listPolicyTemplates(type?: PolicyTemplateType, status?: PolicyTemplateStatus) {
    const where: any = {};
    if (type) where.templateType = type;
    if (status) where.status = status;
    return this.policyRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getPolicyTemplate(id: string) {
    const tpl = await this.policyRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('Policy template not found');
    return tpl;
  }

  async updatePolicyTemplate(id: string, dto: Partial<{
    name: string;
    description: string;
    rules: Record<string, any>;
    metadata: Record<string, any>;
    isApplicableToAllTenants: boolean;
    applicableTenantIds: string[];
    changeSummary: string;
    updatedBy: string;
  }>) {
    const tpl = await this.policyRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('Policy template not found');
    if (tpl.status === PolicyTemplateStatus.ACTIVE) {
      throw new BadRequestException('Cannot edit an active template directly. Create a new version instead.');
    }
    if (dto.name) tpl.name = dto.name;
    if (dto.description !== undefined) tpl.description = dto.description;
    if (dto.rules) tpl.rules = dto.rules;
    if (dto.metadata) tpl.metadata = dto.metadata;
    if (dto.isApplicableToAllTenants !== undefined) tpl.isApplicableToAllTenants = dto.isApplicableToAllTenants;
    if (dto.applicableTenantIds) tpl.applicableTenantIds = dto.applicableTenantIds;
    if (dto.changeSummary) tpl.changeSummary = dto.changeSummary;
    return this.policyRepo.save(tpl);
  }

  async createPolicyVersion(id: string, dto: {
    rules: Record<string, any>;
    changeSummary: string;
    createdBy: string;
  }) {
    const parent = await this.policyRepo.findOne({ where: { id } });
    if (!parent) throw new NotFoundException('Parent template not found');

    const newVersion = this.policyRepo.create({
      name: parent.name,
      description: parent.description,
      templateType: parent.templateType,
      rules: dto.rules,
      metadata: parent.metadata,
      createdBy: dto.createdBy,
      version: parent.version + 1,
      parentTemplateId: parent.id,
      isApplicableToAllTenants: parent.isApplicableToAllTenants,
      applicableTenantIds: parent.applicableTenantIds,
      changeSummary: dto.changeSummary,
    });
    return this.policyRepo.save(newVersion);
  }

  async approvePolicyTemplate(id: string, approvedBy: string) {
    const tpl = await this.policyRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('Policy template not found');
    if (tpl.status !== PolicyTemplateStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Template is not pending approval');
    }

    if (tpl.parentTemplateId) {
      await this.policyRepo.update(tpl.parentTemplateId, { status: PolicyTemplateStatus.SUPERSEDED, supersededBy: id });
    }

    tpl.status = PolicyTemplateStatus.ACTIVE;
    tpl.approvedBy = approvedBy;
    tpl.approvedAt = new Date();
    return this.policyRepo.save(tpl);
  }

  async rejectPolicyTemplate(id: string, reason: string) {
    const tpl = await this.policyRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('Policy template not found');
    tpl.status = PolicyTemplateStatus.REJECTED;
    tpl.changeSummary = reason;
    return this.policyRepo.save(tpl);
  }

  async submitPolicyForApproval(id: string) {
    const tpl = await this.policyRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('Policy template not found');
    if (tpl.status !== PolicyTemplateStatus.DRAFT) {
      throw new BadRequestException('Only draft templates can be submitted for approval');
    }
    tpl.status = PolicyTemplateStatus.PENDING_APPROVAL;
    return this.policyRepo.save(tpl);
  }

  // ─── Tenant Onboarding ──────────────────────────────────────

  async createOnboardingRequest(dto: {
    orgName: string;
    orgCode: string;
    apexOrgId: string;
    complianceDocs?: Record<string, any>;
    kycRequirements?: Record<string, any>;
    productConfig?: Record<string, any>;
    contactInfo?: Record<string, any>;
    submittedBy: string;
  }) {
    const existingOrg = await this.orgRepo.findOne({ where: { code: dto.orgCode } });
    if (existingOrg) throw new BadRequestException('An organization with this code already exists');

    const request = this.onboardingRepo.create({
      ...dto,
      status: OnboardingStatus.DRAFT,
    });
    return this.onboardingRepo.save(request);
  }

  async listOnboardingRequests(status?: OnboardingStatus) {
    const where: any = {};
    if (status) where.status = status;
    return this.onboardingRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getOnboardingRequest(id: string) {
    const req = await this.onboardingRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Onboarding request not found');
    return req;
  }

  async submitOnboardingRequest(id: string) {
    const req = await this.onboardingRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Onboarding request not found');
    if (req.status !== OnboardingStatus.DRAFT) {
      throw new BadRequestException('Only draft requests can be submitted');
    }
    req.status = OnboardingStatus.SUBMITTED;
    return this.onboardingRepo.save(req);
  }

  async approveOnboardingRequest(id: string, reviewedBy: string, reviewNotes?: string) {
    const req = await this.onboardingRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Onboarding request not found');
    if (req.status !== OnboardingStatus.SUBMITTED && req.status !== OnboardingStatus.COMPLIANCE_REVIEW) {
      throw new BadRequestException('Request is not in a reviewable state');
    }
    req.status = OnboardingStatus.APPROVED;
    req.reviewedBy = reviewedBy;
    req.reviewedAt = new Date();
    req.reviewNotes = reviewNotes || req.reviewNotes;
    return this.onboardingRepo.save(req);
  }

  async rejectOnboardingRequest(id: string, reviewedBy: string, reason: string) {
    const req = await this.onboardingRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Onboarding request not found');
    req.status = OnboardingStatus.REJECTED;
    req.reviewedBy = reviewedBy;
    req.reviewedAt = new Date();
    req.rejectionReason = reason;
    return this.onboardingRepo.save(req);
  }

  async completeOnboarding(id: string) {
    const req = await this.onboardingRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Onboarding request not found');
    if (req.status !== OnboardingStatus.APPROVED) {
      throw new BadRequestException('Request must be approved before onboarding');
    }

    const org = this.orgRepo.create({
      name: req.orgName,
      code: req.orgCode,
      apexOrgId: req.apexOrgId,
      createdBy: req.submittedBy,
    });
    const savedOrg = await this.orgRepo.save(org);

    await this.settingRepo.upsert(
      { key: `tenant:${savedOrg.id}:supported_products`, value: JSON.stringify(req.productConfig?.supportedProducts || []) } as AppSetting,
      ['key'],
    );

    req.status = OnboardingStatus.ONBOARDED;
    req.onboardedAt = new Date();
    await this.onboardingRepo.save(req);

    return savedOrg;
  }

  async updateOnboardingRequest(id: string, dto: Partial<{
    complianceDocs: Record<string, any>;
    kycRequirements: Record<string, any>;
    productConfig: Record<string, any>;
    contactInfo: Record<string, any>;
  }>) {
    const req = await this.onboardingRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Onboarding request not found');
    if (req.status !== OnboardingStatus.DRAFT && req.status !== OnboardingStatus.SUBMITTED) {
      throw new BadRequestException('Cannot update request in current state');
    }
    if (dto.complianceDocs) req.complianceDocs = dto.complianceDocs;
    if (dto.kycRequirements) req.kycRequirements = dto.kycRequirements;
    if (dto.productConfig) req.productConfig = dto.productConfig;
    if (dto.contactInfo) req.contactInfo = dto.contactInfo;
    return this.onboardingRepo.save(req);
  }

  // ─── Feature Flags ─────────────────────────────────────────

  async createFeatureFlag(dto: {
    key: string;
    name: string;
    description?: string;
    createdBy: string;
    environments?: Record<string, boolean>;
    isKillSwitch?: boolean;
    metadata?: Record<string, any>;
  }) {
    const existing = await this.flagRepo.findOne({ where: { key: dto.key } });
    if (existing) throw new BadRequestException('Feature flag with this key already exists');

    const flag = this.flagRepo.create({
      ...dto,
      status: FeatureFlagStatus.DISABLED,
      environments: dto.environments || {},
      rolloutPercentage: 0,
    });
    return this.flagRepo.save(flag);
  }

  async listFeatureFlags(status?: FeatureFlagStatus) {
    const where: any = {};
    if (status) where.status = status;
    return this.flagRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getFeatureFlag(id: string) {
    const flag = await this.flagRepo.findOne({ where: { id } });
    if (!flag) throw new NotFoundException('Feature flag not found');
    return flag;
  }

  async updateFeatureFlag(id: string, dto: Partial<{
    name: string;
    description: string;
    status: FeatureFlagStatus;
    environments: Record<string, boolean>;
    cohortRules: Record<string, any>;
    rolloutPercentage: number;
    updatedBy: string;
    metadata: Record<string, any>;
  }>) {
    const flag = await this.flagRepo.findOne({ where: { id } });
    if (!flag) throw new NotFoundException('Feature flag not found');

    if (dto.name !== undefined) flag.name = dto.name;
    if (dto.description !== undefined) flag.description = dto.description;
    if (dto.status !== undefined) {
      flag.status = dto.status;
      if (dto.status === FeatureFlagStatus.ENABLED) flag.enabledAt = new Date();
    }
    if (dto.environments !== undefined) flag.environments = dto.environments;
    if (dto.cohortRules !== undefined) flag.cohortRules = dto.cohortRules;
    if (dto.rolloutPercentage !== undefined) flag.rolloutPercentage = dto.rolloutPercentage;
    if (dto.updatedBy !== undefined) flag.updatedBy = dto.updatedBy;
    if (dto.metadata !== undefined) flag.metadata = dto.metadata;

    return this.flagRepo.save(flag);
  }

  async deleteFeatureFlag(id: string) {
    const flag = await this.flagRepo.findOne({ where: { id } });
    if (!flag) throw new NotFoundException('Feature flag not found');
    return this.flagRepo.remove(flag);
  }

  async toggleFeatureFlag(id: string, enabled: boolean, updatedBy: string) {
    const flag = await this.flagRepo.findOne({ where: { id } });
    if (!flag) throw new NotFoundException('Feature flag not found');
    flag.status = enabled ? FeatureFlagStatus.ENABLED : FeatureFlagStatus.DISABLED;
    flag.updatedBy = updatedBy;
    if (enabled) flag.enabledAt = new Date();
    return this.flagRepo.save(flag);
  }

  // ─── Incidents ─────────────────────────────────────────────

  async createIncident(dto: {
    title: string;
    description?: string;
    severity: IncidentSeverity;
    source: IncidentSource;
    tenantId?: string;
    affectedSystems?: string[];
    metrics?: Record<string, any>;
    reportedBy: string;
  }) {
    const incident = this.incidentRepo.create({
      ...dto,
      status: IncidentStatus.DETECTED,
      detectedAt: new Date(),
    });
    return this.incidentRepo.save(incident);
  }

  async listIncidents(status?: IncidentStatus | IncidentStatus[], severity?: IncidentSeverity) {
    const qb = this.incidentRepo.createQueryBuilder('i').orderBy('i.detectedAt', 'DESC');
    if (status) {
      if (Array.isArray(status)) {
        qb.andWhere('i.status IN (:...statuses)', { statuses: status });
      } else {
        qb.andWhere('i.status = :status', { status });
      }
    }
    if (severity) {
      qb.andWhere('i.severity = :severity', { severity });
    }
    return qb.getMany();
  }

  async getIncident(id: string) {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async updateIncident(id: string, dto: Partial<{
    status: IncidentStatus;
    assignedTo: string;
    resolutionSteps: Record<string, any>[];
    rootCause: string;
    actionItems: string;
    resolvedBy: string;
  }>) {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');

    if (dto.status !== undefined) {
      incident.status = dto.status;
      if (dto.status === IncidentStatus.RESOLVED || dto.status === IncidentStatus.CLOSED) {
        incident.resolvedAt = new Date();
        incident.resolvedBy = dto.resolvedBy || incident.resolvedBy;
      }
    }
    if (dto.assignedTo !== undefined) incident.assignedTo = dto.assignedTo;
    if (dto.resolutionSteps !== undefined) incident.resolutionSteps = dto.resolutionSteps;
    if (dto.rootCause !== undefined) incident.rootCause = dto.rootCause;
    if (dto.actionItems !== undefined) incident.actionItems = dto.actionItems;

    return this.incidentRepo.save(incident);
  }

  async assignIncident(id: string, assignedTo: string) {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    incident.assignedTo = assignedTo;
    if (incident.status === IncidentStatus.DETECTED) {
      incident.status = IncidentStatus.INVESTIGATING;
    }
    return this.incidentRepo.save(incident);
  }

  async getIncidentStats() {
    const [
      total,
      open,
      critical,
      bySeverity,
      bySource,
    ] = await Promise.all([
      this.incidentRepo.count(),
      this.incidentRepo.createQueryBuilder('i').where('i.status IN (:...statuses)', { statuses: [IncidentStatus.DETECTED, IncidentStatus.INVESTIGATING] }).getCount(),
      this.incidentRepo.createQueryBuilder('i').where('i.severity = :severity AND i.status NOT IN (:...statuses)', { severity: IncidentSeverity.CRITICAL, statuses: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] }).getCount(),
      this.incidentRepo.createQueryBuilder('i').select('i.severity', 'severity').addSelect('COUNT(*)', 'count').groupBy('i.severity').getRawMany(),
      this.incidentRepo.createQueryBuilder('i').select('i.source', 'source').addSelect('COUNT(*)', 'count').groupBy('i.source').getRawMany(),
    ]);

    const severityMap: Record<string, number> = {};
    for (const s of bySeverity) severityMap[s.severity] = Number(s.count);

    const sourceMap: Record<string, number> = {};
    for (const s of bySource) sourceMap[s.source] = Number(s.count);

    return { total, open, critical, bySeverity: severityMap, bySource: sourceMap };
  }

  // ─── Global Security Config ─────────────────────────────────

  async getSecurityConfig() {
    const configs = await this.securityRepo.find();
    const result: Record<string, { value: string; description: string; valueType: string; updatedAt: Date }> = {};
    for (const c of configs) {
      result[c.key] = { value: c.value, description: c.description || '', valueType: c.valueType, updatedAt: c.updatedAt };
    }
    return result;
  }

  async setSecurityConfig(key: string, dto: { value: string; description?: string; valueType?: string; updatedBy: string }) {
    await this.securityRepo.upsert(
      { key, value: dto.value, description: dto.description || null, valueType: dto.valueType || 'string', updatedBy: dto.updatedBy } as GlobalSecurityConfig,
      ['key'],
    );
    return this.securityRepo.findOne({ where: { key } });
  }

  async deleteSecurityConfig(key: string) {
    const config = await this.securityRepo.findOne({ where: { key } });
    if (!config) throw new NotFoundException('Security config not found');
    return this.securityRepo.remove(config);
  }

  // ─── Secrets Management ────────────────────────────────────

  async createSecret(dto: {
    key: string;
    encryptedValue: string;
    category: SecretCategory;
    description?: string;
    tenantId?: string;
    createdBy: string;
    expiresAt?: Date;
  }) {
    const existing = await this.secretRepo.findOne({ where: { key: dto.key } });
    if (existing) throw new BadRequestException('Secret with this key already exists');

    const secret = this.secretRepo.create(dto);
    return this.secretRepo.save(secret);
  }

  async listSecrets(category?: SecretCategory) {
    const where: any = {};
    if (category) where.category = category;
    const secrets = await this.secretRepo.find({ where, order: { createdAt: 'DESC' } });
    return secrets.map((s) => ({
      id: s.id,
      key: s.key,
      category: s.category,
      description: s.description,
      tenantId: s.tenantId,
      isRotationEnabled: s.isRotationEnabled,
      lastRotatedAt: s.lastRotatedAt,
      rotationIntervalDays: s.rotationIntervalDays,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    }));
  }

  async getSecret(id: string) {
    const secret = await this.secretRepo.findOne({ where: { id } });
    if (!secret) throw new NotFoundException('Secret not found');
    return {
      id: secret.id,
      key: secret.key,
      encryptedValue: secret.encryptedValue,
      category: secret.category,
      description: secret.description,
      tenantId: secret.tenantId,
      isRotationEnabled: secret.isRotationEnabled,
      lastRotatedAt: secret.lastRotatedAt,
      rotationIntervalDays: secret.rotationIntervalDays,
      expiresAt: secret.expiresAt,
      createdAt: secret.createdAt,
    };
  }

  async updateSecret(id: string, dto: Partial<{
    encryptedValue: string;
    description: string;
    category: SecretCategory;
    isRotationEnabled: boolean;
    rotationIntervalDays: number;
    updatedBy: string;
    expiresAt: Date;
  }>) {
    const secret = await this.secretRepo.findOne({ where: { id } });
    if (!secret) throw new NotFoundException('Secret not found');

    if (dto.encryptedValue !== undefined) secret.encryptedValue = dto.encryptedValue;
    if (dto.description !== undefined) secret.description = dto.description;
    if (dto.category !== undefined) secret.category = dto.category;
    if (dto.isRotationEnabled !== undefined) secret.isRotationEnabled = dto.isRotationEnabled;
    if (dto.rotationIntervalDays !== undefined) secret.rotationIntervalDays = dto.rotationIntervalDays;
    if (dto.updatedBy !== undefined) secret.updatedBy = dto.updatedBy;
    if (dto.expiresAt !== undefined) secret.expiresAt = dto.expiresAt;

    return this.secretRepo.save(secret);
  }

  async deleteSecret(id: string) {
    const secret = await this.secretRepo.findOne({ where: { id } });
    if (!secret) throw new NotFoundException('Secret not found');
    return this.secretRepo.remove(secret);
  }

  async rotateSecret(id: string, newEncryptedValue: string, updatedBy: string) {
    const secret = await this.secretRepo.findOne({ where: { id } });
    if (!secret) throw new NotFoundException('Secret not found');
    secret.encryptedValue = newEncryptedValue;
    secret.lastRotatedAt = new Date();
    secret.updatedBy = updatedBy;
    return this.secretRepo.save(secret);
  }

  // ─── Global super admin utilities ──────────────────────────

  async getGlobalAuditLog(filters?: {
    days?: number;
    action?: string;
    actorId?: string;
    limit?: number;
  }) {
    const days = filters?.days || 7;
    const since = new Date(Date.now() - days * 86400000);
    const where: any = { createdAt: Between(since, new Date()) };

    if (filters?.action) where.action = filters.action;
    if (filters?.actorId) where.performedBy = filters.actorId;

    return this.auditRepo.find({ where, order: { createdAt: 'DESC' }, take: filters?.limit || 200 });
  }

  // ─── KYC Compliance Overview ────────────────────────────────

  async getKycOverview() {
    const total = await this.kycRepo.count();
    const approved = await this.kycRepo.count({ where: { status: KycStatus.APPROVED as any } });
    const rejected = await this.kycRepo.count({ where: { status: KycStatus.REJECTED as any } });
    const pending = await this.kycRepo.count({ where: { status: KycStatus.PENDING as any } });

    const recentSubmissions = await this.kycRepo.find({
      order: { submittedAt: 'DESC' },
      take: 20,
    });

    return { total, approved, rejected, pending, recentSubmissions };
  }

  // ─── Payment Transaction Log ────────────────────────────────

  async getPaymentTransactions(query: {
    search?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, type, status, startDate, endDate, page = 1, limit = 20 } = query;
    const qb = this.paymentRepo.createQueryBuilder('p');

    if (search) {
      qb.andWhere(
        'p.providerReference ILIKE :search',
        { search: `%${search}%` },
      );
    }
    if (type) qb.andWhere('p.provider = :type', { type });
    if (status) qb.andWhere('p.status = :status', { status });
    if (startDate) qb.andWhere('p.createdAt >= :startDate', { startDate });
    if (endDate) qb.andWhere('p.createdAt <= :endDate', { endDate });

    qb.orderBy('p.createdAt', 'DESC').skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Notification Templates ─────────────────────────────────

  async getTemplates() {
    return this.templateRepo.find({ order: { key: 'ASC' } });
  }

  async getTemplate(id: string) {
    const tpl = await this.templateRepo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  async createTemplate(dto: {
    key: string;
    type: TemplateType;
    subject?: string;
    body: string;
    variables?: string[];
  }) {
    const exists = await this.templateRepo.findOne({ where: { key: dto.key } });
    if (exists) throw new BadRequestException('Template key already exists');
    return this.templateRepo.save(this.templateRepo.create(dto));
  }

  async updateTemplate(id: string, dto: Partial<{
    subject: string;
    body: string;
    variables: string[];
  }>) {
    const tpl = await this.getTemplate(id);
    Object.assign(tpl, dto);
    return this.templateRepo.save(tpl);
  }

  async deleteTemplate(id: string) {
    const tpl = await this.getTemplate(id);
    return this.templateRepo.remove(tpl);
  }

  // ─── Global Risk Rules ──────────────────────────────────────

  async getRiskRules() {
    return this.riskRepo.find({ order: { ruleKey: 'ASC' } });
  }

  async updateRiskRule(id: string, dto: Partial<{ enabled: boolean; config: Record<string, any>; description: string }>) {
    const rule = await this.riskRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Risk rule not found');
    Object.assign(rule, dto);
    return this.riskRepo.save(rule);
  }

  async createRiskRule(dto: { ruleKey: string; description: string; enabled: boolean; config: Record<string, any> }) {
    return this.riskRepo.save(this.riskRepo.create(dto));
  }

  async deleteRiskRule(id: string) {
    const rule = await this.riskRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Risk rule not found');
    return this.riskRepo.remove(rule);
  }

  // ─── Tax / Interest Rate Config ─────────────────────────────

  async getFinancialConfig() {
    const keys = ['interest_rate', 'late_payment_fee', 'tax_rate', 'withholding_tax', 'processing_fee'];
    const settings = await this.settingRepo.find({ where: { key: In(keys) } });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    for (const k of keys) if (!map[k]) map[k] = '';
    return map;
  }

  async updateFinancialConfig(dto: Record<string, string>) {
    for (const [key, value] of Object.entries(dto)) {
      await this.settingRepo.upsert(
        { key, value },
        { conflictPaths: ['key'], skipUpdateIfNoValuesChanged: false },
      );
    }
    return this.getFinancialConfig();
  }

  // ─── Dispute Management ─────────────────────────────────────

  async getDisputes(query: { status?: string; type?: string; page?: number; limit?: number }) {
    const { status, type, page = 1, limit = 20 } = query;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const [data, total] = await this.disputeRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveDispute(id: string, dto: { status: DisputeStatus; resolution: string }, resolvedBy: string) {
    const dispute = await this.disputeRepo.findOne({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');
    dispute.status = dto.status;
    dispute.resolution = dto.resolution;
    dispute.resolvedBy = resolvedBy;
    dispute.resolvedAt = new Date();
    return this.disputeRepo.save(dispute);
  }

  // ─── System Config / Backup ─────────────────────────────────

  async getSystemConfig() {
    const keys = ['platform_name', 'support_email', 'support_phone', 'backup_enabled', 'maintenance_mode'];
    const settings = await this.settingRepo.find({ where: { key: In(keys) } });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  }

  async updateSystemConfig(dto: Record<string, string>) {
    for (const [key, value] of Object.entries(dto)) {
      await this.settingRepo.upsert(
        { key, value },
        { conflictPaths: ['key'], skipUpdateIfNoValuesChanged: false },
      );
    }
    return this.getSystemConfig();
  }

  async triggerBackup() {
    const host = this.configService.get<string>('database.host', 'localhost');
    const port = this.configService.get<string>('database.port', '5432');
    const user = this.configService.get<string>('database.username', 'postgres');
    const password = this.configService.get<string>('database.password', 'postgres');
    const db = this.configService.get<string>('database.database', 'coop_bnpl');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql.gz`;
    const filepath = join(this.backupDir, filename);

    const cmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${db} --no-owner | gzip > "${filepath}"`;

    try {
      await execShell(cmd, 300_000);
    } catch (err: any) {
      throw new BadRequestException(`Backup failed: ${err.message}`);
    }

    const stats = statSync(filepath);
    return {
      message: 'Backup completed',
      filename,
      size: stats.size,
      createdAt: new Date().toISOString(),
    };
  }

  async listBackups() {
    try {
      const files = readdirSync(this.backupDir).filter((f) => f.endsWith('.sql.gz'));
      return files
        .map((f) => {
          const stats = statSync(join(this.backupDir, f));
          return { filename: f, size: stats.size, createdAt: stats.birthtime.toISOString() };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  getBackupPath(filename: string): string {
    const safe = join(this.backupDir, filename);
    if (!safe.startsWith(this.backupDir)) throw new BadRequestException('Invalid backup filename');
    if (!existsSync(safe)) throw new NotFoundException('Backup file not found');
    return safe;
  }

  getBackupStream(filename: string) {
    const filepath = this.getBackupPath(filename);
    return createReadStream(filepath);
  }

  async deleteBackup(filename: string) {
    const filepath = this.getBackupPath(filename);
    unlinkSync(filepath);
    return { message: `Backup ${filename} deleted` };
  }

  async restoreBackup(filename: string) {
    const host = this.configService.get<string>('database.host', 'localhost');
    const port = this.configService.get<string>('database.port', '5432');
    const user = this.configService.get<string>('database.username', 'postgres');
    const password = this.configService.get<string>('database.password', 'postgres');
    const db = this.configService.get<string>('database.database', 'coop_bnpl');
    const filepath = this.getBackupPath(filename);

    const cmd = `gunzip -c "${filepath}" | PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${db}`;

    try {
      await execShell(cmd, 600_000);
    } catch (err: any) {
      throw new BadRequestException(`Restore failed: ${err.message}`);
    }

    return { message: `Restore from ${filename} completed` };
  }

  // ─── Role Feature Permissions ────────────────────────────

  async getRolePermissions() {
    const setting = await this.settingRepo.findOne({ where: { key: 'role_permissions' } });
    return setting ? JSON.parse(setting.value) : {};
  }

  async updateRolePermissions(dto: Record<string, { disabledFeatures: string[]; disabledMenuItems: string[] }>) {
    await this.settingRepo.upsert(
      { key: 'role_permissions', value: JSON.stringify(dto) },
      { conflictPaths: ['key'], skipUpdateIfNoValuesChanged: false },
    );
    return dto;
  }

  async getSystemOverview() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400000);

    const [
      totalTenants,
      totalUsers,
      activeUsers,
      onboardingsThisMonth,
      activeIncidents,
      totalPolicies,
    ] = await Promise.all([
      this.orgRepo.count(),
      this.userRepo.count(),
      this.userRepo.count({ where: { isActive: true } }),
      this.onboardingRepo.count({
        where: { createdAt: Between(new Date(now.getFullYear(), now.getMonth(), 1), now) },
      }),
      this.incidentRepo.createQueryBuilder('i').where('i.status IN (:...statuses)', { statuses: [IncidentStatus.DETECTED, IncidentStatus.INVESTIGATING] }).getCount(),
      this.policyRepo.count({ where: { status: PolicyTemplateStatus.ACTIVE } }),
    ]);

    return {
      tenants: { total: totalTenants },
      users: { total: totalUsers, active: activeUsers },
      onboarding: { thisMonth: onboardingsThisMonth },
      incidents: { active: activeIncidents },
      policies: { active: totalPolicies },
    };
  }
}
