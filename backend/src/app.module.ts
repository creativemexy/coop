import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Config
import appConfig, { smtpConfig } from './config/app.config';
import jwtConfig from './config/jwt.config';
import databaseConfig from './database/config/database.config';

// Common
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TenantScopeGuard } from './common/guards/tenant-scope.guard';
import { CsrfGuard } from './common/guards/csrf.guard';
import { MaintenanceGuard } from './common/guards/maintenance.guard';
import { EncryptionService } from './common/encryption.service';
import { setEncryptionInstance } from './common/encryption.transformer';
import { RetentionModule } from './common/retention.module';
import { RiskModule } from './common/risk.module';
import { AuditLog } from './common/entities/audit-log.entity';
import { MonitoringModule } from './common/monitoring/monitoring.module';
import { BootstrapAdminService } from './bootstrap-admin.service';

// Admin entities
import { PolicyTemplate } from './modules/admin/entities/policy-template.entity';
import { TenantOnboardingRequest } from './modules/admin/entities/tenant-onboarding-request.entity';
import { FeatureFlag } from './modules/admin/entities/feature-flag.entity';
import { Incident } from './modules/admin/entities/incident.entity';
import { GlobalSecurityConfig } from './modules/admin/entities/global-security-config.entity';
import { Secret } from './modules/admin/entities/secret.entity';
import { Dispute } from './modules/admin/entities/dispute.entity';
import { GlobalRiskRule } from './modules/admin/entities/global-risk-rule.entity';
import { NotificationTemplate } from './modules/admin/entities/notification-template.entity';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ApexOrganizationsModule } from './modules/apex-organizations/apex-organizations.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { BnplModule } from './modules/bnpl/bnpl.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { KycModule } from './modules/kyc/kyc.module';
import { SmsModule } from './modules/sms/sms.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BusinessManagerModule } from './modules/business-manager/business-manager.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SavingsModule } from './modules/savings/savings.module';
import { LoansModule } from './modules/loans/loans.module';
import { SupportModule } from './modules/support/support.module';
import { AdminModule } from './modules/admin/admin.module';
import { AccountantModule } from './modules/accountant/accountant.module';
import { BrandingModule } from './modules/branding/branding.module';
import { ApexBusinessManagerModule } from './modules/apex-bm/apex-business-manager.module';
import { EmailModule } from './modules/email/email.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { FirstVirtualModule } from './modules/first-virtual/first-virtual.module';

