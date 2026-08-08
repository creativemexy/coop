import { CollectionQueueService } from '../services/collection-queue.service';
import { QueueStatus } from '../entities/collection-queue.entity';
export declare class CollectionQueueController {
    private readonly service;
    constructor(service: CollectionQueueService);
    addToQueue(subscriptionId: string, userId: string): Promise<import("../entities/collection-queue.entity").CollectionQueue>;
    listQueued(status?: string, priority?: string, assignedTo?: string): Promise<import("../entities/collection-queue.entity").CollectionQueue[]>;
    updateStatus(id: string, dto: {
        status: QueueStatus;
        note?: string;
    }): Promise<import("../entities/collection-queue.entity").CollectionQueue>;
    assignTo(id: string, dto: {
        assignedTo: string;
    }): Promise<import("../entities/collection-queue.entity").CollectionQueue>;
    getAgingSummary(): Promise<{
        label: string;
        min: number;
        max: number;
        count: number;
        totalAmount: number;
    }[]>;
}
