"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentProvider = exports.KycProvider = exports.SmsStatus = exports.SmsProvider = exports.PotType = exports.FeeSource = exports.AccountType = exports.JournalStatus = exports.PayoutStatus = exports.PaymentStatus = exports.InstallmentStatus = exports.SubscriptionStatus = exports.KycStatus = exports.OrgStatus = void 0;
var OrgStatus;
(function (OrgStatus) {
    OrgStatus["ACTIVE"] = "active";
    OrgStatus["INACTIVE"] = "inactive";
})(OrgStatus || (exports.OrgStatus = OrgStatus = {}));
var KycStatus;
(function (KycStatus) {
    KycStatus["NONE"] = "none";
    KycStatus["PENDING"] = "pending";
    KycStatus["APPROVED"] = "approved";
    KycStatus["REJECTED"] = "rejected";
})(KycStatus || (exports.KycStatus = KycStatus = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["CREATED"] = "created";
    SubscriptionStatus["PENDING_PAYMENT"] = "pending_payment";
    SubscriptionStatus["DISBURSED"] = "disbursed";
    SubscriptionStatus["ACTIVE_REPAYMENT"] = "active_repayment";
    SubscriptionStatus["SETTLED"] = "settled";
    SubscriptionStatus["DEFAULTED"] = "defaulted";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var InstallmentStatus;
(function (InstallmentStatus) {
    InstallmentStatus["PENDING"] = "pending";
    InstallmentStatus["PAID"] = "paid";
    InstallmentStatus["OVERDUE"] = "overdue";
})(InstallmentStatus || (exports.InstallmentStatus = InstallmentStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["SUCCESS"] = "success";
    PaymentStatus["SUCCESSFUL"] = "successful";
    PaymentStatus["FAILED"] = "failed";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PayoutStatus;
(function (PayoutStatus) {
    PayoutStatus["PENDING"] = "pending";
    PayoutStatus["COMPLETED"] = "completed";
    PayoutStatus["FAILED"] = "failed";
})(PayoutStatus || (exports.PayoutStatus = PayoutStatus = {}));
var JournalStatus;
(function (JournalStatus) {
    JournalStatus["DRAFT"] = "draft";
    JournalStatus["POSTED"] = "posted";
})(JournalStatus || (exports.JournalStatus = JournalStatus = {}));
var AccountType;
(function (AccountType) {
    AccountType["ASSET"] = "asset";
    AccountType["LIABILITY"] = "liability";
    AccountType["EQUITY"] = "equity";
    AccountType["REVENUE"] = "revenue";
    AccountType["EXPENSE"] = "expense";
})(AccountType || (exports.AccountType = AccountType = {}));
var FeeSource;
(function (FeeSource) {
    FeeSource["BNPL"] = "bnpl";
    FeeSource["LOAN"] = "loan";
    FeeSource["INVESTMENT"] = "investment";
    FeeSource["REGISTRATION"] = "registration";
})(FeeSource || (exports.FeeSource = FeeSource = {}));
var PotType;
(function (PotType) {
    PotType["BUSINESS_MANAGER"] = "business_manager";
    PotType["PLATFORM"] = "platform";
    PotType["ORGANIZATION"] = "organization";
    PotType["APEX"] = "apex";
    PotType["ADMIN"] = "admin";
})(PotType || (exports.PotType = PotType = {}));
var SmsProvider;
(function (SmsProvider) {
    SmsProvider["TERMII"] = "termii";
})(SmsProvider || (exports.SmsProvider = SmsProvider = {}));
var SmsStatus;
(function (SmsStatus) {
    SmsStatus["SENT"] = "sent";
    SmsStatus["FAILED"] = "failed";
})(SmsStatus || (exports.SmsStatus = SmsStatus = {}));
var KycProvider;
(function (KycProvider) {
    KycProvider["KORAPAY"] = "korapay";
})(KycProvider || (exports.KycProvider = KycProvider = {}));
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["PAYSTACK"] = "paystack";
    PaymentProvider["FIRSTBANK"] = "firstbank";
    PaymentProvider["WEMA"] = "wema";
    PaymentProvider["KORAPAY"] = "korapay";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
//# sourceMappingURL=status.enum.js.map