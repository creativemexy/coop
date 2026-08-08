"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bnpl_plan_entity_1 = require("../entities/bnpl-plan.entity");
const compliance_service_1 = require("./compliance.service");
let PlansService = class PlansService {
    repo;
    complianceService;
    constructor(repo, complianceService) {
        this.repo = repo;
        this.complianceService = complianceService;
    }
    async create(dto) {
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
            interestType: dto.interestType || bnpl_plan_entity_1.InterestType.FLAT,
            interestRate: dto.interestRate || 0,
            monthlyFeeRate: dto.monthlyFeeRate,
            gracePeriodDays: dto.gracePeriodDays || 0,
            lateFeeRate: dto.lateFeeRate || 0,
            lateFeeCapDays: dto.lateFeeCapDays,
            isEnabled: dto.isEnabled !== false,
            createdBy: dto.createdBy,
            status: bnpl_plan_entity_1.PlanStatus.ACTIVE,
            version: 1,
        });
        const saved = await this.repo.save(plan);
        await this.complianceService.logAction({
            entityType: 'plan',
            entityId: saved.id,
            action: 'create',
            changes: {
                catalogItemId: { from: null, to: saved.catalogItemId },
                tenorOptions: { from: null, to: saved.tenorOptions },
                minPrincipal: { from: null, to: saved.minPrincipal },
                maxPrincipal: { from: null, to: saved.maxPrincipal },
                interestType: { from: null, to: saved.interestType },
                interestRate: { from: null, to: saved.interestRate },
            },
            performedBy: dto.createdBy,
        });
        return saved;
    }
    async findAllByOrg(organizationId) {
        const where = { status: bnpl_plan_entity_1.PlanStatus.ACTIVE };
        if (organizationId) {
            where.organizationId = organizationId;
        }
        return this.repo.find({
            where,
            relations: { catalogItem: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findById(id) {
        const plan = await this.repo.findOne({
            where: { id },
            relations: { catalogItem: true },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Plan not found');
        }
        return plan;
    }
    async update(id, dto) {
        const existing = await this.findById(id);
        const changes = {};
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
    async getVersionHistory(id) {
        return this.complianceService.listAuditLogs({ entityType: 'plan', entityId: id });
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_plan_entity_1.BnplPlan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        compliance_service_1.ComplianceService])
], PlansService);
//# sourceMappingURL=plans.service.js.map