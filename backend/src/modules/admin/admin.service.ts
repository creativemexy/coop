import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, LessThan } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AppSetting } from '../settings/entities/app-setting.entity';
import { WebhookLog } from '../payments/entities/webhook-log.entity';
import { ProcessingStep, ProcessingStepStatus, ProcessingStepType } from '../bnpl/entities/processing-step.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { InvestmentOrder, OrderStatus } from '../investments/entities/investment-order.entity';
import { InvestmentHolding } from '../investments/entities/investment-holding.entity';
import { Role } from '../../common/enums/role.enum';
import { OrgStatus, SubscriptionStatus, InstallmentStatus, PaymentStatus, KycStatus } from '../../common/enums/status.enum';
import { Dispute, DisputeStatus, DisputeType } from './entities/dispute.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SavingsTransaction, TransactionType } from '../savings/entities/savings-transaction.entity';
import { Loan } from '../loans/entities/loan.entity';
import { RepaymentStatus } from '../loans/entities/loan-repayment.entity';

const TENANT_SETTING_KEYS = [
  'bnpl_enabled',
  'kyc_requirement_level',
  'repayment_retry_policy',
  'webhook_providers',
  'log_retention_days',
  'supported_products',
  'notification_webhook_url',
  'notification_email',
] as const;

export interface TenantConfig {
  bnplEnabled: boolean;
  kycRequirementLevel: string;
  repaymentRetryPolicy: { maxAttempts: number; cooldownHours: number; autoRetryOnFailure: boolean };
  webhookProviders: { paystack: { endpoint: string; enabled: boolean; retryOnFailure: boolean; retryMaxAttempts: number } };
  logRetentionDays: number;
}

const DEFAULT_CONFIG: TenantConfig = {
  bnplEnabled: true,
  kycRequirementLevel: 'basic',
  repaymentRetryPolicy: { maxAttempts: 3, cooldownHours: 24, autoRetryOnFailure: true },
  webhookProviders: { paystack: { endpoint: '/api/v1/payments/webhook/paystack', enabled: true, retryOnFailure: true, retryMaxAttempts: 3 } },
  logRetentionDays: 90,
};

