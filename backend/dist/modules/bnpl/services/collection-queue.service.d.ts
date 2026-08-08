import { Repository } from 'typeorm';
import { CollectionQueue, QueueStatus } from '../entities/collection-queue.entity';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
export declare class CollectionQueueService {
    private readonly queueRepo;
    private readonly subRepo;
    private readonly instRepo;
    constructor(queueRepo: Repository<CollectionQueue>, subRepo: Repository<BnplSubscription>, instRepo: Repository<BnplInstallment>);
    addToQueue(subscriptionId: string, assignedBy: string): Promise<CollectionQueue>;
    listQueued(filters?: {
        status?: string;
        priority?: string;
        assignedTo?: string;
    }): Promise<CollectionQueue[]>;
    updateStatus(id: string, status: QueueStatus, note?: string): Promise<CollectionQueue>;
    assignTo(id: string, assignedTo: string): Promise<CollectionQueue>;
    getAgingSummary(): Promise<{
        label: string;
        min: number;
        max: number;
        count: number;
        totalAmount: number;
    }[]>;
}
