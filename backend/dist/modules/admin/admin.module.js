"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const super_admin_controller_1 = require("./super-admin.controller");
const super_admin_service_1 = require("./super-admin.service");
const auth_module_1 = require("../auth/auth.module");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_entity_1 = require("../users/entities/user.entity");
const app_setting_entity_1 = require("../settings/entities/app-setting.entity");
const webhook_log_entity_1 = require("../payments/entities/webhook-log.entity");
const processing_step_entity_1 = require("../bnpl/entities/processing-step.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_plan_entity_1 = require("../bnpl/entities/bnpl-plan.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const investment_order_entity_1 = require("../investments/entities/investment-order.entity");
const investment_holding_entity_1 = require("../investments/entities/investment-holding.entity");
const policy_template_entity_1 = require("./entities/policy-template.entity");
const tenant_onboarding_request_entity_1 = require("./entities/tenant-onboarding-request.entity");
const feature_flag_entity_1 = require("./entities/feature-flag.entity");
const incident_entity_1 = require("./entities/incident.entity");
const global_security_config_entity_1 = require("./entities/global-security-config.entity");
const secret_entity_1 = require("./entities/secret.entity");
const notification_template_entity_1 = require("./entities/notification-template.entity");
const global_risk_rule_entity_1 = require("./entities/global-risk-rule.entity");
const dispute_entity_1 = require("./entities/dispute.entity");
const kyc_submission_entity_1 = require("../kyc/entities/kyc-submission.entity");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const savings_transaction_entity_1 = require("../savings/entities/savings-transaction.entity");
const loan_entity_1 = require("../loans/entities/loan.entity");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                organization_entity_1.Organization,
                user_entity_1.User,
                app_setting_entity_1.AppSetting,
                webhook_log_entity_1.WebhookLog,
                processing_step_entity_1.ProcessingStep,
                audit_log_entity_1.AuditLog,
                bnpl_installment_entity_1.BnplInstallment,
                bnpl_subscription_entity_1.BnplSubscription,
                bnpl_plan_entity_1.BnplPlan,
                payment_entity_1.Payment,
                investment_order_entity_1.InvestmentOrder,
                investment_holding_entity_1.InvestmentHolding,
                policy_template_entity_1.PolicyTemplate,
                tenant_onboarding_request_entity_1.TenantOnboardingRequest,
                feature_flag_entity_1.FeatureFlag,
                incident_entity_1.Incident,
                global_security_config_entity_1.GlobalSecurityConfig,
                secret_entity_1.Secret,
                notification_template_entity_1.NotificationTemplate,
                global_risk_rule_entity_1.GlobalRiskRule,
                dispute_entity_1.Dispute,
                kyc_submission_entity_1.KycSubmission,
                savings_account_entity_1.SavingsAccount,
                savings_transaction_entity_1.SavingsTransaction,
                loan_entity_1.Loan,
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [admin_controller_1.AdminController, super_admin_controller_1.SuperAdminController],
        providers: [admin_service_1.AdminService, super_admin_service_1.SuperAdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map