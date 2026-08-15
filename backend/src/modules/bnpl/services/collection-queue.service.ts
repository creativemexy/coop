import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionQueue, QueueStatus, QueuePriority } from '../entities/collection-queue.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { InstallmentStatus, SubscriptionStatus } from '../../../common/enums/status.enum';

@Injectable()
export class CollectionQueueService {
  constructor(
    @InjectRepository(CollectionQueue)
    private readonly queueRepo: Repository<CollectionQueue>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
  ) {}

  async addToQueue(subscriptionId: string, assignedBy: string) {
    const sub = await this.subRepo.findOne({
      where: { id: subscriptionId },
      relations: { installments: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const existing = await this.queueRepo.findOne({ where: { subscriptionId } });
    if (existing) return existing;

    const overdueInsts = (sub.installments || []).filter(
      (i) => i.status === InstallmentStatus.PENDING && new Date(i.dueDate) < new Date(),
    );

    const now = new Date();
    const daysOverdue = overdueInsts.length > 0
      ? Math.max(...overdueInsts.map((i) => Math.floor((now.getTime() - new Date(i.dueDate).getTime()) / 86400000)))
      : 0;

    const totalOverdueAmount = overdueInsts.reduce((s, i) => s + Number(i.amount), 0);
    const outstandingPrincipal = Number(sub.totalAmount) - Number(sub.amountPaid);

    let priority = QueuePriority.LOW;
    if (daysOverdue > 90) priority = QueuePriority.CRITICAL;
    else if (daysOverdue > 60) priority = QueuePriority.HIGH;
    else if (daysOverdue > 30) priority = QueuePriority.MEDIUM;

    const entry = this.queueRepo.create({
      subscriptionId,
      userId: sub.userId,
      status: QueueStatus.PENDING,
      priority,
      daysOverdue,
      totalOverdueAmount,
      outstandingPrincipal,
      assignedBy,
    });
    return this.queueRepo.save(entry);
  }

  async listQueued(filters?: { status?: string; priority?: string; assignedTo?: string }) {
    const qb = this.queueRepo.createQueryBuilder('q');
    if (filters?.status) qb.andWhere('q.status = :status', { status: filters.status });
    if (filters?.priority) qb.andWhere('q.priority = :priority', { priority: filters.priority });
    if (filters?.assignedTo) qb.andWhere('q.assigned_to = :assignedTo', { assignedTo: filters.assignedTo });
    qb.orderBy('q.priority', 'ASC').addOrderBy('q.days_overdue', 'DESC');
    return qb.getMany();
  }

  async updateStatus(id: string, status: QueueStatus, note?: string) {
    const entry = await this.queueRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Queue entry not found');

    entry.status = status;
    if (note) entry.agentNote = note;
    if (status === QueueStatus.CONTACTED) entry.lastContactedAt = new Date();
    if (status === QueueStatus.RESOLVED || status === QueueStatus.CLOSED) entry.resolvedAt = new Date();
    return this.queueRepo.save(entry);
  }

  async assignTo(id: string, assignedTo: string) {
    const entry = await this.queueRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Queue entry not found');
    entry.assignedTo = assignedTo;
    return this.queueRepo.save(entry);
  }

  async getAgingSummary() {
    interface AgingRow { label: string; count: string; total_amount: string }
    const rows: AgingRow[] = await this.queueRepo.manager.query(
      `SELECT CASE
                WHEN actual_days BETWEEN 0 AND 30 THEN '0–30 days'
                WHEN actual_days BETWEEN 31 AND 60 THEN '31–60 days'
                WHEN actual_days BETWEEN 61 AND 90 THEN '61–90 days'
                ELSE '90+ days'
              END AS label,
              COUNT(*)::text AS count,
              COALESCE(SUM(total_overdue_amount), 0)::text AS total_amount
       FROM (
         SELECT total_overdue_amount,
                CASE WHEN days_overdue > 0 THEN days_overdue
                     ELSE FLOOR(EXTRACT(EPOCH FROM (now() - created_at)) / 86400)
                END AS actual_days
         FROM bnpl_collection_queues
       ) t
       GROUP BY label`,
    );

    const byLabel = new Map(rows.map((r) => [r.label, r]));
    const labels = ['0–30 days', '31–60 days', '61–90 days', '90+ days'];
    return labels.map((label) => {
      const row = byLabel.get(label);
      return {
        label,
        count: row ? Number(row.count) : 0,
        totalAmount: row ? Number(row.total_amount) : 0,
      };
    });
  }
}
