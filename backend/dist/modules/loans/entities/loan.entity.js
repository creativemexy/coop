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
exports.Loan = exports.LoanStatus = void 0;
const typeorm_1 = require("typeorm");
const loan_repayment_entity_1 = require("./loan-repayment.entity");
var LoanStatus;
(function (LoanStatus) {
    LoanStatus["PENDING"] = "pending";
    LoanStatus["APEX_APPROVED"] = "apex_approved";
    LoanStatus["ORG_APPROVED"] = "org_approved";
    LoanStatus["APPROVED"] = "approved";
    LoanStatus["ACTIVE"] = "active";
    LoanStatus["COMPLETED"] = "completed";
    LoanStatus["DEFAULTED"] = "defaulted";
    LoanStatus["REJECTED"] = "rejected";
})(LoanStatus || (exports.LoanStatus = LoanStatus = {}));
let Loan = class Loan {
    id;
    userId;
    amount;
    interestRate;
    duration;
    monthlyPayment;
    totalRepayment;
    amountPaid;
    serviceFee;
    serviceFeePaid;
    serviceFeePaidAt;
    serviceFeeTxId;
    apexApprovedBy;
    apexApprovedAt;
    orgApprovedBy;
    orgApprovedAt;
    adminApprovedBy;
    adminApprovedAt;
    disbursedBy;
    disbursedAt;
    disbursedAmount;
    rejectedBy;
    rejectedAt;
    rejectionReason;
    purpose;
    status;
    repayments;
    borrower;
    createdAt;
    updatedAt;
};
exports.Loan = Loan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Loan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], Loan.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Loan.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, name: 'interest_rate', default: 5 }),
    __metadata("design:type", Number)
], Loan.prototype, "interestRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Loan.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'monthly_payment' }),
    __metadata("design:type", Number)
], Loan.prototype, "monthlyPayment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'total_repayment' }),
    __metadata("design:type", Number)
], Loan.prototype, "totalRepayment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'amount_paid', default: 0 }),
    __metadata("design:type", Number)
], Loan.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, name: 'service_fee', default: 0 }),
    __metadata("design:type", Number)
], Loan.prototype, "serviceFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'service_fee_paid', default: false }),
    __metadata("design:type", Boolean)
], Loan.prototype, "serviceFeePaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'service_fee_paid_at', nullable: true }),
    __metadata("design:type", Date)
], Loan.prototype, "serviceFeePaidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'service_fee_tx_id', nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "serviceFeeTxId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'apex_approved_by', nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "apexApprovedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'apex_approved_at', nullable: true }),
    __metadata("design:type", Date)
], Loan.prototype, "apexApprovedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'org_approved_by', nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "orgApprovedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'org_approved_at', nullable: true }),
    __metadata("design:type", Date)
], Loan.prototype, "orgApprovedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'admin_approved_by', nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "adminApprovedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'admin_approved_at', nullable: true }),
    __metadata("design:type", Date)
], Loan.prototype, "adminApprovedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'disbursed_by', nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "disbursedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'disbursed_at', nullable: true }),
    __metadata("design:type", Date)
], Loan.prototype, "disbursedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 15,
        scale: 2,
        name: 'disbursed_amount',
        default: 0,
    }),
    __metadata("design:type", Number)
], Loan.prototype, "disbursedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rejected_by', nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "rejectedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'rejected_at', nullable: true }),
    __metadata("design:type", Date)
], Loan.prototype, "rejectedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'rejection_reason', nullable: true }),
    __metadata("design:type", Object)
], Loan.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Loan.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: LoanStatus, default: LoanStatus.PENDING }),
    __metadata("design:type", String)
], Loan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => loan_repayment_entity_1.LoanRepayment, (r) => r.loan),
    __metadata("design:type", Array)
], Loan.prototype, "repayments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Loan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Loan.prototype, "updatedAt", void 0);
exports.Loan = Loan = __decorate([
    (0, typeorm_1.Entity)('loans')
], Loan);
//# sourceMappingURL=loan.entity.js.map