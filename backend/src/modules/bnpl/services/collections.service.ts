import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { CollectionPriority, PriorityLevel, PriorityEntityType } from '../entities/collection-priority.entity';
import { ExceptionCase, ExceptionCaseStatus } from '../entities/exception-case.entity';
import { CollectionPlaybook, PlaybookTrigger } from '../entities/collection-playbook.entity';
import { ExceptionReason } from '../entities/exception-reason.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { InstallmentStatus } from '../../../common/enums/status.enum';

export interface CohortBucket {
  label: string;
  minDays: number;
  maxDays: number;
  count: number;
  totalAmount: number;
  installments: { id: string; subscriptionId: string; dueDate: Date; amount: number; daysLate: number }[];
}

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(CollectionPriority)
    private readonly priorityRepo: Repository<CollectionPriority>,
    @InjectRepository(ExceptionCase)
    private readonly exceptionRepo: Repository<ExceptionCase>,
    @InjectRepository(ExceptionReason)
    private readonly reasonRepo: Repository<ExceptionReason>,
    @InjectRepository(CollectionPlaybook)
    private readonly playbookRepo: Repository<CollectionPlaybook>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async getDelinquencyCohorts() {
    const now = new Date();
    const allPending = await this.instRepo
      .createQueryBuilder('i')
      .where('i.status = :status', { status: InstallmentStatus.PENDING })
      .andWhere('i.due_date < :now', { now })
      .getMany();

    const buckets: CohortBucket[] = [
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
      .getRawOne<{ total: string }>();

    return {
      cohorts: buckets,
      totalDelinquentAmount: totalDelinquent,
      totalActivePrincipal: Number(totalActive?.total || 0),
      delinquencyRate: Number(totalActive?.total || 0) > 0 ? totalDelinquent / Number(totalActive?.total || 0) : 0,
      asOf: now,
    };
  }

  async assignPriority(entityType: PriorityEntityType, entityId: string, priority: PriorityLevel, reason: string, assignedBy: string) {
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
    } as CollectionPriority);
  }

  async getPriorities(entityType?: PriorityEntityType) {
    const where: any = {};
    if (entityType) where.entityType = entityType;
    return this.priorityRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getExceptionReasons() {
    return this.reasonRepo.find({ where: { status: 'active' } });
  }

  async createExceptionCase(data: {
    subscriptionId: string;
    reasonId: string;
    description?: string;
    createdBy: string;
    assignedTo?: string;
  }) {
    const reason = await this.reasonRepo.findOne({ where: { id: data.reasonId } });
    if (!reason) throw new NotFoundException('Exception reason not found');

    const exceptionCase = await this.exceptionRepo.save({
      subscriptionId: data.subscriptionId,
      reasonId: data.reasonId,
      description: data.description,
      createdBy: data.createdBy,
      assignedTo: data.assignedTo,
    } as ExceptionCase);

    await this.auditRepo.save({
      entityType: 'exception_case',
      entityId: exceptionCase.id,
      action: 'exception_case_created',
      performedBy: data.createdBy,
      changes: { reasonId: { from: null, to: data.reasonId }, subscriptionId: { from: null, to: data.subscriptionId } },
      reason: data.description || 'Exception case created',
    } as unknown as AuditLog);

    return exceptionCase;
  }

  async resolveExceptionCase(id: string, resolution: string, resolvedBy: string) {
    const ec = await this.exceptionRepo.findOne({ where: { id } });
    if (!ec) throw new NotFoundException('Exception case not found');

    ec.status = ExceptionCaseStatus.RESOLVED;
    ec.resolution = resolution;
    ec.resolvedAt = new Date();
    const saved = await this.exceptionRepo.save(ec);

    await this.auditRepo.save({
      entityType: 'exception_case',
      entityId: id,
      action: 'exception_case_resolved',
      performedBy: resolvedBy,
      changes: { status: { from: ec.status, to: ExceptionCaseStatus.RESOLVED }, resolution: { from: null, to: resolution } },
      reason: resolution,
    } as unknown as AuditLog);

    return saved;
  }

  async getExceptionCases(filters?: { status?: ExceptionCaseStatus; subscriptionId?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.subscriptionId) where.subscriptionId = filters.subscriptionId;
    return this.exceptionRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getPlaybooks(triggerEvent?: PlaybookTrigger) {
    const where: any = { status: 'active' };
    if (triggerEvent) where.triggerEvent = triggerEvent;
    return this.playbookRepo.find({ where, order: { title: 'ASC' } });
  }

  async getRecommendedActions(subscriptionId: string) {
    const sub = await this.subRepo.findOne({
      where: { id: subscriptionId },
      relations: { installments: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const pendingInsts = (sub.installments || []).filter(
      (i) => i.status === InstallmentStatus.PENDING,
    );
    const overdueInsts = pendingInsts.filter(
      (i) => new Date(i.dueDate) < new Date(),
    );
    const hasPriorDelinquency = await this.auditRepo.count({
      where: { entityId: subscriptionId, action: 'repayment_retry' },
    });

    let trigger: PlaybookTrigger;
    if (overdueInsts.length > 0 && hasPriorDelinquency > 0) {
      trigger = PlaybookTrigger.REPEATED_DELINQUENCY;
    } else if (overdueInsts.length > 0) {
      trigger = PlaybookTrigger.FIRST_DELINQUENCY;
    } else {
      trigger = PlaybookTrigger.PAYMENT_FAILURE;
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
    if (existing > 0) return { seeded: false, count: existing };

    const playbooks = [
      {
        title: 'First Delinquency — Gentle Reminder',
        description: 'For customers who missed their first payment.',
        triggerEvent: PlaybookTrigger.FIRST_DELINQUENCY,
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
        triggerEvent: PlaybookTrigger.REPEATED_DELINQUENCY,
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
        triggerEvent: PlaybookTrigger.PAYMENT_FAILURE,
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
        triggerEvent: PlaybookTrigger.HIGH_RISK,
        recommendedActions: [
          { step: 1, action: 'Full account review by risk team', note: 'Check payment history' },
          { step: 2, action: 'Place temporary hold on new orders', note: 'Requires supervisor approval' },
          { step: 3, action: 'Create exception case documenting rationale', note: 'Template-driven' },
          { step: 4, action: 'Determine if write-off or restructuring needed', note: 'Supervisor decision' },
        ],
        requiresApproval: true,
      },
    ];

    await this.playbookRepo.save(playbooks as CollectionPlaybook[]);
    return { seeded: true, count: playbooks.length };
  }
}
