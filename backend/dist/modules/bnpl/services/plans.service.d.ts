import { Repository } from 'typeorm';
import { BnplPlan, InterestType, PlanStatus } from '../entities/bnpl-plan.entity';
import { ComplianceService } from './compliance.service';
export declare class PlansService {
    private readonly repo;
    private readonly complianceService;
    constructor(repo: Repository<BnplPlan>, complianceService: ComplianceService);
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
        createdBy: string;
    }): Promise<BnplPlan>;
    findAllByOrg(organizationId?: string): Promise<BnplPlan[]>;
    findById(id: string): Promise<BnplPlan>;
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
        updatedBy?: string;
    }): Promise<BnplPlan>;
    getVersionHistory(id: string): Promise<import("../entities/audit-log.entity").AuditLog[]>;
}
