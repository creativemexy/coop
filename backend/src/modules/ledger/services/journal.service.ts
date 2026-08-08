import { Injectable } from '@nestjs/common';
import { DoubleEntryService } from './double-entry.service';

@Injectable()
export class JournalService {
  constructor(private readonly doubleEntry: DoubleEntryService) {}

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
  }) {
    return this.doubleEntry.postEntry(dto);
  }

  async findEntries(organizationId?: string) {
    return this.doubleEntry.findEntries(organizationId);
  }
}
