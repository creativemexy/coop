"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dashboard_controller_1 = require("./dashboard.controller");
const dashboard_service_1 = require("./dashboard.service");
const users_module_1 = require("../users/users.module");
const bnpl_module_1 = require("../bnpl/bnpl.module");
const ledger_module_1 = require("../ledger/ledger.module");
const savings_module_1 = require("../savings/savings.module");
const savings_transaction_entity_1 = require("../savings/entities/savings-transaction.entity");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const loans_module_1 = require("../loans/loans.module");
const loan_entity_1 = require("../loans/entities/loan.entity");
const investments_module_1 = require("../investments/investments.module");
const user_entity_1 = require("../users/entities/user.entity");
const apex_organization_entity_1 = require("../apex-organizations/entities/apex-organization.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const bnpl_plan_entity_1 = require("../bnpl/entities/bnpl-plan.entity");
const bnpl_catalog_item_entity_1 = require("../bnpl/entities/bnpl-catalog-item.entity");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const bnpl_plan_config_entity_1 = require("../bnpl/entities/bnpl-plan-config.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const journal_entry_entity_1 = require("../ledger/entities/journal-entry.entity");
const fee_pot_entity_1 = require("../ledger/entities/fee-pot.entity");
const support_ticket_entity_1 = require("../bnpl/entities/support-ticket.entity");
const ticket_message_entity_1 = require("../support/entities/ticket-message.entity");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                apex_organization_entity_1.ApexOrganization,
                organization_entity_1.Organization,
                bnpl_plan_entity_1.BnplPlan,
                bnpl_catalog_item_entity_1.BnplCatalogItem,
                bnpl_subscription_entity_1.BnplSubscription,
                bnpl_installment_entity_1.BnplInstallment,
                bnpl_plan_config_entity_1.BnplPlanConfig,
                payment_entity_1.Payment,
                journal_entry_entity_1.JournalEntry,
                fee_pot_entity_1.FeePot,
                support_ticket_entity_1.SupportTicket,
                ticket_message_entity_1.TicketMessage,
                savings_transaction_entity_1.SavingsTransaction,
                savings_account_entity_1.SavingsAccount,
                loan_entity_1.Loan,
            ]),
            users_module_1.UsersModule,
            bnpl_module_1.BnplModule,
            ledger_module_1.LedgerModule,
            savings_module_1.SavingsModule,
            loans_module_1.LoansModule,
            investments_module_1.InvestmentsModule,
        ],
        controllers: [dashboard_controller_1.DashboardController],
        providers: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map