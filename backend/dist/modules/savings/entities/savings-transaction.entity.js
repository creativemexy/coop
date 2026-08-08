"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingsTransaction = exports.TransactionType = void 0;
const typeorm_1 = require("typeorm");
const savings_account_entity_1 = require("./savings-account.entity");
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["WITHDRAWAL"] = "withdrawal";
    TransactionType["GOAL_DEPOSIT"] = "goal_deposit";
    TransactionType["GOAL_WITHDRAWAL"] = "goal_withdrawal";
    TransactionType["INTEREST"] = "interest";
    TransactionType["LOAN_SERVICE_FEE"] = "loan_service_fee";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
let SavingsTransaction = class SavingsTransaction {
    id;
    accountId;
    account;
    type;
    amount;
    balanceBefore;
    balanceAfter;
    description;
    externalReference;
    createdAt;
};
exports.SavingsTransaction = SavingsTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SavingsTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'account_id' }),
    __metadata("design:type", String)
], SavingsTransaction.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => savings_account_entity_1.SavingsAccount, (a) => a.transactions),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", savings_account_entity_1.SavingsAccount)
], SavingsTransaction.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TransactionType }),
    __metadata("design:type", String)
], SavingsTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], SavingsTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'balance_before' }),
    __metadata("design:type", Number)
], SavingsTransaction.prototype, "balanceBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'balance_after' }),
    __metadata("design:type", Number)
], SavingsTransaction.prototype, "balanceAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SavingsTransaction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        nullable: true,
        unique: true,
        name: 'external_reference',
    }),
    __metadata("design:type", Object)
], SavingsTransaction.prototype, "externalReference", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SavingsTransaction.prototype, "createdAt", void 0);
exports.SavingsTransaction = SavingsTransaction = __decorate([
    (0, typeorm_1.Entity)('savings_transactions')
], SavingsTransaction);
//# sourceMappingURL=savings-transaction.entity.js.map