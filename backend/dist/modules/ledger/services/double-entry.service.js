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
exports.DoubleEntryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const journal_entry_entity_1 = require("../entities/journal-entry.entity");
const journal_line_entity_1 = require("../entities/journal-line.entity");
const account_entity_1 = require("../entities/account.entity");
const status_enum_1 = require("../../../common/enums/status.enum");
let DoubleEntryService = class DoubleEntryService {
    entryRepo;
    lineRepo;
    accountRepo;
    constructor(entryRepo, lineRepo, accountRepo) {
        this.entryRepo = entryRepo;
        this.lineRepo = lineRepo;
        this.accountRepo = accountRepo;
    }
    async postEntry(dto) {
        const totalDebits = dto.lines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredits = dto.lines.reduce((sum, l) => sum + l.credit, 0);
        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            throw new common_1.BadRequestException('Journal entry is not balanced. Debits must equal credits.');
        }
        const accountIds = dto.lines.map((l) => l.accountId);
        const existingAccounts = await this.accountRepo.find({
            where: accountIds.map((id) => ({ id })),
        });
        const existingIds = new Set(existingAccounts.map((a) => a.id));
        const missingId = accountIds.find((id) => !existingIds.has(id));
        if (missingId) {
            throw new common_1.BadRequestException(`Account not found: ${missingId}`);
        }
        const entry = this.entryRepo.create({
            description: dto.description,
            entryDate: dto.entryDate,
            status: status_enum_1.JournalStatus.POSTED,
            postedBy: dto.postedBy,
            postedAt: new Date(),
        });
        const savedEntry = await this.entryRepo.save(entry);
        const lines = dto.lines.map((l) => this.lineRepo.create({
            journalEntryId: savedEntry.id,
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            organizationId: l.organizationId,
        }));
        await this.lineRepo.save(lines);
        return this.entryRepo.findOneOrFail({
            where: { id: savedEntry.id },
            relations: { lines: true },
        });
    }
    async findEntries(organizationId) {
        if (organizationId) {
            const entryIds = await this.lineRepo
                .createQueryBuilder('line')
                .select('line.journal_entry_id', 'entry_id')
                .where('line.organization_id = :orgId', { orgId: organizationId })
                .distinct(true)
                .getRawMany();
            const ids = entryIds.map((r) => r.entry_id);
            if (ids.length === 0)
                return [];
            return this.entryRepo.find({
                where: ids.map((id) => ({ id })),
                relations: { lines: true },
                order: { createdAt: 'DESC' },
                take: 100,
            });
        }
        return this.entryRepo.find({
            relations: { lines: true },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
};
exports.DoubleEntryService = DoubleEntryService;
exports.DoubleEntryService = DoubleEntryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(journal_entry_entity_1.JournalEntry)),
    __param(1, (0, typeorm_1.InjectRepository)(journal_line_entity_1.JournalLine)),
    __param(2, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DoubleEntryService);
//# sourceMappingURL=double-entry.service.js.map