import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './controllers/catalog.controller';
import { PlansController } from './controllers/plans.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { InstallmentsController } from './controllers/installments.controller';
import { ComplianceController } from './controllers/compliance.controller';
import { ApprovalController } from './controllers/approval.controller';
import { PlanConfigController } from './controllers/plan-config.controller';
import { RepaymentController } from './controllers/repayment.controller';
import { CollectionsController } from './controllers/collections.controller';
import { ProcessingEngineController } from './controllers/processing-engine.controller';
import { CollectionQueueController } from './controllers/collection-queue.controller';
import { CatalogService } from './services/catalog.service';
import { PlansService } from './services/plans.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { InstallmentsService } from './services/installments.service';
import { ComplianceService } from './services/compliance.service';
import { ApprovalService } from './services/approval.service';
import { PlanConfigService } from './services/plan-config.service';
import { RepaymentService } from './services/repayment.service';
import { CollectionsService } from './services/collections.service';
import { ProcessingEngineService } from './services/processing-engine.service';
import { CollectionQueueService } from './services/collection-queue.service';
import { BnplCatalogItem } from './entities/bnpl-catalog-item.entity';
import { BnplCatalogImage } from './entities/bnpl-catalog-image.entity';
import { BnplCatalogOrgEligibility } from './entities/bnpl-catalog-org-eligibility.entity';
import { BnplPlan } from './entities/bnpl-plan.entity';
import { BnplSubscription } from './entities/bnpl-subscription.entity';
import { BnplInstallment } from './entities/bnpl-installment.entity';
import { RiskFlag } from './entities/risk-flag.entity';
import { ExceptionReason } from './entities/exception-reason.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ApprovalRequest } from './entities/approval-request.entity';
import { BnplPlanConfig } from './entities/bnpl-plan-config.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CollectionPriority } from './entities/collection-priority.entity';
import { ExceptionCase } from './entities/exception-case.entity';
import { CollectionPlaybook } from './entities/collection-playbook.entity';
import { ProcessingStep } from './entities/processing-step.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
import { CollectionQueue } from './entities/collection-queue.entity';
import { AppSetting } from '../settings/entities/app-setting.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BnplCatalogItem,
      BnplCatalogImage,
      BnplCatalogOrgEligibility,
      BnplPlan,
      BnplSubscription,
      BnplInstallment,
      RiskFlag,
      ExceptionReason,
      AuditLog,
      ApprovalRequest,
      BnplPlanConfig,
      CollectionPriority,
      ExceptionCase,
      CollectionPlaybook,
      ProcessingStep,
      IdempotencyKey,
      CollectionQueue,
      Payment,
      AppSetting,
    ]),
    UsersModule,
  ],
  controllers: [
    CatalogController,
    PlansController,
    SubscriptionsController,
    InstallmentsController,
    ComplianceController,
    ApprovalController,
    PlanConfigController,
    RepaymentController,
    CollectionsController,
    ProcessingEngineController,
    CollectionQueueController,
  ],
  providers: [
    CatalogService,
    PlansService,
    SubscriptionsService,
    InstallmentsService,
    ComplianceService,
    ApprovalService,
    PlanConfigService,
    RepaymentService,
    CollectionsService,
    ProcessingEngineService,
    CollectionQueueService,
  ],
  exports: [CatalogService, PlansService, SubscriptionsService, ComplianceService, ApprovalService, RepaymentService, CollectionsService, ProcessingEngineService, CollectionQueueService],
})
export class BnplModule {}
