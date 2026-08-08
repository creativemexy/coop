"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const app_config_1 = __importStar(require("./config/app.config"));
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
const database_config_1 = __importDefault(require("./database/config/database.config"));
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const tenant_scope_guard_1 = require("./common/guards/tenant-scope.guard");
const csrf_guard_1 = require("./common/guards/csrf.guard");
const maintenance_guard_1 = require("./common/guards/maintenance.guard");
const encryption_service_1 = require("./common/encryption.service");
const encryption_transformer_1 = require("./common/encryption.transformer");
const retention_module_1 = require("./common/retention.module");
const risk_module_1 = require("./common/risk.module");
const audit_log_entity_1 = require("./common/entities/audit-log.entity");
const monitoring_module_1 = require("./common/monitoring/monitoring.module");
const bootstrap_admin_service_1 = require("./bootstrap-admin.service");
const policy_template_entity_1 = require("./modules/admin/entities/policy-template.entity");
const tenant_onboarding_request_entity_1 = require("./modules/admin/entities/tenant-onboarding-request.entity");
const feature_flag_entity_1 = require("./modules/admin/entities/feature-flag.entity");
const incident_entity_1 = require("./modules/admin/entities/incident.entity");
const global_security_config_entity_1 = require("./modules/admin/entities/global-security-config.entity");
const secret_entity_1 = require("./modules/admin/entities/secret.entity");
const dispute_entity_1 = require("./modules/admin/entities/dispute.entity");
const global_risk_rule_entity_1 = require("./modules/admin/entities/global-risk-rule.entity");
const notification_template_entity_1 = require("./modules/admin/entities/notification-template.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const apex_organizations_module_1 = require("./modules/apex-organizations/apex-organizations.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const bnpl_module_1 = require("./modules/bnpl/bnpl.module");
const payments_module_1 = require("./modules/payments/payments.module");
const ledger_module_1 = require("./modules/ledger/ledger.module");
const kyc_module_1 = require("./modules/kyc/kyc.module");
const sms_module_1 = require("./modules/sms/sms.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const business_manager_module_1 = require("./modules/business-manager/business-manager.module");
const settings_module_1 = require("./modules/settings/settings.module");
const savings_module_1 = require("./modules/savings/savings.module");
const loans_module_1 = require("./modules/loans/loans.module");
const support_module_1 = require("./modules/support/support.module");
const admin_module_1 = require("./modules/admin/admin.module");
const accountant_module_1 = require("./modules/accountant/accountant.module");
const branding_module_1 = require("./modules/branding/branding.module");
const apex_business_manager_module_1 = require("./modules/apex-bm/apex-business-manager.module");
const email_module_1 = require("./modules/email/email.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const payment_methods_module_1 = require("./modules/payment-methods/payment-methods.module");
const first_virtual_module_1 = require("./modules/first-virtual/first-virtual.module");
const apex_organization_entity_1 = require("./modules/apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("./modules/organizations/entities/organization.entity");
const user_entity_1 = require("./modules/users/entities/user.entity");
const kyc_submission_entity_1 = require("./modules/kyc/entities/kyc-submission.entity");
const bnpl_catalog_item_entity_1 = require("./modules/bnpl/entities/bnpl-catalog-item.entity");
const bnpl_catalog_org_eligibility_entity_1 = require("./modules/bnpl/entities/bnpl-catalog-org-eligibility.entity");
const bnpl_plan_entity_1 = require("./modules/bnpl/entities/bnpl-plan.entity");
const bnpl_subscription_entity_1 = require("./modules/bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("./modules/bnpl/entities/bnpl-installment.entity");
const risk_flag_entity_1 = require("./modules/bnpl/entities/risk-flag.entity");
const exception_reason_entity_1 = require("./modules/bnpl/entities/exception-reason.entity");
const audit_log_entity_2 = require("./modules/bnpl/entities/audit-log.entity");
const approval_request_entity_1 = require("./modules/bnpl/entities/approval-request.entity");
const bnpl_plan_config_entity_1 = require("./modules/bnpl/entities/bnpl-plan-config.entity");
const payment_entity_1 = require("./modules/payments/entities/payment.entity");
const account_entity_1 = require("./modules/ledger/entities/account.entity");
const journal_entry_entity_1 = require("./modules/ledger/entities/journal-entry.entity");
const journal_line_entity_1 = require("./modules/ledger/entities/journal-line.entity");
const fee_share_ledger_entity_1 = require("./modules/ledger/entities/fee-share-ledger.entity");
const fee_pot_entity_1 = require("./modules/ledger/entities/fee-pot.entity");
const fee_withdrawal_request_entity_1 = require("./modules/ledger/entities/fee-withdrawal-request.entity");
const sms_log_entity_1 = require("./modules/sms/entities/sms-log.entity");
const app_setting_entity_1 = require("./modules/settings/entities/app-setting.entity");
const savings_account_entity_1 = require("./modules/savings/entities/savings-account.entity");
const savings_transaction_entity_1 = require("./modules/savings/entities/savings-transaction.entity");
const loan_entity_1 = require("./modules/loans/entities/loan.entity");
const loan_repayment_entity_1 = require("./modules/loans/entities/loan-repayment.entity");
const login_history_entity_1 = require("./modules/auth/entities/login-history.entity");
const in_app_notification_entity_1 = require("./modules/notifications/entities/in-app-notification.entity");
const saved_payment_method_entity_1 = require("./modules/payment-methods/entities/saved-payment-method.entity");
const referral_entity_1 = require("./modules/users/entities/referral.entity");
const user_activity_entity_1 = require("./modules/users/entities/user-activity.entity");
const webhook_log_entity_1 = require("./modules/payments/entities/webhook-log.entity");
const support_ticket_entity_1 = require("./modules/bnpl/entities/support-ticket.entity");
const ticket_message_entity_1 = require("./modules/support/entities/ticket-message.entity");
const processing_step_entity_1 = require("./modules/bnpl/entities/processing-step.entity");
const idempotency_key_entity_1 = require("./modules/bnpl/entities/idempotency-key.entity");
const collection_queue_entity_1 = require("./modules/bnpl/entities/collection-queue.entity");
const reconciliation_run_entity_1 = require("./modules/accountant/entities/reconciliation-run.entity");
const reconciliation_result_entity_1 = require("./modules/accountant/entities/reconciliation-result.entity");
const adjustment_request_entity_1 = require("./modules/accountant/entities/adjustment-request.entity");
const investments_module_1 = require("./modules/investments/investments.module");
const investment_product_entity_1 = require("./modules/investments/entities/investment-product.entity");
const investment_product_version_entity_1 = require("./modules/investments/entities/investment-product-version.entity");
const investment_eligibility_rule_entity_1 = require("./modules/investments/entities/investment-eligibility-rule.entity");
const share_issuance_cycle_entity_1 = require("./modules/investments/entities/share-issuance-cycle.entity");
const investment_order_entity_1 = require("./modules/investments/entities/investment-order.entity");
const investment_holding_entity_1 = require("./modules/investments/entities/investment-holding.entity");
const distribution_entity_1 = require("./modules/investments/entities/distribution.entity");
const distribution_payment_entity_1 = require("./modules/investments/entities/distribution-payment.entity");
const distribution_run_entity_1 = require("./modules/investments/entities/distribution-run.entity");
const redemption_request_entity_1 = require("./modules/investments/entities/redemption-request.entity");
const pricing_config_entity_1 = require("./modules/investments/entities/pricing-config.entity");
const nav_snapshot_entity_1 = require("./modules/investments/entities/nav-snapshot.entity");
const corporate_action_entity_1 = require("./modules/investments/entities/corporate-action.entity");
const bnpl_catalog_image_entity_1 = require("./modules/bnpl/entities/bnpl-catalog-image.entity");
const collection_priority_entity_1 = require("./modules/bnpl/entities/collection-priority.entity");
const exception_case_entity_1 = require("./modules/bnpl/entities/exception-case.entity");
const collection_playbook_entity_1 = require("./modules/bnpl/entities/collection-playbook.entity");
const device_session_entity_1 = require("./modules/auth/entities/device-session.entity");
const virtual_account_entity_1 = require("./modules/first-virtual/entities/virtual-account.entity");
const pending_deposit_entity_1 = require("./modules/first-virtual/entities/pending-deposit.entity");
const entities = [
    investment_product_entity_1.InvestmentProduct,
    investment_product_version_entity_1.InvestmentProductVersion,
    investment_eligibility_rule_entity_1.InvestmentEligibilityRule,
    share_issuance_cycle_entity_1.ShareIssuanceCycle,
    investment_order_entity_1.InvestmentOrder,
    investment_holding_entity_1.InvestmentHolding,
    distribution_entity_1.Distribution,
    distribution_payment_entity_1.DistributionPayment,
    distribution_run_entity_1.DistributionRun,
    redemption_request_entity_1.RedemptionRequest,
    pricing_config_entity_1.PricingConfig,
    nav_snapshot_entity_1.NavSnapshot,
    corporate_action_entity_1.CorporateAction,
    apex_organization_entity_1.ApexOrganization,
    organization_entity_1.Organization,
    user_entity_1.User,
    kyc_submission_entity_1.KycSubmission,
    bnpl_catalog_item_entity_1.BnplCatalogItem,
    bnpl_catalog_org_eligibility_entity_1.BnplCatalogOrgEligibility,
    bnpl_plan_entity_1.BnplPlan,
    bnpl_subscription_entity_1.BnplSubscription,
    bnpl_installment_entity_1.BnplInstallment,
    payment_entity_1.Payment,
    account_entity_1.Account,
    journal_entry_entity_1.JournalEntry,
    journal_line_entity_1.JournalLine,
    fee_share_ledger_entity_1.FeeShareLedger,
    fee_pot_entity_1.FeePot,
    fee_withdrawal_request_entity_1.FeeWithdrawalRequest,
    sms_log_entity_1.SmsLog,
    app_setting_entity_1.AppSetting,
    savings_account_entity_1.SavingsAccount,
    savings_transaction_entity_1.SavingsTransaction,
    loan_entity_1.Loan,
    loan_repayment_entity_1.LoanRepayment,
    risk_flag_entity_1.RiskFlag,
    exception_reason_entity_1.ExceptionReason,
    audit_log_entity_2.AuditLog,
    approval_request_entity_1.ApprovalRequest,
    bnpl_plan_config_entity_1.BnplPlanConfig,
    login_history_entity_1.LoginHistory,
    in_app_notification_entity_1.InAppNotification,
    saved_payment_method_entity_1.SavedPaymentMethod,
    referral_entity_1.Referral,
    user_activity_entity_1.UserActivity,
    webhook_log_entity_1.WebhookLog,
    support_ticket_entity_1.SupportTicket,
    ticket_message_entity_1.TicketMessage,
    processing_step_entity_1.ProcessingStep,
    idempotency_key_entity_1.IdempotencyKey,
    collection_queue_entity_1.CollectionQueue,
    bnpl_catalog_image_entity_1.BnplCatalogImage,
    collection_priority_entity_1.CollectionPriority,
    exception_case_entity_1.ExceptionCase,
    collection_playbook_entity_1.CollectionPlaybook,
    device_session_entity_1.DeviceSession,
    policy_template_entity_1.PolicyTemplate,
    tenant_onboarding_request_entity_1.TenantOnboardingRequest,
    feature_flag_entity_1.FeatureFlag,
    incident_entity_1.Incident,
    global_security_config_entity_1.GlobalSecurityConfig,
    secret_entity_1.Secret,
    dispute_entity_1.Dispute,
    global_risk_rule_entity_1.GlobalRiskRule,
    notification_template_entity_1.NotificationTemplate,
    reconciliation_run_entity_1.ReconciliationRun,
    reconciliation_result_entity_1.ReconciliationResult,
    adjustment_request_entity_1.AdjustmentRequest,
    audit_log_entity_1.AuditLog,
    virtual_account_entity_1.VirtualAccount,
    pending_deposit_entity_1.PendingDeposit,
];
let AppModule = class AppModule {
    encryption;
    constructor(encryption) {
        this.encryption = encryption;
    }
    onModuleInit() {
        (0, encryption_transformer_1.setEncryptionInstance)(this.encryption);
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, jwt_config_1.default, database_config_1.default, app_config_1.smtpConfig],
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [{ limit: 100, ttl: 60000 }],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('database.host'),
                    port: configService.get('database.port'),
                    username: configService.get('database.username'),
                    password: configService.get('database.password'),
                    database: configService.get('database.database'),
                    entities: entities,
                    synchronize: configService.get('database.synchronize'),
                    logging: configService.get('database.logging'),
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User]),
            apex_organizations_module_1.ApexOrganizationsModule,
            organizations_module_1.OrganizationsModule,
            bnpl_module_1.BnplModule,
            payments_module_1.PaymentsModule,
            ledger_module_1.LedgerModule,
            kyc_module_1.KycModule,
            sms_module_1.SmsModule,
            dashboard_module_1.DashboardModule,
            business_manager_module_1.BusinessManagerModule,
            settings_module_1.SettingsModule,
            savings_module_1.SavingsModule,
            loans_module_1.LoansModule,
            support_module_1.SupportModule,
            admin_module_1.AdminModule,
            accountant_module_1.AccountantModule,
            investments_module_1.InvestmentsModule,
            branding_module_1.BrandingModule,
            apex_business_manager_module_1.ApexBusinessManagerModule,
            email_module_1.EmailModule,
            notifications_module_1.NotificationsModule,
            payment_methods_module_1.PaymentMethodsModule,
            first_virtual_module_1.FirstVirtualModule,
            retention_module_1.RetentionModule,
            risk_module_1.RiskModule,
            monitoring_module_1.MonitoringModule,
            schedule_1.ScheduleModule.forRoot(),
        ],
        providers: [
            encryption_service_1.EncryptionService,
            bootstrap_admin_service_1.BootstrapAdminService,
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.AllExceptionsFilter,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: csrf_guard_1.CsrfGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: maintenance_guard_1.MaintenanceGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: tenant_scope_guard_1.TenantScopeGuard,
            },
        ],
    }),
    __metadata("design:paramtypes", [encryption_service_1.EncryptionService])
], AppModule);
//# sourceMappingURL=app.module.js.map