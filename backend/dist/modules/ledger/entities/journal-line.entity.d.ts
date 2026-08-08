import { JournalEntry } from './journal-entry.entity';
export declare class JournalLine {
    id: string;
    journalEntry: JournalEntry;
    journalEntryId: string;
    accountId: string;
    debit: number;
    credit: number;
    organizationId: string;
    createdAt: Date;
}
