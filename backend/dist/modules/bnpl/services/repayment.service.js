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
exports.RepaymentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bnpl_installment_entity_1 = require("../entities/bnpl-installment.entity");
const bnpl_subscription_entity_1 = require("../entities/bnpl-subscription.entity");
const payment_entity_1 = require("../../payments/entities/payment.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const status_enum_1 = require("../../../common/enums/status.enum");
let RepaymentService = class RepaymentService {
    instRepo;
    subRepo;
    paymentRepo;
    auditRepo;
    constructor(instRepo, subRepo, paymentRepo, auditRepo) {
        this.instRepo = instRepo;
        this.subRepo = subRepo;
        this.paymentRepo = paymentRepo;
        this.auditRepo = auditRepo;
    }
    async getRepaymentSchedule(orderId) {
        const sub = await this.subRepo.findOne({
            where: { id: orderId },
            relations: { plan: { catalogItem: true }, installments: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('Order not found');
        const payments = await this.paymentRepo.find({
            where: { subscriptionId: orderId },
            order: { createdAt: 'DESC' },
        });
        const installments = (sub.installments || []).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        return {
            orderId: sub.id,
            catalogItem: sub.plan?.catalogItem?.name,
            totalAmount: Number(sub.totalAmount),
            amountPaid: Number(sub.amountPaid),
            outstanding: Number(sub.totalAmount) - Number(sub.amountPaid),
            status: sub.status,
            installments: installments.map((inst) => ({
                id: inst.id,
                dueDate: inst.dueDate,
                amount: Number(inst.amount),
                lateFee: Number(inst.lateFeeAmount),
                status: inst.status,
                paidAt: inst.paidAt,
                paymentReference: inst.paymentReference,
                gracePeriodEnd: inst.gracePeriodEnd,
                isOverdue: inst.status === status_enum_1.InstallmentStatus.PENDING && new Date(inst.dueDate) < new Date(),
                daysLate: inst.status === status_enum_1.InstallmentStatus.PENDING
                    ? Math.max(0, Math.floor((Date.now() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
                    : 0,
            })),
            paymentAttempts: payments.map((p) => ({
                id: p.id,
                amount: Number(p.amount),
                provider: p.provider,
                providerReference: p.providerReference,
                status: p.status,
                createdAt: p.createdAt,
                metadata: p.metadata,
            })),
        };
    }
    async safeRetry(installmentId, performedBy) {
        const inst = await this.instRepo.findOne({ where: { id: installmentId } });
        if (!inst)
            throw new common_1.NotFoundException('Installment not found');
        if (inst.status === status_enum_1.InstallmentStatus.PAID) {
            throw new common_1.BadRequestException('Installment is already paid');
        }
        if (inst.status !== status_enum_1.InstallmentStatus.OVERDUE && !(inst.status === status_enum_1.InstallmentStatus.PENDING && new Date(inst.dueDate) < new Date())) {
            throw new common_1.BadRequestException('Only overdue/delinquent installments can be retried');
        }
        const now = new Date();
        const newDueDate = new Date(now);
        newDueDate.setDate(newDueDate.getDate() + 7);
        inst.dueDate = newDueDate;
        inst.status = status_enum_1.InstallmentStatus.PENDING;
        const saved = await this.instRepo.save(inst);
        await this.auditRepo.save({
            entityType: 'installment',
            entityId: installmentId,
            action: 'repayment_retry',
            performedBy,
            changes: { dueDate: { from: inst.dueDate, to: newDueDate }, status: { from: inst.status, to: status_enum_1.InstallmentStatus.PENDING } },
            reason: 'Safe retry of overdue installment',
        });
        return saved;
    }
    async reconcile(installmentId, data, performedBy) {
        const inst = await this.instRepo.findOne({ where: { id: installmentId } });
        if (!inst)
            throw new common_1.NotFoundException('Installment not found');
        const changes = {};
        if (data.status && data.status !== inst.status) {
            changes.status = { from: inst.status, to: data.status };
            inst.status = data.status;
        }
        if (data.paymentReference) {
            changes.paymentReference = { from: inst.paymentReference, to: data.paymentReference };
            inst.paymentReference = data.paymentReference;
        }
        if (data.paidAt) {
            changes.paidAt = { from: inst.paidAt, to: data.paidAt };
            inst.paidAt = data.paidAt;
        }
        if (data.status === status_enum_1.InstallmentStatus.PAID && !inst.paidAt) {
            inst.paidAt = new Date();
            changes.paidAt = { from: null, to: inst.paidAt };
        }
        if (Object.keys(changes).length === 0) {
            throw new common_1.BadRequestException('No changes to reconcile');
        }
        const saved = await this.instRepo.save(inst);
        if (inst.status === status_enum_1.InstallmentStatus.PAID) {
            await this._updateSubscriptionPaidAmount(inst.subscriptionId);
        }
        await this.auditRepo.save({
            entityType: 'installment',
            entityId: installmentId,
            action: 'repayment_reconcile',
            performedBy,
            changes,
            reason: data.note || 'Manual reconciliation',
        });
        return saved;
    }
    async updateMetadata(installmentId, metadata, performedBy) {
        const inst = await this.instRepo.findOne({ where: { id: installmentId } });
        if (!inst)
            throw new common_1.NotFoundException('Installment not found');
        const allowedFields = ['lateFeeAmount', 'gracePeriodEnd'];
        const changes = {};
        for (const key of Object.keys(metadata)) {
            if (!allowedFields.includes(key)) {
                throw new common_1.ForbiddenException(`Field '${key}' cannot be modified via metadata correction`);
            }
            changes[key] = { from: inst[key], to: metadata[key] };
            inst[key] = metadata[key];
        }
        const saved = await this.instRepo.save(inst);
        await this.auditRepo.save({
            entityType: 'installment',
            entityId: installmentId,
            action: 'repayment_metadata_update',
            performedBy,
            changes,
            reason: 'Metadata correction',
        });
        return saved;
    }
    async handlePartialPayment(installmentId, amount, paymentReference, performedBy) {
        const inst = await this.instRepo.findOne({ where: { id: installmentId } });
        if (!inst)
            throw new common_1.NotFoundException('Installment not found');
        if (inst.status === status_enum_1.InstallmentStatus.PAID) {
            throw new common_1.BadRequestException('Installment is already fully paid');
        }
        const instAmount = Number(inst.amount);
        if (amount <= 0) {
            throw new common_1.BadRequestException('Partial amount must be positive');
        }
        const remaining = instAmount - amount;
        if (remaining <= 0) {
            inst.status = status_enum_1.InstallmentStatus.PAID;
            inst.paidAt = new Date();
            inst.paymentReference = paymentReference;
        }
        else {
            inst.paymentReference = paymentReference;
        }
        const saved = await this.instRepo.save(inst);
        await this._updateSubscriptionPaidAmount(inst.subscriptionId);
        await this.auditRepo.save({
            entityType: 'installment',
            entityId: installmentId,
            action: 'repayment_partial',
            performedBy,
            changes: {
                amount: { from: instAmount, to: amount },
                status: { from: inst.status === status_enum_1.InstallmentStatus.PAID ? 'pending' : inst.status, to: inst.status },
                paymentReference: { from: null, to: paymentReference },
            },
            reason: `Partial payment of ₦${amount} applied`,
        });
        return saved;
    }
    async _updateSubscriptionPaidAmount(subscriptionId) {
        const paidInst = await this.instRepo.find({
            where: { subscriptionId, status: status_enum_1.InstallmentStatus.PAID },
        });
        const totalPaid = paidInst.reduce((sum, i) => sum + Number(i.amount), 0);
        await this.subRepo.update(subscriptionId, { amountPaid: totalPaid });
        const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
        if (sub && totalPaid >= Number(sub.totalAmount)) {
            sub.status = status_enum_1.SubscriptionStatus.SETTLED;
            sub.settledAt = new Date();
            await this.subRepo.save(sub);
        }
    }
};
exports.RepaymentService = RepaymentService;
exports.RepaymentService = RepaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RepaymentService);
//# sourceMappingURL=repayment.service.js.map