"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const accounts_controller_1 = require("./controllers/accounts.controller");
const journal_controller_1 = require("./controllers/journal.controller");
const fee_pots_controller_1 = require("./controllers/fee-pots.controller");
const accounts_service_1 = require("./services/accounts.service");
const journal_service_1 = require("./services/journal.service");
const double_entry_service_1 = require("./services/double-entry.service");
const fee_share_service_1 = require("./services/fee-share.service");
const fee_pot_service_1 = require("./services/fee-pot.service");
const account_entity_1 = require("./entities/account.entity");
const journal_entry_entity_1 = require("./entities/journal-entry.entity");
const journal_line_entity_1 = require("./entities/journal-line.entity");
const fee_share_ledger_entity_1 = require("./entities/fee-share-ledger.entity");
const fee_pot_entity_1 = require("./entities/fee-pot.entity");
const fee_withdrawal_request_entity_1 = require("./entities/fee-withdrawal-request.entity");
const users_module_1 = require("../users/users.module");
const organization_entity_1 = require("../organizations/entities/organization.entity");
const apex_organization_entity_1 = require("../apex-organizations/entities/apex-organization.entity");
const paystack_client_1 = require("../payments/providers/paystack/paystack.client");
let LedgerModule = class LedgerModule {
};
exports.LedgerModule = LedgerModule;
exports.LedgerModule = LedgerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                account_entity_1.Account,
                journal_entry_entity_1.JournalEntry,
                journal_line_entity_1.JournalLine,
                fee_share_ledger_entity_1.FeeShareLedger,
                fee_pot_entity_1.FeePot,
                fee_withdrawal_request_entity_1.FeeWithdrawalRequest,
                organization_entity_1.Organization,
                apex_organization_entity_1.ApexOrganization,
            ]),
            axios_1.HttpModule,
            users_module_1.UsersModule,
        ],
        controllers: [accounts_controller_1.AccountsController, journal_controller_1.JournalController, fee_pots_controller_1.FeePotsController],
        providers: [
            accounts_service_1.AccountsService,
            journal_service_1.JournalService,
            double_entry_service_1.DoubleEntryService,
            fee_share_service_1.FeeShareService,
            fee_pot_service_1.FeePotService,
            paystack_client_1.PaystackClient,
        ],
        exports: [
            accounts_service_1.AccountsService,
            journal_service_1.JournalService,
            double_entry_service_1.DoubleEntryService,
            fee_share_service_1.FeeShareService,
            fee_pot_service_1.FeePotService,
        ],
    })
], LedgerModule);
//# sourceMappingURL=ledger.module.js.map