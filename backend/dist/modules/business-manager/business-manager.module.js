"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessManagerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const business_manager_controller_1 = require("./business-manager.controller");
const business_manager_service_1 = require("./business-manager.service");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const bnpl_plan_entity_1 = require("../bnpl/entities/bnpl-plan.entity");
const bnpl_catalog_item_entity_1 = require("../bnpl/entities/bnpl-catalog-item.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const sms_log_entity_1 = require("../sms/entities/sms-log.entity");
const dashboard_module_1 = require("../dashboard/dashboard.module");
const bnpl_module_1 = require("../bnpl/bnpl.module");
const users_module_1 = require("../users/users.module");
let BusinessManagerModule = class BusinessManagerModule {
};
exports.BusinessManagerModule = BusinessManagerModule;
exports.BusinessManagerModule = BusinessManagerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                bnpl_subscription_entity_1.BnplSubscription,
                bnpl_installment_entity_1.BnplInstallment,
                bnpl_plan_entity_1.BnplPlan,
                bnpl_catalog_item_entity_1.BnplCatalogItem,
                audit_log_entity_1.AuditLog,
                payment_entity_1.Payment,
                sms_log_entity_1.SmsLog,
            ]),
            dashboard_module_1.DashboardModule,
            bnpl_module_1.BnplModule,
            users_module_1.UsersModule,
        ],
        controllers: [business_manager_controller_1.BusinessManagerController],
        providers: [business_manager_service_1.BusinessManagerService],
    })
], BusinessManagerModule);
//# sourceMappingURL=business-manager.module.js.map