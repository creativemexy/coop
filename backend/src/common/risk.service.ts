import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalRiskRule } from '../modules/admin/entities/global-risk-rule.entity';

@Injectable()
export class RiskService {
  constructor(
    @InjectRepository(GlobalRiskRule)
    private readonly repo: Repository<GlobalRiskRule>,
  ) {}

  async getRule(key: string): Promise<GlobalRiskRule | null> {
    return this.repo.findOne({ where: { ruleKey: key, enabled: true } });
  }

  async getConfig(key: string): Promise<Record<string, any> | null> {
    const rule = await this.getRule(key);
    return rule?.config ?? null;
  }

  async checkMinMax(
    key: string,
    value: number,
    field: string = 'amount',
  ): Promise<{ allowed: boolean; limit: number } | null> {
    const config = await this.getConfig(key);
    if (!config) return null;
    const limit = config[field];
    if (limit === undefined) return null;
    return { allowed: value <= limit, limit };
  }

  async checkMin(key: string, value: number, field: string = 'amount'): Promise<{ allowed: boolean; min: number } | null> {
    const config = await this.getConfig(key);
    if (!config) return null;
    const min = config[field];
    if (min === undefined) return null;
    return { allowed: value >= min, min };
  }

  async checkDailyLimit(
    key: string,
    currentDailyTotal: number,
  ): Promise<{ allowed: boolean; limit: number } | null> {
    const config = await this.getConfig(key);
    if (!config) return null;
    const limit = config.amount;
    if (limit === undefined) return null;
    return { allowed: currentDailyTotal < limit, limit };
  }

  async checkCountLimit(
    key: string,
    currentCount: number,
  ): Promise<{ allowed: boolean; limit: number } | null> {
    const config = await this.getConfig(key);
    if (!config) return null;
    const count = config.count ?? config.amount;
    if (count === undefined) return null;
    return { allowed: currentCount < count, limit: count };
  }
}
