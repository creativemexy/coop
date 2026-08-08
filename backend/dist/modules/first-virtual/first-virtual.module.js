"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirstVirtualModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const virtual_account_entity_1 = require("./entities/virtual-account.entity");
const pending_deposit_entity_1 = require("./entities/pending-deposit.entity");
const virtual_accounts_service_1 = require("./virtual-accounts.service");
const virtual_accounts_controller_1 = require("./virtual-accounts.controller");
const virtual_account_webhook_controller_1 = require("./virtual-account-webhook.controller");
const firstcheckout_client_1 = require("./firstcheckout.client");
const savings_module_1 = require("../savings/savings.module");
const loans_module_1 = require("../loans/loans.module");
const user_entity_1 = require("../users/entities/user.entity");
let FirstVirtualModule = class FirstVirtualModule {
};
exports.FirstVirtualModule = FirstVirtualModule;
exports.FirstVirtualModule = FirstVirtualModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([virtual_account_entity_1.VirtualAccount, user_entity_1.User, pending_deposit_entity_1.PendingDeposit]),
            axios_1.HttpModule,
            savings_module_1.SavingsModule,
            loans_module_1.LoansModule,
        ],
        controllers: [virtual_accounts_controller_1.VirtualAccountsController, virtual_account_webhook_controller_1.VirtualAccountWebhookController],
        providers: [virtual_accounts_service_1.VirtualAccountsService, firstcheckout_client_1.FirstCheckoutClient],
        exports: [virtual_accounts_service_1.VirtualAccountsService],
    })
], FirstVirtualModule);
//# sourceMappingURL=first-virtual.module.js.map