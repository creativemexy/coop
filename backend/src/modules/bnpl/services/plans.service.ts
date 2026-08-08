import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BnplPlan, InterestType, PlanStatus } from '../entities/bnpl-plan.entity';
import { ComplianceService } from './compliance.service';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(BnplPlan)
    private readonly repo: Repository<BnplPlan>,
    private readonly complianceService: ComplianceService,
  ) {}

  async create(dto: {
    organizationId: string;
    catalogItemId: string;
    tenorOptions?: number[];
    minPrincipal?: number;
    maxPrincipal?: number;
    eligibilityBands?: Array<{ minScore: number; maxScore: number; maxPrincipal: number }>;
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
  }): Promise<BnplPlan> {
    const plan = this.repo.create({
      organizationId: dto.organizationId,
      catalogItemId: dto.catalogItemId,
      tenorOptions: dto.tenorOptions || [3, 6, 9, 12],
      minPrincipal: dto.minPrincipal,
      maxPrincipal: dto.maxPrincipal,
      eligibilityBands: dto.eligibilityBands,
      downPaymentPercent: dto.downPaymentPercent,
      installmentCount: dto.installmentCount,
      installmentFrequency: dto.installmentFrequency,
      interestType: dto.interestType || InterestType.FLAT,
      interestRate: dto.interestRate || 0,
      monthlyFeeRate: dto.monthlyFeeRate,
      gracePeriodDays: dto.gracePeriodDays || 0,
      lateFeeRate: dto.lateFeeRate || 0,
      lateFeeCapDays: dto.lateFeeCapDays,
      isEnabled: dto.isEnabled !== false,
      createdBy: dto.createdBy,
      status: PlanStatus.ACTIVE,
      version: 1,
    });
    const saved = await this.repo.save(plan);

    // Log creation to audit
    await this.complianceService.logAction({
      entityType: 'plan',
      entityId: saved.id,
      action: 'create',
      changes: {
        catalogItemId: { from: null as any, to: saved.catalogItemId },
        tenorOptions: { from: null as any, to: saved.tenorOptions },
        minPrincipal: { from: null as any, to: saved.minPrincipal },
        maxPrincipal: { from: null as any, to: saved.maxPrincipal },
        interestType: { from: null as any, to: saved.interestType },
        interestRate: { from: null as any, to: saved.interestRate },
      },
      performedBy: dto.createdBy,
    });

    return saved;
  }

  async findAllByOrg(organizationId?: string): Promise<BnplPlan[]> {
    const where: any = { status: PlanStatus.ACTIVE };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.repo.find({
      where,
      relations: { catalogItem: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<BnplPlan> {
    const plan = await this.repo.findOne({
      where: { id },
      relations: { catalogItem: true },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return plan;
  }

  async update(
    id: string,
    dto: {
      status?: PlanStatus;
      isEnabled?: boolean;
      tenorOptions?: number[];
      minPrincipal?: number;
      maxPrincipal?: number;
      eligibilityBands?: Array<{ minScore: number; maxScore: number; maxPrincipal: number }>;
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
    },
  ): Promise<BnplPlan> {
    const existing = await this.findById(id);
    const changes: Record<string, { from: any; to: any }> = {};

    if (dto.tenorOptions !== undefined && dto.tenorOptions !== existing.tenorOptions) {
      changes.tenorOptions = { from: existing.tenorOptions, to: dto.tenorOptions };
    }
    if (dto.minPrincipal !== undefined && dto.minPrincipal !== existing.minPrincipal) {
      changes.minPrincipal = { from: existing.minPrincipal, to: dto.minPrincipal };
    }
    if (dto.maxPrincipal !== undefined && dto.maxPrincipal !== existing.maxPrincipal) {
      changes.maxPrincipal = { from: existing.maxPrincipal, to: dto.maxPrincipal };
    }
    if (dto.interestType !== undefined && dto.interestType !== existing.interestType) {
      changes.interestType = { from: existing.interestType, to: dto.interestType };
    }
    if (dto.interestRate !== undefined && dto.interestRate !== existing.interestRate) {
      changes.interestRate = { from: existing.interestRate, to: dto.interestRate };
    }

    const updatedPlan = {
      ...existing,
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }),
      ...(dto.tenorOptions !== undefined && { tenorOptions: dto.tenorOptions }),
      ...(dto.minPrincipal !== undefined && { minPrincipal: dto.minPrincipal }),
      ...(dto.maxPrincipal !== undefined && { maxPrincipal: dto.maxPrincipal }),
      ...(dto.eligibilityBands !== undefined && { eligibilityBands: dto.eligibilityBands }),
      ...(dto.downPaymentPercent !== undefined && { downPaymentPercent: dto.downPaymentPercent }),
      ...(dto.installmentCount !== undefined && { installmentCount: dto.installmentCount }),
      ...(dto.installmentFrequency !== undefined && { installmentFrequency: dto.installmentFrequency }),
      ...(dto.interestType !== undefined && { interestType: dto.interestType }),
      ...(dto.interestRate !== undefined && { interestRate: dto.interestRate }),
      ...(dto.monthlyFeeRate !== undefined && { monthlyFeeRate: dto.monthlyFeeRate }),
      ...(dto.gracePeriodDays !== undefined && { gracePeriodDays: dto.gracePeriodDays }),
      ...(dto.lateFeeRate !== undefined && { lateFeeRate: dto.lateFeeRate }),
      ...(dto.lateFeeCapDays !== undefined && { lateFeeCapDays: dto.lateFeeCapDays }),
      version: existing.version + 1,
    };

    await this.repo.update(id, updatedPlan);
    const saved = await this.findById(id);

    // Log update to audit if changes were made
    if (Object.keys(changes).length > 0 && dto.updatedBy) {
      await this.complianceService.logAction({
        entityType: 'plan',
        entityId: id,
        action: 'update',
        changes,
        performedBy: dto.updatedBy,
      });
    }

    return saved;
  }

  async getVersionHistory(id: string) {
    return this.complianceService.listAuditLogs({ entityType: 'plan', entityId: id });
  }
}
