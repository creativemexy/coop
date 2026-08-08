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
exports.ProcessingEngineService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const processing_step_entity_1 = require("../entities/processing-step.entity");
const idempotency_key_entity_1 = require("../entities/idempotency-key.entity");
const bnpl_subscription_entity_1 = require("../entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../entities/bnpl-installment.entity");
const bnpl_plan_entity_1 = require("../entities/bnpl-plan.entity");
const bnpl_plan_config_entity_1 = require("../entities/bnpl-plan-config.entity");
const status_enum_1 = require("../../../common/enums/status.enum");
let ProcessingEngineService = class ProcessingEngineService {
    stepRepo;
    ikRepo;
    subRepo;
    instRepo;
    planRepo;
    configRepo;
    constructor(stepRepo, ikRepo, subRepo, instRepo, planRepo, configRepo) {
        this.stepRepo = stepRepo;
        this.ikRepo = ikRepo;
        this.subRepo = subRepo;
        this.instRepo = instRepo;
        this.planRepo = planRepo;
        this.configRepo = configRepo;
    }
    async checkIdempotency(key, operation) {
        const existing = await this.ikRepo.findOne({ where: { idempotencyKey: key } });
        if (existing) {
            return { isNew: false, result: existing.result };
        }
        return { isNew: true };
    }
    async markIdempotent(key, operation, referenceId, result) {
        const entity = this.ikRepo.create({
            idempotencyKey: key,
            operation,
            referenceId,
            status: 'completed',
            result,
        });
        await this.ikRepo.save(entity);
    }
    async createPaymentIntent(subscriptionId, idempotencyKey) {
        const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        const key = idempotencyKey || `payment_intent_${subscriptionId}_${(0, uuid_1.v4)()}`;
        const { isNew, result } = await this.checkIdempotency(key, 'payment_intent');
        if (!isNew)
            return result;
        const existingStep = await this.stepRepo.findOne({
            where: { subscriptionId, stepType: processing_step_entity_1.ProcessingStepType.PAYMENT_INTENT, status: processing_step_entity_1.ProcessingStepStatus.COMPLETED },
        });
        if (existingStep) {
            throw new common_1.ConflictException('Payment intent already created for this subscription');
        }
        const step = this.stepRepo.create({
            subscriptionId,
            stepType: processing_step_entity_1.ProcessingStepType.PAYMENT_INTENT,
            status: processing_step_entity_1.ProcessingStepStatus.COMPLETED,
            idempotencyKey: key,
            metadata: { totalAmount: Number(sub.totalAmount), downPayment: Number(sub.downPayment) },
            completedAt: new Date(),
        });
        await this.stepRepo.save(step);
        const response = { paymentIntentId: step.id, amount: Number(sub.totalAmount), status: 'created' };
        await this.markIdempotent(key, 'payment_intent', step.id, response);
        return response;
    }
    async executeDisbursement(subscriptionId, disbursementReference, idempotencyKey) {
        const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        if (sub.status !== status_enum_1.SubscriptionStatus.PENDING_PAYMENT) {
            throw new common_1.BadRequestException('Order must be in pending_payment to disburse');
        }
        const key = idempotencyKey || `disburse_${subscriptionId}_${(0, uuid_1.v4)()}`;
        const { isNew, result } = await this.checkIdempotency(key, 'disbursement');
        if (!isNew)
            return result;
        const existingDisbursement = await this.stepRepo.findOne({
            where: { subscriptionId, stepType: processing_step_entity_1.ProcessingStepType.DISBURSEMENT, status: processing_step_entity_1.ProcessingStepStatus.COMPLETED },
        });
        if (existingDisbursement) {
            throw new common_1.ConflictException('Disbursement already completed for this subscription');
        }
        const step = this.stepRepo.create({
            subscriptionId,
            stepType: processing_step_entity_1.ProcessingStepType.DISBURSEMENT,
            status: processing_step_entity_1.ProcessingStepStatus.IN_PROGRESS,
            idempotencyKey: key,
            externalReference: disbursementReference,
        });
        await this.stepRepo.save(step);
        const plan = await this.planRepo.findOne({ where: { id: sub.planId }, relations: { catalogItem: true } });
        if (!plan)
            throw new common_1.NotFoundException('Plan not found');
        const config = await this.configRepo.findOne({ where: { organizationId: plan.organizationId } });
        const itemPrice = Number(plan.catalogItem?.price || 0);
        const downPayment = (itemPrice * Number(plan.downPaymentPercent)) / 100;
        sub.downPayment = downPayment;
        sub.payoutStatus = status_enum_1.PayoutStatus.COMPLETED;
        sub.disbursementReference = disbursementReference;
        sub.disbursedAt = new Date();
        sub.status = status_enum_1.SubscriptionStatus.DISBURSED;
        const savedSub = await this.subRepo.save(sub);
        const installmentAmount = (Number(sub.totalAmount) - downPayment) / Number(plan.installmentCount);
        const startDate = new Date();
        const installments = [];
        for (let i = 0; i < plan.installmentCount; i++) {
            const dueDate = this._calculateDueDate(startDate, i, plan.installmentFrequency, config?.dueDateRule || bnpl_plan_config_entity_1.DueDateRule.SAME_DAY_MONTHLY);
            const gracePeriodEnd = config?.gracePeriodDays ? new Date(dueDate.getTime() + config.gracePeriodDays * 86400000) : undefined;
            const lateFeeAmount = this._calculateLateFee(installmentAmount, config?.lateFeeType || bnpl_plan_config_entity_1.LateFeeType.FLAT, config?.lateFeeValue || 0);
            installments.push({
                subscriptionId,
                dueDate,
                amount: Math.round(installmentAmount * 100) / 100,
                lateFeeAmount: Math.round(lateFeeAmount * 100) / 100,
                gracePeriodEnd: gracePeriodEnd || undefined,
                status: status_enum_1.InstallmentStatus.PENDING,
            });
        }
        const totalInstallmentSum = installments.reduce((s, i) => s + i.amount, 0);
        const roundingDiff = Math.round((Number(sub.totalAmount) - downPayment - totalInstallmentSum) * 100) / 100;
        if (installments.length > 0) {
            installments[installments.length - 1].amount = Math.round((installments[installments.length - 1].amount + roundingDiff) * 100) / 100;
        }
        const savedInsts = await this.instRepo.save(installments);
        const installGenStep = this.stepRepo.create({
            subscriptionId,
            stepType: processing_step_entity_1.ProcessingStepType.INSTALLMENT_GENERATION,
            status: processing_step_entity_1.ProcessingStepStatus.COMPLETED,
            idempotencyKey: `install_gen_${subscriptionId}_${(0, uuid_1.v4)()}`,
            metadata: { installmentCount: savedInsts.length },
            completedAt: new Date(),
        });
        await this.stepRepo.save(installGenStep);
        step.status = processing_step_entity_1.ProcessingStepStatus.COMPLETED;
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
    async getProcessingSteps(subscriptionId) {
        return this.stepRepo.find({
            where: { subscriptionId },
            order: { createdAt: 'ASC' },
        });
    }
    async retryStep(stepId) {
        const step = await this.stepRepo.findOne({ where: { id: stepId } });
        if (!step)
            throw new common_1.NotFoundException('Processing step not found');
        if (step.status === processing_step_entity_1.ProcessingStepStatus.COMPLETED) {
            throw new common_1.BadRequestException('Step already completed');
        }
        step.retryCount += 1;
        step.status = processing_step_entity_1.ProcessingStepStatus.IN_PROGRESS;
        step.errorMessage = null;
        return this.stepRepo.save(step);
    }
    _calculateDueDate(start, index, frequency, rule) {
        const due = new Date(start);
        if (frequency === 'weekly') {
            due.setDate(due.getDate() + (index + 1) * 7);
        }
        else if (frequency === 'biweekly') {
            due.setDate(due.getDate() + (index + 1) * 14);
        }
        else {
            if (rule === bnpl_plan_config_entity_1.DueDateRule.END_OF_MONTH) {
                due.setMonth(due.getMonth() + (index + 1));
                due.setDate(0);
            }
            else {
                const originalDay = start.getDate();
                due.setMonth(due.getMonth() + (index + 1));
                if (due.getDate() !== originalDay)
                    due.setDate(0);
            }
        }
        return due;
    }
    _calculateLateFee(installmentAmount, feeType, feeValue) {
        if (feeValue <= 0)
            return 0;
        return feeType === bnpl_plan_config_entity_1.LateFeeType.PERCENTAGE ? installmentAmount * (feeValue / 100) : feeValue;
    }
};
exports.ProcessingEngineService = ProcessingEngineService;
exports.ProcessingEngineService = ProcessingEngineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(processing_step_entity_1.ProcessingStep)),
    __param(1, (0, typeorm_1.InjectRepository)(idempotency_key_entity_1.IdempotencyKey)),
    __param(2, (0, typeorm_1.InjectRepository)(bnpl_subscription_entity_1.BnplSubscription)),
    __param(3, (0, typeorm_1.InjectRepository)(bnpl_installment_entity_1.BnplInstallment)),
    __param(4, (0, typeorm_1.InjectRepository)(bnpl_plan_entity_1.BnplPlan)),
    __param(5, (0, typeorm_1.InjectRepository)(bnpl_plan_config_entity_1.BnplPlanConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProcessingEngineService);
//# sourceMappingURL=processing-engine.service.js.map