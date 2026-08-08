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
exports.InstallmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bnpl_installment_entity_1 = require("../entities/bnpl-installment.entity");
const bnpl_subscription_entity_1 = require("../entities/bnpl-subscription.entity");
const status_enum_1 = require("../../../common/enums/status.enum");
let InstallmentsService = class InstallmentsService {
    repo;
    subRepo;
    constructor(repo, subRepo) {
        this.repo = repo;
        this.subRepo = subRepo;
    }
    async findBySubscription(subscriptionId) {
        return this.repo.find({
            where: { subscriptionId },
            order: { dueDate: 'ASC' },
        });
    }
    async markAsPaid(id, paymentReference) {
        const installment = await this.repo.findOne({ where: { id } });
        if (!installment) {
            throw new common_1.NotFoundException('Installment not found');
        }
        installment.status = status_enum_1.InstallmentStatus.PAID;
        installment.paidAt = new Date();
        installment.paymentReference = paymentReference;
        const saved = await this.repo.save(installment);
        await this._updateSubscriptionPaidAmount(installment.subscriptionId);
        return saved;
    }
    async listAll(filters) {
        const qb = this.repo.createQueryBuilder('inst');
        if (filters?.status) {
            qb.andWhere('inst.status = :status', { status: filters.status });
        }
        if (filters?.overdue) {
            qb.andWhere('inst.status = :pending', { pending: status_enum_1.InstallmentStatus.PENDING })
                .andWhere('inst.due_date < :now', { now: new Date() });
        }
        qb.orderBy('inst.due_date', 'ASC');
        return qb.getMany();
    }
    async retryInstallment(id) {
        const inst = await this.repo.findOne({ where: { id } });
        if (!inst)
            throw new common_1.NotFoundException('Installment not found');
        if (inst.status !== status_enum_1.InstallmentStatus.OVERDUE && !(inst.status === status_enum_1.InstallmentStatus.PENDING && new Date(inst.dueDate) < new Date())) {
            throw new common_1.BadRequestException('Only overdue installments can be retried');
        }
        const now = new Date();
        const newDueDate = new Date(now);
        newDueDate.setDate(newDueDate.getDate() + 7);
        inst.dueDate = newDueDate;
        inst.status = status_enum_1.InstallmentStatus.PENDING;
        return this.repo.save(inst);
    }
    async getReconciliation(subscriptionId) {
        const sub = await this.subRepo.findOne({
            where: { id: subscriptionId },
            relations: { plan: { catalogItem: true }, installments: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        const installments = sub.installments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const expectedTotal = sub.totalAmount;
        const receivedTotal = Number(sub.amountPaid);
        const outstanding = expectedTotal - receivedTotal;
        const paidInstallments = installments.filter((i) => i.status === status_enum_1.InstallmentStatus.PAID);
        const pendingInstallments = installments.filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING);
        const overdueInstallments = installments.filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING && new Date(i.dueDate) < new Date());
        return {
            subscriptionId: sub.id,
            catalogItem: sub.plan?.catalogItem?.name,
            status: sub.status,
            expectedTotal,
            receivedTotal,
            outstanding,
            paidCount: paidInstallments.length,
            pendingCount: pendingInstallments.length,
            overdueCount: overdueInstallments.length,
            totalInstallments: installments.length,
            installments: installments.map((i) => ({
                id: i.id,
                dueDate: i.dueDate,
                amount: i.amount,
                status: i.status,
                paidAt: i.paidAt,
                paymentReference: i.paymentReference,
                isOverdue: i.status === status_enum_1.InstallmentStatus.PENDING && new Date(i.dueDate) < new Date(),
            })),
        };
    }
    async _updateSubscriptionPaidAmount(subscriptionId) {
        const paidInst = await this.repo.find({
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
exports.InstallmentsService = InstallmentsService;
exports.InstallmentsService = InstallmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], InstallmentsService);
//# sourceMappingURL=installments.service.js.map