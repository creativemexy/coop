import { Repository } from 'typeorm';
import { BnplPlanConfig, InterestModel, DueDateRule, LateFeeType } from '../entities/bnpl-plan-config.entity';
export declare class PlanConfigService {
    private readonly repo;
    constructor(repo: Repository<BnplPlanConfig>);
    get(organizationId: string): Promise<BnplPlanConfig | null>;
    upsert(organizationId: string, dto: {
        availableTenors: {
            installmentCount: number;
            frequency: string;
            label: string;
        }[];
        interestModel: InterestModel;
        maxPrincipal?: number;
        requireMembership?: boolean;
        dueDateRule: DueDateRule;
        gracePeriodDays?: number;
        lateFeeType: LateFeeType;
        lateFeeValue?: number;
        updatedBy: string;
    }): Promise<BnplPlanConfig>;
}
