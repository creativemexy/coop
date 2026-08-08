import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessManagerController } from './business-manager.controller';
import { BusinessManagerService } from './business-manager.service';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { BnplCatalogItem } from '../bnpl/entities/bnpl-catalog-item.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SmsLog } from '../sms/entities/sms-log.entity';
import { DashboardModule } from '../dashboard/dashboard.module';
import { BnplModule } from '../bnpl/bnpl.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BnplSubscription,
      BnplInstallment,
      BnplPlan,
      BnplCatalogItem,
      AuditLog,
      Payment,
      SmsLog,
    ]),
    DashboardModule,
    BnplModule,
    UsersModule,
  ],
  controllers: [BusinessManagerController],
  providers: [BusinessManagerService],
})
export class BusinessManagerModule {}
