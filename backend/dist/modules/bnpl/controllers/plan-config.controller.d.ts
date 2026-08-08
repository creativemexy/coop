import { PlanConfigService } from '../services/plan-config.service';
import { InterestModel, DueDateRule, LateFeeType } from '../entities/bnpl-plan-config.entity';
export declare class PlanConfigController {
    private readonly service;
    constructor(service: PlanConfigService);
    get(organizationId: string): Promise<{
        configured: boolean;
    } | {
        id: string;
        organizationId: string;
        availableTenors: {
            installmentCount: number;
            frequency: "weekly" | "biweekly" | "monthly";
            label: string;
        }[];
        interestModel: InterestModel;
        maxPrincipal: number;
        requireMembership: boolean;
        dueDateRule: DueDateRule;
        gracePeriodDays: number;
        lateFeeType: LateFeeType;
        lateFeeValue: number;
        createdBy: string;
        updatedBy: string;
        createdAt: Date;
        updatedAt: Date;
        configured: boolean;
    }>;
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
    }, userId: string): Promise<import("../entities/bnpl-plan-config.entity").BnplPlanConfig>;
}
