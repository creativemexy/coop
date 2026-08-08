import { Repository } from 'typeorm';
import { GlobalRiskRule } from '../modules/admin/entities/global-risk-rule.entity';
export declare class RiskService {
    private readonly repo;
    constructor(repo: Repository<GlobalRiskRule>);
    getRule(key: string): Promise<GlobalRiskRule | null>;
    getConfig(key: string): Promise<Record<string, any> | null>;
    checkMinMax(key: string, value: number, field?: string): Promise<{
        allowed: boolean;
        limit: number;
    } | null>;
    checkMin(key: string, value: number, field?: string): Promise<{
        allowed: boolean;
        min: number;
    } | null>;
    checkDailyLimit(key: string, currentDailyTotal: number): Promise<{
        allowed: boolean;
        limit: number;
    } | null>;
    checkCountLimit(key: string, currentCount: number): Promise<{
        allowed: boolean;
        limit: number;
    } | null>;
}
