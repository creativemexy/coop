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
exports.PendingDeposit = void 0;
const typeorm_1 = require("typeorm");
let PendingDeposit = class PendingDeposit {
    id;
    userId;
    amount;
    type;
    loanRepaymentId;
    reference;
    accountNumber;
    accountName;
    bankName;
    bankReference;
    token;
    status;
    expiresAt;
    creditedAt;
    createdAt;
    updatedAt;
};
exports.PendingDeposit = PendingDeposit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PendingDeposit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], PendingDeposit.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], PendingDeposit.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'general' }),
    __metadata("design:type", String)
], PendingDeposit.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true, name: 'loan_repayment_id' }),
    __metadata("design:type", Object)
], PendingDeposit.prototype, "loanRepaymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, unique: true }),
    __metadata("design:type", String)
], PendingDeposit.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true, name: 'account_number' }),
    __metadata("design:type", String)
], PendingDeposit.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, name: 'account_name' }),
    __metadata("design:type", String)
], PendingDeposit.prototype, "accountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, name: 'bank_name' }),
    __metadata("design:type", String)
], PendingDeposit.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 40,
        nullable: true,
        name: 'bank_reference',
    }),
    __metadata("design:type", String)
], PendingDeposit.prototype, "bankReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], PendingDeposit.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pending' }),
    __metadata("design:type", String)
], PendingDeposit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'expires_at' }),
    __metadata("design:type", Date)
], PendingDeposit.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, name: 'credited_at' }),
    __metadata("design:type", Date)
], PendingDeposit.prototype, "creditedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PendingDeposit.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PendingDeposit.prototype, "updatedAt", void 0);
exports.PendingDeposit = PendingDeposit = __decorate([
    (0, typeorm_1.Entity)('pending_deposits')
], PendingDeposit);
//# sourceMappingURL=pending-deposit.entity.js.map