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
exports.LoanRepayment = exports.RepaymentStatus = void 0;
const typeorm_1 = require("typeorm");
const loan_entity_1 = require("./loan.entity");
var RepaymentStatus;
(function (RepaymentStatus) {
    RepaymentStatus["PENDING"] = "pending";
    RepaymentStatus["PAID"] = "paid";
    RepaymentStatus["OVERDUE"] = "overdue";
})(RepaymentStatus || (exports.RepaymentStatus = RepaymentStatus = {}));
let LoanRepayment = class LoanRepayment {
    id;
    loanId;
    loan;
    dueDate;
    amount;
    paidAt;
    paymentReference;
    status;
    createdAt;
};
exports.LoanRepayment = LoanRepayment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LoanRepayment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'loan_id' }),
    __metadata("design:type", String)
], LoanRepayment.prototype, "loanId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => loan_entity_1.Loan, (l) => l.repayments),
    (0, typeorm_1.JoinColumn)({ name: 'loan_id' }),
    __metadata("design:type", loan_entity_1.Loan)
], LoanRepayment.prototype, "loan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'due_date' }),
    __metadata("design:type", Date)
], LoanRepayment.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], LoanRepayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'paid_at', nullable: true }),
    __metadata("design:type", Date)
], LoanRepayment.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'payment_reference', nullable: true }),
    __metadata("design:type", String)
], LoanRepayment.prototype, "paymentReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RepaymentStatus, default: RepaymentStatus.PENDING }),
    __metadata("design:type", String)
], LoanRepayment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], LoanRepayment.prototype, "createdAt", void 0);
exports.LoanRepayment = LoanRepayment = __decorate([
    (0, typeorm_1.Entity)('loan_repayments')
], LoanRepayment);
//# sourceMappingURL=loan-repayment.entity.js.map