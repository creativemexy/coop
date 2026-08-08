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
exports.BnplInstallment = void 0;
const typeorm_1 = require("typeorm");
const status_enum_1 = require("../../../common/enums/status.enum");
const bnpl_subscription_entity_1 = require("./bnpl-subscription.entity");
let BnplInstallment = class BnplInstallment {
    id;
    subscriptionId;
    subscription;
    dueDate;
    lateFeeAmount;
    gracePeriodEnd;
    amount;
    status;
    paidAt;
    paymentReference;
    createdAt;
    updatedAt;
};
exports.BnplInstallment = BnplInstallment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BnplInstallment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'subscription_id' }),
    __metadata("design:type", String)
], BnplInstallment.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bnpl_subscription_entity_1.BnplSubscription, (sub) => sub.installments),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id' }),
    __metadata("design:type", bnpl_subscription_entity_1.BnplSubscription)
], BnplInstallment.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'due_date' }),
    __metadata("design:type", Date)
], BnplInstallment.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'late_fee_amount', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], BnplInstallment.prototype, "lateFeeAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'grace_period_end', nullable: true }),
    __metadata("design:type", Date)
], BnplInstallment.prototype, "gracePeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], BnplInstallment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: status_enum_1.InstallmentStatus,
        default: status_enum_1.InstallmentStatus.PENDING,
    }),
    __metadata("design:type", String)
], BnplInstallment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'paid_at', nullable: true }),
    __metadata("design:type", Date)
], BnplInstallment.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'payment_reference', nullable: true }),
    __metadata("design:type", String)
], BnplInstallment.prototype, "paymentReference", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BnplInstallment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BnplInstallment.prototype, "updatedAt", void 0);
exports.BnplInstallment = BnplInstallment = __decorate([
    (0, typeorm_1.Entity)('bnpl_installments')
], BnplInstallment);
//# sourceMappingURL=bnpl-installment.entity.js.map