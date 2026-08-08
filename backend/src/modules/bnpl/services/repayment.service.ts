import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { InstallmentStatus, SubscriptionStatus, PaymentStatus } from '../../../common/enums/status.enum';

@Injectable()
export class RepaymentService {
  constructor(
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async getRepaymentSchedule(orderId: string) {
    const sub = await this.subRepo.findOne({
      where: { id: orderId },
      relations: { plan: { catalogItem: true }, installments: true },
    });
    if (!sub) throw new NotFoundException('Order not found');

    const payments = await this.paymentRepo.find({
      where: { subscriptionId: orderId },
      order: { createdAt: 'DESC' },
    });

    const installments = (sub.installments || []).sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

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
        isOverdue: inst.status === InstallmentStatus.PENDING && new Date(inst.dueDate) < new Date(),
        daysLate: inst.status === InstallmentStatus.PENDING
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

  async safeRetry(installmentId: string, performedBy: string) {
    const inst = await this.instRepo.findOne({ where: { id: installmentId } });
    if (!inst) throw new NotFoundException('Installment not found');

    if (inst.status === InstallmentStatus.PAID) {
      throw new BadRequestException('Installment is already paid');
    }
    if (inst.status !== InstallmentStatus.OVERDUE && !(inst.status === InstallmentStatus.PENDING && new Date(inst.dueDate) < new Date())) {
      throw new BadRequestException('Only overdue/delinquent installments can be retried');
    }

    const now = new Date();
    const newDueDate = new Date(now);
    newDueDate.setDate(newDueDate.getDate() + 7);
    inst.dueDate = newDueDate;
    inst.status = InstallmentStatus.PENDING;

    const saved = await this.instRepo.save(inst);

    await this.auditRepo.save({
      entityType: 'installment',
      entityId: installmentId,
      action: 'repayment_retry',
      performedBy,
      changes: { dueDate: { from: inst.dueDate, to: newDueDate }, status: { from: inst.status, to: InstallmentStatus.PENDING } },
      reason: 'Safe retry of overdue installment',
    } as unknown as AuditLog);

    return saved;
  }

  async reconcile(installmentId: string, data: { status?: InstallmentStatus; paymentReference?: string; paidAt?: Date; note?: string }, performedBy: string) {
    const inst = await this.instRepo.findOne({ where: { id: installmentId } });
    if (!inst) throw new NotFoundException('Installment not found');

    const changes: Record<string, { from: any; to: any }> = {};
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
    if (data.status === InstallmentStatus.PAID && !inst.paidAt) {
      inst.paidAt = new Date();
      changes.paidAt = { from: null, to: inst.paidAt };
    }

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('No changes to reconcile');
    }

    const saved = await this.instRepo.save(inst);

    if (inst.status === InstallmentStatus.PAID) {
      await this._updateSubscriptionPaidAmount(inst.subscriptionId);
    }

    await this.auditRepo.save({
      entityType: 'installment',
      entityId: installmentId,
      action: 'repayment_reconcile',
      performedBy,
      changes,
      reason: data.note || 'Manual reconciliation',
    } as unknown as AuditLog);

    return saved;
  }

  async updateMetadata(installmentId: string, metadata: Record<string, any>, performedBy: string) {
    const inst = await this.instRepo.findOne({ where: { id: installmentId } });
    if (!inst) throw new NotFoundException('Installment not found');

    const allowedFields = ['lateFeeAmount', 'gracePeriodEnd'];
    const changes: Record<string, { from: any; to: any }> = {};

    for (const key of Object.keys(metadata)) {
      if (!allowedFields.includes(key)) {
        throw new ForbiddenException(`Field '${key}' cannot be modified via metadata correction`);
      }
      changes[key] = { from: (inst as any)[key], to: metadata[key] };
      (inst as any)[key] = metadata[key];
    }

    const saved = await this.instRepo.save(inst);

    await this.auditRepo.save({
      entityType: 'installment',
      entityId: installmentId,
      action: 'repayment_metadata_update',
      performedBy,
      changes,
      reason: 'Metadata correction',
    } as unknown as AuditLog);

    return saved;
  }

  async handlePartialPayment(installmentId: string, amount: number, paymentReference: string, performedBy: string) {
    const inst = await this.instRepo.findOne({ where: { id: installmentId } });
    if (!inst) throw new NotFoundException('Installment not found');

    if (inst.status === InstallmentStatus.PAID) {
      throw new BadRequestException('Installment is already fully paid');
    }

    const instAmount = Number(inst.amount);
    if (amount <= 0) {
      throw new BadRequestException('Partial amount must be positive');
    }

    const remaining = instAmount - amount;
    if (remaining <= 0) {
      inst.status = InstallmentStatus.PAID;
      inst.paidAt = new Date();
      inst.paymentReference = paymentReference;
    }
    // For a true partial, we store the partial amount reference but keep installment pending
    // The remaining balance is tracked on the subscription level
    else {
      inst.paymentReference = paymentReference;
    }

    const saved = await this.instRepo.save(inst);

    // Update subscription amount paid regardless
    await this._updateSubscriptionPaidAmount(inst.subscriptionId);

    await this.auditRepo.save({
      entityType: 'installment',
      entityId: installmentId,
      action: 'repayment_partial',
      performedBy,
      changes: {
        amount: { from: instAmount, to: amount },
        status: { from: inst.status === InstallmentStatus.PAID ? 'pending' : inst.status, to: inst.status },
        paymentReference: { from: null, to: paymentReference },
      },
      reason: `Partial payment of ₦${amount} applied`,
    } as unknown as AuditLog);

    return saved;
  }

  private async _updateSubscriptionPaidAmount(subscriptionId: string) {
    const paidInst = await this.instRepo.find({
      where: { subscriptionId, status: InstallmentStatus.PAID },
    });
    const totalPaid = paidInst.reduce((sum, i) => sum + Number(i.amount), 0);
    await this.subRepo.update(subscriptionId, { amountPaid: totalPaid });

    const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
    if (sub && totalPaid >= Number(sub.totalAmount)) {
      sub.status = SubscriptionStatus.SETTLED;
      sub.settledAt = new Date();
      await this.subRepo.save(sub);
    }
  }
}
