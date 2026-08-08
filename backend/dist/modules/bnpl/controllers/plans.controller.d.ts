import { PlansService } from '../services/plans.service';
import { InterestType, PlanStatus } from '../entities/bnpl-plan.entity';
export declare class PlansController {
    private readonly service;
    constructor(service: PlansService);
    create(dto: {
        organizationId: string;
        catalogItemId: string;
        tenorOptions?: number[];
        minPrincipal?: number;
        maxPrincipal?: number;
        eligibilityBands?: Array<{
            minScore: number;
            maxScore: number;
            maxPrincipal: number;
        }>;
        downPaymentPercent: number;
        installmentCount: number;
        installmentFrequency: string;
        interestType?: InterestType;
        interestRate?: number;
        monthlyFeeRate?: number;
        gracePeriodDays?: number;
        lateFeeRate?: number;
        lateFeeCapDays?: number;
        isEnabled?: boolean;
    }, userId: string): Promise<import("../entities/bnpl-plan.entity").BnplPlan>;
    findAll(organizationId: string): Promise<import("../entities/bnpl-plan.entity").BnplPlan[]>;
    findById(id: string): Promise<import("../entities/bnpl-plan.entity").BnplPlan>;
    update(id: string, dto: {
        status?: PlanStatus;
        isEnabled?: boolean;
        tenorOptions?: number[];
        minPrincipal?: number;
        maxPrincipal?: number;
        eligibilityBands?: Array<{
            minScore: number;
            maxScore: number;
            maxPrincipal: number;
        }>;
        downPaymentPercent?: number;
        installmentCount?: number;
        installmentFrequency?: string;
        interestType?: InterestType;
        interestRate?: number;
        monthlyFeeRate?: number;
        gracePeriodDays?: number;
        lateFeeRate?: number;
        lateFeeCapDays?: number;
    }, userId: string): Promise<import("../entities/bnpl-plan.entity").BnplPlan>;
    getVersionHistory(id: string): Promise<import("../entities/audit-log.entity").AuditLog[]>;
}
