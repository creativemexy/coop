import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { ProcessingStep, ProcessingStepType, ProcessingStepStatus } from '../entities/processing-step.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplPlan } from '../entities/bnpl-plan.entity';
import { BnplPlanConfig, InterestModel, DueDateRule, LateFeeType } from '../entities/bnpl-plan-config.entity';
import { SubscriptionStatus, InstallmentStatus, PayoutStatus } from '../../../common/enums/status.enum';

@Injectable()
export class ProcessingEngineService {
  constructor(
    @InjectRepository(ProcessingStep)
    private readonly stepRepo: Repository<ProcessingStep>,
    @InjectRepository(IdempotencyKey)
    private readonly ikRepo: Repository<IdempotencyKey>,
    @InjectRepository(BnplSubscription)
    private readonly subRepo: Repository<BnplSubscription>,
    @InjectRepository(BnplInstallment)
    private readonly instRepo: Repository<BnplInstallment>,
    @InjectRepository(BnplPlan)
    private readonly planRepo: Repository<BnplPlan>,
    @InjectRepository(BnplPlanConfig)
    private readonly configRepo: Repository<BnplPlanConfig>,
  ) {}

  private async checkIdempotency(key: string, operation: string): Promise<{ isNew: boolean; result?: any }> {
    const existing = await this.ikRepo.findOne({ where: { idempotencyKey: key } });
    if (existing) {
      return { isNew: false, result: existing.result };
    }
    return { isNew: true };
  }

  private async markIdempotent(key: string, operation: string, referenceId: string, result: any) {
    const entity = this.ikRepo.create({
      idempotencyKey: key,
      operation,
      referenceId,
      status: 'completed',
      result,
    });
    await this.ikRepo.save(entity);
  }

  async createPaymentIntent(subscriptionId: string, idempotencyKey?: string) {
    const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription not found');

    const key = idempotencyKey || `payment_intent_${subscriptionId}_${uuid()}`;
    const { isNew, result } = await this.checkIdempotency(key, 'payment_intent');
    if (!isNew) return result;

    const existingStep = await this.stepRepo.findOne({
      where: { subscriptionId, stepType: ProcessingStepType.PAYMENT_INTENT, status: ProcessingStepStatus.COMPLETED },
    });
    if (existingStep) {
      throw new ConflictException('Payment intent already created for this subscription');
    }

    const step = this.stepRepo.create({
      subscriptionId,
      stepType: ProcessingStepType.PAYMENT_INTENT,
      status: ProcessingStepStatus.COMPLETED,
      idempotencyKey: key,
      metadata: { totalAmount: Number(sub.totalAmount), downPayment: Number(sub.downPayment) },
      completedAt: new Date(),
    });
    await this.stepRepo.save(step);

    const response = { paymentIntentId: step.id, amount: Number(sub.totalAmount), status: 'created' };
    await this.markIdempotent(key, 'payment_intent', step.id, response);
    return response;
  }

  async executeDisbursement(subscriptionId: string, disbursementReference: string, idempotencyKey?: string) {
    const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== SubscriptionStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order must be in pending_payment to disburse');
    }

    const key = idempotencyKey || `disburse_${subscriptionId}_${uuid()}`;
    const { isNew, result } = await this.checkIdempotency(key, 'disbursement');
    if (!isNew) return result;

    const existingDisbursement = await this.stepRepo.findOne({
      where: { subscriptionId, stepType: ProcessingStepType.DISBURSEMENT, status: ProcessingStepStatus.COMPLETED },
    });
    if (existingDisbursement) {
      throw new ConflictException('Disbursement already completed for this subscription');
    }

    const step = this.stepRepo.create({
      subscriptionId,
      stepType: ProcessingStepType.DISBURSEMENT,
      status: ProcessingStepStatus.IN_PROGRESS,
      idempotencyKey: key,
      externalReference: disbursementReference,
    });
    await this.stepRepo.save(step);

    const plan = await this.planRepo.findOne({ where: { id: sub.planId }, relations: { catalogItem: true } });
    if (!plan) throw new NotFoundException('Plan not found');

    const config = await this.configRepo.findOne({ where: { organizationId: plan.organizationId } });
    const itemPrice = Number(plan.catalogItem?.price || 0);
    const downPayment = (itemPrice * Number(plan.downPaymentPercent)) / 100;