// Entities
import { ApexOrganization } from './modules/apex-organizations/entities/apex-organization.entity';
import { Organization } from './modules/organizations/entities/organization.entity';
import { User } from './modules/users/entities/user.entity';
import { KycSubmission } from './modules/kyc/entities/kyc-submission.entity';
import { BnplCatalogItem } from './modules/bnpl/entities/bnpl-catalog-item.entity';
import { BnplCatalogOrgEligibility } from './modules/bnpl/entities/bnpl-catalog-org-eligibility.entity';
import { BnplPlan } from './modules/bnpl/entities/bnpl-plan.entity';
import { BnplSubscription } from './modules/bnpl/entities/bnpl-subscription.entity';
import { BnplInstallment } from './modules/bnpl/entities/bnpl-installment.entity';
import { RiskFlag } from './modules/bnpl/entities/risk-flag.entity';
import { ExceptionReason } from './modules/bnpl/entities/exception-reason.entity';
import { AuditLog as BnplAuditLog } from './modules/bnpl/entities/audit-log.entity';
import { ApprovalRequest } from './modules/bnpl/entities/approval-request.entity';
import { BnplPlanConfig } from './modules/bnpl/entities/bnpl-plan-config.entity';
import { Payment } from './modules/payments/entities/payment.entity';
import { Account } from './modules/ledger/entities/account.entity';
import { JournalEntry } from './modules/ledger/entities/journal-entry.entity';
import { JournalLine } from './modules/ledger/entities/journal-line.entity';
import { FeeShareLedger } from './modules/ledger/entities/fee-share-ledger.entity';
import { FeePot } from './modules/ledger/entities/fee-pot.entity';
import { FeeWithdrawalRequest } from './modules/ledger/entities/fee-withdrawal-request.entity';
import { SmsLog } from './modules/sms/entities/sms-log.entity';
import { AppSetting } from './modules/settings/entities/app-setting.entity';
import { SavingsAccount } from './modules/savings/entities/savings-account.entity';
import { SavingsTransaction } from './modules/savings/entities/savings-transaction.entity';
import { Loan } from './modules/loans/entities/loan.entity';
import { LoanRepayment } from './modules/loans/entities/loan-repayment.entity';
import { LoginHistory } from './modules/auth/entities/login-history.entity';
import { InAppNotification } from './modules/notifications/entities/in-app-notification.entity';
import { SavedPaymentMethod } from './modules/payment-methods/entities/saved-payment-method.entity';
import { Referral } from './modules/users/entities/referral.entity';
import { UserActivity } from './modules/users/entities/user-activity.entity';
import { WebhookLog } from './modules/payments/entities/webhook-log.entity';
import { SupportTicket } from './modules/bnpl/entities/support-ticket.entity';
import { TicketMessage } from './modules/support/entities/ticket-message.entity';
import { ProcessingStep } from './modules/bnpl/entities/processing-step.entity';
import { IdempotencyKey } from './modules/bnpl/entities/idempotency-key.entity';
import { CollectionQueue } from './modules/bnpl/entities/collection-queue.entity';
import { ReconciliationRun } from './modules/accountant/entities/reconciliation-run.entity';
import { ReconciliationResult } from './modules/accountant/entities/reconciliation-result.entity';
import { AdjustmentRequest } from './modules/accountant/entities/adjustment-request.entity';
import { InvestmentsModule } from './modules/investments/investments.module';
import { InvestmentProduct } from './modules/investments/entities/investment-product.entity';
import { InvestmentProductVersion } from './modules/investments/entities/investment-product-version.entity';
import { InvestmentEligibilityRule } from './modules/investments/entities/investment-eligibility-rule.entity';
import { ShareIssuanceCycle } from './modules/investments/entities/share-issuance-cycle.entity';
import { InvestmentOrder } from './modules/investments/entities/investment-order.entity';
import { InvestmentHolding } from './modules/investments/entities/investment-holding.entity';
import { Distribution } from './modules/investments/entities/distribution.entity';
import { DistributionPayment } from './modules/investments/entities/distribution-payment.entity';
import { DistributionRun } from './modules/investments/entities/distribution-run.entity';
import { RedemptionRequest } from './modules/investments/entities/redemption-request.entity';
import { PricingConfig } from './modules/investments/entities/pricing-config.entity';
import { NavSnapshot } from './modules/investments/entities/nav-snapshot.entity';
import { CorporateAction } from './modules/investments/entities/corporate-action.entity';
import { BnplCatalogImage } from './modules/bnpl/entities/bnpl-catalog-image.entity';
import { CollectionPriority } from './modules/bnpl/entities/collection-priority.entity';
import { ExceptionCase } from './modules/bnpl/entities/exception-case.entity';
import { CollectionPlaybook } from './modules/bnpl/entities/collection-playbook.entity';
import { DeviceSession } from './modules/auth/entities/device-session.entity';
import { VirtualAccount } from './modules/first-virtual/entities/virtual-account.entity';
import { PendingDeposit } from './modules/first-virtual/entities/pending-deposit.entity';

const entities = [
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
  ApexOrganization,
  Organization,
  User,
  KycSubmission,
  BnplCatalogItem,
  BnplCatalogOrgEligibility,
  BnplPlan,
  BnplSubscription,
  BnplInstallment,
  Payment,
  Account,
  JournalEntry,
  JournalLine,
  FeeShareLedger,
  FeePot,
  FeeWithdrawalRequest,
  SmsLog,
  AppSetting,
  SavingsAccount,
  SavingsTransaction,
  Loan,
  LoanRepayment,
  RiskFlag,
  ExceptionReason,
  BnplAuditLog,
  ApprovalRequest,
  BnplPlanConfig,
  LoginHistory,
  InAppNotification,
  SavedPaymentMethod,
  Referral,
  UserActivity,
  WebhookLog,
  SupportTicket,
  TicketMessage,
  ProcessingStep,
  IdempotencyKey,
  CollectionQueue,
  BnplCatalogImage,
  CollectionPriority,
  ExceptionCase,
  CollectionPlaybook,
  DeviceSession,
  PolicyTemplate,
  TenantOnboardingRequest,
  FeatureFlag,
  Incident,
  GlobalSecurityConfig,
  Secret,
  Dispute,
  GlobalRiskRule,
  NotificationTemplate,
  ReconciliationRun,
  ReconciliationResult,
  AdjustmentRequest,
  AuditLog,
  VirtualAccount,
  PendingDeposit,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, databaseConfig, smtpConfig],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ limit: 100, ttl: 60000 }],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: entities,
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
      }),
    }),
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([User]),
    ApexOrganizationsModule,
    OrganizationsModule,
    BnplModule,
    PaymentsModule,
    LedgerModule,
    KycModule,
    SmsModule,
    DashboardModule,
    BusinessManagerModule,
    SettingsModule,
    SavingsModule,
    LoansModule,
    SupportModule,
    AdminModule,
    AccountantModule,
    InvestmentsModule,
    BrandingModule,
    ApexBusinessManagerModule,
    EmailModule,
    NotificationsModule,
    PaymentMethodsModule,
    FirstVirtualModule,
    RetentionModule,
    RiskModule,
    MonitoringModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    EncryptionService,
    BootstrapAdminService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantScopeGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly encryption: EncryptionService) {}

  onModuleInit(): void {
    setEncryptionInstance(this.encryption);
  }
}
