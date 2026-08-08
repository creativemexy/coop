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
exports.CollectionQueueService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const collection_queue_entity_1 = require("../entities/collection-queue.entity");
const bnpl_subscription_entity_1 = require("../entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../entities/bnpl-installment.entity");
const status_enum_1 = require("../../../common/enums/status.enum");
let CollectionQueueService = class CollectionQueueService {
    queueRepo;
    subRepo;
    instRepo;
    constructor(queueRepo, subRepo, instRepo) {
        this.queueRepo = queueRepo;
        this.subRepo = subRepo;
        this.instRepo = instRepo;
    }
    async addToQueue(subscriptionId, assignedBy) {
        const sub = await this.subRepo.findOne({
            where: { id: subscriptionId },
            relations: { installments: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        const existing = await this.queueRepo.findOne({ where: { subscriptionId } });
        if (existing)
            return existing;
        const overdueInsts = (sub.installments || []).filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING && new Date(i.dueDate) < new Date());
        const now = new Date();
        const daysOverdue = overdueInsts.length > 0
            ? Math.max(...overdueInsts.map((i) => Math.floor((now.getTime() - new Date(i.dueDate).getTime()) / 86400000)))
            : 0;
        const totalOverdueAmount = overdueInsts.reduce((s, i) => s + Number(i.amount), 0);
        const outstandingPrincipal = Number(sub.totalAmount) - Number(sub.amountPaid);
        let priority = collection_queue_entity_1.QueuePriority.LOW;
        if (daysOverdue > 90)
            priority = collection_queue_entity_1.QueuePriority.CRITICAL;
        else if (daysOverdue > 60)
            priority = collection_queue_entity_1.QueuePriority.HIGH;
        else if (daysOverdue > 30)
            priority = collection_queue_entity_1.QueuePriority.MEDIUM;
        const entry = this.queueRepo.create({
            subscriptionId,
            userId: sub.userId,
            status: collection_queue_entity_1.QueueStatus.PENDING,
            priority,
            daysOverdue,
            totalOverdueAmount,
            outstandingPrincipal,
            assignedBy,
        });
        return this.queueRepo.save(entry);
    }
    async listQueued(filters) {
        const qb = this.queueRepo.createQueryBuilder('q');
        if (filters?.status)
            qb.andWhere('q.status = :status', { status: filters.status });
        if (filters?.priority)
            qb.andWhere('q.priority = :priority', { priority: filters.priority });
        if (filters?.assignedTo)
            qb.andWhere('q.assigned_to = :assignedTo', { assignedTo: filters.assignedTo });
        qb.orderBy('q.priority', 'ASC').addOrderBy('q.days_overdue', 'DESC');
        return qb.getMany();
    }
    async updateStatus(id, status, note) {
        const entry = await this.queueRepo.findOne({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Queue entry not found');
        entry.status = status;
        if (note)
            entry.agentNote = note;
        if (status === collection_queue_entity_1.QueueStatus.CONTACTED)
            entry.lastContactedAt = new Date();
        if (status === collection_queue_entity_1.QueueStatus.RESOLVED || status === collection_queue_entity_1.QueueStatus.CLOSED)
            entry.resolvedAt = new Date();
        return this.queueRepo.save(entry);
    }
    async assignTo(id, assignedTo) {
        const entry = await this.queueRepo.findOne({ where: { id } });
        if (!entry)
            throw new common_1.NotFoundException('Queue entry not found');
        entry.assignedTo = assignedTo;
        return this.queueRepo.save(entry);
    }
    async getAgingSummary() {
        const all = await this.queueRepo.find();
        const now = new Date();
        const buckets = [
            { label: '0–30 days', min: 0, max: 30, count: 0, totalAmount: 0 },
            { label: '31–60 days', min: 31, max: 60, count: 0, totalAmount: 0 },
            { label: '61–90 days', min: 61, max: 90, count: 0, totalAmount: 0 },
            { label: '90+ days', min: 91, max: Infinity, count: 0, totalAmount: 0 },
        ];
        for (const entry of all) {
            const actualDays = entry.daysOverdue > 0 ? entry.daysOverdue : Math.floor((now.getTime() - new Date(entry.createdAt).getTime()) / 86400000);
            const bucket = buckets.find((b) => actualDays >= b.min && actualDays <= b.max);
            if (bucket) {
                bucket.count++;
                bucket.totalAmount += Number(entry.totalOverdueAmount);
            }
        }
        return buckets;
    }
};
exports.CollectionQueueService = CollectionQueueService;
exports.CollectionQueueService = CollectionQueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(collection_queue_entity_1.CollectionQueue)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(2, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CollectionQueueService);
//# sourceMappingURL=collection-queue.service.js.map