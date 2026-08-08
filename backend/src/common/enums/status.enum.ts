export enum OrgStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum KycStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum SubscriptionStatus {
  CREATED = 'created',
  PENDING_PAYMENT = 'pending_payment',
  DISBURSED = 'disbursed',
  ACTIVE_REPAYMENT = 'active_repayment',
  SETTLED = 'settled',
  DEFAULTED = 'defaulted',
}

export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
}

export enum PayoutStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum JournalStatus {
  DRAFT = 'draft',
  POSTED = 'posted',
}

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

export enum FeeSource {
  BNPL = 'bnpl',
  LOAN = 'loan',
  INVESTMENT = 'investment',
  REGISTRATION = 'registration',
}

export enum PotType {
  BUSINESS_MANAGER = 'business_manager',
  PLATFORM = 'platform',
  ORGANIZATION = 'organization',
  APEX = 'apex',
  ADMIN = 'admin',
}

export enum SmsProvider {
  TERMII = 'termii',
}

export enum SmsStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

export enum KycProvider {
  KORAPAY = 'korapay',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  FIRSTBANK = 'firstbank',
  WEMA = 'wema',
  KORAPAY = 'korapay',
}
