import { Repository } from 'typeorm';
import { BnplSubscription } from '../entities/bnpl-subscription.entity';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { BnplPlan } from '../entities/bnpl-plan.entity';
import { BnplPlanConfig } from '../entities/bnpl-plan-config.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { UsersService } from '../../users/users.service';
import { SubscriptionStatus } from '../../../common/enums/status.enum';
export declare class SubscriptionsService {
    private readonly subRepo;
    private readonly instRepo;
    private readonly planRepo;
    private readonly configRepo;
    private readonly auditRepo;
    private readonly usersService;
    private readonly logger;
    constructor(subRepo: Repository<BnplSubscription>, instRepo: Repository<BnplInstallment>, planRepo: Repository<BnplPlan>, configRepo: Repository<BnplPlanConfig>, auditRepo: Repository<AuditLog>, usersService: UsersService);
    checkEligibility(userId: string, planId: string): Promise<{
        eligible: boolean;
        reasons: {
            key: string;
            label: string;
            passed: boolean;
            detail?: string;
        }[];
    }>;
    subscribe(userId: string, planId: string): Promise<BnplSubscription>;
    findByUser(userId: string): Promise<BnplSubscription[]>;
    findById(id: string): Promise<BnplSubscription>;
    findByOrg(organizationId: string): Promise<BnplSubscription[]>;
    listOrders(filters?: {
        status?: string;
        payoutStatus?: string;
        search?: string;
        product?: string;
        tenor?: number;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<any[]>;
    getOrderPayments(orderId: string): Promise<any>;
    updateOrderStatus(id: string, status: SubscriptionStatus, performedBy?: string, reason?: string): Promise<BnplSubscription>;
    approve(id: string, performedBy?: string): Promise<BnplSubscription>;
    markDisbursed(id: string, disbursementReference: string, performedBy?: string, reason?: string): Promise<BnplSubscription>;
    markSettled(id: string, performedBy?: string, reason?: string): Promise<BnplSubscription>;
    searchUsers(query: string): Promise<{
        id: string;
        name: string;
        email: string;
    }[]>;
    private _logAudit;
    private _calculateStartDate;
    private _calculateDueDate;
    private _calculateTotalAmount;
    private _calculateLateFee;
}
