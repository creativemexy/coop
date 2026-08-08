import { SubscriptionsService } from '../services/subscriptions.service';
import { SubscriptionStatus } from '../../../common/enums/status.enum';
export declare class SubscriptionsController {
    private readonly service;
    constructor(service: SubscriptionsService);
    subscribe(dto: {
        planId: string;
    }, userId: string): Promise<import("../entities/bnpl-subscription.entity").BnplSubscription>;
    findMySubscriptions(user: Record<string, unknown>): Promise<import("../entities/bnpl-subscription.entity").BnplSubscription[]>;
    listOrders(status?: string, payoutStatus?: string, search?: string, product?: string, tenor?: string, dateFrom?: string, dateTo?: string): Promise<any[]>;
    getOrderPayments(id: string): Promise<any>;
    updateOrderStatus(id: string, dto: {
        status: SubscriptionStatus;
        reason?: string;
    }, userId: string): Promise<import("../entities/bnpl-subscription.entity").BnplSubscription>;
    markDisbursed(id: string, dto: {
        disbursementReference: string;
        reason?: string;
    }, userId: string): Promise<import("../entities/bnpl-subscription.entity").BnplSubscription>;
    markSettled(id: string, dto: {
        reason?: string;
    }, userId: string): Promise<import("../entities/bnpl-subscription.entity").BnplSubscription>;
    searchUsers(query: string): Promise<{
        id: string;
        name: string;
        email: string;
    }[]>;
    findById(id: string): Promise<import("../entities/bnpl-subscription.entity").BnplSubscription>;
}
