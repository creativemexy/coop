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
var BusinessManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessManagerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const bnpl_plan_entity_1 = require("../bnpl/entities/bnpl-plan.entity");
const bnpl_catalog_item_entity_1 = require("../bnpl/entities/bnpl-catalog-item.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const approval_service_1 = require("../bnpl/services/approval.service");
const payment_entity_1 = require("../payments/entities/payment.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const role_enum_1 = require("../../common/enums/role.enum");
const sms_log_entity_1 = require("../sms/entities/sms-log.entity");
const users_service_1 = require("../users/users.service");
let BusinessManagerService = BusinessManagerService_1 = class BusinessManagerService {
    subRepo;
    instRepo;
    planRepo;
    catalogRepo;
    auditRepo;
    paymentRepo;
    smsLogRepo;
    usersService;
    approvalService;
    logger = new common_1.Logger(BusinessManagerService_1.name);
    constructor(subRepo, instRepo, planRepo, catalogRepo, auditRepo, paymentRepo, smsLogRepo, usersService, approvalService) {
        this.subRepo = subRepo;
        this.instRepo = instRepo;
        this.planRepo = planRepo;
        this.catalogRepo = catalogRepo;
        this.auditRepo = auditRepo;
        this.paymentRepo = paymentRepo;
        this.smsLogRepo = smsLogRepo;
        this.usersService = usersService;
        this.approvalService = approvalService;
    }
    async _log(entityType, entityId, action, performedBy, changes, reason) {
        try {
            let performerName;
            try {
                const user = await this.usersService.findById(performedBy);
                performerName =
                    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                        user?.email ||
                        performedBy;
            }
            catch {
            }
            await this.auditRepo.save({
                entityType,
                entityId,
                action,
                changes: changes,
                reason,
                performedBy,
                performerName,
            });
        }
        catch (err) {
            this.logger.error(`Failed to write audit log: ${String(err)}`);
        }
    }
    async lookupOrder(reference, organizationId) {
        const subQuery = this.subRepo.createQueryBuilder('sub')
            .leftJoinAndSelect('sub.plan', 'plan')
            .leftJoinAndSelect('plan.catalogItem', 'catalogItem')
            .leftJoinAndSelect('sub.installments', 'installments')
            .where('sub.id = :reference', { reference });
        if (organizationId) {
            subQuery.andWhere('plan.organizationId = :organizationId', { organizationId });
        }
        let subscription = await subQuery.getOne();
        if (!subscription) {
            const payment = await this.paymentRepo.findOne({
                where: { providerReference: reference },
            });
            if (payment?.subscriptionId) {
                const subQuery2 = this.subRepo.createQueryBuilder('sub')
                    .leftJoinAndSelect('sub.plan', 'plan')
                    .leftJoinAndSelect('plan.catalogItem', 'catalogItem')
                    .leftJoinAndSelect('sub.installments', 'installments')
                    .where('sub.id = :id', { id: payment.subscriptionId });
                if (organizationId) {
                    subQuery2.andWhere('plan.organizationId = :organizationId', { organizationId });
                }
                subscription = await subQuery2.getOne();
            }
        }
        if (!subscription) {
            throw new common_1.NotFoundException(`Order not found for reference: ${reference}`);
        }
        const payments = await this.paymentRepo.find({
            where: { subscriptionId: subscription.id },
            order: { createdAt: 'DESC' },
        });
        return {
            subscription,
            payments: payments.map((p) => ({
                id: p.id,
                amount: p.amount,
                fee: p.fee,
                provider: p.provider,
                providerReference: p.providerReference,
                status: p.status,
                payoutStatus: p.payoutStatus,
                createdAt: p.createdAt,
            })),
        };
    }
    async getWebhookStatus(limit = 20, offset = 0, organizationId) {
        const qb = this.paymentRepo.createQueryBuilder('p')
            .orderBy('p.created_at', 'DESC')
            .take(limit)
            .skip(offset)
            .select([
            'p.id', 'p.provider_reference', 'p.provider', 'p.status',
            'p.payout_status', 'p.amount', 'p.created_at',
        ]);
        if (organizationId) {
            const subQuery = this.subRepo.createQueryBuilder('sub')
                .leftJoin('sub.plan', 'plan')
                .where('plan.organization_id = :organizationId', { organizationId })
                .select('sub.id');
            qb.andWhere('p.subscription_id IN (' + subQuery.getQuery() + ')')
                .setParameters(subQuery.getParameters());
        }
        const [payments, total] = await qb.getManyAndCount();
        return {
            total,
            payments: payments.map((p) => ({
                id: p.id,
                providerReference: p.providerReference,
                provider: p.provider,
                status: p.status,
                payoutStatus: p.payoutStatus,
                amount: p.amount,
                createdAt: p.createdAt,
                webhookReceived: p.status !== status_enum_1.PaymentStatus.PENDING,
            })),
        };
    }
    async resubmitWebhook(paymentId, organizationId, performedBy) {
        const qb = this.paymentRepo.createQueryBuilder('p')
            .where('p.id = :paymentId', { paymentId });
        if (organizationId) {
            const subQuery = this.subRepo.createQueryBuilder('sub')
                .leftJoin('sub.plan', 'plan')
                .where('plan.organization_id = :organizationId', { organizationId })
                .select('sub.id');
            qb.andWhere('p.subscription_id IN (' + subQuery.getQuery() + ')')
                .setParameters(subQuery.getParameters());
        }
        const payment = await qb.getOne();
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        const result = {
            message: 'Webhook resubmission prepared. Use the reference to re-trigger on the provider dashboard.',
            provider: payment.provider,
            providerReference: payment.providerReference,
            paymentId: payment.id,
            status: payment.status,
        };
        await this._log('payment', paymentId, 'webhook_resubmit', performedBy || 'system', { providerReference: { from: null, to: payment.providerReference } }, `Webhook resubmission prepared for ${payment.providerReference}`);
        return result;
    }
    async getLogs(type = 'all', limit = 50, offset = 0, organizationId) {
        const smsLogs = type === 'all' || type === 'sms'
            ? await this.smsLogRepo.find({
                order: { createdAt: 'DESC' },
                take: limit,
                skip: offset,
            })
            : [];
        let paymentLogs = [];
        if (type === 'all' || type === 'payment') {
            const qb = this.paymentRepo.createQueryBuilder('p')
                .orderBy('p.created_at', 'DESC')
                .take(limit)
                .skip(offset)
                .select([
                'p.id', 'p.provider_reference', 'p.provider', 'p.status',
                'p.payout_status', 'p.amount', 'p.created_at',
            ]);
            if (organizationId) {
                const subQuery = this.subRepo.createQueryBuilder('sub')
                    .leftJoin('sub.plan', 'plan')
                    .where('plan.organization_id = :organizationId', { organizationId })
                    .select('sub.id');
                qb.andWhere('p.subscription_id IN (' + subQuery.getQuery() + ')')
                    .setParameters(subQuery.getParameters());
            }
            paymentLogs = await qb.getMany();
        }
        return {
            smsLogs: smsLogs.map((l) => ({
                id: l.id,
                recipient: l.recipient,
                eventType: l.eventType,
                provider: l.provider,
                status: l.status,
                createdAt: l.createdAt,
            })),
            paymentLogs: paymentLogs.map((p) => ({
                id: p.id,
                providerReference: p.providerReference,
                provider: p.provider,
                status: p.status,
                payoutStatus: p.payoutStatus,
                amount: p.amount,
                createdAt: p.createdAt,
            })),
        };
    }
    async markInstallmentAsPaid(installmentId, providerReference, performedBy, organizationId) {
        const instQb = this.instRepo.createQueryBuilder('inst')
            .leftJoinAndSelect('inst.subscription', 'sub')
            .leftJoin('sub.plan', 'plan')
            .where('inst.id = :installmentId', { installmentId });
        if (organizationId) {
            instQb.andWhere('plan.organization_id = :organizationId', { organizationId });
        }
        const installment = await instQb.getOne();
        if (!installment) {
            throw new common_1.NotFoundException('Installment not found');
        }
        if (installment.status === status_enum_1.InstallmentStatus.PAID) {
            throw new common_1.BadRequestException('Installment is already marked as paid');
        }
        const oldStatus = installment.status;
        installment.status = status_enum_1.InstallmentStatus.PAID;
        installment.paidAt = new Date();
        installment.paymentReference = providerReference;
        await this.instRepo.save(installment);
        const sub = installment.subscription;
        if (sub) {
            sub.amountPaid = Number(sub.amountPaid) + Number(installment.amount);
            await this.subRepo.save(sub);
        }
        const payment = this.paymentRepo.create({
            userId: sub?.userId || 'unknown',
            subscriptionId: sub?.id,
            amount: Number(installment.amount),
            fee: 0,
            provider: 'manual',
            providerReference,
            status: status_enum_1.PaymentStatus.SUCCESS,
            payoutStatus: status_enum_1.PayoutStatus.PENDING,
            metadata: { markedBy: performedBy || 'business_manager', installmentId },
        });
        await this.paymentRepo.save(payment);
        await this._log('installment', installmentId, 'mark_paid', performedBy || 'system', {
            status: { from: oldStatus, to: status_enum_1.InstallmentStatus.PAID },
            paymentReference: { from: null, to: providerReference },
        }, `Installment ${installmentId} marked as paid via ${providerReference}`);
        return {
            message: 'Installment marked as paid successfully',
            installmentId,
            providerReference,
            amount: installment.amount,
            paymentId: payment.id,
        };
    }
    async markInstallmentAsPaidOrRequestApproval(installmentId, providerReference, performedBy, role, organizationId, reason) {
        if (role === role_enum_1.Role.SUPERVISOR ||
            role === role_enum_1.Role.SUPER_ADMIN) {
            return this.markInstallmentAsPaid(installmentId, providerReference, performedBy, organizationId);
        }
        return this.approvalService.submit({
            requestType: 'manual_override',
            requestData: { installmentId, providerReference },
            reason: reason || 'Manual correction requested',
            requestedBy: performedBy,
        });
    }
};
exports.BusinessManagerService = BusinessManagerService;
exports.BusinessManagerService = BusinessManagerService = BusinessManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(2, (0, typeorm_1.InjectRepository)(bnpl_plan_entity_1.BnplPlan)),
    __param(3, (0, typeorm_1.InjectRepository)(bnpl_catalog_item_entity_1.BnplCatalogItem)),
    __param(4, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(5, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(6, (0, typeorm_1.InjectRepository)(sms_log_entity_1.SmsLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        approval_service_1.ApprovalService])
], BusinessManagerService);
//# sourceMappingURL=business-manager.service.js.map