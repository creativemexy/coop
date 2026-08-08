import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BnplPlanConfig,
  InterestModel,
  DueDateRule,
  LateFeeType,
} from '../entities/bnpl-plan-config.entity';

@Injectable()
export class PlanConfigService {
  constructor(
    @InjectRepository(BnplPlanConfig)
    private readonly repo: Repository<BnplPlanConfig>,
  ) {}

  async get(organizationId: string): Promise<BnplPlanConfig | null> {
    return this.repo.findOne({ where: { organizationId } });
  }

  async upsert(
    organizationId: string,
    dto: {
      availableTenors: { installmentCount: number; frequency: string; label: string }[];
      interestModel: InterestModel;
      maxPrincipal?: number;
      requireMembership?: boolean;
      dueDateRule: DueDateRule;
      gracePeriodDays?: number;
      lateFeeType: LateFeeType;
      lateFeeValue?: number;
      updatedBy: string;
    },
  ): Promise<BnplPlanConfig> {
    const existing = await this.repo.findOne({ where: { organizationId } });
    const payload: Partial<BnplPlanConfig> = {
      organizationId,
      availableTenors: dto.availableTenors as any,
      interestModel: dto.interestModel,
      maxPrincipal: dto.maxPrincipal ?? undefined,
      requireMembership: dto.requireMembership ?? false,
      dueDateRule: dto.dueDateRule,
      gracePeriodDays: dto.gracePeriodDays ?? 0,
      lateFeeType: dto.lateFeeType,
      lateFeeValue: dto.lateFeeValue ?? 0,
      createdBy: existing ? existing.createdBy : dto.updatedBy,
      updatedBy: dto.updatedBy,
    };

    if (existing) {
      await this.repo.update(existing.id, payload);
      return this.repo.findOne({ where: { organizationId } }) as Promise<BnplPlanConfig>;
    }
    const entity = this.repo.create(payload);
    return this.repo.save(entity);
  }
}