@Injectable()
export class AdminService {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AppSetting)
    private readonly settingRepo: Repository<AppSetting>,
    @InjectRepository(WebhookLog)
    private readonly webhookLogRepo: Repository<WebhookLog>,
    @InjectRepository(ProcessingStep)
    private readonly stepRepo: Repository<ProcessingStep>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplPlan)
    private readonly planRepo: Repository<BnplPlan>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(InvestmentOrder)
    private readonly investOrderRepo: Repository<InvestmentOrder>,
    @InjectRepository(InvestmentHolding)
    private readonly holdingRepo: Repository<InvestmentHolding>,
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(SavingsAccount)
    private readonly savingsAccRepo: Repository<SavingsAccount>,
    @InjectRepository(SavingsTransaction)
    private readonly savingsTxRepo: Repository<SavingsTransaction>,
    @InjectRepository(Loan)
    private readonly loanRepo: Repository<Loan>,
  ) {}

  async resetPassword(userId: string, newPassword: string) {
    return this.authService.adminResetPassword(userId, newPassword);
  }

  async revokeSessions(userId: string) {
    return this.authService.revokeSessions(userId);
  }

  async assignRole(
    userId: string,
    role: Role,
    callerRole: string,
    organizationId?: string,
    apexOrgId?: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (role === Role.SUPER_ADMIN || role === Role.OPERATIONAL_ADMIN) {
      if (callerRole !== Role.SUPER_ADMIN) {
        throw new BadRequestException('Only super admin can assign system-wide roles');
      }
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

    if (coopRoles.includes(role) && !organizationId && !apexOrgId) {
      throw new BadRequestException(
        'Cooperative-level roles require organizationId or apexOrgId',
      );
    }

    const updates: Partial<User> = { role };
    if (organizationId) updates.organizationId = organizationId;
    if (apexOrgId) updates.apexOrgId = apexOrgId;

    await this.userRepo.update(userId, updates);
    return this.userRepo.findOne({ where: { id: userId } });
  }

  // ─── Tenant config ───────────────────────────────────────────────

  private async getTenantSettingsMap(id: string): Promise<Map<string, string>> {
    const keys = TENANT_SETTING_KEYS.map((k) => `tenant:${id}:${k}`);
    const rows = await this.settingRepo.find({ where: { key: In(keys) } });
    return new Map(rows.map((s) => [s.key.replace(`tenant:${id}:`, ''), s.value]));
  }

  async getTenantConfig(id: string): Promise<TenantConfig> {
    const map = await this.getTenantSettingsMap(id);
    return {
      bnplEnabled: map.has('bnpl_enabled') ? map.get('bnpl_enabled') === 'true' : DEFAULT_CONFIG.bnplEnabled,
      kycRequirementLevel: map.get('kyc_requirement_level') || DEFAULT_CONFIG.kycRequirementLevel,
      repaymentRetryPolicy: map.has('repayment_retry_policy')
        ? JSON.parse(map.get('repayment_retry_policy')!)
        : DEFAULT_CONFIG.repaymentRetryPolicy,
      webhookProviders: map.has('webhook_providers')
        ? JSON.parse(map.get('webhook_providers')!)
        : DEFAULT_CONFIG.webhookProviders,
      logRetentionDays: map.has('log_retention_days') ? Number(map.get('log_retention_days')) : DEFAULT_CONFIG.logRetentionDays,
    };
  }

  async updateTenantConfig(
    id: string,
    dto: Partial<TenantConfig & { name?: string; status?: string }>,
  ) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Tenant not found');

    if (dto.name || dto.status) {
      await this.orgRepo.update(id, {
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status as OrgStatus }),
      });
    }

    const settings: { key: string; value: string }[] = [];
    if (dto.bnplEnabled !== undefined) settings.push({ key: `tenant:${id}:bnpl_enabled`, value: String(dto.bnplEnabled) });
    if (dto.kycRequirementLevel !== undefined) settings.push({ key: `tenant:${id}:kyc_requirement_level`, value: dto.kycRequirementLevel });
    if (dto.repaymentRetryPolicy !== undefined) settings.push({ key: `tenant:${id}:repayment_retry_policy`, value: JSON.stringify(dto.repaymentRetryPolicy) });
    if (dto.webhookProviders !== undefined) settings.push({ key: `tenant:${id}:webhook_providers`, value: JSON.stringify(dto.webhookProviders) });
    if (dto.logRetentionDays !== undefined) settings.push({ key: `tenant:${id}:log_retention_days`, value: String(dto.logRetentionDays) });

    for (const s of settings) {
      await this.settingRepo.upsert({ key: s.key, value: s.value } as AppSetting, ['key']);
    }

    return this.getTenantDetail(id);
  }

  // ─── Tenant listing / detail (augmented with config) ─────────────

  async listTenants() {
    const orgs = await this.orgRepo.find({
      relations: { apexOrg: true },
      order: { createdAt: 'DESC' },
    });
    const settingKeys = orgs.flatMap((org) =>
      TENANT_SETTING_KEYS.map((k) => `tenant:${org.id}:${k}`),
    );
    const settings = await this.settingRepo.find({
      where: { key: In(settingKeys) },
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

  async getTenantDetail(id: string) {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: { apexOrg: true },
    });
    if (!org) throw new NotFoundException('Tenant not found');

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
        ? JSON.parse(map.get('repayment_retry_policy')!)
        : DEFAULT_CONFIG.repaymentRetryPolicy,
      webhookProviders: map.has('webhook_providers')
        ? JSON.parse(map.get('webhook_providers')!)
        : DEFAULT_CONFIG.webhookProviders,
      logRetentionDays: map.has('log_retention_days') ? Number(map.get('log_retention_days')) : 90,
      supportedProducts: this._parseSetting(map.get('supported_products'), []),
      notificationWebhookUrl: map.get('notification_webhook_url') || null,
      notificationEmail: map.get('notification_email') || null,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  async getTenantHealth(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Tenant not found');

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
      isActive: org.status === OrgStatus.ACTIVE,
      users: { total: totalUsers, active: activeUsers, pending: totalUsers - activeUsers },
      roleDistribution: roleDistribution.map((r: any) => ({ role: r.role, count: Number(r.count) })),
      lastUpdated: org.updatedAt,
    };
  }

  async updateTenantSettings(
    id: string,
    dto: {
      name?: string;
      status?: string;
      supportedProducts?: string[];
      notificationWebhookUrl?: string;
      notificationEmail?: string;
    },
  ) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Tenant not found');

    if (dto.name || dto.status) {
      await this.orgRepo.update(id, {
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status as OrgStatus }),
      });
    }

    const entry = (key: string, value: string) =>
      this.settingRepo.upsert({ key, value } as AppSetting, ['key']);

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

  async getTenantSettings(id: string) {
    return this.getTenantDetail(id);
  }

  // ─── Operational Monitoring ──────────────────────────────────────

  async getWebhookDeliveryStatus(tenantId?: string, days = 7) {
    const since = new Date(Date.now() - days * 86400000);
    const where: any = { createdAt: Between(since, new Date()) };

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

  async getFailedJobs(tenantId?: string, days = 7) {
    const since = new Date(Date.now() - days * 86400000);
    const where: any = { status: ProcessingStepStatus.FAILED, createdAt: Between(since, new Date()) };

    const steps = await this.stepRepo.find({ where, order: { createdAt: 'DESC' }, take: 200 });

    const byType: Record<string, number> = {};
    for (const s of steps) {
      byType[s.stepType] = (byType[s.stepType] || 0) + 1;
    }

    return {
      total: steps.length,
      byType,
      steps: steps.slice(0, 100),
    };
  }

  async getQueueStatus(tenantId?: string) {
    const now = new Date();

    const totalOverdue = await this.instRepo.count({
      where: { status: InstallmentStatus.PENDING, dueDate: LessThan(now) },
    });

    const pendingSteps = await this.stepRepo.count({
      where: { status: ProcessingStepStatus.PENDING },
    });

    const failedSteps = await this.stepRepo.count({
      where: { status: ProcessingStepStatus.FAILED },
    });

    const lateInstallments = await this.instRepo.find({
      where: { status: InstallmentStatus.PENDING, dueDate: LessThan(now) },
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

  // ─── Dispute Management (Admin) ─────────────────────────

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

  async getMemberStatement(userId: string) {
    const [user, savingsAcc] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.savingsAccRepo.findOne({ where: { userId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');

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

    const loanRepayments = loans.flatMap((l) =>
      (l.repayments || []).map((r) => ({
        date: r.createdAt,
        type: r.status === RepaymentStatus.PAID ? 'loan_repayment' : 'loan_due',
        amount: -Number(r.amount),
        description: `Loan repayment due ${new Date(r.dueDate).toLocaleDateString()}`,
        status: r.status,
        reference: r.paymentReference || r.id,
      })),
    );

    const transactions: Array<{
      date: Date;
      type: string;
      amount: number;
      description: string;
      status: string;
      reference: string;
    }> = [
      ...savingsTxs.map((tx) => ({
        date: tx.createdAt,
        type: tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.GOAL_WITHDRAWAL
          ? 'savings_withdrawal'
          : tx.type === TransactionType.INTEREST
            ? 'savings_interest'
            : 'savings_deposit',
        amount: tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.GOAL_WITHDRAWAL
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

  async getSystemLogs(tenantId?: string, days = 7) {
    const since = new Date(Date.now() - days * 86400000);
    const where: any = { createdAt: Between(since, new Date()) };

    const logs = await this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 200,
    });

    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};
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

  // ─── Admin Overview Dashboard ──────────────────────────────────

  async getAdminOverview() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeTenants,
      activeUsers,
      webhooks24h,
      webhooks7d,
      jobsFailed24h,
      jobsFailed7d,
      jobsRetrying,
      pendingSteps,
    ] = await Promise.all([
      this.orgRepo.count({ where: { status: OrgStatus.ACTIVE } }),
      this.userRepo.count({ where: { isActive: true } }),
      this.webhookLogRepo.find({ where: { createdAt: Between(dayAgo, now) }, order: { createdAt: 'DESC' }, take: 500 }),
      this.webhookLogRepo.find({ where: { createdAt: Between(weekAgo, now) }, order: { createdAt: 'DESC' }, take: 500 }),
      this.stepRepo.find({ where: { status: ProcessingStepStatus.FAILED, createdAt: Between(dayAgo, now) }, order: { createdAt: 'DESC' }, take: 200 }),
      this.stepRepo.find({ where: { status: ProcessingStepStatus.FAILED, createdAt: Between(weekAgo, now) }, order: { createdAt: 'DESC' }, take: 200 }),
      this.stepRepo.find({ where: { status: ProcessingStepStatus.IN_PROGRESS }, order: { createdAt: 'DESC' }, take: 200 }),
      this.stepRepo.count({ where: { status: ProcessingStepStatus.PENDING } }),
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

  // ─── Tenant Health Table ───────────────────────────────────────

  async getTenantsHealthTable() {
    const orgs = await this.orgRepo.find({ order: { name: 'ASC' } });
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const settingKeys = orgs.flatMap((org) => [
      `tenant:${org.id}:bnpl_enabled`,
      `tenant:${org.id}:supported_products`,
    ]);
    const settings = await this.settingRepo.find({ where: { key: In(settingKeys) } });
    const settingMap = new Map(settings.map((s) => [s.key, s.value]));

    // Latest failed webhook per org (match by common patterns — webhook_logs don't have org_id directly, use broad scope)
    const allFailedWebhooks = await this.webhookLogRepo.find({
      where: { status: 'failed', createdAt: Between(weekAgo, now) },
      order: { createdAt: 'DESC' },
    });

    const webhookErrorsByProvider = new Map<string, Date>();
    for (const wh of allFailedWebhooks) {
      const key = wh.provider;
      if (!webhookErrorsByProvider.has(key) || wh.createdAt > webhookErrorsByProvider.get(key)!) {
        webhookErrorsByProvider.set(key, wh.createdAt);
      }
    }

    const orgsWithHealth = await Promise.all(
      orgs.map(async (org) => {
        const bnplEnabled = settingMap.get(`tenant:${org.id}:bnpl_enabled`) !== 'false';

        const plans = await this.planRepo.find({ where: { organizationId: org.id } });
        const planIds = plans.map((p) => p.id);

        let backlogCount = 0;
        if (planIds.length > 0) {
          const subs = await this.subRepo.find({ where: planIds.map((id) => ({ planId: id })) });
          const subIds = subs.map((s) => s.id);
          if (subIds.length > 0) {
            backlogCount = await this.stepRepo.count({
              where: { subscriptionId: In(subIds), status: ProcessingStepStatus.PENDING },
            });
          }
        }

        const latestWebhookError = webhookErrorsByProvider.get('paystack') || null;

        const hasFailedJobs = backlogCount > 0;
        const hasWebhookErrors = latestWebhookError !== null;

        let status: string;
        if (hasFailedJobs || hasWebhookErrors) {
          status = 'degraded';
        } else {
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
      }),
    );

    return orgsWithHealth;
  }

  // ─── Admin Audit Logs (filtered) ───────────────────────────────

  async getAdminAuditLogs(filters?: {
    tenantId?: string;
    actorId?: string;
    action?: string;
    days?: number;
  }) {
    const days = filters?.days || 7;
    const since = new Date(Date.now() - days * 86400000);
    const qb = this.auditRepo.createQueryBuilder('a');
    qb.where('a.created_at >= :since', { since });

    if (filters?.tenantId) {
      // Match audit logs by org — entity_id may reference the org
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

  // ─── Users by organization (for role matrix) ───────────────────

  async getUsersByOrganization() {
    const orgs = await this.orgRepo.find({ order: { name: 'ASC' } });
    const users = await this.userRepo.find({ order: { createdAt: 'ASC' } });

    const orgMap = new Map<string, typeof users>();
    for (const u of users) {
      const key = u.organizationId || 'unassigned';
      if (!orgMap.has(key)) orgMap.set(key, []);
      orgMap.get(key)!.push(u);
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

  // ─── Tenant Reports ────────────────────────────────────────────

  async getTenantOrderVolume(tenantId: string) {
    const plans = await this.planRepo.find({ where: { organizationId: tenantId }, relations: { catalogItem: true } });
    const planIds = plans.map((p) => p.id);
    if (planIds.length === 0) return { totalOrders: 0, activeSubscriptions: 0, totalVolume: 0, byPlan: [] };

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
      activeSubscriptions: subs.filter((s) => s.status === SubscriptionStatus.ACTIVE_REPAYMENT).length,
      totalVolume,
      byPlan,
    };
  }

  async getTenantRepaymentKpis(tenantId: string) {
    const plans = await this.planRepo.find({ where: { organizationId: tenantId }, relations: { catalogItem: true } });
    const planIds = plans.map((p) => p.id);
    if (planIds.length === 0) return { totalInstallments: 0, paidRate: 0, overdueAmount: 0, paidMtd: 0 };

    const subs = await this.subRepo.find({ where: planIds.map((id) => ({ planId: id })), relations: { installments: true } });
    const allInsts = subs.flatMap((s) => s.installments || []);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalInsts = allInsts.length;
    const paidInsts = allInsts.filter((i) => i.status === InstallmentStatus.PAID);
    const overdueInsts = allInsts.filter((i) => i.status === InstallmentStatus.PENDING && new Date(i.dueDate) < now);
    const paidMtd = allInsts.filter((i) => i.status === InstallmentStatus.PAID && i.paidAt && i.paidAt >= startOfMonth);

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

  async getTenantDelinquencySnapshot(tenantId: string) {
    const plans = await this.planRepo.find({ where: { organizationId: tenantId } });
    const planIds = plans.map((p) => p.id);
    if (planIds.length === 0) return { totalDelinquent: 0, totalDelinquentAmount: 0, buckets: [] };

    const subs = await this.subRepo.find({ where: planIds.map((id) => ({ planId: id })) });
    const subIds = subs.map((s) => s.id);
    if (subIds.length === 0) return { totalDelinquent: 0, totalDelinquentAmount: 0, buckets: [] };

    const now = new Date();
    const allInsts = await this.instRepo.find({
      where: { subscriptionId: In(subIds), status: InstallmentStatus.PENDING, dueDate: LessThan(now) },
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

  async exportTenantReport(tenantId: string): Promise<string> {
    const org = await this.orgRepo.findOne({ where: { id: tenantId } });
    const orgName = org?.name || 'Unknown';

    const [volume, repayment, delinquency] = await Promise.all([
      this.getTenantOrderVolume(tenantId),
      this.getTenantRepaymentKpis(tenantId),
      this.getTenantDelinquencySnapshot(tenantId),
    ]);

    const lines: string[] = [
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

  // ─── Helpers ─────────────────────────────────────────────────────

  private _parseSetting<T>(val: string | undefined, fallback: T): T {
    if (!val) return fallback;
    try { return JSON.parse(val) as T; } catch { return val as unknown as T; }
  }

  private diffDays(a: Date, b: Date): number {
    return Math.floor((b.getTime() - a.getTime()) / 86400000);
  }

  // ── Platform-wide Financial Reports ──

  async getFinancialReports() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalPayments,
      monthPayments,
      yearPayments,
      subscriptions,
      activeHoldings,
      investOrders,
      totalUsers,
      monthUsers,
    ] = await Promise.all([
      this.paymentRepo.find({ where: { status: PaymentStatus.SUCCESS } }),
      this.paymentRepo.find({ where: { status: PaymentStatus.SUCCESS, createdAt: Between(startOfMonth, now) } }),
      this.paymentRepo.find({ where: { status: PaymentStatus.SUCCESS, createdAt: Between(startOfYear, now) } }),
      this.subRepo.find(),
      this.holdingRepo.find({ where: { isActive: true } }),
      this.investOrderRepo.find(),
      this.userRepo.count(),
      this.userRepo.count({ where: { createdAt: Between(startOfMonth, now) } }),
    ]);

    const totalVolume = totalPayments.reduce((s, p) => s + Number(p.amount), 0);
    const totalFees = totalPayments.reduce((s, p) => s + Number(p.fee), 0);
    const monthVolume = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
    const yearVolume = yearPayments.reduce((s, p) => s + Number(p.amount), 0);

    const outstandingPrincipal = subscriptions
      .filter((s) => s.status === SubscriptionStatus.ACTIVE_REPAYMENT || s.status === SubscriptionStatus.DEFAULTED)
      .reduce((sum, s) => sum + (Number(s.totalAmount) - Number(s.amountPaid)), 0);

    const defaultedCount = subscriptions.filter((s) => s.status === SubscriptionStatus.DEFAULTED).length;
    const activeRepaymentCount = subscriptions.filter((s) => s.status === SubscriptionStatus.ACTIVE_REPAYMENT).length;
    const defaultRate = activeRepaymentCount + defaultedCount > 0
      ? (defaultedCount / (activeRepaymentCount + defaultedCount)) * 100
      : 0;

    const aum = activeHoldings.reduce((s, h) => s + Number(h.currentValue || h.costBasis), 0);
    const totalInvested = investOrders
      .filter((o) => o.status === OrderStatus.ALLOCATED)
      .reduce((s, o) => s + Number(o.amount), 0);

    const [savingsAccounts, savingsDeposits, savingsWithdrawals, activeLoans] = await Promise.all([
      this.savingsAccRepo.find(),
      this.savingsTxRepo.find({ where: { type: In([TransactionType.DEPOSIT, TransactionType.GOAL_DEPOSIT]) } }),
      this.savingsTxRepo.find({ where: { type: In([TransactionType.WITHDRAWAL, TransactionType.GOAL_WITHDRAWAL]) } }),
      this.loanRepo.find(),
    ]);

    const savingsBalance = savingsAccounts.reduce((s, a) => s + Number(a.balance || 0), 0);
    const totalSavingsDeposits = savingsDeposits.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalSavingsWithdrawals = savingsWithdrawals.reduce((s, t) => s + Number(t.amount || 0), 0);
    const activeSavingsAccounts = savingsAccounts.filter((a) => a.status === 'active').length;
    const activeLoanCount = activeLoans.filter((l) => l.status === 'active').length;
    const loanOutstanding = activeLoans.reduce(
      (s, l) => s + (Number(l.totalRepayment) - Number(l.amountPaid || 0)),
      0,
    );

    const last12Months: Array<{ month: string; volume: number; fees: number; users: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const [monthPaymentsData, monthNewUsers] = await Promise.all([
        this.paymentRepo.find({ where: { status: PaymentStatus.SUCCESS, createdAt: Between(d, end) } }),
        this.userRepo.count({ where: { createdAt: Between(d, end) } }),
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
}
