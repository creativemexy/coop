import { Repository } from 'typeorm';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { CollectionPriority, PriorityLevel, PriorityEntityType } from '../entities/collection-priority.entity';
import { ExceptionCase, ExceptionCaseStatus } from '../entities/exception-case.entity';
import { CollectionPlaybook, PlaybookTrigger } from '../entities/collection-playbook.entity';
import { ExceptionReason } from '../entities/exception-reason.entity';
import { AuditLog } from '../entities/audit-log.entity';
export interface CohortBucket {
    label: string;
    minDays: number;
    maxDays: number;
    count: number;
    totalAmount: number;
    installments: {
        id: string;
        subscriptionId: string;
        dueDate: Date;
        amount: number;
        daysLate: number;
    }[];
}
export declare class CollectionsService {
    private readonly instRepo;
    private readonly subRepo;
    private readonly priorityRepo;
    private readonly exceptionRepo;
    private readonly reasonRepo;
    private readonly playbookRepo;
    private readonly auditRepo;
    constructor(instRepo: Repository<BnplInstallment>, subRepo: Repository<BnplSubscription>, priorityRepo: Repository<CollectionPriority>, exceptionRepo: Repository<ExceptionCase>, reasonRepo: Repository<ExceptionReason>, playbookRepo: Repository<CollectionPlaybook>, auditRepo: Repository<AuditLog>);
    getDelinquencyCohorts(): Promise<{
        cohorts: CohortBucket[];
        totalDelinquentAmount: number;
        totalActivePrincipal: number;
        delinquencyRate: number;
        asOf: Date;
    }>;
    assignPriority(entityType: PriorityEntityType, entityId: string, priority: PriorityLevel, reason: string, assignedBy: string): Promise<CollectionPriority>;
    getPriorities(entityType?: PriorityEntityType): Promise<CollectionPriority[]>;
    getExceptionReasons(): Promise<ExceptionReason[]>;
    createExceptionCase(data: {
        subscriptionId: string;
        reasonId: string;
        description?: string;
        createdBy: string;
        assignedTo?: string;
    }): Promise<ExceptionCase>;
    resolveExceptionCase(id: string, resolution: string, resolvedBy: string): Promise<ExceptionCase>;
    getExceptionCases(filters?: {
        status?: ExceptionCaseStatus;
        subscriptionId?: string;
    }): Promise<ExceptionCase[]>;
    getPlaybooks(triggerEvent?: PlaybookTrigger): Promise<CollectionPlaybook[]>;
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
