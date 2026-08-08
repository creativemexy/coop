import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AccountsController } from './controllers/accounts.controller';
import { JournalController } from './controllers/journal.controller';
import { FeePotsController } from './controllers/fee-pots.controller';
import { AccountsService } from './services/accounts.service';
import { JournalService } from './services/journal.service';
import { DoubleEntryService } from './services/double-entry.service';
import { FeeShareService } from './services/fee-share.service';
import { FeePotService } from './services/fee-pot.service';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import { FeeShareLedger } from './entities/fee-share-ledger.entity';
import { FeePot } from './entities/fee-pot.entity';
import { FeeWithdrawalRequest } from './entities/fee-withdrawal-request.entity';
import { UsersModule } from '../users/users.module';
import { Organization } from '../organizations/entities/organization.entity';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { PaystackClient } from '../payments/providers/paystack/paystack.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      JournalEntry,
      JournalLine,
      FeeShareLedger,
      FeePot,
      FeeWithdrawalRequest,
      Organization,
      ApexOrganization,
    ]),
    HttpModule,
    UsersModule,
  ],
  controllers: [AccountsController, JournalController, FeePotsController],
  providers: [
    AccountsService,
    JournalService,
    DoubleEntryService,
    FeeShareService,
    FeePotService,
    PaystackClient,
  ],
  exports: [
    AccountsService,
    JournalService,
    DoubleEntryService,
    FeeShareService,
    FeePotService,
  ],
})
export class LedgerModule {}
