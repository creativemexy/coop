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
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const account_entity_1 = require("../entities/account.entity");
let AccountsService = class AccountsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto) {
        const existing = await this.repo.findOne({ where: { code: dto.code } });
        if (existing) {
            throw new common_1.BadRequestException(`An account with code "${dto.code}" already exists`);
        }
        const account = this.repo.create({ ...dto, isSystem: false });
        return this.repo.save(account);
    }
    async findAll(organizationId) {
        const where = {};
        if (organizationId)
            where.organizationId = organizationId;
        return this.repo.find({ where, order: { code: 'ASC' } });
    }
    async findById(id) {
        const account = await this.repo.findOne({ where: { id } });
        if (!account)
            throw new common_1.NotFoundException('Account not found');
        return account;
    }
    async findByCode(code) {
        return this.repo.findOne({ where: { code } });
    }
    async update(id, dto) {
        const account = await this.findById(id);
        if (dto.code && dto.code !== account.code) {
            const existing = await this.repo.findOne({ where: { code: dto.code } });
            if (existing) {
                throw new common_1.BadRequestException(`An account with code "${dto.code}" already exists`);
            }
        }
        if (account.isSystem) {
            throw new common_1.BadRequestException('System accounts cannot be edited. Create a new account instead.');
        }
        if (dto.code)
            account.code = dto.code;
        if (dto.name !== undefined)
            account.name = dto.name;
        if (dto.type !== undefined)
            account.type = dto.type;
        if (dto.description !== undefined)
            account.description = dto.description;
        if (dto.isActive !== undefined)
            account.isActive = dto.isActive;
        return this.repo.save(account);
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map