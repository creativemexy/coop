import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DoubleEntryService } from './double-entry.service';
import { JournalEntry } from '../entities/journal-entry.entity';
import { JournalLine } from '../entities/journal-line.entity';
import { Account } from '../entities/account.entity';
import { JournalStatus } from '../../../common/enums/status.enum';

describe('DoubleEntryService', () => {
  let service: DoubleEntryService;
  let entryRepo: jest.Mocked<Repository<JournalEntry>>;
  let lineRepo: jest.Mocked<Repository<JournalLine>>;
  let accountRepo: jest.Mocked<Repository<Account>>;

  const mockAccount = { id: 'acct-1', code: '1000' } as Account;
  const mockEntry = {
    id: 'entry-1',
    description: 'Test entry',
    status: JournalStatus.POSTED,
    lines: [],
  } as JournalEntry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoubleEntryService,
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(JournalLine),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DoubleEntryService>(DoubleEntryService);
    entryRepo = module.get(getRepositoryToken(JournalEntry));
    lineRepo = module.get(getRepositoryToken(JournalLine));
    accountRepo = module.get(getRepositoryToken(Account));
  });

  describe('postEntry', () => {
    it('should throw if debits != credits', async () => {
      await expect(
        service.postEntry({
          description: 'Unbalanced',
          entryDate: new Date(),
          postedBy: 'user-1',
          lines: [
            { accountId: 'acct-1', debit: 100, credit: 0 },
            { accountId: 'acct-2', debit: 0, credit: 50 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if account does not exist', async () => {
      accountRepo.find.mockResolvedValue([]);
      await expect(
        service.postEntry({
          description: 'Missing account',
          entryDate: new Date(),
          postedBy: 'user-1',
          lines: [
            { accountId: 'missing', debit: 100, credit: 0 },
            { accountId: 'acct-2', debit: 0, credit: 100 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should post balanced entry with valid accounts', async () => {
      accountRepo.find.mockResolvedValue([
        { id: 'acct-1' } as Account,
        { id: 'acct-2' } as Account,
      ]);
      entryRepo.create.mockReturnValue(mockEntry);
      entryRepo.save.mockResolvedValue(mockEntry);
      entryRepo.findOneOrFail.mockResolvedValue(mockEntry);
      lineRepo.create.mockReturnValue({} as JournalLine);
      lineRepo.save.mockResolvedValue([]);

      const result = await service.postEntry({
        description: 'Balanced entry',
        entryDate: new Date(),
        postedBy: 'user-1',
        lines: [
          { accountId: 'acct-1', debit: 100, credit: 0 },
          { accountId: 'acct-2', debit: 0, credit: 100 },
        ],
      });

      expect(result.id).toBe('entry-1');
      expect(entryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: JournalStatus.POSTED }),
      );
    });
  });
});
