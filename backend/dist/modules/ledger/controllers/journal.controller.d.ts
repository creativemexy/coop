import { JournalService } from '../services/journal.service';
export declare class JournalController {
    private readonly service;
    constructor(service: JournalService);
    postEntry(dto: {
        description: string;
        entryDate: string;
        lines: Array<{
            accountId: string;
            debit: number;
            credit: number;
            organizationId?: string;
        }>;
    }, user: any): Promise<import("../entities/journal-entry.entity").JournalEntry>;
    findEntries(user: any): Promise<import("../entities/journal-entry.entity").JournalEntry[]>;
}
