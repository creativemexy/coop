import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalLine } from '../entities/journal-line.entity';
import { Account } from '../entities/account.entity';
import { JournalStatus } from '../../../common/enums/status.enum';

@Injectable()
export class DoubleEntryService {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly entryRepo: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private readonly lineRepo: Repository<JournalLine>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {}

  async postEntry(dto: {
    description: string;
    entryDate: Date;
    postedBy: string;
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      organizationId?: string;
    }>;
  }): Promise<JournalEntry> {
    const totalDebits = dto.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredits = dto.lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new BadRequestException(
        'Journal entry is not balanced. Debits must equal credits.',
      );
    }

    const accountIds = dto.lines.map((l) => l.accountId);
    const existingAccounts = await this.accountRepo.find({
      where: accountIds.map((id) => ({ id })),
    });
    const existingIds = new Set(existingAccounts.map((a) => a.id));
    const missingId = accountIds.find((id) => !existingIds.has(id));
    if (missingId) {
      throw new BadRequestException(`Account not found: ${missingId}`);
    }

    const entry = this.entryRepo.create({
      description: dto.description,
      entryDate: dto.entryDate,
      status: JournalStatus.POSTED,
      postedBy: dto.postedBy,
      postedAt: new Date(),
    });
    const savedEntry = await this.entryRepo.save(entry);

    const lines = dto.lines.map((l) =>
      this.lineRepo.create({
        journalEntryId: savedEntry.id,
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        organizationId: l.organizationId,
      }),
    );
    await this.lineRepo.save(lines);

    return this.entryRepo.findOneOrFail({
      where: { id: savedEntry.id },
      relations: { lines: true },
    });
  }

  async findEntries(organizationId?: string): Promise<JournalEntry[]> {
    if (organizationId) {
      const entryIds = await this.lineRepo
        .createQueryBuilder('line')
        .select('line.journal_entry_id', 'entry_id')
        .where('line.organization_id = :orgId', { orgId: organizationId })
        .distinct(true)
        .getRawMany();

      const ids = entryIds.map((r: { entry_id: string }) => r.entry_id);

      if (ids.length === 0) return [];

      return this.entryRepo.find({
        where: ids.map((id: string) => ({ id })),
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
}
