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
exports.CollectionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bnpl_installment_entity_1 = require("../entities/bnpl-installment.entity");
const bnpl_subscription_entity_1 = require("../entities/bnpl-subscription.entity");
const collection_priority_entity_1 = require("../entities/collection-priority.entity");
const exception_case_entity_1 = require("../entities/exception-case.entity");
const collection_playbook_entity_1 = require("../entities/collection-playbook.entity");
const exception_reason_entity_1 = require("../entities/exception-reason.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const status_enum_1 = require("../../../common/enums/status.enum");
let CollectionsService = class CollectionsService {
    instRepo;
    subRepo;
    priorityRepo;
    exceptionRepo;
    reasonRepo;
    playbookRepo;
    auditRepo;
    constructor(instRepo, subRepo, priorityRepo, exceptionRepo, reasonRepo, playbookRepo, auditRepo) {
        this.instRepo = instRepo;
        this.subRepo = subRepo;
        this.priorityRepo = priorityRepo;
        this.exceptionRepo = exceptionRepo;
        this.reasonRepo = reasonRepo;
        this.playbookRepo = playbookRepo;
        this.auditRepo = auditRepo;
    }
    async getDelinquencyCohorts() {
        const now = new Date();
        const allPending = await this.instRepo
            .createQueryBuilder('i')
            .where('i.status = :status', { status: status_enum_1.InstallmentStatus.PENDING })
            .andWhere('i.due_date < :now', { now })
            .getMany();
        const buckets = [
            { label: '1–30 days', minDays: 1, maxDays: 30, count: 0, totalAmount: 0, installments: [] },
            { label: '31–60 days', minDays: 31, maxDays: 60, count: 0, totalAmount: 0, installments: [] },
            { label: '61–90 days', minDays: 61, maxDays: 90, count: 0, totalAmount: 0, installments: [] },
            { label: '90+ days', minDays: 91, maxDays: Infinity, count: 0, totalAmount: 0, installments: [] },
        ];
        for (const inst of allPending) {
            const daysLate = Math.floor((now.getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            const bucket = buckets.find((b) => daysLate >= b.minDays && daysLate <= b.maxDays);
            if (bucket) {
                bucket.count++;
                bucket.totalAmount += Number(inst.amount);
                bucket.installments.push({
                    id: inst.id,
                    subscriptionId: inst.subscriptionId,
                    dueDate: inst.dueDate,
                    amount: Number(inst.amount),
                    daysLate,
                });
            }
        }
        const totalDelinquent = buckets.reduce((s, b) => s + b.totalAmount, 0);
        const totalActive = await this.subRepo
            .createQueryBuilder('s')
            .where('s.status = :status', { status: 'active_repayment' })
            .select('SUM(s.total_amount)', 'total')
            .getRawOne();
        return {
            cohorts: buckets,
            totalDelinquentAmount: totalDelinquent,
            totalActivePrincipal: Number(totalActive?.total || 0),
            delinquencyRate: Number(totalActive?.total || 0) > 0 ? totalDelinquent / Number(totalActive?.total || 0) : 0,
            asOf: now,
        };
    }
    async assignPriority(entityType, entityId, priority, reason, assignedBy) {
        const existing = await this.priorityRepo.findOne({ where: { entityType, entityId } });
        if (existing) {
            existing.priority = priority;
            existing.reason = reason;
            existing.assignedBy = assignedBy;
            return this.priorityRepo.save(existing);
        }
        return this.priorityRepo.save({
            entityType,
            entityId,
            priority,
            reason,
            assignedBy,
        });
    }
    async getPriorities(entityType) {
        const where = {};
        if (entityType)
            where.entityType = entityType;
        return this.priorityRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async getExceptionReasons() {
        return this.reasonRepo.find({ where: { status: 'active' } });
    }
    async createExceptionCase(data) {
        const reason = await this.reasonRepo.findOne({ where: { id: data.reasonId } });
        if (!reason)
            throw new common_1.NotFoundException('Exception reason not found');
        const exceptionCase = await this.exceptionRepo.save({
            subscriptionId: data.subscriptionId,
            reasonId: data.reasonId,
            description: data.description,
            createdBy: data.createdBy,
            assignedTo: data.assignedTo,
        });
        await this.auditRepo.save({
            entityType: 'exception_case',
            entityId: exceptionCase.id,
            action: 'exception_case_created',
            performedBy: data.createdBy,
            changes: { reasonId: { from: null, to: data.reasonId }, subscriptionId: { from: null, to: data.subscriptionId } },
            reason: data.description || 'Exception case created',
        });
        return exceptionCase;
    }
    async resolveExceptionCase(id, resolution, resolvedBy) {
        const ec = await this.exceptionRepo.findOne({ where: { id } });
        if (!ec)
            throw new common_1.NotFoundException('Exception case not found');
        ec.status = exception_case_entity_1.ExceptionCaseStatus.RESOLVED;
        ec.resolution = resolution;
        ec.resolvedAt = new Date();
        const saved = await this.exceptionRepo.save(ec);
        await this.auditRepo.save({
            entityType: 'exception_case',
            entityId: id,
            action: 'exception_case_resolved',
            performedBy: resolvedBy,
            changes: { status: { from: ec.status, to: exception_case_entity_1.ExceptionCaseStatus.RESOLVED }, resolution: { from: null, to: resolution } },
            reason: resolution,
        });
        return saved;
    }
    async getExceptionCases(filters) {
        const where = {};
        if (filters?.status)
            where.status = filters.status;
        if (filters?.subscriptionId)
            where.subscriptionId = filters.subscriptionId;
        return this.exceptionRepo.find({ where, order: { createdAt: 'DESC' } });
    }
    async getPlaybooks(triggerEvent) {
        const where = { status: 'active' };
        if (triggerEvent)
            where.triggerEvent = triggerEvent;
        return this.playbookRepo.find({ where, order: { title: 'ASC' } });
    }
    async getRecommendedActions(subscriptionId) {
        const sub = await this.subRepo.findOne({
            where: { id: subscriptionId },
            relations: { installments: true },
        });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        const pendingInsts = (sub.installments || []).filter((i) => i.status === status_enum_1.InstallmentStatus.PENDING);
        const overdueInsts = pendingInsts.filter((i) => new Date(i.dueDate) < new Date());
        const hasPriorDelinquency = await this.auditRepo.count({
            where: { entityId: subscriptionId, action: 'repayment_retry' },
        });
        let trigger;
        if (overdueInsts.length > 0 && hasPriorDelinquency > 0) {
            trigger = collection_playbook_entity_1.PlaybookTrigger.REPEATED_DELINQUENCY;
        }
        else if (overdueInsts.length > 0) {
            trigger = collection_playbook_entity_1.PlaybookTrigger.FIRST_DELINQUENCY;
        }
        else {
            trigger = collection_playbook_entity_1.PlaybookTrigger.PAYMENT_FAILURE;
        }
        const playbooks = await this.playbookRepo.find({
            where: { triggerEvent: trigger, status: 'active' },
        });
        return {
            subscriptionId,
            trigger,
            overdueCount: overdueInsts.length,
            totalOverdueAmount: overdueInsts.reduce((s, i) => s + Number(i.amount), 0),
            priorRetries: hasPriorDelinquency,
            playbooks: playbooks.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                recommendedActions: p.recommendedActions,
                requiresApproval: p.requiresApproval,
            })),
        };
    }
    async seedPlaybooks() {
        const existing = await this.playbookRepo.count();
        if (existing > 0)
            return { seeded: false, count: existing };
        const playbooks = [
            {
                title: 'First Delinquency — Gentle Reminder',
                description: 'For customers who missed their first payment.',
                triggerEvent: collection_playbook_entity_1.PlaybookTrigger.FIRST_DELINQUENCY,
                recommendedActions: [
                    { step: 1, action: 'Send SMS/email payment reminder', note: 'Include late fee warning' },
                    { step: 2, action: 'Apply late fee if grace period expired', note: 'Per plan config' },
                    { step: 3, action: 'Flag for review if unpaid after 7 days', note: 'Escalate to collections' },
                ],
                requiresApproval: false,
            },
            {
                title: 'Repeated Delinquency — Escalation',
                description: 'Repeat offenders need stricter action.',
                triggerEvent: collection_playbook_entity_1.PlaybookTrigger.REPEATED_DELINQUENCY,
                recommendedActions: [
                    { step: 1, action: 'Send escalation notice with final payment deadline', note: '7-day final notice' },
                    { step: 2, action: 'Suspend future BNPL access', note: 'Requires approval' },
                    { step: 3, action: 'Assign collection priority flag', note: 'Set to HIGH or CRITICAL' },
                    { step: 4, action: 'Consider legal / third-party collection', note: 'Escalate to supervisor' },
                ],
                requiresApproval: true,
            },
            {
                title: 'Payment Failure — Technical Retry',
                description: 'When a payment attempt fails at the processor.',
                triggerEvent: collection_playbook_entity_1.PlaybookTrigger.PAYMENT_FAILURE,
                recommendedActions: [
                    { step: 1, action: 'Verify provider error code and reason', note: 'Check webhook logs' },
                    { step: 2, action: 'Retry payment with same provider', note: 'Safe retry up to 3x' },
                    { step: 3, action: 'Offer alternative payment method', note: 'Manual override if needed' },
                ],
                requiresApproval: false,
            },
            {
                title: 'High-Risk Account — Immediate Review',
                description: 'Triggered when risk flags or exception cases indicate high risk.',
                triggerEvent: collection_playbook_entity_1.PlaybookTrigger.HIGH_RISK,
                recommendedActions: [
                    { step: 1, action: 'Full account review by risk team', note: 'Check payment history' },
                    { step: 2, action: 'Place temporary hold on new orders', note: 'Requires supervisor approval' },
                    { step: 3, action: 'Create exception case documenting rationale', note: 'Template-driven' },
                    { step: 4, action: 'Determine if write-off or restructuring needed', note: 'Supervisor decision' },
                ],
                requiresApproval: true,
            },
        ];
        await this.playbookRepo.save(playbooks);
        return { seeded: true, count: playbooks.length };
    }
};
exports.CollectionsService = CollectionsService;
exports.CollectionsService = CollectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(1, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(2, (0, typeorm_1.InjectRepository)(collection_priority_entity_1.CollectionPriority)),
    __param(3, (0, typeorm_1.InjectRepository)(exception_case_entity_1.ExceptionCase)),
    __param(4, (0, typeorm_1.InjectRepository)(exception_reason_entity_1.ExceptionReason)),
    __param(5, (0, typeorm_1.InjectRepository)(collection_playbook_entity_1.CollectionPlaybook)),
    __param(6, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CollectionsService);
//# sourceMappingURL=collections.service.js.map