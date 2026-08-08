import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { InvestmentProduct } from './entities/investment-product.entity';
import { InvestmentProductVersion } from './entities/investment-product-version.entity';
import { InvestmentEligibilityRule } from './entities/investment-eligibility-rule.entity';
import { ShareIssuanceCycle } from './entities/share-issuance-cycle.entity';
import { InvestmentOrder } from './entities/investment-order.entity';
import { InvestmentHolding } from './entities/investment-holding.entity';
import { Distribution } from './entities/distribution.entity';
import { DistributionPayment } from './entities/distribution-payment.entity';
import { RedemptionRequest } from './entities/redemption-request.entity';
import { PricingConfig } from './entities/pricing-config.entity';
import { NavSnapshot } from './entities/nav-snapshot.entity';
import { CorporateAction } from './entities/corporate-action.entity';
import { DistributionRun } from './entities/distribution-run.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvestmentProduct,
      InvestmentProductVersion,
      InvestmentEligibilityRule,
      ShareIssuanceCycle,
      InvestmentOrder,
      InvestmentHolding,
      Distribution,
      DistributionPayment,
      DistributionRun,
      RedemptionRequest,
      PricingConfig,
      NavSnapshot,
      CorporateAction,
      Payment,
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
