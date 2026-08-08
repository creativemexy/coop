import { Repository } from 'typeorm';
import { ApprovalRequest, ApprovalRequestType } from '../entities/approval-request.entity';
import { CatalogService } from './catalog.service';
import { PlansService } from './plans.service';
import { PlanConfigService } from './plan-config.service';
import { SubscriptionsService } from './subscriptions.service';
import { InstallmentsService } from './installments.service';
import { UsersService } from '../../users/users.service';
import { BnplInstallment } from '../entities/bnpl-installment.entity';
import { AppSetting } from '../../settings/entities/app-setting.entity';
export declare class ApprovalService {
    private readonly repo;
    private readonly instRepo;
    private readonly settingRepo;
    private readonly catalogService;
    private readonly plansService;
    private readonly planConfigService;
    private readonly subscriptionsService;
    private readonly installmentsService;
    private readonly usersService;
    constructor(repo: Repository<ApprovalRequest>, instRepo: Repository<BnplInstallment>, settingRepo: Repository<AppSetting>, catalogService: CatalogService, plansService: PlansService, planConfigService: PlanConfigService, subscriptionsService: SubscriptionsService, installmentsService: InstallmentsService, usersService: UsersService);
    submit(dto: {
        requestType: ApprovalRequestType;
        requestData: Record<string, any>;
        reason?: string;
        requestedBy: string;
    }): Promise<ApprovalRequest>;
    list(filters?: {
        status?: string;
        requestType?: string;
    }): Promise<ApprovalRequest[]>;
    findById(id: string): Promise<ApprovalRequest>;
    approve(id: string, reviewedBy: string, reviewerRole?: string): Promise<ApprovalRequest>;
    reject(id: string, reviewedBy: string, rejectionReason?: string): Promise<ApprovalRequest>;
    private _execute;
}
