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
exports.SavingsAccount = void 0;
const typeorm_1 = require("typeorm");
const savings_transaction_entity_1 = require("./savings-transaction.entity");
let SavingsAccount = class SavingsAccount {
    id;
    userId;
    balance;
    goalBalance;
    targetAmount;
    status;
    createdAt;
    updatedAt;
    transactions;
};
exports.SavingsAccount = SavingsAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SavingsAccount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], SavingsAccount.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], SavingsAccount.prototype, "balance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'goal_balance', default: 0 }),
    __metadata("design:type", Number)
], SavingsAccount.prototype, "goalBalance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'target_amount', nullable: true }),
    __metadata("design:type", Number)
], SavingsAccount.prototype, "targetAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'active' }),
    __metadata("design:type", String)
], SavingsAccount.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SavingsAccount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SavingsAccount.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => savings_transaction_entity_1.SavingsTransaction, (t) => t.account),
    __metadata("design:type", Array)
], SavingsAccount.prototype, "transactions", void 0);
exports.SavingsAccount = SavingsAccount = __decorate([
    (0, typeorm_1.Entity)('savings_accounts')
], SavingsAccount);
//# sourceMappingURL=savings-account.entity.js.map