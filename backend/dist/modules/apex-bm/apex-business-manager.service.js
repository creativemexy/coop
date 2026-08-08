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
exports.ApexBusinessManagerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const apex_organization_entity_1 = require("../apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_entity_1 = require("../users/entities/user.entity");
const fee_share_ledger_entity_1 = require("../ledger/entities/fee-share-ledger.entity");
const fee_pot_entity_1 = require("../ledger/entities/fee-pot.entity");
const status_enum_1 = require("../../common/enums/status.enum");
const role_enum_1 = require("../../common/enums/role.enum");
const encryption_service_1 = require("../../common/encryption.service");
const mask_util_1 = require("../../common/mask.util");
let ApexBusinessManagerService = class ApexBusinessManagerService {
    apexOrgRepo;
    orgRepo;
    userRepo;
    ledgerRepo;
    potRepo;
    constructor(apexOrgRepo, orgRepo, userRepo, ledgerRepo, potRepo) {
        this.apexOrgRepo = apexOrgRepo;
        this.orgRepo = orgRepo;
        this.userRepo = userRepo;
        this.ledgerRepo = ledgerRepo;
        this.potRepo = potRepo;
    }
    async listUsers(apexOrgId, search) {
        const apexOrg = await this.apexOrgRepo.findOne({
            where: { id: apexOrgId },
            relations: { organizations: true },
        });
        const orgs = apexOrg?.organizations || [];
        const orgIds = orgs.map((o) => o.id);
        const qb = this.userRepo.createQueryBuilder('u');
        if (orgIds.length > 0) {
            qb.where('u.apex_org_id = :apexOrgId', { apexOrgId })
                .orWhere('u.organization_id IN (:...orgIds)', { orgIds });
        }
        else {
            qb.where('u.apex_org_id = :apexOrgId', { apexOrgId });
        }
        if (search) {
            qb.andWhere('u.email_hash = :hash', { hash: (0, encryption_service_1.hashForLookup)(search) });
        }
        qb.orderBy('u.created_at', 'DESC');
        const users = await qb.getMany();
        const individualIds = users
            .filter((u) => u.role === role_enum_1.Role.INDIVIDUAL)
            .map((u) => u.id);
        const memberCounts = individualIds.length > 0
            ? await this.userRepo
                .createQueryBuilder('u')
                .select('u.organization_id', 'organizationId')
                .addSelect('COUNT(*)', 'count')
                .where('u.organization_id IN (:...orgIds)', { orgIds })
                .andWhere('u.role = :role', { role: role_enum_1.Role.INDIVIDUAL })
                .groupBy('u.organization_id')
                .getRawMany()
            : [];
        const countMap = new Map(memberCounts.map((m) => [m.organizationId, Number(m.count)]));
        return {
            organizations: orgs.map((o) => ({
                id: o.id,
                name: o.name,
                code: o.code,
                status: o.status,
                memberCount: countMap.get(o.id) || 0,
            })),
            individuals: users
                .filter((u) => u.role === role_enum_1.Role.INDIVIDUAL)
                .map((u) => (0, mask_util_1.maskUser)(u)),
        };
    }
    async getDashboard(apexOrgId) {
        const apexOrg = await this.apexOrgRepo.findOne({
            where: { id: apexOrgId },
        });
        if (!apexOrg)
            throw new Error('Apex organization not found');
        const orgs = await this.orgRepo.find({
            where: { apexOrgId },
            select: { id: true },
        });
        const orgIds = orgs.map((o) => o.id);
        const memberQuery = this.userRepo
            .createQueryBuilder('u')
            .where('u.role = :role', { role: role_enum_1.Role.INDIVIDUAL });
        if (orgIds.length > 0) {
            memberQuery.andWhere('(u.apex_org_id = :apexOrgId OR u.organization_id IN (:...orgIds))', { apexOrgId, orgIds });
        }
        else {
            memberQuery.andWhere('u.apex_org_id = :apexOrgId', { apexOrgId });
        }
        const memberCount = await memberQuery.getCount();
        const feeLedger = await this.ledgerRepo.find({
            where: { apexOrgId, source: status_enum_1.FeeSource.REGISTRATION },
            order: { createdAt: 'DESC' },
            take: 50,
        });
        const totalFees = feeLedger.reduce((s, l) => s + Number(l.totalFee), 0);
        const apexShare = feeLedger.reduce((s, l) => s + Number(l.apexShare), 0);
        const orgShares = feeLedger.reduce((s, l) => s + Number(l.organizationShare), 0);
        const apexPot = await this.potRepo.findOne({ where: { potType: status_enum_1.PotType.APEX, entityId: apexOrgId } });
        const apexBalance = apexPot ? Number(apexPot.balance) : 0;
        return {
            apexOrg: {
                id: apexOrg.id,
                name: apexOrg.name,
                code: apexOrg.code,
                bankName: apexOrg.bankName,
                accountName: apexOrg.accountName,
                accountNumber: apexOrg.accountNumber,
                sortCode: apexOrg.sortCode,
                bankCode: apexOrg.bankCode,
            },
            stats: { organizations: orgIds.length, members: memberCount },
            fees: { totalFees, apexShare, orgShares, apexBalance, ledgerEntries: feeLedger.length },
            recentLedger: feeLedger.slice(0, 10),
        };
    }
    async updateBankDetails(apexOrgId, dto) {
        await this.apexOrgRepo.update(apexOrgId, dto);
        return this.apexOrgRepo.findOne({ where: { id: apexOrgId } });
    }
};
exports.ApexBusinessManagerService = ApexBusinessManagerService;
exports.ApexBusinessManagerService = ApexBusinessManagerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(apex_organization_entity_1.ApexOrganization)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(fee_share_ledger_entity_1.FeeShareLedger)),
    __param(4, (0, typeorm_1.InjectRepository)(fee_pot_entity_1.FeePot)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ApexBusinessManagerService);
//# sourceMappingURL=apex-business-manager.service.js.map