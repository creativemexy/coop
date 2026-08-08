import { DoubleEntryService } from './double-entry.service';
export declare class JournalService {
    private readonly doubleEntry;
    constructor(doubleEntry: DoubleEntryService);
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
    }): Promise<import("../entities/journal-entry.entity").JournalEntry>;
    findEntries(organizationId?: string): Promise<import("../entities/journal-entry.entity").JournalEntry[]>;
}
