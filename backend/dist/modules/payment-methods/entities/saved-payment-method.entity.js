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
exports.SavedPaymentMethod = exports.PaymentMethodType = void 0;
const typeorm_1 = require("typeorm");
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CARD"] = "card";
    PaymentMethodType["BANK"] = "bank";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
let SavedPaymentMethod = class SavedPaymentMethod {
    id;
    userId;
    type;
    provider;
    providerToken;
    last4;
    cardBrand;
    expiryMonth;
    expiryYear;
    bankName;
    accountNumber;
    accountName;
    isDefault;
    isActive;
    createdAt;
    updatedAt;
};
exports.SavedPaymentMethod = SavedPaymentMethod;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PaymentMethodType }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'provider_token', length: 255, nullable: true }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "providerToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last4', length: 4, nullable: true }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "last4", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'card_brand', length: 50, nullable: true }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "cardBrand", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_month', length: 2, nullable: true }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "expiryMonth", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_year', length: 4, nullable: true }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "expiryYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bank_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "bankName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_number', length: 20, nullable: true }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_name', length: 255, nullable: true }),
    __metadata("design:type", String)
], SavedPaymentMethod.prototype, "accountName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_default', default: false }),
    __metadata("design:type", Boolean)
], SavedPaymentMethod.prototype, "isDefault", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], SavedPaymentMethod.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SavedPaymentMethod.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], SavedPaymentMethod.prototype, "updatedAt", void 0);
exports.SavedPaymentMethod = SavedPaymentMethod = __decorate([
    (0, typeorm_1.Entity)('saved_payment_methods')
], SavedPaymentMethod);
//# sourceMappingURL=saved-payment-method.entity.js.map