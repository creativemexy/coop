export declare enum OrgStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare enum KycStatus {
    NONE = "none",
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare enum SubscriptionStatus {
    CREATED = "created",
    PENDING_PAYMENT = "pending_payment",
    DISBURSED = "disbursed",
    ACTIVE_REPAYMENT = "active_repayment",
    SETTLED = "settled",
    DEFAULTED = "defaulted"
}
export declare enum InstallmentStatus {
    PENDING = "pending",
    PAID = "paid",
    OVERDUE = "overdue"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    SUCCESS = "success",
    SUCCESSFUL = "successful",
    FAILED = "failed"
}
export declare enum PayoutStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum JournalStatus {
    DRAFT = "draft",
    POSTED = "posted"
}
export declare enum AccountType {
    ASSET = "asset",
    LIABILITY = "liability",
    EQUITY = "equity",
    REVENUE = "revenue",
    EXPENSE = "expense"
}
export declare enum FeeSource {
    BNPL = "bnpl",
    LOAN = "loan",
    INVESTMENT = "investment",
    REGISTRATION = "registration"
}
export declare enum PotType {
    BUSINESS_MANAGER = "business_manager",
    PLATFORM = "platform",
    ORGANIZATION = "organization",
    APEX = "apex",
    ADMIN = "admin"
}
export declare enum SmsProvider {
    TERMII = "termii"
}
export declare enum SmsStatus {
    SENT = "sent",
    FAILED = "failed"
}
export declare enum KycProvider {
    KORAPAY = "korapay"
}
export declare enum PaymentProvider {
    PAYSTACK = "paystack",
    FIRSTBANK = "firstbank",
    WEMA = "wema",
    KORAPAY = "korapay"
}
