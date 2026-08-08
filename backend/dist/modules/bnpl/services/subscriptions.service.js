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
var SubscriptionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bnpl_subscription_entity_1 = require("../entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../entities/bnpl-installment.entity");
const bnpl_plan_entity_1 = require("../entities/bnpl-plan.entity");
const bnpl_plan_config_entity_1 = require("../entities/bnpl-plan-config.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const users_service_1 = require("../../users/users.service");
const status_enum_1 = require("../../../common/enums/status.enum");
const mask_util_1 = require("../../../common/mask.util");
let SubscriptionsService = SubscriptionsService_1 = class SubscriptionsService {
    subRepo;
    instRepo;
    planRepo;
    configRepo;
    auditRepo;
    usersService;
    logger = new common_1.Logger(SubscriptionsService_1.name);
    constructor(subRepo, instRepo, planRepo, configRepo, auditRepo, usersService) {
        this.subRepo = subRepo;
        this.instRepo = instRepo;
        this.planRepo = planRepo;
        this.configRepo = configRepo;
        this.auditRepo = auditRepo;
        this.usersService = usersService;
    }
    async checkEligibility(userId, planId) {
        const plan = await this.planRepo.findOne({
            where: { id: planId, status: bnpl_plan_entity_1.PlanStatus.ACTIVE },
            relations: { catalogItem: true },
        });
        if (!plan) {
            return {
                eligible: false,
                reasons: [{ key: 'plan_not_found', label: 'Plan not found or inactive', passed: false }],
            };
        }
        const config = await this.configRepo.findOne({ where: { organizationId: plan.organizationId } });
        const user = await this.usersService.findById(userId);
        const itemPrice = Number(plan.catalogItem?.price || 0);
        const userScore = user.creditScore;
        const reasons = [];
        const membershipOk = !config?.requireMembership || !!user?.organizationId;
        reasons.push({
            key: 'membership',
            label: 'Organization membership',
            passed: membershipOk,
            detail: membershipOk ? undefined : 'User must belong to an organization',
        });
        const minOk = !plan.minPrincipal || itemPrice >= Number(plan.minPrincipal);
        const maxOk = (!plan.maxPrincipal || itemPrice <= Number(plan.maxPrincipal));
        const orgMaxOk = !config?.maxPrincipal || itemPrice <= Number(config.maxPrincipal);
        reasons.push({
            key: 'principal_min',
            label: `Minimum principal (₦${Number(plan.minPrincipal || 0).toLocaleString()})`,
            passed: minOk,
            detail: minOk ? undefined : `Item price ₦${itemPrice.toLocaleString()} below minimum ₦${Number(plan.minPrincipal).toLocaleString()}`,
        });
        reasons.push({
            key: 'principal_max',
            label: `Maximum principal (₦${Number(plan.maxPrincipal || 0).toLocaleString()})`,
            passed: maxOk && orgMaxOk,
            detail: !maxOk
                ? `Item price ₦${itemPrice.toLocaleString()} exceeds plan maximum`
                : !orgMaxOk
                    ? `Item price ₦${itemPrice.toLocaleString()} exceeds organization maximum`
                    : undefined,
        });
        let scoreOk = true;
        if (plan.eligibilityBands?.length && userScore !== undefined) {
            scoreOk = plan.eligibilityBands.some((band) => userScore >= band.minScore && userScore <= band.maxScore && itemPrice <= band.maxPrincipal);
            reasons.push({
                key: 'credit_score',
                label: `Credit score (${userScore})`,
                passed: scoreOk,
                detail: scoreOk ? undefined : `Score ${userScore} doesn't match any eligibility tier`,
            });
        }
        else if (plan.eligibilityBands?.length && userScore === undefined) {
            scoreOk = false;
            reasons.push({
                key: 'credit_score',
                label: 'Credit score',
                passed: false,
                detail: 'No credit score on record',
            });
        }
        const eligible = membershipOk && minOk && maxOk && orgMaxOk && scoreOk;
        return { eligible, reasons };
    }
    async subscribe(userId, planId) {
        const { eligible, reasons } = await this.checkEligibility(userId, planId);
        if (!eligible) {
            throw new common_1.BadRequestException(`Not eligible: ${reasons.filter((r) => !r.passed).map((r) => r.label).join(', ')}`);
        }
        const plan = await this.planRepo.findOne({
            where: { id: planId, status: bnpl_plan_entity_1.PlanStatus.ACTIVE },
            relations: { catalogItem: true },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found or inactive');
        const config = await this.configRepo.findOne({ where: { organizationId: plan.organizationId } });
        const itemPrice = Number(plan.catalogItem?.price || 0);
        const totalAmount = this._calculateTotalAmount(itemPrice, Number(plan.interestRate), plan.installmentCount, config?.interestModel || bnpl_plan_config_entity_1.InterestModel.SIMPLE);
        const subscription = this.subRepo.create({
            userId,
            planId,
            status: status_enum_1.SubscriptionStatus.CREATED,
            downPayment: 0,
            totalAmount,
            amountPaid: 0,
            payoutStatus: status_enum_1.PayoutStatus.PENDING,
        });
        return this.subRepo.save(subscription);
    }
    async findByUser(userId) {
        return this.subRepo.find({
            where: { userId },
            relations: { plan: { catalogItem: true }, installments: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findById(id) {
        const sub = await this.subRepo.findOne({
            where: { id },
            relations: { plan: { catalogItem: true }, installments: true },
        });
        if (!sub) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        return sub;
    }
    async findByOrg(organizationId) {
        return this.subRepo
            .createQueryBuilder('sub')
            .leftJoinAndSelect('sub.plan', 'plan')
            .leftJoinAndSelect('plan.catalogItem', 'catalogItem')
            .leftJoinAndSelect('sub.installments', 'installments')
            .where('plan.organizationId = :orgId', { orgId: organizationId })
            .orderBy('sub.created_at', 'DESC')
            .getMany();
    }
    async listOrders(filters) {
        const qb = this.subRepo
            .createQueryBuilder('sub')
            .leftJoinAndSelect('sub.plan', 'plan')
            .leftJoinAndSelect('plan.catalogItem', 'catalogItem')
            .leftJoinAndSelect('sub.installments', 'installments');
        if (filters?.status) {
            const statuses = filters.status.split(',');
            if (statuses.length === 1) {
                qb.andWhere('sub.status = :status', { status: filters.status });
            }
            else {
                qb.andWhere('sub.status IN (:...statuses)', { statuses });
            }
        }
        if (filters?.payoutStatus) {
            qb.andWhere('sub.payout_status = :payoutStatus', {
                payoutStatus: filters.payoutStatus,
            });
        }
        if (filters?.search) {
            qb.andWhere('catalogItem.name ILIKE :search', {
                search: `%${filters.search}%`,
            });
        }
        if (filters?.product) {
            qb.andWhere('catalogItem.name ILIKE :product', {
                product: `%${filters.product}%`,
            });
        }
        if (filters?.tenor) {
            qb.andWhere('plan.installment_count = :tenor', {
                tenor: filters.tenor,
            });
        }
        if (filters?.dateFrom) {
            qb.andWhere('sub.created_at >= :dateFrom', {
                dateFrom: new Date(filters.dateFrom),
            });
        }
        if (filters?.dateTo) {
            qb.andWhere('sub.created_at <= :dateTo', {
                dateTo: new Date(filters.dateTo),
            });
        }
        qb.orderBy('sub.created_at', 'DESC');
        const subs = await qb.getMany();
        const enriched = [];
        for (const sub of subs) {
            const riskCount = await this.auditRepo.manager
                .query(`SELECT COUNT(*) as cnt FROM bnpl_risk_flags WHERE entity_id = $1 AND (status = 'open' OR status = 'investigating')`, [sub.id])
                .then((r) => Number(r[0]?.cnt || 0));
            const openRiskCount = await this.auditRepo.manager
                .query(`SELECT COUNT(*) as cnt FROM bnpl_risk_flags WHERE entity_id = $1 AND status = 'open'`, [sub.id])
                .then((r) => Number(r[0]?.cnt || 0));
            const overdueInst = (sub.installments || []).filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING && new Date(i.dueDate) < new Date());
            const paidInst = (sub.installments || []).filter((i) => i.status === status_enum_1.InstallmentStatus.PAID);
            enriched.push({
                ...sub,
                riskFlagCount: riskCount,
                openRiskFlagCount: openRiskCount,
                riskLevel: openRiskCount > 0 ? 'high' : riskCount > 0 ? 'medium' : 'low',
                overdueInstallmentCount: overdueInst.length,
                totalInstallmentCount: (sub.installments || []).length,
                paidInstallmentCount: paidInst.length,
            });
        }
        return enriched;
    }
    async getOrderPayments(orderId) {
        const payments = await this.subRepo.manager.query(`SELECT id, amount, fee, provider, provider_reference, status, payout_status, metadata, created_at
       FROM payments
       WHERE subscription_id = $1
       ORDER BY created_at DESC`, [orderId]);
        return payments.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            fee: Number(p.fee || 0),
            provider: p.provider,
            providerReference: p.provider_reference,
            status: p.status,
            payoutStatus: p.payout_status,
            metadata: p.metadata,
            createdAt: p.created_at,
        }));
    }
    async updateOrderStatus(id, status, performedBy, reason) {
        const sub = await this.subRepo.findOne({ where: { id } });
        if (!sub)
            throw new common_1.NotFoundException('Order not found');
        const allowedTransitions = {
            [status_enum_1.SubscriptionStatus.CREATED]: [status_enum_1.SubscriptionStatus.PENDING_PAYMENT, status_enum_1.SubscriptionStatus.DEFAULTED],
            [status_enum_1.SubscriptionStatus.PENDING_PAYMENT]: [status_enum_1.SubscriptionStatus.DEFAULTED],
            [status_enum_1.SubscriptionStatus.DISBURSED]: [status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT, status_enum_1.SubscriptionStatus.DEFAULTED],
            [status_enum_1.SubscriptionStatus.ACTIVE_REPAYMENT]: [status_enum_1.SubscriptionStatus.DEFAULTED],
            [status_enum_1.SubscriptionStatus.SETTLED]: [],
            [status_enum_1.SubscriptionStatus.DEFAULTED]: [status_enum_1.SubscriptionStatus.PENDING_PAYMENT],
        };
        if (!allowedTransitions[sub.status]?.includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${sub.status} to ${status}`);
        }
        const oldStatus = sub.status;
        sub.status = status;
        if (status === status_enum_1.SubscriptionStatus.PENDING_PAYMENT && !sub.approvedAt) {
            sub.approvedAt = new Date();
        }
        const saved = await this.subRepo.save(sub);
        this._logAudit({
            entityType: 'subscription',
            entityId: id,
            action: 'status_change',
            changes: {
                status: { from: oldStatus, to: status },
            },
            reason,
            performedBy,
        });
        return saved;
    }
    async approve(id, performedBy) {
        return this.updateOrderStatus(id, status_enum_1.SubscriptionStatus.PENDING_PAYMENT, performedBy, 'Approved via approve()');
    }
    async markDisbursed(id, disbursementReference, performedBy, reason) {
        const sub = await this.subRepo.findOne({ where: { id } });
        if (!sub)
            throw new common_1.NotFoundException('Order not found');
        if (sub.status !== status_enum_1.SubscriptionStatus.PENDING_PAYMENT) {
            throw new common_1.BadRequestException('Order must be in pending_payment to disburse');
        }
        const plan = await this.planRepo.findOne({
            where: { id: sub.planId },
            relations: { catalogItem: true },
        });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const config = await this.configRepo.findOne({ where: { organizationId: plan.organizationId } });
        const itemPrice = Number(plan.catalogItem?.price || 0);
        const downPayment = (itemPrice * Number(plan.downPaymentPercent)) / 100;
        sub.downPayment = downPayment;
        sub.payoutStatus = status_enum_1.PayoutStatus.COMPLETED;
        sub.disbursementReference = disbursementReference;
        sub.disbursedAt = new Date();
        sub.status = status_enum_1.SubscriptionStatus.DISBURSED;
        const saved = await this.subRepo.save(sub);
        const installmentAmount = (Number(sub.totalAmount) - downPayment) / Number(plan.installmentCount);
        const installments = [];
        const startDate = this._calculateStartDate(config ?? undefined);
        for (let i = 0; i < plan.installmentCount; i++) {
            const dueDate = this._calculateDueDate(startDate, i, plan.installmentFrequency, config?.dueDateRule || bnpl_plan_config_entity_1.DueDateRule.SAME_DAY_MONTHLY);
            const gracePeriodEnd = config?.gracePeriodDays
                ? new Date(dueDate.getTime() + config.gracePeriodDays * 86400000)
                : undefined;
            const lateFeeAmount = this._calculateLateFee(installmentAmount, config?.lateFeeType || bnpl_plan_config_entity_1.LateFeeType.FLAT, config?.lateFeeValue || 0);
            installments.push(this.instRepo.create({
                subscriptionId: saved.id,
                dueDate,
                amount: installmentAmount,
                lateFeeAmount,
                gracePeriodEnd,
                status: status_enum_1.InstallmentStatus.PENDING,
            }));
        }
        await this.instRepo.save(installments);
        saved.nextInstallmentDate = installments[0]?.dueDate || null;
        const result = await this.subRepo.save(saved);
        this._logAudit({
            entityType: 'subscription',
            entityId: id,
            action: 'disburse',
            changes: {
                status: { from: status_enum_1.SubscriptionStatus.PENDING_PAYMENT, to: status_enum_1.SubscriptionStatus.DISBURSED },
                disbursementReference: { from: null, to: disbursementReference },
                downPayment: { from: sub.downPayment, to: downPayment },
            },
            reason: reason || `Disbursed with ref ${disbursementReference}`,
            performedBy,
        });
        return result;
    }
    async markSettled(id, performedBy, reason) {
        const sub = await this.subRepo.findOne({ where: { id } });
        if (!sub)
            throw new common_1.NotFoundException('Order not found');
        const oldStatus = sub.status;
        sub.settledAt = new Date();
        sub.status = status_enum_1.SubscriptionStatus.SETTLED;
        const saved = await this.subRepo.save(sub);
        this._logAudit({
            entityType: 'subscription',
            entityId: id,
            action: 'settle',
            changes: {
                status: { from: oldStatus, to: status_enum_1.SubscriptionStatus.SETTLED },
                settledAt: { from: null, to: sub.settledAt },
            },
            reason: reason || 'Manually settled',
            performedBy,
        });
        return saved;
    }
    async searchUsers(query) {
        const results = await this.usersService.search(query);
        return results.map((u) => ({
            id: u.id,
            name: (0, mask_util_1.maskName)(u.name) ?? u.id,
            email: (0, mask_util_1.maskEmail)(u.email) ?? '',
        }));
    }
    async _logAudit(dto) {
        try {
            let performerName;
            if (dto.performedBy) {
                try {
                    const user = await this.usersService.findById(dto.performedBy);
                    performerName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || dto.performedBy;
                }
                catch { }
            }
            await this.auditRepo.save({
                entityType: dto.entityType,
                entityId: dto.entityId,
                action: dto.action,
                changes: dto.changes,
                reason: dto.reason,
                performedBy: dto.performedBy || 'system',
                performerName,
            });
        }
        catch (err) {
            this.logger.error(`Failed to write audit log: ${err}`);
        }
    }
    _calculateStartDate(config) {
        const now = new Date();
        if (config?.gracePeriodDays) {
            return new Date(now.getTime() + config.gracePeriodDays * 86400000);
        }
        return now;
    }
    _calculateDueDate(start, index, frequency, rule) {
        const due = new Date(start);
        if (frequency === 'weekly') {
            due.setDate(due.getDate() + (index + 1) * 7);
        }
        else if (frequency === 'biweekly') {
            due.setDate(due.getDate() + (index + 1) * 14);
        }
        else {
            if (rule === bnpl_plan_config_entity_1.DueDateRule.END_OF_MONTH) {
                due.setMonth(due.getMonth() + (index + 1));
                due.setDate(0);
            }
            else {
                const originalDay = start.getDate();
                due.setMonth(due.getMonth() + (index + 1));
                if (due.getDate() !== originalDay) {
                    due.setDate(0);
                }
            }
        }
        return due;
    }
    _calculateTotalAmount(principal, interestRate, installmentCount, model) {
        switch (model) {
            case bnpl_plan_config_entity_1.InterestModel.FIXED_MONTHLY_FEE:
                return principal + principal * (interestRate / 100) * installmentCount;
            case bnpl_plan_config_entity_1.InterestModel.REDUCING_BALANCE: {
                const monthlyRate = interestRate / 100 / 12;
                const emi = (principal *
                    monthlyRate *
                    Math.pow(1 + monthlyRate, installmentCount)) /
                    (Math.pow(1 + monthlyRate, installmentCount) - 1);
                return emi * installmentCount;
            }
            case bnpl_plan_config_entity_1.InterestModel.SIMPLE:
            default:
                return principal + (principal * interestRate) / 100;
        }
    }
    _calculateLateFee(installmentAmount, feeType, feeValue) {
        if (feeValue <= 0)
            return 0;
        if (feeType === bnpl_plan_config_entity_1.LateFeeType.PERCENTAGE) {
            return installmentAmount * (feeValue / 100);
        }
        return feeValue;
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = SubscriptionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(2, (0, typeorm_1.InjectRepository)(bnpl_plan_entity_1.BnplPlan)),
    __param(3, (0, typeorm_1.InjectRepository)(bnpl_plan_config_entity_1.BnplPlanConfig)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map