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
exports.BnplSubscription = void 0;
const typeorm_1 = require("typeorm");
const status_enum_1 = require("../../../common/enums/status.enum");
const bnpl_plan_entity_1 = require("./bnpl-plan.entity");
const bnpl_installment_entity_1 = require("./bnpl-installment.entity");
let BnplSubscription = class BnplSubscription {
    id;
    userId;
    planId;
    plan;
    status;
    downPayment;
    totalAmount;
    amountPaid;
    nextInstallmentDate;
    providerReference;
    payoutStatus;
    disbursementReference;
    disbursedAt;
    settledAt;
    approvedAt;
    createdAt;
    updatedAt;
    installments;
};
exports.BnplSubscription = BnplSubscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BnplSubscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    __metadata("design:type", String)
], BnplSubscription.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'plan_id' }),
    __metadata("design:type", String)
], BnplSubscription.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bnpl_plan_entity_1.BnplPlan, (plan) => plan.subscriptions),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", bnpl_plan_entity_1.BnplPlan)
], BnplSubscription.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: status_enum_1.SubscriptionStatus,
        default: status_enum_1.SubscriptionStatus.CREATED,
    }),
    __metadata("design:type", String)
], BnplSubscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'down_payment', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], BnplSubscription.prototype, "downPayment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'total_amount', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], BnplSubscription.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        name: 'amount_paid',
        precision: 15,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], BnplSubscription.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', name: 'next_installment_date', nullable: true }),
    __metadata("design:type", Date)
], BnplSubscription.prototype, "nextInstallmentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'provider_reference', nullable: true }),
    __metadata("design:type", String)
], BnplSubscription.prototype, "providerReference", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: status_enum_1.PayoutStatus,
        name: 'payout_status',
        default: status_enum_1.PayoutStatus.PENDING,
    }),
    __metadata("design:type", String)
], BnplSubscription.prototype, "payoutStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'disbursement_reference', nullable: true }),
    __metadata("design:type", String)
], BnplSubscription.prototype, "disbursementReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'disbursed_at', nullable: true }),
    __metadata("design:type", Date)
], BnplSubscription.prototype, "disbursedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'settled_at', nullable: true }),
    __metadata("design:type", Date)
], BnplSubscription.prototype, "settledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'approved_at', nullable: true }),
    __metadata("design:type", Date)
], BnplSubscription.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BnplSubscription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BnplSubscription.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bnpl_installment_entity_1.BnplInstallment, (inst) => inst.subscription),
    __metadata("design:type", Array)
], BnplSubscription.prototype, "installments", void 0);
exports.BnplSubscription = BnplSubscription = __decorate([
    (0, typeorm_1.Entity)('bnpl_subscriptions')
], BnplSubscription);
//# sourceMappingURL=bnpl-subscription.entity.js.map