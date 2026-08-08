"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountantModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const accountant_controller_1 = require("./accountant.controller");
const accountant_service_1 = require("./accountant.service");
const auth_module_1 = require("../auth/auth.module");
const bnpl_subscription_entity_1 = require("../bnpl/entities/bnpl-subscription.entity");
const bnpl_installment_entity_1 = require("../bnpl/entities/bnpl-installment.entity");
const bnpl_plan_entity_1 = require("../bnpl/entities/bnpl-plan.entity");
const bnpl_catalog_item_entity_1 = require("../bnpl/entities/bnpl-catalog-item.entity");
const payment_entity_1 = require("../payments/entities/payment.entity");
const fee_share_ledger_entity_1 = require("../ledger/entities/fee-share-ledger.entity");
const fee_pot_entity_1 = require("../ledger/entities/fee-pot.entity");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const user_entity_1 = require("../users/entities/user.entity");
const audit_log_entity_1 = require("../bnpl/entities/audit-log.entity");
const reconciliation_run_entity_1 = require("./entities/reconciliation-run.entity");
const reconciliation_result_entity_1 = require("./entities/reconciliation-result.entity");
const adjustment_request_entity_1 = require("./entities/adjustment-request.entity");
const loan_entity_1 = require("../loans/entities/loan.entity");
const loan_repayment_entity_1 = require("../loans/entities/loan-repayment.entity");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const savings_transaction_entity_1 = require("../savings/entities/savings-transaction.entity");
const journal_entry_entity_1 = require("../ledger/entities/journal-entry.entity");
const journal_line_entity_1 = require("../ledger/entities/journal-line.entity");
const distribution_entity_1 = require("../investments/entities/distribution.entity");
const fee_withdrawal_request_entity_1 = require("../ledger/entities/fee-withdrawal-request.entity");
let AccountantModule = class AccountantModule {
};
exports.AccountantModule = AccountantModule;
exports.AccountantModule = AccountantModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                bnpl_subscription_entity_1.BnplSubscription,
                bnpl_installment_entity_1.BnplInstallment,
                bnpl_plan_entity_1.BnplPlan,
                bnpl_catalog_item_entity_1.BnplCatalogItem,
                payment_entity_1.Payment,
                fee_share_ledger_entity_1.FeeShareLedger,
                organization_entity_1.Organization,
                user_entity_1.User,
                audit_log_entity_1.AuditLog,
                reconciliation_run_entity_1.ReconciliationRun,
                reconciliation_result_entity_1.ReconciliationResult,
                adjustment_request_entity_1.AdjustmentRequest,
                loan_entity_1.Loan,
                loan_repayment_entity_1.LoanRepayment,
                savings_account_entity_1.SavingsAccount,
                savings_transaction_entity_1.SavingsTransaction,
                journal_entry_entity_1.JournalEntry,
                journal_line_entity_1.JournalLine,
                fee_pot_entity_1.FeePot,
                distribution_entity_1.Distribution,
                fee_withdrawal_request_entity_1.FeeWithdrawalRequest,
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [accountant_controller_1.AccountantController],
        providers: [accountant_service_1.AccountantService],
    })
], AccountantModule);
//# sourceMappingURL=accountant.module.js.map