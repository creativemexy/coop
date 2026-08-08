import { ProcessingEngineService } from '../services/processing-engine.service';
export declare class ProcessingEngineController {
    private readonly service;
    constructor(service: ProcessingEngineService);
    createPaymentIntent(subscriptionId: string, idempotencyKey?: string): Promise<any>;
    disburse(subscriptionId: string, dto: {
        disbursementReference: string;
        idempotencyKey?: string;
    }): Promise<any>;
    getSteps(subscriptionId: string): Promise<import("../entities/processing-step.entity").ProcessingStep[]>;
    retryStep(stepId: string): Promise<import("../entities/processing-step.entity").ProcessingStep>;
}
