import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { VirtualAccount } from './entities/virtual-account.entity';
import { PendingDeposit } from './entities/pending-deposit.entity';
import { VirtualAccountsService } from './virtual-accounts.service';
import { VirtualAccountsController } from './virtual-accounts.controller';
import { VirtualAccountWebhookController } from './virtual-account-webhook.controller';
import { FirstCheckoutClient } from './firstcheckout.client';
import { SavingsModule } from '../savings/savings.module';
import { LoansModule } from '../loans/loans.module';
import { InvestmentsModule } from '../investments/investments.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VirtualAccount, User, PendingDeposit]),
    HttpModule,
    SavingsModule,
    LoansModule,
    forwardRef(() => InvestmentsModule),
  ],
  controllers: [VirtualAccountsController, VirtualAccountWebhookController],
  providers: [VirtualAccountsService, FirstCheckoutClient],
  exports: [VirtualAccountsService],
})
export class FirstVirtualModule {}
