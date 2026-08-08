"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const loans_controller_1 = require("./loans.controller");
const loans_service_1 = require("./loans.service");
const loan_entity_1 = require("./entities/loan.entity");
const loan_repayment_entity_1 = require("./entities/loan-repayment.entity");
const savings_transaction_entity_1 = require("../savings/entities/savings-transaction.entity");
const savings_account_entity_1 = require("../savings/entities/savings-account.entity");
const savings_module_1 = require("../savings/savings.module");
const users_module_1 = require("../users/users.module");
const retention_module_1 = require("../../common/retention.module");
let LoansModule = class LoansModule {
};
exports.LoansModule = LoansModule;
exports.LoansModule = LoansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([loan_entity_1.Loan, loan_repayment_entity_1.LoanRepayment, savings_transaction_entity_1.SavingsTransaction, savings_account_entity_1.SavingsAccount]),
            savings_module_1.SavingsModule,
            users_module_1.UsersModule,
            retention_module_1.RetentionModule,
        ],
        controllers: [loans_controller_1.LoansController],
        providers: [loans_service_1.LoansService],
        exports: [loans_service_1.LoansService],
    })
], LoansModule);
//# sourceMappingURL=loans.module.js.map