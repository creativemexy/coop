import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersModule } from '../users/users.module';
import { BnplModule } from '../bnpl/bnpl.module';
import { LedgerModule } from '../ledger/ledger.module';
import { SavingsModule } from '../savings/savings.module';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { LoansModule } from '../loans/loans.module';
import { Loan } from '../loans/entities/loan.entity';
import { InvestmentsModule } from '../investments/investments.module';
import { User } from '../users/entities/user.entity';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplPlanConfig } from '../bnpl/entities/bnpl-plan-config.entity';
import { Payment } from '../payments/entities/payment.entity';
import { JournalEntry } from '../ledger/entities/journal-entry.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';
import { SupportTicket } from '../bnpl/entities/support-ticket.entity';
import { TicketMessage } from '../support/entities/ticket-message.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ApexOrganization,
      Organization,
      BnplPlan,
      BnplCatalogItem,
      BnplSubscription,
      BnplInstallment,
      BnplPlanConfig,
      Payment,
      JournalEntry,
      FeePot,
      SupportTicket,
      TicketMessage,
      SavingsTransaction,
      SavingsAccount,
      Loan,
    ]),
    UsersModule,
    BnplModule,
    LedgerModule,
    SavingsModule,
    LoansModule,
    InvestmentsModule,
    RealtimeModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
