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
exports.FeeWithdrawalRequest = void 0;
const typeorm_1 = require("typeorm");
const status_enum_1 = require("../../../common/enums/status.enum");
const status_enum_2 = require("../../../common/enums/status.enum");
let FeeWithdrawalRequest = class FeeWithdrawalRequest {
    id;
    potType;
    amount;
    status;
    requestedBy;
    approvedBy;
    accountNumber;
    bankCode;
    bankName;
    note;
    paystackReference;
    createdAt;
    updatedAt;
};
exports.FeeWithdrawalRequest = FeeWithdrawalRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, name: 'pot_type' }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "potType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], FeeWithdrawalRequest.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: status_enum_1.PayoutStatus.PENDING }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'requested_by' }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "requestedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'approved_by', nullable: true }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'account_number', nullable: true }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, name: 'bank_code', nullable: true }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "bankCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'bank_name', nullable: true }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, name: 'paystack_reference', nullable: true }),
    __metadata("design:type", String)
], FeeWithdrawalRequest.prototype, "paystackReference", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], FeeWithdrawalRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], FeeWithdrawalRequest.prototype, "updatedAt", void 0);
exports.FeeWithdrawalRequest = FeeWithdrawalRequest = __decorate([
    (0, typeorm_1.Entity)('fee_withdrawal_requests')
], FeeWithdrawalRequest);
//# sourceMappingURL=fee-withdrawal-request.entity.js.map