"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const bcrypt = __importStar(require("bcrypt"));
const encryption_service_1 = require("../../common/encryption.service");
const temp_password_util_1 = require("../../common/temp-password.util");
const email_service_1 = require("../email/email.service");
function execShell(cmd, timeout) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.exec)(cmd, { shell: true }, (err, _stdout, stderr) => {
            if (err)
                reject(new Error(stderr || err.message));
            else
                resolve();
        });
        if (timeout > 0) {
            const timer = setTimeout(() => { child.kill(); reject(new Error('Command timed out')); }, timeout);
            child.on('close', () => clearTimeout(timer));
        }
    });
}
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_entity_1 = require("../users/entities/user.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const app_setting_entity_1 = require("../settings/entities/app-setting.entity");
const policy_template_entity_1 = require("./entities/policy-template.entity");
const tenant_onboarding_request_entity_1 = require("./entities/tenant-onboarding-request.entity");
const feature_flag_entity_1 = require("./entities/feature-flag.entity");
const incident_entity_1 = require("./entities/incident.entity");
const global_security_config_entity_1 = require("./entities/global-security-config.entity");
const secret_entity_1 = require("./entities/secret.entity");
const notification_template_entity_1 = require("./entities/notification-template.entity");
const global_risk_rule_entity_1 = require("./entities/global-risk-rule.entity");
const dispute_entity_1 = require("./entities/dispute.entity");
const kyc_submission_entity_1 = require("../kyc/entities/kyc-submission.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const payment_entity_1 = require("../payments/entities/payment.entity");
const role_enum_1 = require("../../common/enums/role.enum");
let SuperAdminService = class SuperAdminService {
    configService;
    emailService;
    orgRepo;
    userRepo;
    auditRepo;
    settingRepo;
    policyRepo;
    onboardingRepo;
    flagRepo;
    incidentRepo;
    securityRepo;
    secretRepo;
    templateRepo;
    riskRepo;
    disputeRepo;
    kycRepo;
    paymentRepo;
    backupDir;
    constructor(configService, emailService, orgRepo, userRepo, auditRepo, settingRepo, policyRepo, onboardingRepo, flagRepo, incidentRepo, securityRepo, secretRepo, templateRepo, riskRepo, disputeRepo, kycRepo, paymentRepo) {
        this.configService = configService;
        this.emailService = emailService;
        this.orgRepo = orgRepo;
        this.userRepo = userRepo;
        this.auditRepo = auditRepo;
        this.settingRepo = settingRepo;
        this.policyRepo = policyRepo;
        this.onboardingRepo = onboardingRepo;
        this.flagRepo = flagRepo;
        this.incidentRepo = incidentRepo;
        this.securityRepo = securityRepo;
        this.secretRepo = secretRepo;
        this.templateRepo = templateRepo;
        this.riskRepo = riskRepo;
        this.disputeRepo = disputeRepo;
        this.kycRepo = kycRepo;
        this.paymentRepo = paymentRepo;
        this.backupDir = (0, path_1.join)(process.cwd(), 'storage', 'backups');
        if (!(0, fs_1.existsSync)(this.backupDir))
            (0, fs_1.mkdirSync)(this.backupDir, { recursive: true });
    }
    async createUser(dto) {
        const email = dto.email?.trim().toLowerCase();
        if (!email)
            throw new common_1.BadRequestException('Email is required');
        const existing = await this.userRepo.findOne({
            where: [{ emailHash: (0, encryption_service_1.hashForLookup)(email) }, { email }],
        });
        if (existing)
            throw new common_1.BadRequestException('A user with that email already exists');
        const role = dto.role;
        if (role === role_enum_1.Role.SUPER_ADMIN || role === role_enum_1.Role.INDIVIDUAL) {
            throw new common_1.BadRequestException('Super admin accounts cannot be created here');
        }
        const coopRoles = [
            role_enum_1.Role.BUSINESS_MANAGER,
            role_enum_1.Role.BNPL_MANAGER,
            role_enum_1.Role.ACCOUNTANT,
            role_enum_1.Role.LOAN_MANAGER,
            role_enum_1.Role.INVESTMENT_MANAGER,
            role_enum_1.Role.SUPERVISOR,
            role_enum_1.Role.OPERATIONS,
        ];
        if (coopRoles.includes(role) && !dto.organizationId && !dto.apexOrgId) {
            throw new common_1.BadRequestException(`${role} requires an organizationId or apexOrgId`);
        }
        const temporaryPassword = (0, temp_password_util_1.generateTemporaryPassword)();
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);
        const user = this.userRepo.create({
            email,
            emailHash: (0, encryption_service_1.hashForLookup)(email),
            passwordHash,
            firstName: dto.firstName ?? null,
            lastName: dto.lastName ?? null,
            phone: dto.phone ?? null,
            phoneHash: dto.phone ? (0, encryption_service_1.hashForLookup)(dto.phone) : null,
            role,
            organizationId: dto.organizationId ?? null,
            apexOrgId: dto.apexOrgId ?? null,
            isActive: true,
            kycStatus: status_enum_1.KycStatus.NONE,
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
    async createPolicyTemplate(dto) {
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
    async listPolicyTemplates(type, status) {
        const where = {};
        if (type)
            where.templateType = type;
        if (status)
            where.status = status;
        return this.policyRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async getPolicyTemplate(id) {
        const tpl = await this.policyRepo.findOne({ where: { id } });
        if (!tpl)
            throw new common_1.NotFoundException('Policy template not found');
        return tpl;
    }
    async updatePolicyTemplate(id, dto) {
        const tpl = await this.policyRepo.findOne({ where: { id } });
        if (!tpl)
            throw new common_1.NotFoundException('Policy template not found');
        if (tpl.status === policy_template_entity_1.PolicyTemplateStatus.ACTIVE) {
            throw new common_1.BadRequestException('Cannot edit an active template directly. Create a new version instead.');
        }
        if (dto.name)
            tpl.name = dto.name;
        if (dto.description !== undefined)
            tpl.description = dto.description;
        if (dto.rules)
            tpl.rules = dto.rules;
        if (dto.metadata)
            tpl.metadata = dto.metadata;
        if (dto.isApplicableToAllTenants !== undefined)
            tpl.isApplicableToAllTenants = dto.isApplicableToAllTenants;
        if (dto.applicableTenantIds)
            tpl.applicableTenantIds = dto.applicableTenantIds;
        if (dto.changeSummary)
            tpl.changeSummary = dto.changeSummary;
        return this.policyRepo.save(tpl);
    }
    async createPolicyVersion(id, dto) {
        const parent = await this.policyRepo.findOne({ where: { id } });
        if (!parent)
            throw new common_1.NotFoundException('Parent template not found');
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
    async approvePolicyTemplate(id, approvedBy) {
        const tpl = await this.policyRepo.findOne({ where: { id } });
        if (!tpl)
            throw new common_1.NotFoundException('Policy template not found');
        if (tpl.status !== policy_template_entity_1.PolicyTemplateStatus.PENDING_APPROVAL) {
            throw new common_1.BadRequestException('Template is not pending approval');
        }
        if (tpl.parentTemplateId) {
            await this.policyRepo.update(tpl.parentTemplateId, { status: policy_template_entity_1.PolicyTemplateStatus.SUPERSEDED, supersededBy: id });
        }
        tpl.status = policy_template_entity_1.PolicyTemplateStatus.ACTIVE;
        tpl.approvedBy = approvedBy;
        tpl.approvedAt = new Date();
        return this.policyRepo.save(tpl);
    }
    async rejectPolicyTemplate(id, reason) {
        const tpl = await this.policyRepo.findOne({ where: { id } });
        if (!tpl)
            throw new common_1.NotFoundException('Policy template not found');
        tpl.status = policy_template_entity_1.PolicyTemplateStatus.REJECTED;
        tpl.changeSummary = reason;
        return this.policyRepo.save(tpl);
    }
    async submitPolicyForApproval(id) {
        const tpl = await this.policyRepo.findOne({ where: { id } });
        if (!tpl)
            throw new common_1.NotFoundException('Policy template not found');
        if (tpl.status !== policy_template_entity_1.PolicyTemplateStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft templates can be submitted for approval');
        }
        tpl.status = policy_template_entity_1.PolicyTemplateStatus.PENDING_APPROVAL;
        return this.policyRepo.save(tpl);
    }
    async createOnboardingRequest(dto) {
        const existingOrg = await this.orgRepo.findOne({ where: { code: dto.orgCode } });
        if (existingOrg)
            throw new common_1.BadRequestException('An organization with this code already exists');
        const request = this.onboardingRepo.create({
            ...dto,
            status: tenant_onboarding_request_entity_1.OnboardingStatus.DRAFT,
        });
        return this.onboardingRepo.save(request);
    }
    async listOnboardingRequests(status) {
        const where = {};
        if (status)
            where.status = status;
        return this.onboardingRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async getOnboardingRequest(id) {
        const req = await this.onboardingRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Onboarding request not found');
        return req;
    }
    async submitOnboardingRequest(id) {
        const req = await this.onboardingRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Onboarding request not found');
        if (req.status !== tenant_onboarding_request_entity_1.OnboardingStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft requests can be submitted');
        }
        req.status = tenant_onboarding_request_entity_1.OnboardingStatus.SUBMITTED;
        return this.onboardingRepo.save(req);
    }
    async approveOnboardingRequest(id, reviewedBy, reviewNotes) {
        const req = await this.onboardingRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Onboarding request not found');
        if (req.status !== tenant_onboarding_request_entity_1.OnboardingStatus.SUBMITTED && req.status !== tenant_onboarding_request_entity_1.OnboardingStatus.COMPLIANCE_REVIEW) {
            throw new common_1.BadRequestException('Request is not in a reviewable state');
        }
        req.status = tenant_onboarding_request_entity_1.OnboardingStatus.APPROVED;
        req.reviewedBy = reviewedBy;
        req.reviewedAt = new Date();
        req.reviewNotes = reviewNotes || req.reviewNotes;
        return this.onboardingRepo.save(req);
    }
    async rejectOnboardingRequest(id, reviewedBy, reason) {
        const req = await this.onboardingRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Onboarding request not found');
        req.status = tenant_onboarding_request_entity_1.OnboardingStatus.REJECTED;
        req.reviewedBy = reviewedBy;
        req.reviewedAt = new Date();
        req.rejectionReason = reason;
        return this.onboardingRepo.save(req);
    }
    async completeOnboarding(id) {
        const req = await this.onboardingRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Onboarding request not found');
        if (req.status !== tenant_onboarding_request_entity_1.OnboardingStatus.APPROVED) {
            throw new common_1.BadRequestException('Request must be approved before onboarding');
        }
        const org = this.orgRepo.create({
            name: req.orgName,
            code: req.orgCode,
            apexOrgId: req.apexOrgId,
            createdBy: req.submittedBy,
        });
        const savedOrg = await this.orgRepo.save(org);
        await this.settingRepo.upsert({ key: `tenant:${savedOrg.id}:supported_products`, value: JSON.stringify(req.productConfig?.supportedProducts || []) }, ['key']);
        req.status = tenant_onboarding_request_entity_1.OnboardingStatus.ONBOARDED;
        req.onboardedAt = new Date();
        await this.onboardingRepo.save(req);
        return savedOrg;
    }
    async updateOnboardingRequest(id, dto) {
        const req = await this.onboardingRepo.findOne({ where: { id } });
        if (!req)
            throw new common_1.NotFoundException('Onboarding request not found');
        if (req.status !== tenant_onboarding_request_entity_1.OnboardingStatus.DRAFT && req.status !== tenant_onboarding_request_entity_1.OnboardingStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Cannot update request in current state');
        }
        if (dto.complianceDocs)
            req.complianceDocs = dto.complianceDocs;
        if (dto.kycRequirements)
            req.kycRequirements = dto.kycRequirements;
        if (dto.productConfig)
            req.productConfig = dto.productConfig;
        if (dto.contactInfo)
            req.contactInfo = dto.contactInfo;
        return this.onboardingRepo.save(req);
    }
    async createFeatureFlag(dto) {
        const existing = await this.flagRepo.findOne({ where: { key: dto.key } });
        if (existing)
            throw new common_1.BadRequestException('Feature flag with this key already exists');
        const flag = this.flagRepo.create({
            ...dto,
            status: feature_flag_entity_1.FeatureFlagStatus.DISABLED,
            environments: dto.environments || {},
            rolloutPercentage: 0,
        });
        return this.flagRepo.save(flag);
    }
    async listFeatureFlags(status) {
        const where = {};
        if (status)
            where.status = status;
        return this.flagRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async getFeatureFlag(id) {
        const flag = await this.flagRepo.findOne({ where: { id } });
        if (!flag)
            throw new common_1.NotFoundException('Feature flag not found');
        return flag;
    }
    async updateFeatureFlag(id, dto) {
        const flag = await this.flagRepo.findOne({ where: { id } });
        if (!flag)
            throw new common_1.NotFoundException('Feature flag not found');
        if (dto.name !== undefined)
            flag.name = dto.name;
        if (dto.description !== undefined)
            flag.description = dto.description;
        if (dto.status !== undefined) {
            flag.status = dto.status;
            if (dto.status === feature_flag_entity_1.FeatureFlagStatus.ENABLED)
                flag.enabledAt = new Date();
        }
        if (dto.environments !== undefined)
            flag.environments = dto.environments;
        if (dto.cohortRules !== undefined)
            flag.cohortRules = dto.cohortRules;
        if (dto.rolloutPercentage !== undefined)
            flag.rolloutPercentage = dto.rolloutPercentage;
        if (dto.updatedBy !== undefined)
            flag.updatedBy = dto.updatedBy;
        if (dto.metadata !== undefined)
            flag.metadata = dto.metadata;
        return this.flagRepo.save(flag);
    }
    async deleteFeatureFlag(id) {
        const flag = await this.flagRepo.findOne({ where: { id } });
        if (!flag)
            throw new common_1.NotFoundException('Feature flag not found');
        return this.flagRepo.remove(flag);
    }
    async toggleFeatureFlag(id, enabled, updatedBy) {
        const flag = await this.flagRepo.findOne({ where: { id } });
        if (!flag)
            throw new common_1.NotFoundException('Feature flag not found');
        flag.status = enabled ? feature_flag_entity_1.FeatureFlagStatus.ENABLED : feature_flag_entity_1.FeatureFlagStatus.DISABLED;
        flag.updatedBy = updatedBy;
        if (enabled)
            flag.enabledAt = new Date();
        return this.flagRepo.save(flag);
    }
    async createIncident(dto) {
        const incident = this.incidentRepo.create({
            ...dto,
            status: incident_entity_1.IncidentStatus.DETECTED,
            detectedAt: new Date(),
        });
        return this.incidentRepo.save(incident);
    }
    async listIncidents(status, severity) {
        const qb = this.incidentRepo.createQueryBuilder('i').orderBy('i.detectedAt', 'DESC');
        if (status) {
            if (Array.isArray(status)) {
                qb.andWhere('i.status IN (:...statuses)', { statuses: status });
            }
            else {
                qb.andWhere('i.status = :status', { status });
            }
        }
        if (severity) {
            qb.andWhere('i.severity = :severity', { severity });
        }
        return qb.getMany();
    }
    async getIncident(id) {
        const incident = await this.incidentRepo.findOne({ where: { id } });
        if (!incident)
            throw new common_1.NotFoundException('Incident not found');
        return incident;
    }
    async updateIncident(id, dto) {
        const incident = await this.incidentRepo.findOne({ where: { id } });
        if (!incident)
            throw new common_1.NotFoundException('Incident not found');
        if (dto.status !== undefined) {
            incident.status = dto.status;
            if (dto.status === incident_entity_1.IncidentStatus.RESOLVED || dto.status === incident_entity_1.IncidentStatus.CLOSED) {
                incident.resolvedAt = new Date();
                incident.resolvedBy = dto.resolvedBy || incident.resolvedBy;
            }
        }
        if (dto.assignedTo !== undefined)
            incident.assignedTo = dto.assignedTo;
        if (dto.resolutionSteps !== undefined)
            incident.resolutionSteps = dto.resolutionSteps;
        if (dto.rootCause !== undefined)
            incident.rootCause = dto.rootCause;
        if (dto.actionItems !== undefined)
            incident.actionItems = dto.actionItems;
        return this.incidentRepo.save(incident);
    }
    async assignIncident(id, assignedTo) {
        const incident = await this.incidentRepo.findOne({ where: { id } });
        if (!incident)
            throw new common_1.NotFoundException('Incident not found');
        incident.assignedTo = assignedTo;
        if (incident.status === incident_entity_1.IncidentStatus.DETECTED) {
            incident.status = incident_entity_1.IncidentStatus.INVESTIGATING;
        }
        return this.incidentRepo.save(incident);
    }
    async getIncidentStats() {
        const [total, open, critical, bySeverity, bySource,] = await Promise.all([
            this.incidentRepo.count(),
            this.incidentRepo.createQueryBuilder('i').where('i.status IN (:...statuses)', { statuses: [incident_entity_1.IncidentStatus.DETECTED, incident_entity_1.IncidentStatus.INVESTIGATING] }).getCount(),
            this.incidentRepo.createQueryBuilder('i').where('i.severity = :severity AND i.status NOT IN (:...statuses)', { severity: incident_entity_1.IncidentSeverity.CRITICAL, statuses: [incident_entity_1.IncidentStatus.RESOLVED, incident_entity_1.IncidentStatus.CLOSED] }).getCount(),
            this.incidentRepo.createQueryBuilder('i').select('i.severity', 'severity').addSelect('COUNT(*)', 'count').groupBy('i.severity').getRawMany(),
            this.incidentRepo.createQueryBuilder('i').select('i.source', 'source').addSelect('COUNT(*)', 'count').groupBy('i.source').getRawMany(),
        ]);
        const severityMap = {};
        for (const s of bySeverity)
            severityMap[s.severity] = Number(s.count);
        const sourceMap = {};
        for (const s of bySource)
            sourceMap[s.source] = Number(s.count);
        return { total, open, critical, bySeverity: severityMap, bySource: sourceMap };
    }
    async getSecurityConfig() {
        const configs = await this.securityRepo.find();
        const result = {};
        for (const c of configs) {
            result[c.key] = { value: c.value, description: c.description || '', valueType: c.valueType, updatedAt: c.updatedAt };
        }
        return result;
    }
    async setSecurityConfig(key, dto) {
        await this.securityRepo.upsert({ key, value: dto.value, description: dto.description || null, valueType: dto.valueType || 'string', updatedBy: dto.updatedBy }, ['key']);
        return this.securityRepo.findOne({ where: { key } });
    }
    async deleteSecurityConfig(key) {
        const config = await this.securityRepo.findOne({ where: { key } });
        if (!config)
            throw new common_1.NotFoundException('Security config not found');
        return this.securityRepo.remove(config);
    }
    async createSecret(dto) {
        const existing = await this.secretRepo.findOne({ where: { key: dto.key } });
        if (existing)
            throw new common_1.BadRequestException('Secret with this key already exists');
        const secret = this.secretRepo.create(dto);
        return this.secretRepo.save(secret);
    }
    async listSecrets(category) {
        const where = {};
        if (category)
            where.category = category;
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
    async getSecret(id) {
        const secret = await this.secretRepo.findOne({ where: { id } });
        if (!secret)
            throw new common_1.NotFoundException('Secret not found');
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
    async updateSecret(id, dto) {
        const secret = await this.secretRepo.findOne({ where: { id } });
        if (!secret)
            throw new common_1.NotFoundException('Secret not found');
        if (dto.encryptedValue !== undefined)
            secret.encryptedValue = dto.encryptedValue;
        if (dto.description !== undefined)
            secret.description = dto.description;
        if (dto.category !== undefined)
            secret.category = dto.category;
        if (dto.isRotationEnabled !== undefined)
            secret.isRotationEnabled = dto.isRotationEnabled;
        if (dto.rotationIntervalDays !== undefined)
            secret.rotationIntervalDays = dto.rotationIntervalDays;
        if (dto.updatedBy !== undefined)
            secret.updatedBy = dto.updatedBy;
        if (dto.expiresAt !== undefined)
            secret.expiresAt = dto.expiresAt;
        return this.secretRepo.save(secret);
    }
    async deleteSecret(id) {
        const secret = await this.secretRepo.findOne({ where: { id } });
        if (!secret)
            throw new common_1.NotFoundException('Secret not found');
        return this.secretRepo.remove(secret);
    }
    async rotateSecret(id, newEncryptedValue, updatedBy) {
        const secret = await this.secretRepo.findOne({ where: { id } });
        if (!secret)
            throw new common_1.NotFoundException('Secret not found');
        secret.encryptedValue = newEncryptedValue;
        secret.lastRotatedAt = new Date();
        secret.updatedBy = updatedBy;
        return this.secretRepo.save(secret);
    }
    async getGlobalAuditLog(filters) {
        const days = filters?.days || 7;
        const since = new Date(Date.now() - days * 86400000);
        const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
        if (filters?.action)
            where.action = filters.action;
        if (filters?.actorId)
            where.performedBy = filters.actorId;
        return this.auditRepo.find({ where, order: { createdAt: 'DESC' }, take: filters?.limit || 200 });
    }
    async getKycOverview() {
        const total = await this.kycRepo.count();
        const approved = await this.kycRepo.count({ where: { status: status_enum_1.KycStatus.APPROVED } });
        const rejected = await this.kycRepo.count({ where: { status: status_enum_1.KycStatus.REJECTED } });
        const pending = await this.kycRepo.count({ where: { status: status_enum_1.KycStatus.PENDING } });
        const recentSubmissions = await this.kycRepo.find({
            order: { submittedAt: 'DESC' },
            take: 20,
        });
        return { total, approved, rejected, pending, recentSubmissions };
    }
    async getPaymentTransactions(query) {
        const { search, type, status, startDate, endDate, page = 1, limit = 20 } = query;
        const qb = this.paymentRepo.createQueryBuilder('p');
        if (search) {
            qb.andWhere('p.providerReference ILIKE :search', { search: `%${search}%` });
        }
        if (type)
            qb.andWhere('p.provider = :type', { type });
        if (status)
            qb.andWhere('p.status = :status', { status });
        if (startDate)
            qb.andWhere('p.createdAt >= :startDate', { startDate });
        if (endDate)
            qb.andWhere('p.createdAt <= :endDate', { endDate });
        qb.orderBy('p.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async getTemplates() {
        return this.templateRepo.find({ order: { key: 'ASC' } });
    }
    async getTemplate(id) {
        const tpl = await this.templateRepo.findOne({ where: { id } });
        if (!tpl)
            throw new common_1.NotFoundException('Template not found');
        return tpl;
    }
    async createTemplate(dto) {
        const exists = await this.templateRepo.findOne({ where: { key: dto.key } });
        if (exists)
            throw new common_1.BadRequestException('Template key already exists');
        return this.templateRepo.save(this.templateRepo.create(dto));
    }
    async updateTemplate(id, dto) {
        const tpl = await this.getTemplate(id);
        Object.assign(tpl, dto);
        return this.templateRepo.save(tpl);
    }
    async deleteTemplate(id) {
        const tpl = await this.getTemplate(id);
        return this.templateRepo.remove(tpl);
    }
    async getRiskRules() {
        return this.riskRepo.find({ order: { ruleKey: 'ASC' } });
    }
    async updateRiskRule(id, dto) {
        const rule = await this.riskRepo.findOne({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('Risk rule not found');
        Object.assign(rule, dto);
        return this.riskRepo.save(rule);
    }
    async createRiskRule(dto) {
        return this.riskRepo.save(this.riskRepo.create(dto));
    }
    async deleteRiskRule(id) {
        const rule = await this.riskRepo.findOne({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('Risk rule not found');
        return this.riskRepo.remove(rule);
    }
    async getFinancialConfig() {
        const keys = ['interest_rate', 'late_payment_fee', 'tax_rate', 'withholding_tax', 'processing_fee'];
        const settings = await this.settingRepo.find({ where: { key: (0, typeorm_2.In)(keys) } });
        const map = {};
        for (const s of settings)
            map[s.key] = s.value;
        for (const k of keys)
            if (!map[k])
                map[k] = '';
        return map;
    }
    async updateFinancialConfig(dto) {
        for (const [key, value] of Object.entries(dto)) {
            await this.settingRepo.upsert({ key, value }, { conflictPaths: ['key'], skipUpdateIfNoValuesChanged: false });
        }
        return this.getFinancialConfig();
    }
    async getDisputes(query) {
        const { status, type, page = 1, limit = 20 } = query;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const [data, total] = await this.disputeRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async resolveDispute(id, dto, resolvedBy) {
        const dispute = await this.disputeRepo.findOne({ where: { id } });
        if (!dispute)
            throw new common_1.NotFoundException('Dispute not found');
        dispute.status = dto.status;
        dispute.resolution = dto.resolution;
        dispute.resolvedBy = resolvedBy;
        dispute.resolvedAt = new Date();
        return this.disputeRepo.save(dispute);
    }
    async getSystemConfig() {
        const keys = ['platform_name', 'support_email', 'support_phone', 'backup_enabled', 'maintenance_mode'];
        const settings = await this.settingRepo.find({ where: { key: (0, typeorm_2.In)(keys) } });
        const map = {};
        for (const s of settings)
            map[s.key] = s.value;
        return map;
    }
    async updateSystemConfig(dto) {
        for (const [key, value] of Object.entries(dto)) {
            await this.settingRepo.upsert({ key, value }, { conflictPaths: ['key'], skipUpdateIfNoValuesChanged: false });
        }
        return this.getSystemConfig();
    }
    async triggerBackup() {
        const host = this.configService.get('database.host', 'localhost');
        const port = this.configService.get('database.port', '5432');
        const user = this.configService.get('database.username', 'postgres');
        const password = this.configService.get('database.password', 'postgres');
        const db = this.configService.get('database.database', 'coop_bnpl');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql.gz`;
        const filepath = (0, path_1.join)(this.backupDir, filename);
        const cmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${db} --no-owner | gzip > "${filepath}"`;
        try {
            await execShell(cmd, 300_000);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Backup failed: ${err.message}`);
        }
        const stats = (0, fs_1.statSync)(filepath);
        return {
            message: 'Backup completed',
            filename,
            size: stats.size,
            createdAt: new Date().toISOString(),
        };
    }
    async listBackups() {
        try {
            const files = (0, fs_1.readdirSync)(this.backupDir).filter((f) => f.endsWith('.sql.gz'));
            return files
                .map((f) => {
                const stats = (0, fs_1.statSync)((0, path_1.join)(this.backupDir, f));
                return { filename: f, size: stats.size, createdAt: stats.birthtime.toISOString() };
            })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        catch {
            return [];
        }
    }
    getBackupPath(filename) {
        const safe = (0, path_1.join)(this.backupDir, filename);
        if (!safe.startsWith(this.backupDir))
            throw new common_1.BadRequestException('Invalid backup filename');
        if (!(0, fs_1.existsSync)(safe))
            throw new common_1.NotFoundException('Backup file not found');
        return safe;
    }
    getBackupStream(filename) {
        const filepath = this.getBackupPath(filename);
        return (0, fs_1.createReadStream)(filepath);
    }
    async deleteBackup(filename) {
        const filepath = this.getBackupPath(filename);
        (0, fs_1.unlinkSync)(filepath);
        return { message: `Backup ${filename} deleted` };
    }
    async restoreBackup(filename) {
        const host = this.configService.get('database.host', 'localhost');
        const port = this.configService.get('database.port', '5432');
        const user = this.configService.get('database.username', 'postgres');
        const password = this.configService.get('database.password', 'postgres');
        const db = this.configService.get('database.database', 'coop_bnpl');
        const filepath = this.getBackupPath(filename);
        const cmd = `gunzip -c "${filepath}" | PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${db}`;
        try {
            await execShell(cmd, 600_000);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Restore failed: ${err.message}`);
        }
        return { message: `Restore from ${filename} completed` };
    }
    async getRolePermissions() {
        const setting = await this.settingRepo.findOne({ where: { key: 'role_permissions' } });
        return setting ? JSON.parse(setting.value) : {};
    }
    async updateRolePermissions(dto) {
        await this.settingRepo.upsert({ key: 'role_permissions', value: JSON.stringify(dto) }, { conflictPaths: ['key'], skipUpdateIfNoValuesChanged: false });
        return dto;
    }
    async getSystemOverview() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 86400000);
        const [totalTenants, totalUsers, activeUsers, onboardingsThisMonth, activeIncidents, totalPolicies,] = await Promise.all([
            this.orgRepo.count(),
            this.userRepo.count(),
            this.userRepo.count({ where: { isActive: true } }),
            this.onboardingRepo.count({
                where: { createdAt: (0, typeorm_2.Between)(new Date(now.getFullYear(), now.getMonth(), 1), now) },
            }),
            this.incidentRepo.createQueryBuilder('i').where('i.status IN (:...statuses)', { statuses: [incident_entity_1.IncidentStatus.DETECTED, incident_entity_1.IncidentStatus.INVESTIGATING] }).getCount(),
            this.policyRepo.count({ where: { status: policy_template_entity_1.PolicyTemplateStatus.ACTIVE } }),
        ]);
        return {
            tenants: { total: totalTenants },
            users: { total: totalUsers, active: activeUsers },
            onboarding: { thisMonth: onboardingsThisMonth },
            incidents: { active: activeIncidents },
            policies: { active: totalPolicies },
        };
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(5, (0, typeorm_1.InjectRepository)(app_setting_entity_1.AppSetting)),
    __param(6, (0, typeorm_1.InjectRepository)(policy_template_entity_1.PolicyTemplate)),
    __param(7, (0, typeorm_1.InjectRepository)(tenant_onboarding_request_entity_1.TenantOnboardingRequest)),
    __param(8, (0, typeorm_1.InjectRepository)(feature_flag_entity_1.FeatureFlag)),
    __param(9, (0, typeorm_1.InjectRepository)(incident_entity_1.Incident)),
    __param(10, (0, typeorm_1.InjectRepository)(global_security_config_entity_1.GlobalSecurityConfig)),
    __param(11, (0, typeorm_1.InjectRepository)(secret_entity_1.Secret)),
    __param(12, (0, typeorm_1.InjectRepository)(notification_template_entity_1.NotificationTemplate)),
    __param(13, (0, typeorm_1.InjectRepository)(global_risk_rule_entity_1.GlobalRiskRule)),
    __param(14, (0, typeorm_1.InjectRepository)(dispute_entity_1.Dispute)),
    __param(15, (0, typeorm_1.InjectRepository)(kyc_submission_entity_1.KycSubmission)),
    __param(16, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        email_service_1.EmailService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map