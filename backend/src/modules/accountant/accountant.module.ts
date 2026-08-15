import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountantController } from './accountant.controller';
import { AccountantService } from './accountant.service';
import { AuthModule } from '../auth/auth.module';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { FeeShareLedger } from '../ledger/entities/fee-share-ledger.entity';
import { FeePot } from '../ledger/entities/fee-pot.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { ReconciliationRun } from './entities/reconciliation-run.entity';
import { ReconciliationResult } from './entities/reconciliation-result.entity';
import { AdjustmentRequest } from './entities/adjustment-request.entity';
import { Loan } from '../loans/entities/loan.entity';
import { LoanRepayment } from '../loans/entities/loan-repayment.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { JournalEntry } from '../ledger/entities/journal-entry.entity';
import { JournalLine } from '../ledger/entities/journal-line.entity';
import { Distribution } from '../investments/entities/distribution.entity';
import { FeeWithdrawalRequest } from '../ledger/entities/fee-withdrawal-request.entity';
import { ApexOrganization } from '../apex-organizations/entities/apex-organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BnplSubscription,
      BnplInstallment,
      BnplPlan,
      BnplCatalogItem,
      Payment,
      FeeShareLedger,
      Organization,
      User,
      AuditLog,
      ReconciliationRun,
      ReconciliationResult,
      AdjustmentRequest,
      Loan,
      LoanRepayment,
      SavingsAccount,
      SavingsTransaction,
      JournalEntry,
      JournalLine,
      FeePot,
      Distribution,
      FeeWithdrawalRequest,
      ApexOrganization,
    ]),
    AuthModule,
  ],
  controllers: [AccountantController],
  providers: [AccountantService],
})
export class AccountantModule {}
