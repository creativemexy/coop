"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BnplModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const catalog_controller_1 = require("./controllers/catalog.controller");
const plans_controller_1 = require("./controllers/plans.controller");
const subscriptions_controller_1 = require("./controllers/subscriptions.controller");
const installments_controller_1 = require("./controllers/installments.controller");
const compliance_controller_1 = require("./controllers/compliance.controller");
const approval_controller_1 = require("./controllers/approval.controller");
const plan_config_controller_1 = require("./controllers/plan-config.controller");
const repayment_controller_1 = require("./controllers/repayment.controller");
const collections_controller_1 = require("./controllers/collections.controller");
const processing_engine_controller_1 = require("./controllers/processing-engine.controller");
const collection_queue_controller_1 = require("./controllers/collection-queue.controller");
const catalog_service_1 = require("./services/catalog.service");
const plans_service_1 = require("./services/plans.service");
const subscriptions_service_1 = require("./services/subscriptions.service");
const installments_service_1 = require("./services/installments.service");
const compliance_service_1 = require("./services/compliance.service");
const approval_service_1 = require("./services/approval.service");
const plan_config_service_1 = require("./services/plan-config.service");
const repayment_service_1 = require("./services/repayment.service");
const collections_service_1 = require("./services/collections.service");
const processing_engine_service_1 = require("./services/processing-engine.service");
const collection_queue_service_1 = require("./services/collection-queue.service");
const bnpl_catalog_item_entity_1 = require("./entities/bnpl-catalog-item.entity");
const bnpl_catalog_image_entity_1 = require("./entities/bnpl-catalog-image.entity");
const bnpl_catalog_org_eligibility_entity_1 = require("./entities/bnpl-catalog-org-eligibility.entity");
const bnpl_plan_entity_1 = require("./entities/bnpl-plan.entity");
const bnpl_subscription_entity_1 = require("./entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("./entities/bnpl-installment.entity");
const risk_flag_entity_1 = require("./entities/risk-flag.entity");
const exception_reason_entity_1 = require("./entities/exception-reason.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const approval_request_entity_1 = require("./entities/approval-request.entity");
const bnpl_plan_config_entity_1 = require("./entities/bnpl-plan-config.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const collection_priority_entity_1 = require("./entities/collection-priority.entity");
const exception_case_entity_1 = require("./entities/exception-case.entity");
const collection_playbook_entity_1 = require("./entities/collection-playbook.entity");
const processing_step_entity_1 = require("./entities/processing-step.entity");
const idempotency_key_entity_1 = require("./entities/idempotency-key.entity");
const collection_queue_entity_1 = require("./entities/collection-queue.entity");
const app_setting_entity_1 = require("../settings/entities/app-setting.entity");
const users_module_1 = require("../users/users.module");
let BnplModule = class BnplModule {
};
exports.BnplModule = BnplModule;
exports.BnplModule = BnplModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                bnpl_catalog_item_entity_1.BnplCatalogItem,
                bnpl_catalog_image_entity_1.BnplCatalogImage,
                bnpl_catalog_org_eligibility_entity_1.BnplCatalogOrgEligibility,
                bnpl_plan_entity_1.BnplPlan,
                bnpl_subscription_entity_1.BnplSubscription,
                bnpl_installment_entity_1.BnplInstallment,
                risk_flag_entity_1.RiskFlag,
                exception_reason_entity_1.ExceptionReason,
                audit_log_entity_1.AuditLog,
                approval_request_entity_1.ApprovalRequest,
                bnpl_plan_config_entity_1.BnplPlanConfig,
                collection_priority_entity_1.CollectionPriority,
                exception_case_entity_1.ExceptionCase,
                collection_playbook_entity_1.CollectionPlaybook,
                processing_step_entity_1.ProcessingStep,
                idempotency_key_entity_1.IdempotencyKey,
                collection_queue_entity_1.CollectionQueue,
                payment_entity_1.Payment,
                app_setting_entity_1.AppSetting,
            ]),
            users_module_1.UsersModule,
        ],
        controllers: [
            catalog_controller_1.CatalogController,
            plans_controller_1.PlansController,
            subscriptions_controller_1.SubscriptionsController,
            installments_controller_1.InstallmentsController,
            compliance_controller_1.ComplianceController,
            approval_controller_1.ApprovalController,
            plan_config_controller_1.PlanConfigController,
            repayment_controller_1.RepaymentController,
            collections_controller_1.CollectionsController,
            processing_engine_controller_1.ProcessingEngineController,
            collection_queue_controller_1.CollectionQueueController,
        ],
        providers: [
            catalog_service_1.CatalogService,
            plans_service_1.PlansService,
            subscriptions_service_1.SubscriptionsService,
            installments_service_1.InstallmentsService,
            compliance_service_1.ComplianceService,
            approval_service_1.ApprovalService,
            plan_config_service_1.PlanConfigService,
            repayment_service_1.RepaymentService,
            collections_service_1.CollectionsService,
            processing_engine_service_1.ProcessingEngineService,
            collection_queue_service_1.CollectionQueueService,
        ],
        exports: [catalog_service_1.CatalogService, plans_service_1.PlansService, subscriptions_service_1.SubscriptionsService, compliance_service_1.ComplianceService, approval_service_1.ApprovalService, repayment_service_1.RepaymentService, collections_service_1.CollectionsService, processing_engine_service_1.ProcessingEngineService, collection_queue_service_1.CollectionQueueService],
    })
], BnplModule);
//# sourceMappingURL=bnpl.module.js.map