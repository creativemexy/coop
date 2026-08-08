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
exports.PlanConfigService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bnpl_plan_config_entity_1 = require("../entities/bnpl-plan-config.entity");
let PlanConfigService = class PlanConfigService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async get(organizationId) {
        return this.repo.findOne({ where: { organizationId } });
    }
    async upsert(organizationId, dto) {
        const existing = await this.repo.findOne({ where: { organizationId } });
        const payload = {
            organizationId,
            availableTenors: dto.availableTenors,
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
            return this.repo.findOne({ where: { organizationId } });
        }
        const entity = this.repo.create(payload);
        return this.repo.save(entity);
    }
};
exports.PlanConfigService = PlanConfigService;
exports.PlanConfigService = PlanConfigService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(bnpl_plan_config_entity_1.BnplPlanConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlanConfigService);
//# sourceMappingURL=plan-config.service.js.map