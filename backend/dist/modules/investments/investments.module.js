"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const investments_controller_1 = require("./investments.controller");
const investments_service_1 = require("./investments.service");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
const investment_product_entity_1 = require("./entities/investment-product.entity");
const investment_product_version_entity_1 = require("./entities/investment-product-version.entity");
const investment_eligibility_rule_entity_1 = require("./entities/investment-eligibility-rule.entity");
const share_issuance_cycle_entity_1 = require("./entities/share-issuance-cycle.entity");
const investment_order_entity_1 = require("./entities/investment-order.entity");
const investment_holding_entity_1 = require("./entities/investment-holding.entity");
const distribution_entity_1 = require("./entities/distribution.entity");
const distribution_payment_entity_1 = require("./entities/distribution-payment.entity");
const redemption_request_entity_1 = require("./entities/redemption-request.entity");
const pricing_config_entity_1 = require("./entities/pricing-config.entity");
const nav_snapshot_entity_1 = require("./entities/nav-snapshot.entity");
const corporate_action_entity_1 = require("./entities/corporate-action.entity");
const distribution_run_entity_1 = require("./entities/distribution-run.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
let InvestmentsModule = class InvestmentsModule {
};
exports.InvestmentsModule = InvestmentsModule;
exports.InvestmentsModule = InvestmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
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
                payment_entity_1.Payment,
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
        ],
        controllers: [investments_controller_1.InvestmentsController],
        providers: [investments_service_1.InvestmentsService],
        exports: [investments_service_1.InvestmentsService],
    })
], InvestmentsModule);
//# sourceMappingURL=investments.module.js.map