import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { AuthModule } from '../auth/auth.module';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { AppSetting } from '../settings/entities/app-setting.entity';
import { WebhookLog } from '../payments/entities/webhook-log.entity';
import { ProcessingStep } from '../bnpl/entities/processing-step.entity';
import { AuditLog } from '../bnpl/entities/audit-log.entity';
import { BnplInstallment } from '../bnpl/entities/bnpl-installment.entity';
import { BnplSubscription } from '../bnpl/entities/bnpl-subscription.entity';
import { BnplPlan } from '../bnpl/entities/bnpl-plan.entity';
import { Payment } from '../payments/entities/payment.entity';
import { InvestmentOrder } from '../investments/entities/investment-order.entity';
import { InvestmentHolding } from '../investments/entities/investment-holding.entity';
import { PolicyTemplate } from './entities/policy-template.entity';
import { TenantOnboardingRequest } from './entities/tenant-onboarding-request.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { Incident } from './entities/incident.entity';
import { GlobalSecurityConfig } from './entities/global-security-config.entity';
import { Secret } from './entities/secret.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { GlobalRiskRule } from './entities/global-risk-rule.entity';
import { Dispute } from './entities/dispute.entity';
import { KycSubmission } from '../kyc/entities/kyc-submission.entity';
import { SavingsAccount } from '../savings/entities/savings-account.entity';
import { SavingsTransaction } from '../savings/entities/savings-transaction.entity';
import { Loan } from '../loans/entities/loan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      AppSetting,
      WebhookLog,
      ProcessingStep,
      AuditLog,
      BnplInstallment,
      BnplSubscription,
      BnplPlan,
      Payment,
      InvestmentOrder,
      InvestmentHolding,
      PolicyTemplate,
      TenantOnboardingRequest,
      FeatureFlag,
      Incident,
      GlobalSecurityConfig,
      Secret,
      NotificationTemplate,
      GlobalRiskRule,
      Dispute,
      KycSubmission,
      SavingsAccount,
      SavingsTransaction,
      Loan,
    ]),
    AuthModule,
  ],
  controllers: [AdminController, SuperAdminController],
  providers: [AdminService, SuperAdminService],
})
export class AdminModule {}
