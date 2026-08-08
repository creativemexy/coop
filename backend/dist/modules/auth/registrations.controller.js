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
exports.RegistrationsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const apex_organization_entity_1 = require("../apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
let RegistrationsController = class RegistrationsController {
    apexRepo;
    orgRepo;
    constructor(apexRepo, orgRepo) {
        this.apexRepo = apexRepo;
        this.orgRepo = orgRepo;
    }
    async getApexOrgs() {
        const orgs = await this.apexRepo.find({
            order: { name: 'ASC' },
        });
        return orgs.map((o) => ({ id: o.id, name: o.name }));
    }
    async getOrgs(apexOrgId) {
        const where = {};
        if (apexOrgId)
            where.apexOrgId = apexOrgId;
        const orgs = await this.orgRepo.find({
            where,
            order: { name: 'ASC' },
        });
        return orgs.map((o) => ({ id: o.id, name: o.name, code: o.code }));
    }
};
exports.RegistrationsController = RegistrationsController;
__decorate([
    (0, common_1.Get)('apex-organizations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "getApexOrgs", null);
__decorate([
    (0, common_1.Get)('organizations'),
    __param(0, (0, common_1.Query)('apexOrgId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RegistrationsController.prototype, "getOrgs", null);
exports.RegistrationsController = RegistrationsController = __decorate([
    (0, common_1.Controller)('api/v1/registrations'),
    __param(0, (0, typeorm_1.InjectRepository)(apex_organization_entity_1.ApexOrganization)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RegistrationsController);
//# sourceMappingURL=registrations.controller.js.map