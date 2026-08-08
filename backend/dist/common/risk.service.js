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
exports.RiskService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const global_risk_rule_entity_1 = require("../modules/admin/entities/global-risk-rule.entity");
let RiskService = class RiskService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async getRule(key) {
        return this.repo.findOne({ where: { ruleKey: key, enabled: true } });
    }
    async getConfig(key) {
        const rule = await this.getRule(key);
        return rule?.config ?? null;
    }
    async checkMinMax(key, value, field = 'amount') {
        const config = await this.getConfig(key);
        if (!config)
            return null;
        const limit = config[field];
        if (limit === undefined)
            return null;
        return { allowed: value <= limit, limit };
    }
    async checkMin(key, value, field = 'amount') {
        const config = await this.getConfig(key);
        if (!config)
            return null;
        const min = config[field];
        if (min === undefined)
            return null;
        return { allowed: value >= min, min };
    }
    async checkDailyLimit(key, currentDailyTotal) {
        const config = await this.getConfig(key);
        if (!config)
            return null;
        const limit = config.amount;
        if (limit === undefined)
            return null;
        return { allowed: currentDailyTotal < limit, limit };
    }
    async checkCountLimit(key, currentCount) {
        const config = await this.getConfig(key);
        if (!config)
            return null;
        const count = config.count ?? config.amount;
        if (count === undefined)
            return null;
        return { allowed: currentCount < count, limit: count };
    }
};
exports.RiskService = RiskService;
exports.RiskService = RiskService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(global_risk_rule_entity_1.GlobalRiskRule)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RiskService);
//# sourceMappingURL=risk.service.js.map