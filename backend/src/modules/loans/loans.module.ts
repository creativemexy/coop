import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { Loan } from './entities/loan.entity';
import { LoanRepayment } from './entities/loan-repayment.entity';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SavingsModule } from '../savings/savings.module';
import { UsersModule } from '../users/users.module';
import { RetentionModule } from '../../common/retention.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan, LoanRepayment, SavingsTransaction, SavingsAccount]),
    SavingsModule,
    UsersModule,
    RetentionModule,
  ],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
