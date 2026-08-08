import { CollectionsService } from '../services/collections.service';
import { PriorityLevel, PriorityEntityType } from '../entities/collection-priority.entity';
import { ExceptionCaseStatus } from '../entities/exception-case.entity';
import { PlaybookTrigger } from '../entities/collection-playbook.entity';
export declare class CollectionsController {
    private readonly service;
    constructor(service: CollectionsService);
    getCohorts(): Promise<{
        cohorts: import("../services/collections.service").CohortBucket[];
        totalDelinquentAmount: number;
        totalActivePrincipal: number;
        delinquencyRate: number;
        asOf: Date;
    }>;
    assignPriority(dto: {
        entityType: PriorityEntityType;
        entityId: string;
        priority: PriorityLevel;
        reason: string;
    }, userId: string): Promise<import("../entities/collection-priority.entity").CollectionPriority>;
    getPriorities(entityType?: PriorityEntityType): Promise<import("../entities/collection-priority.entity").CollectionPriority[]>;
    getExceptionReasons(): Promise<import("../entities/exception-reason.entity").ExceptionReason[]>;
    createExceptionCase(dto: {
        subscriptionId: string;
        reasonId: string;
        description?: string;
        assignedTo?: string;
    }, userId: string): Promise<import("../entities/exception-case.entity").ExceptionCase>;
    resolveExceptionCase(id: string, dto: {
        resolution: string;
    }, userId: string): Promise<import("../entities/exception-case.entity").ExceptionCase>;
    getExceptionCases(status?: ExceptionCaseStatus, subscriptionId?: string): Promise<import("../entities/exception-case.entity").ExceptionCase[]>;
    getPlaybooks(triggerEvent?: PlaybookTrigger): Promise<import("../entities/collection-playbook.entity").CollectionPlaybook[]>;
    getRecommendedActions(subscriptionId: string): Promise<{
        subscriptionId: string;
        trigger: PlaybookTrigger.FIRST_DELINQUENCY | PlaybookTrigger.REPEATED_DELINQUENCY | PlaybookTrigger.PAYMENT_FAILURE;
        overdueCount: number;
        totalOverdueAmount: number;
        priorRetries: number;
        playbooks: {
            id: string;
            title: string;
            description: string;
            recommendedActions: {
                step: number;
                action: string;
                note?: string;
            }[];
            requiresApproval: boolean;
        }[];
    }>;
    seedPlaybooks(): Promise<{
        seeded: boolean;
        count: number;
    }>;
}
