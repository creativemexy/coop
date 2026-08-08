"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const auth_service_1 = require("../auth/auth.service");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_entity_1 = require("../users/entities/user.entity");
const app_setting_entity_1 = require("../settings/entities/app-setting.entity");
const webhook_log_entity_1 = require("../payments/entities/webhook-log.entity");
const processing_step_entity_1 = require("../bnpl/entities/processing-step.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_plan_entity_1 = require("../bnpl/entities/bnpl-plan.entity");
const investment_order_entity_1 = require("../investments/entities/investment-order.entity");
const investment_holding_entity_1 = require("../investments/entities/investment-holding.entity");
const role_enum_1 = require("../../common/enums/role.enum");
const status_enum_1 = require("../../common/enums/status.enum");
const dispute_entity_1 = require("./entities/dispute.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const savings_transaction_entity_1 = require("../savings/entities/savings-transaction.entity");
const loan_entity_1 = require("../loans/entities/loan.entity");
const loan_repayment_entity_1 = require("../loans/entities/loan-repayment.entity");
const TENANT_SETTING_KEYS = [
    'bnpl_enabled',
    'kyc_requirement_level',
    'repayment_retry_policy',
    'webhook_providers',
    'log_retention_days',
    'supported_products',
    'notification_webhook_url',
    'notification_email',
];
const DEFAULT_CONFIG = {
    bnplEnabled: true,
    kycRequirementLevel: 'basic',
    repaymentRetryPolicy: { maxAttempts: 3, cooldownHours: 24, autoRetryOnFailure: true },
    webhookProviders: { paystack: { endpoint: '/api/v1/payments/webhook/paystack', enabled: true, retryOnFailure: true, retryMaxAttempts: 3 } },
    logRetentionDays: 90,
};
let AdminService = class AdminService {
    authService;
    orgRepo;
    userRepo;
    settingRepo;
    webhookLogRepo;
    stepRepo;
    auditRepo;
    instRepo;
    subRepo;
    planRepo;
    paymentRepo;
    investOrderRepo;
    holdingRepo;
    disputeRepo;
    savingsAccRepo;
    savingsTxRepo;
    loanRepo;
    constructor(authService, orgRepo, userRepo, settingRepo, webhookLogRepo, stepRepo, auditRepo, instRepo, subRepo, planRepo, paymentRepo, investOrderRepo, holdingRepo, disputeRepo, savingsAccRepo, savingsTxRepo, loanRepo) {
        this.authService = authService;
        this.orgRepo = orgRepo;
        this.userRepo = userRepo;
        this.settingRepo = settingRepo;
        this.webhookLogRepo = webhookLogRepo;
        this.stepRepo = stepRepo;
        this.auditRepo = auditRepo;
        this.instRepo = instRepo;
        this.subRepo = subRepo;
        this.planRepo = planRepo;
        this.paymentRepo = paymentRepo;
        this.investOrderRepo = investOrderRepo;
        this.holdingRepo = holdingRepo;
        this.disputeRepo = disputeRepo;
        this.savingsAccRepo = savingsAccRepo;
        this.savingsTxRepo = savingsTxRepo;
        this.loanRepo = loanRepo;
    }
    async resetPassword(userId, newPassword) {
        return this.authService.adminResetPassword(userId, newPassword);
    }
    async revokeSessions(userId) {
        return this.authService.revokeSessions(userId);
    }
    async assignRole(userId, role, callerRole, organizationId, apexOrgId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (role === role_enum_1.Role.SUPER_ADMIN || role === role_enum_1.Role.OPERATIONAL_ADMIN) {
            if (callerRole !== role_enum_1.Role.SUPER_ADMIN) {
                throw new common_1.BadRequestException('Only super admin can assign system-wide roles');
            }
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
        if (coopRoles.includes(role) && !organizationId && !apexOrgId) {
            throw new common_1.BadRequestException('Cooperative-level roles require organizationId or apexOrgId');
        }
        const updates = { role };
        if (organizationId)
            updates.organizationId = organizationId;
        if (apexOrgId)
            updates.apexOrgId = apexOrgId;
        await this.userRepo.update(userId, updates);
        return this.userRepo.findOne({ where: { id: userId } });
    }
    async getTenantSettingsMap(id) {
        const keys = TENANT_SETTING_KEYS.map((k) => `tenant:${id}:${k}`);
        const rows = await this.settingRepo.find({ where: { key: (0, typeorm_2.In)(keys) } });
        return new Map(rows.map((s) => [s.key.replace(`tenant:${id}:`, ''), s.value]));
    }
    async getTenantConfig(id) {
        const map = await this.getTenantSettingsMap(id);
        return {
            bnplEnabled: map.has('bnpl_enabled') ? map.get('bnpl_enabled') === 'true' : DEFAULT_CONFIG.bnplEnabled,
            kycRequirementLevel: map.get('kyc_requirement_level') || DEFAULT_CONFIG.kycRequirementLevel,
            repaymentRetryPolicy: map.has('repayment_retry_policy')
                ? JSON.parse(map.get('repayment_retry_policy'))
                : DEFAULT_CONFIG.repaymentRetryPolicy,
            webhookProviders: map.has('webhook_providers')
                ? JSON.parse(map.get('webhook_providers'))
                : DEFAULT_CONFIG.webhookProviders,
            logRetentionDays: map.has('log_retention_days') ? Number(map.get('log_retention_days')) : DEFAULT_CONFIG.logRetentionDays,
        };
    }
    async updateTenantConfig(id, dto) {
        const org = await this.orgRepo.findOne({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('Tenant not found');
        if (dto.name || dto.status) {
            await this.orgRepo.update(id, {
                ...(dto.name && { name: dto.name }),
                ...(dto.status && { status: dto.status }),
            });
        }
        const settings = [];
        if (dto.bnplEnabled !== undefined)
            settings.push({ key: `tenant:${id}:bnpl_enabled`, value: String(dto.bnplEnabled) });
        if (dto.kycRequirementLevel !== undefined)
            settings.push({ key: `tenant:${id}:kyc_requirement_level`, value: dto.kycRequirementLevel });
        if (dto.repaymentRetryPolicy !== undefined)
            settings.push({ key: `tenant:${id}:repayment_retry_policy`, value: JSON.stringify(dto.repaymentRetryPolicy) });
        if (dto.webhookProviders !== undefined)
            settings.push({ key: `tenant:${id}:webhook_providers`, value: JSON.stringify(dto.webhookProviders) });
        if (dto.logRetentionDays !== undefined)
            settings.push({ key: `tenant:${id}:log_retention_days`, value: String(dto.logRetentionDays) });
        for (const s of settings) {
            await this.settingRepo.upsert({ key: s.key, value: s.value }, ['key']);
        }
        return this.getTenantDetail(id);
    }
    async listTenants() {
        const orgs = await this.orgRepo.find({
            relations: { apexOrg: true },
            order: { createdAt: 'DESC' },
        });
        const settingKeys = orgs.flatMap((org) => TENANT_SETTING_KEYS.map((k) => `tenant:${org.id}:${k}`));
        const settings = await this.settingRepo.find({
            where: { key: (0, typeorm_2.In)(settingKeys) },
        });
        const settingMap = new Map(settings.map((s) => [s.key, s.value]));
        return orgs.map((org) => ({
            id: org.id,
            name: org.name,
            code: org.code,
            status: org.status,
            apexOrg: org.apexOrg?.name || null,
            supportedProducts: this._parseSetting(settingMap.get(`tenant:${org.id}:supported_products`), []),
            notificationWebhookUrl: settingMap.get(`tenant:${org.id}:notification_webhook_url`) || null,
            notificationEmail: settingMap.get(`tenant:${org.id}:notification_email`) || null,
            bnplEnabled: settingMap.get(`tenant:${org.id}:bnpl_enabled`) !== 'false',
            kycRequirementLevel: settingMap.get(`tenant:${org.id}:kyc_requirement_level`) || 'basic',
            createdAt: org.createdAt,
        }));
    }
    async getTenantDetail(id) {
        const org = await this.orgRepo.findOne({
            where: { id },
            relations: { apexOrg: true },
        });
        if (!org)
            throw new common_1.NotFoundException('Tenant not found');
        const userCount = await this.userRepo.count({ where: { organizationId: id } });
        const map = await this.getTenantSettingsMap(id);
        return {
            id: org.id,
            name: org.name,
            code: org.code,
            status: org.status,
            apexOrg: org.apexOrg?.name || null,
            apexOrgId: org.apexOrgId,
            userCount,
            bnplEnabled: map.has('bnpl_enabled') ? map.get('bnpl_enabled') === 'true' : true,
            kycRequirementLevel: map.get('kyc_requirement_level') || 'basic',
            repaymentRetryPolicy: map.has('repayment_retry_policy')
                ? JSON.parse(map.get('repayment_retry_policy'))
                : DEFAULT_CONFIG.repaymentRetryPolicy,
            webhookProviders: map.has('webhook_providers')
                ? JSON.parse(map.get('webhook_providers'))
                : DEFAULT_CONFIG.webhookProviders,
            logRetentionDays: map.has('log_retention_days') ? Number(map.get('log_retention_days')) : 90,
            supportedProducts: this._parseSetting(map.get('supported_products'), []),
            notificationWebhookUrl: map.get('notification_webhook_url') || null,
            notificationEmail: map.get('notification_email') || null,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt,
        };
    }
    async getTenantHealth(id) {
        const org = await this.orgRepo.findOne({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('Tenant not found');
        const totalUsers = await this.userRepo.count({ where: { organizationId: id } });
        const activeUsers = await this.userRepo.count({ where: { organizationId: id, isActive: true } });
        const roleDistribution = await this.userRepo
            .createQueryBuilder('u')
            .select('u.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .where('u.organization_id = :orgId', { orgId: id })
            .groupBy('u.role')
            .getRawMany();
        return {
            tenantId: id,
            name: org.name,
            status: org.status,
            isActive: org.status === status_enum_1.OrgStatus.ACTIVE,
            users: { total: totalUsers, active: activeUsers, pending: totalUsers - activeUsers },
            roleDistribution: roleDistribution.map((r) => ({ role: r.role, count: Number(r.count) })),
            lastUpdated: org.updatedAt,
        };
    }
    async updateTenantSettings(id, dto) {
        const org = await this.orgRepo.findOne({ where: { id } });
        if (!org)
            throw new common_1.NotFoundException('Tenant not found');
        if (dto.name || dto.status) {
            await this.orgRepo.update(id, {
                ...(dto.name && { name: dto.name }),
                ...(dto.status && { status: dto.status }),
            });
        }
        const entry = (key, value) => this.settingRepo.upsert({ key, value }, ['key']);
        if (dto.supportedProducts !== undefined) {
            await entry(`tenant:${id}:supported_products`, JSON.stringify(dto.supportedProducts));
        }
        if (dto.notificationWebhookUrl !== undefined) {
            await entry(`tenant:${id}:notification_webhook_url`, dto.notificationWebhookUrl);
        }
        if (dto.notificationEmail !== undefined) {
            await entry(`tenant:${id}:notification_email`, dto.notificationEmail);
        }
        return this.getTenantDetail(id);
    }
    async getTenantSettings(id) {
        return this.getTenantDetail(id);
    }
    async getWebhookDeliveryStatus(tenantId, days = 7) {
        const since = new Date(Date.now() - days * 86400000);
        const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
        const logs = await this.webhookLogRepo.find({ where, order: { createdAt: 'DESC' }, take: 500 });
        const total = logs.length;
        const processed = logs.filter((l) => l.status === 'processed').length;
        const failed = logs.filter((l) => l.status === 'failed').length;
        const retried = logs.filter((l) => l.retryCount > 0).length;
        const backlog = logs.filter((l) => l.status === 'pending').length;
        return {
            period: `${days}d`,
            total,
            processed,
            failed,
            retried,
            backlog,
            recentLogs: logs.slice(0, 50),
        };
    }
    async getFailedJobs(tenantId, days = 7) {
        const since = new Date(Date.now() - days * 86400000);
        const where = { status: processing_step_entity_1.ProcessingStepStatus.FAILED, createdAt: (0, typeorm_2.Between)(since, new Date()) };
        const steps = await this.stepRepo.find({ where, order: { createdAt: 'DESC' }, take: 200 });
        const byType = {};
        for (const s of steps) {
            byType[s.stepType] = (byType[s.stepType] || 0) + 1;
        }
        return {
            total: steps.length,
            byType,
            steps: steps.slice(0, 100),
        };
    }
    async getQueueStatus(tenantId) {
        const now = new Date();
        const totalOverdue = await this.instRepo.count({
            where: { status: status_enum_1.InstallmentStatus.PENDING, dueDate: (0, typeorm_2.LessThan)(now) },
        });
        const pendingSteps = await this.stepRepo.count({
            where: { status: processing_step_entity_1.ProcessingStepStatus.PENDING },
        });
        const failedSteps = await this.stepRepo.count({
            where: { status: processing_step_entity_1.ProcessingStepStatus.FAILED },
        });
        const lateInstallments = await this.instRepo.find({
            where: { status: status_enum_1.InstallmentStatus.PENDING, dueDate: (0, typeorm_2.LessThan)(now) },
            order: { dueDate: 'ASC' },
            take: 200,
        });
        const buckets = [
            { label: '0-7 days late', min: 0, max: 7, count: 0, totalAmount: 0 },
            { label: '8-30 days late', min: 8, max: 30, count: 0, totalAmount: 0 },
            { label: '31-90 days late', min: 31, max: 90, count: 0, totalAmount: 0 },
            { label: '90+ days late', min: 91, max: Infinity, count: 0, totalAmount: 0 },
        ];
        for (const inst of lateInstallments) {
            const daysLate = Math.floor((now.getTime() - new Date(inst.dueDate).getTime()) / 86400000);
            const bucket = buckets.find((b) => daysLate >= b.min && daysLate <= b.max);
            if (bucket) {
                bucket.count++;
                bucket.totalAmount += Number(inst.amount);
            }
        }
        return {
            overdueInstallments: totalOverdue,
            pendingProcessingSteps: pendingSteps,
            failedProcessingSteps: failedSteps,
            agingBuckets: buckets,
            queueLatency: pendingSteps > 0 ? 'degraded' : 'normal',
            errorRate: totalOverdue > 0 || failedSteps > 0 ? 'elevated' : 'normal',
        };
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
    async getMemberStatement(userId) {
        const [user, savingsAcc] = await Promise.all([
            this.userRepo.findOne({ where: { id: userId } }),
            this.savingsAccRepo.findOne({ where: { userId } }),
        ]);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const [savingsTxs, payments, subs, loans] = await Promise.all([
            savingsAcc
                ? this.savingsTxRepo.find({ where: { accountId: savingsAcc.id }, order: { createdAt: 'DESC' } })
                : Promise.resolve([]),
            this.paymentRepo.find({ where: { userId }, order: { createdAt: 'DESC' } }),
            this.subRepo.find({ where: { userId }, relations: { plan: { catalogItem: true }, installments: true }, order: { createdAt: 'DESC' } }),
            this.loanRepo.find({ where: { userId }, relations: { repayments: true }, order: { createdAt: 'DESC' } }),
        ]);
        const installments = subs.flatMap((s) => (s.installments || []).map((i) => ({
            date: i.createdAt,
            type: 'installment',
            amount: -Number(i.amount),
            description: `Installment due ${new Date(i.dueDate).toLocaleDateString()} · ${s.plan?.catalogItem?.name || 'Subscription'}`,
            status: i.status,
            reference: i.id,
        })));
        const loanRepayments = loans.flatMap((l) => (l.repayments || []).map((r) => ({
            date: r.createdAt,
            type: r.status === loan_repayment_entity_1.RepaymentStatus.PAID ? 'loan_repayment' : 'loan_due',
            amount: -Number(r.amount),
            description: `Loan repayment due ${new Date(r.dueDate).toLocaleDateString()}`,
            status: r.status,
            reference: r.paymentReference || r.id,
        })));
        const transactions = [
            ...savingsTxs.map((tx) => ({
                date: tx.createdAt,
                type: tx.type === savings_transaction_entity_1.TransactionType.WITHDRAWAL || tx.type === savings_transaction_entity_1.TransactionType.GOAL_WITHDRAWAL
                    ? 'savings_withdrawal'
                    : tx.type === savings_transaction_entity_1.TransactionType.INTEREST
                        ? 'savings_interest'
                        : 'savings_deposit',
                amount: tx.type === savings_transaction_entity_1.TransactionType.WITHDRAWAL || tx.type === savings_transaction_entity_1.TransactionType.GOAL_WITHDRAWAL
                    ? -Number(tx.amount)
                    : Number(tx.amount),
                description: tx.description || `Savings ${tx.type.replace('_', ' ')}`,
                status: 'completed',
                reference: tx.id,
            })),
            ...payments.map((p) => ({
                date: p.createdAt,
                type: 'payment',
                amount: -Number(p.amount),
                description: `Payment for subscription via ${p.provider || 'gateway'}`,
                status: p.status,
                reference: p.providerReference || p.id,
            })),
            ...installments,
            ...loanRepayments,
        ];
        transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
        return {
            member: {
                id: user.id,
                name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
                email: user.email,
            },
            transactions,
        };
    }
    async getSystemLogs(tenantId, days = 7) {
        const since = new Date(Date.now() - days * 86400000);
        const where = { createdAt: (0, typeorm_2.Between)(since, new Date()) };
        const logs = await this.auditRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: 200,
        });
        const byAction = {};
        const byEntity = {};
        for (const l of logs) {
            byAction[l.action] = (byAction[l.action] || 0) + 1;
            const entity = l.entityType || 'unknown';
            byEntity[entity] = (byEntity[entity] || 0) + 1;
        }
        return {
            total: logs.length,
            byAction,
            byEntity,
            logs: logs.slice(0, 100),
        };
    }
    async getAdminOverview() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [activeTenants, activeUsers, webhooks24h, webhooks7d, jobsFailed24h, jobsFailed7d, jobsRetrying, pendingSteps,] = await Promise.all([
            this.orgRepo.count({ where: { status: status_enum_1.OrgStatus.ACTIVE } }),
            this.userRepo.count({ where: { isActive: true } }),
            this.webhookLogRepo.find({ where: { createdAt: (0, typeorm_2.Between)(dayAgo, now) }, order: { createdAt: 'DESC' }, take: 500 }),
            this.webhookLogRepo.find({ where: { createdAt: (0, typeorm_2.Between)(weekAgo, now) }, order: { createdAt: 'DESC' }, take: 500 }),
            this.stepRepo.find({ where: { status: processing_step_entity_1.ProcessingStepStatus.FAILED, createdAt: (0, typeorm_2.Between)(dayAgo, now) }, order: { createdAt: 'DESC' }, take: 200 }),
            this.stepRepo.find({ where: { status: processing_step_entity_1.ProcessingStepStatus.FAILED, createdAt: (0, typeorm_2.Between)(weekAgo, now) }, order: { createdAt: 'DESC' }, take: 200 }),
            this.stepRepo.find({ where: { status: processing_step_entity_1.ProcessingStepStatus.IN_PROGRESS }, order: { createdAt: 'DESC' }, take: 200 }),
            this.stepRepo.count({ where: { status: processing_step_entity_1.ProcessingStepStatus.PENDING } }),
        ]);
        const webhookTotal7d = webhooks7d.length;
        const webhookProcessed7d = webhooks7d.filter((l) => l.status === 'processed').length;
        const webhookSuccessRate7d = webhookTotal7d > 0 ? (webhookProcessed7d / webhookTotal7d) * 100 : 100;
        const webhooksNeedingAttention = webhooks7d
            .filter((l) => l.status === 'failed' || l.retryCount > 0)
            .slice(0, 50);
        const failedJobsDetail = jobsFailed7d.map((s) => ({
            id: s.id,
            stepType: s.stepType,
            subscriptionId: s.subscriptionId,
            errorMessage: s.errorMessage,
            retryCount: s.retryCount,
            createdAt: s.createdAt,
            age: Math.floor((now.getTime() - new Date(s.createdAt).getTime()) / 3600000),
        }));
        const retryingJobsDetail = jobsRetrying.map((s) => ({
            id: s.id,
            stepType: s.stepType,
            subscriptionId: s.subscriptionId,
            errorMessage: s.errorMessage,
            retryCount: s.retryCount,
            createdAt: s.createdAt,
            age: Math.floor((now.getTime() - new Date(s.createdAt).getTime()) / 3600000),
        }));
        return {
            kpis: {
                activeTenants,
                activeUsers,
                webhookSuccessRate: Math.round(webhookSuccessRate7d * 100) / 100,
                webhookTotal7d,
                webhookProcessed7d,
                jobsFailed24h: jobsFailed24h.length,
                jobsFailed7d: jobsFailed7d.length,
                reconciliationBacklog: pendingSteps,
            },
            queues: {
                webhooksNeedingAttention,
                failedJobs: failedJobsDetail.slice(0, 50),
                retryingJobs: retryingJobsDetail.slice(0, 50),
            },
        };
    }
    async getTenantsHealthTable() {
        const orgs = await this.orgRepo.find({ order: { name: 'ASC' } });
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const settingKeys = orgs.flatMap((org) => [
            `tenant:${org.id}:bnpl_enabled`,
            `tenant:${org.id}:supported_products`,
        ]);
        const settings = await this.settingRepo.find({ where: { key: (0, typeorm_2.In)(settingKeys) } });
        const settingMap = new Map(settings.map((s) => [s.key, s.value]));
        const allFailedWebhooks = await this.webhookLogRepo.find({
            where: { status: 'failed', createdAt: (0, typeorm_2.Between)(weekAgo, now) },
            order: { createdAt: 'DESC' },
        });
        const webhookErrorsByProvider = new Map();
        for (const wh of allFailedWebhooks) {
            const key = wh.provider;
            if (!webhookErrorsByProvider.has(key) || wh.createdAt > webhookErrorsByProvider.get(key)) {
                webhookErrorsByProvider.set(key, wh.createdAt);
            }
        }
        const orgsWithHealth = await Promise.all(orgs.map(async (org) => {
            const bnplEnabled = settingMap.get(`tenant:${org.id}:bnpl_enabled`) !== 'false';
            const plans = await this.planRepo.find({ where: { organizationId: org.id } });
            const planIds = plans.map((p) => p.id);
            let backlogCount = 0;
            if (planIds.length > 0) {
                const subs = await this.subRepo.find({ where: planIds.map((id) => ({ planId: id })) });
                const subIds = subs.map((s) => s.id);
                if (subIds.length > 0) {
                    backlogCount = await this.stepRepo.count({
                        where: { subscriptionId: (0, typeorm_2.In)(subIds), status: processing_step_entity_1.ProcessingStepStatus.PENDING },
                    });
                }
            }
            const latestWebhookError = webhookErrorsByProvider.get('paystack') || null;
            const hasFailedJobs = backlogCount > 0;
            const hasWebhookErrors = latestWebhookError !== null;
            let status;
            if (hasFailedJobs || hasWebhookErrors) {
                status = 'degraded';
            }
            else {
                status = 'healthy';
            }
            return {
                id: org.id,
                name: org.name,
                code: org.code,
                status,
                bnplEnabled,
                lastWebhookError: latestWebhookError?.toISOString() || null,
                backlogCount,
            };
        }));
        return orgsWithHealth;
    }
    async getAdminAuditLogs(filters) {
        const days = filters?.days || 7;
        const since = new Date(Date.now() - days * 86400000);
        const qb = this.auditRepo.createQueryBuilder('a');
        qb.where('a.created_at >= :since', { since });
        if (filters?.tenantId) {
            qb.andWhere('(a.entity_id = :tenantId OR a.entity_type LIKE :tenantPattern)', {
                tenantId: filters.tenantId,
                tenantPattern: `%${filters.tenantId}%`,
            });
        }
        if (filters?.actorId) {
            qb.andWhere('a.performed_by = :actorId', { actorId: filters.actorId });
        }
        if (filters?.action) {
            qb.andWhere('a.action = :action', { action: filters.action });
        }
        qb.orderBy('a.created_at', 'DESC');
        qb.limit(200);
        return qb.getMany();
    }
    async getUsersByOrganization() {
        const orgs = await this.orgRepo.find({ order: { name: 'ASC' } });
        const users = await this.userRepo.find({ order: { createdAt: 'ASC' } });
        const orgMap = new Map();
        for (const u of users) {
            const key = u.organizationId || 'unassigned';
            if (!orgMap.has(key))
                orgMap.set(key, []);
            orgMap.get(key).push(u);
        }
        return orgs.map((org) => ({
            id: org.id,
            name: org.name,
            code: org.code,
            status: org.status,
            users: (orgMap.get(org.id) || []).map((u) => ({
                id: u.id,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                isActive: u.isActive,
                kycStatus: u.kycStatus,
                createdAt: u.createdAt,
            })),
        }));
    }
    async getTenantOrderVolume(tenantId) {
        const plans = await this.planRepo.find({ where: { organizationId: tenantId }, relations: { catalogItem: true } });
        const planIds = plans.map((p) => p.id);
        if (planIds.length === 0)
            return { totalOrders: 0, activeSubscriptions: 0, totalVolume: 0, byPlan: [] };
        const subs = await this.subRepo.find({ where: planIds.map((id) => ({ planId: id })) });
        const totalVolume = subs.reduce((s, sub) => s + Number(sub.totalAmount), 0);
        const byPlan = plans.map((p) => {
            const planSubs = subs.filter((s) => s.planId === p.id);
            return {
                planId: p.id,
                planName: p.catalogItem?.name || `Plan ${p.id.slice(0, 8)}`,
                orderCount: planSubs.length,
                totalVolume: planSubs.reduce((s2, sub) => s2 + Number(sub.totalAmount), 0),
            };
        });
        return {
            totalOrders: subs.length,
            activeSubscriptions: subs.filter((s) => s.status === status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT).length,
            totalVolume,
            byPlan,
        };
    }
    async getTenantRepaymentKpis(tenantId) {
        const plans = await this.planRepo.find({ where: { organizationId: tenantId }, relations: { catalogItem: true } });
        const planIds = plans.map((p) => p.id);
        if (planIds.length === 0)
            return { totalInstallments: 0, paidRate: 0, overdueAmount: 0, paidMtd: 0 };
        const subs = await this.subRepo.find({ where: planIds.map((id) => ({ planId: id })), relations: { installments: true } });
        const allInsts = subs.flatMap((s) => s.installments || []);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const totalInsts = allInsts.length;
        const paidInsts = allInsts.filter((i) => i.status === status_enum_1.InstallmentStatus.PAID);
        const overdueInsts = allInsts.filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING && new Date(i.dueDate) < now);
        const paidMtd = allInsts.filter((i) => i.status === status_enum_1.InstallmentStatus.PAID && i.paidAt && i.paidAt >= startOfMonth);
        return {
            totalInstallments: totalInsts,
            paidInstallments: paidInsts.length,
            paidRate: totalInsts > 0 ? paidInsts.length / totalInsts : 0,
            overdueCount: overdueInsts.length,
            overdueAmount: Math.round(overdueInsts.reduce((s, i) => s + Number(i.amount), 0) * 100) / 100,
            paidMtdCount: paidMtd.length,
            paidMtdAmount: Math.round(paidMtd.reduce((s, i) => s + Number(i.amount), 0) * 100) / 100,
        };
    }
    async getTenantDelinquencySnapshot(tenantId) {
        const plans = await this.planRepo.find({ where: { organizationId: tenantId } });
        const planIds = plans.map((p) => p.id);
        if (planIds.length === 0)
            return { totalDelinquent: 0, totalDelinquentAmount: 0, buckets: [] };
        const subs = await this.subRepo.find({ where: planIds.map((id) => ({ planId: id })) });
        const subIds = subs.map((s) => s.id);
        if (subIds.length === 0)
            return { totalDelinquent: 0, totalDelinquentAmount: 0, buckets: [] };
        const now = new Date();
        const allInsts = await this.instRepo.find({
            where: { subscriptionId: (0, typeorm_2.In)(subIds), status: status_enum_1.InstallmentStatus.PENDING, dueDate: (0, typeorm_2.LessThan)(now) },
        });
        const bucketDefs = [
            { label: '1-30 days', min: 1, max: 30 },
            { label: '31-60 days', min: 31, max: 60 },
            { label: '61-90 days', min: 61, max: 90 },
            { label: '90+ days', min: 91, max: Infinity },
        ];
        const buckets = bucketDefs.map((b) => {
            const items = allInsts.filter((i) => {
                const d = Math.floor((now.getTime() - new Date(i.dueDate).getTime()) / 86400000);
                return d >= b.min && d <= b.max;
            });
            return { label: b.label, count: items.length, amount: Math.round(items.reduce((s, i) => s + Number(i.amount), 0) * 100) / 100 };
        });
        return {
            totalDelinquent: allInsts.length,
            totalDelinquentAmount: Math.round(allInsts.reduce((s, i) => s + Number(i.amount), 0) * 100) / 100,
            buckets,
        };
    }
    async exportTenantReport(tenantId) {
        const org = await this.orgRepo.findOne({ where: { id: tenantId } });
        const orgName = org?.name || 'Unknown';
        const [volume, repayment, delinquency] = await Promise.all([
            this.getTenantOrderVolume(tenantId),
            this.getTenantRepaymentKpis(tenantId),
            this.getTenantDelinquencySnapshot(tenantId),
        ]);
        const lines = [
            `Tenant Report - ${orgName} (${org?.code || tenantId})`,
            `Generated: ${new Date().toISOString()}`,
            '',
            '=== Order Volume ===',
            `Total Orders,${volume.totalOrders}`,
            `Active Subscriptions,${volume.activeSubscriptions}`,
            `Total Volume (₦),${volume.totalVolume}`,
            '',
            '=== Repayment KPIs ===',
            `Total Installments,${repayment.totalInstallments}`,
            `Paid Installments,${repayment.paidInstallments}`,
            `Payment Rate,${(repayment.paidRate * 100).toFixed(2)}%`,
            `Overdue Count,${repayment.overdueCount}`,
            `Overdue Amount (₦),${repayment.overdueAmount}`,
            `Paid MTD Count,${repayment.paidMtdCount}`,
            `Paid MTD Amount (₦),${repayment.paidMtdAmount}`,
            '',
            '=== Delinquency Snapshot ===',
            `Total Delinquent Installments,${delinquency.totalDelinquent}`,
            `Total Delinquent Amount (₦),${delinquency.totalDelinquentAmount}`,
            '',
            'Bucket,Count,Amount',
            ...delinquency.buckets.map((b) => `${b.label},${b.count},${b.amount}`),
        ];
        return lines.join('\n');
    }
    _parseSetting(val, fallback) {
        if (!val)
            return fallback;
        try {
            return JSON.parse(val);
        }
        catch {
            return val;
        }
    }
    diffDays(a, b) {
        return Math.floor((b.getTime() - a.getTime()) / 86400000);
    }
    async getFinancialReports() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const [totalPayments, monthPayments, yearPayments, subscriptions, activeHoldings, investOrders, totalUsers, monthUsers,] = await Promise.all([
            this.paymentRepo.find({ where: { status: status_enum_1.PaymentStatus.SUCCESS } }),
            this.paymentRepo.find({ where: { status: status_enum_1.PaymentStatus.SUCCESS, createdAt: (0, typeorm_2.Between)(startOfMonth, now) } }),
            this.paymentRepo.find({ where: { status: status_enum_1.PaymentStatus.SUCCESS, createdAt: (0, typeorm_2.Between)(startOfYear, now) } }),
            this.subRepo.find(),
            this.holdingRepo.find({ where: { isActive: true } }),
            this.investOrderRepo.find(),
            this.userRepo.count(),
            this.userRepo.count({ where: { createdAt: (0, typeorm_2.Between)(startOfMonth, now) } }),
        ]);
        const totalVolume = totalPayments.reduce((s, p) => s + Number(p.amount), 0);
        const totalFees = totalPayments.reduce((s, p) => s + Number(p.fee), 0);
        const monthVolume = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
        const yearVolume = yearPayments.reduce((s, p) => s + Number(p.amount), 0);
        const outstandingPrincipal = subscriptions
            .filter((s) => s.status === status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT || s.status === status_enum_1.SubscriptionStatus.DEFAULTED)
            .reduce((sum, s) => sum + (Number(s.totalAmount) - Number(s.amountPaid)), 0);
        const defaultedCount = subscriptions.filter((s) => s.status === status_enum_1.SubscriptionStatus.DEFAULTED).length;
        const activeRepaymentCount = subscriptions.filter((s) => s.status === status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT).length;
        const defaultRate = activeRepaymentCount + defaultedCount > 0
            ? (defaultedCount / (activeRepaymentCount + defaultedCount)) * 100
            : 0;
        const aum = activeHoldings.reduce((s, h) => s + Number(h.currentValue || h.costBasis), 0);
        const totalInvested = investOrders
            .filter((o) => o.status === investment_order_entity_1.OrderStatus.ALLOCATED)
            .reduce((s, o) => s + Number(o.amount), 0);
        const [savingsAccounts, savingsDeposits, savingsWithdrawals, activeLoans] = await Promise.all([
            this.savingsAccRepo.find(),
            this.savingsTxRepo.find({ where: { type: (0, typeorm_2.In)([savings_transaction_entity_1.TransactionType.DEPOSIT, savings_transaction_entity_1.TransactionType.GOAL_DEPOSIT]) } }),
            this.savingsTxRepo.find({ where: { type: (0, typeorm_2.In)([savings_transaction_entity_1.TransactionType.WITHDRAWAL, savings_transaction_entity_1.TransactionType.GOAL_WITHDRAWAL]) } }),
            this.loanRepo.find(),
        ]);
        const savingsBalance = savingsAccounts.reduce((s, a) => s + Number(a.balance || 0), 0);
        const totalSavingsDeposits = savingsDeposits.reduce((s, t) => s + Number(t.amount || 0), 0);
        const totalSavingsWithdrawals = savingsWithdrawals.reduce((s, t) => s + Number(t.amount || 0), 0);
        const activeSavingsAccounts = savingsAccounts.filter((a) => a.status === 'active').length;
        const activeLoanCount = activeLoans.filter((l) => l.status === 'active').length;
        const loanOutstanding = activeLoans.reduce((s, l) => s + (Number(l.totalRepayment) - Number(l.amountPaid || 0)), 0);
        const last12Months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            const [monthPaymentsData, monthNewUsers] = await Promise.all([
                this.paymentRepo.find({ where: { status: status_enum_1.PaymentStatus.SUCCESS, createdAt: (0, typeorm_2.Between)(d, end) } }),
                this.userRepo.count({ where: { createdAt: (0, typeorm_2.Between)(d, end) } }),
            ]);
            last12Months.push({
                month: label,
                volume: monthPaymentsData.reduce((s, p) => s + Number(p.amount), 0),
                fees: monthPaymentsData.reduce((s, p) => s + Number(p.fee), 0),
                users: monthNewUsers,
            });
        }
        return {
            summary: {
                totalVolume: Math.round(totalVolume * 100) / 100,
                totalFees: Math.round(totalFees * 100) / 100,
                monthVolume: Math.round(monthVolume * 100) / 100,
                yearVolume: Math.round(yearVolume * 100) / 100,
                outstandingPrincipal: Math.round(outstandingPrincipal * 100) / 100,
                aum: Math.round(aum * 100) / 100,
                totalInvested: Math.round(totalInvested * 100) / 100,
                defaultRate: Math.round(defaultRate * 100) / 100,
                totalUsers,
                newUsersMonth: monthUsers,
                activeLoans: activeRepaymentCount,
                defaultedLoans: defaultedCount,
                savingsBalance: Math.round(savingsBalance * 100) / 100,
                totalSavingsDeposits: Math.round(totalSavingsDeposits * 100) / 100,
                totalSavingsWithdrawals: Math.round(totalSavingsWithdrawals * 100) / 100,
                activeSavingsAccounts,
                activeLoanCount,
                loanOutstanding: Math.round(loanOutstanding * 100) / 100,
            },
            trends: last12Months,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(app_setting_entity_1.AppSetting)),
    __param(4, (0, typeorm_1.InjectRepository)(webhook_log_entity_1.WebhookLog)),
    __param(5, (0, typeorm_1.InjectRepository)(processing_step_entity_1.ProcessingStep)),
    __param(6, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(7, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(8, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(9, (0, typeorm_1.InjectRepository)(bnpl_plan_entity_1.BnplPlan)),
    __param(10, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(11, (0, typeorm_1.InjectRepository)(investment_order_entity_1.InvestmentOrder)),
    __param(12, (0, typeorm_1.InjectRepository)(investment_holding_entity_1.InvestmentHolding)),
    __param(13, (0, typeorm_1.InjectRepository)(dispute_entity_1.Dispute)),
    __param(14, (0, typeorm_1.InjectRepository)(savings_account_entity_1.SavingsAccount)),
    __param(15, (0, typeorm_1.InjectRepository)(savings_transaction_entity_1.SavingsTransaction)),
    __param(16, (0, typeorm_1.InjectRepository)(loan_entity_1.Loan)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
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
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map