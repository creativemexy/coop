import { Repository } from 'typeorm';
import { ProcessingStep } from '../entities/processing-step.entity';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplPlan } from '../entities/bnpl-plan.entity';
import { BnplPlanConfig } from '../entities/bnpl-plan-config.entity';
export declare class ProcessingEngineService {
    private readonly stepRepo;
    private readonly ikRepo;
    private readonly subRepo;
    private readonly instRepo;
    private readonly planRepo;
    private readonly configRepo;
    constructor(stepRepo: Repository<ProcessingStep>, ikRepo: Repository<IdempotencyKey>, subRepo: Repository<BnplSubscription>, instRepo: Repository<BnplInstallment>, planRepo: Repository<BnplPlan>, configRepo: Repository<BnplPlanConfig>);
    private checkIdempotency;
    private markIdempotent;
    createPaymentIntent(subscriptionId: string, idempotencyKey?: string): Promise<any>;
    executeDisbursement(subscriptionId: string, disbursementReference: string, idempotencyKey?: string): Promise<any>;
    getProcessingSteps(subscriptionId: string): Promise<ProcessingStep[]>;
    retryStep(stepId: string): Promise<ProcessingStep>;
    private _calculateDueDate;
    private _calculateLateFee;
}
