import { Repository } from 'typeorm';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalLine } from '../entities/journal-line.entity';
import { Account } from '../entities/account.entity';
export declare class DoubleEntryService {
    private readonly entryRepo;
    private readonly lineRepo;
    private readonly accountRepo;
    constructor(entryRepo: Repository<JournalEntry>, lineRepo: Repository<JournalLine>, accountRepo: Repository<Account>);
    postEntry(dto: {
        description: string;
        entryDate: Date;
        postedBy: string;
        lines: Array<{
            accountId: string;
            debit: number;
            credit: number;
            organizationId?: string;
        }>;
    }): Promise<JournalEntry>;
    findEntries(organizationId?: string): Promise<JournalEntry[]>;
}