    sub.downPayment = downPayment;
    sub.payoutStatus = PayoutStatus.COMPLETED;
    sub.disbursementReference = disbursementReference;
    sub.disbursedAt = new Date();
    sub.status = SubscriptionStatus.DISBURSED;
    const savedSub = await this.subRepo.save(sub);

    // Generate installments
    const installmentAmount = (Number(sub.totalAmount) - downPayment) / Number(plan.installmentCount);
    const startDate = new Date();
    const installments: BnplInstallment[] = [];
    for (let i = 0; i < plan.installmentCount; i++) {
      const dueDate = this._calculateDueDate(startDate, i, plan.installmentFrequency, config?.dueDateRule || DueDateRule.SAME_DAY_MONTHLY);
      const gracePeriodEnd = config?.gracePeriodDays ? new Date(dueDate.getTime() + config.gracePeriodDays * 86400000) : undefined;
      const lateFeeAmount = this._calculateLateFee(installmentAmount, config?.lateFeeType || LateFeeType.FLAT, config?.lateFeeValue || 0);
      installments.push({
        subscriptionId,
        dueDate,
        amount: Math.round(installmentAmount * 100) / 100,
        lateFeeAmount: Math.round(lateFeeAmount * 100) / 100,
        gracePeriodEnd: gracePeriodEnd || undefined,
        status: InstallmentStatus.PENDING,
      } as BnplInstallment);
    }

    // Distribute rounding remainder across installments
    const totalInstallmentSum = installments.reduce((s, i) => s + i.amount, 0);
    const roundingDiff = Math.round((Number(sub.totalAmount) - downPayment - totalInstallmentSum) * 100) / 100;
    if (installments.length > 0) {
      installments[installments.length - 1].amount = Math.round((installments[installments.length - 1].amount + roundingDiff) * 100) / 100;
    }

    const savedInsts = await this.instRepo.save(installments);

    // Mark installment generation step
    const installGenStep = this.stepRepo.create({
      subscriptionId,
      stepType: ProcessingStepType.INSTALLMENT_GENERATION,
      status: ProcessingStepStatus.COMPLETED,
      idempotencyKey: `install_gen_${subscriptionId}_${uuid()}`,
      metadata: { installmentCount: savedInsts.length },
      completedAt: new Date(),
    });
    await this.stepRepo.save(installGenStep);

    // Mark disbursement step completed
    step.status = ProcessingStepStatus.COMPLETED;
    step.completedAt = new Date();
    await this.stepRepo.save(step);

    const response = {
      disbursementId: step.id,
      subscriptionId: savedSub.id,
      disbursementReference,
      installmentCount: savedInsts.length,
      status: 'completed',
    };

    await this.markIdempotent(key, 'disbursement', step.id, response);
    return response;
  }

  async getProcessingSteps(subscriptionId: string) {
    return this.stepRepo.find({
      where: { subscriptionId },
      order: { createdAt: 'ASC' },
    });
  }

  async retryStep(stepId: string) {
    const step = await this.stepRepo.findOne({ where: { id: stepId } });
    if (!step) throw new NotFoundException('Processing step not found');
    if (step.status === ProcessingStepStatus.COMPLETED) {
      throw new BadRequestException('Step already completed');
    }

    step.retryCount += 1;
    step.status = ProcessingStepStatus.IN_PROGRESS;
    step.errorMessage = null;
    return this.stepRepo.save(step);
  }

  private _calculateDueDate(start: Date, index: number, frequency: string, rule: DueDateRule): Date {
    const due = new Date(start);
    if (frequency === 'weekly') {
      due.setDate(due.getDate() + (index + 1) * 7);
    } else if (frequency === 'biweekly') {
      due.setDate(due.getDate() + (index + 1) * 14);
    } else {
      if (rule === DueDateRule.END_OF_MONTH) {
        due.setMonth(due.getMonth() + (index + 1));
        due.setDate(0);
      } else {
        const originalDay = start.getDate();
        due.setMonth(due.getMonth() + (index + 1));
        if (due.getDate() !== originalDay) due.setDate(0);
      }
    }
    return due;
  }

  private _calculateLateFee(installmentAmount: number, feeType: LateFeeType, feeValue: number): number {
    if (feeValue <= 0) return 0;
    return feeType === LateFeeType.PERCENTAGE ? installmentAmount * (feeValue / 100) : feeValue;
  }
}
