import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { InstallmentStatus, SubscriptionStatus } from '../../../common/enums/status.enum';

@Injectable()
export class InstallmentsService {
  constructor(
    @InjectRepository(BnplInstallment)
    private readonly repo: Repository<BnplInstallment>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
  ) {}

  async findBySubscription(subscriptionId: string): Promise<BnplInstallment[]> {
    return this.repo.find({
      where: { subscriptionId },
      order: { dueDate: 'ASC' },
    });
  }

  async markAsPaid(
    id: string,
    paymentReference: string,
  ): Promise<BnplInstallment> {
    const installment = await this.repo.findOne({ where: { id } });
    if (!installment) {
      throw new NotFoundException('Installment not found');
    }
    installment.status = InstallmentStatus.PAID;
    installment.paidAt = new Date();
    installment.paymentReference = paymentReference;
    const saved = await this.repo.save(installment);

    await this._updateSubscriptionPaidAmount(installment.subscriptionId);
    return saved;
  }

  async listAll(filters?: {
    status?: string;
    overdue?: boolean;
  }): Promise<BnplInstallment[]> {
    const qb = this.repo.createQueryBuilder('inst');
    if (filters?.status) {
      qb.andWhere('inst.status = :status', { status: filters.status });
    }
    if (filters?.overdue) {
      qb.andWhere('inst.status = :pending', { pending: InstallmentStatus.PENDING })
        .andWhere('inst.due_date < :now', { now: new Date() });
    }
    qb.orderBy('inst.due_date', 'ASC');
    return qb.getMany();
  }

  async retryInstallment(id: string): Promise<BnplInstallment> {
    const inst = await this.repo.findOne({ where: { id } });
    if (!inst) throw new NotFoundException('Installment not found');
    if (inst.status !== InstallmentStatus.OVERDUE && !(inst.status === InstallmentStatus.PENDING && new Date(inst.dueDate) < new Date())) {
      throw new BadRequestException('Only overdue installments can be retried');
    }
    // Move due date forward
    const now = new Date();
    const newDueDate = new Date(now);
    newDueDate.setDate(newDueDate.getDate() + 7);
    inst.dueDate = newDueDate;
    inst.status = InstallmentStatus.PENDING;
    return this.repo.save(inst);
  }

  async getReconciliation(subscriptionId: string) {
    const sub = await this.subRepo.findOne({
      where: { id: subscriptionId },
      relations: { plan: { catalogItem: true }, installments: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const installments = sub.installments.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    const expectedTotal = sub.totalAmount;
    const receivedTotal = Number(sub.amountPaid);
    const outstanding = expectedTotal - receivedTotal;
    const paidInstallments = installments.filter((i) => i.status === InstallmentStatus.PAID);
    const pendingInstallments = installments.filter((i) => i.status === InstallmentStatus.PENDING);
    const overdueInstallments = installments.filter(
      (i) => i.status === InstallmentStatus.PENDING && new Date(i.dueDate) < new Date(),
    );

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
        isOverdue: i.status === InstallmentStatus.PENDING && new Date(i.dueDate) < new Date(),
      })),
    };
  }

  private async _updateSubscriptionPaidAmount(subscriptionId: string) {
    const paidInst = await this.repo.find({
      where: { subscriptionId, status: InstallmentStatus.PAID },
    });
    const totalPaid = paidInst.reduce((sum, i) => sum + Number(i.amount), 0);
    await this.subRepo.update(subscriptionId, { amountPaid: totalPaid });

    // Auto-complete if fully paid
    const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
    if (sub && totalPaid >= Number(sub.totalAmount)) {
      sub.status = SubscriptionStatus.SETTLED;
      sub.settledAt = new Date();
      await this.subRepo.save(sub);
    }
  }
}
