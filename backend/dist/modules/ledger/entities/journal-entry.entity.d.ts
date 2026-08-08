import { JournalStatus } from '../../../common/enums/status.enum';
import { JournalLine } from './journal-line.entity';
export declare class JournalEntry {
    id: string;
    lines: JournalLine[];
    description: string;
    entryDate: Date;
    status: JournalStatus;
    postedBy: string;
    createdAt: Date;
    postedAt: Date;
}
