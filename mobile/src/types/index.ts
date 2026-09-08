export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  kycStatus: KycStatus;
  apexOrgId?: string;
  organizationId?: string;
  notificationPreferences?: { email?: boolean; sms?: boolean; inApp?: boolean };
}

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
  BUSINESS_MANAGER = 'business_manager',
  BNPL_MANAGER = 'bnpl_manager',
  INDIVIDUAL = 'individual',
}

export enum KycStatus {
  NONE = 'none',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum InstallmentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DashboardPortfolio {
  totalInvested: number;
  currentValue: number;
  totalEarned: number;
  holdingCount: number;
  unrealizedReturn: number;
  unrealizedReturnPct: number;
}

export interface DashboardData {
  activeSubscriptions: number;
  nextPaymentDate: string | null;
  nextPaymentAmount: number;
  kycStatus: KycStatus;
  savingsBalance: number;
  goalBalance: number;
  savingsTarget: number;
  activeLoans: number;
  totalOutstanding: number;
  portfolio: DashboardPortfolio;
  bnplEligible: boolean;
  bnplAvailable: number;
  bnplUsed: number;
  bnplCreditLimit: number;
}

export interface SavingsAccount {
  balance: number;
  goalBalance: number;
  targetAmount: number;
  withdrawalsEnabled: boolean;
}

export interface SavingsTransaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'interest';
  description: string | null;
  status: string;
  createdAt: string;
}

export interface VirtualAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  status: string;
  provider: string;
}

export interface DepositInstruction {
  id: string;
  amount: number;
  type: 'general' | 'goal' | 'loan';
  reference: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  status: string;
  expiresAt: string | null;
  creditedAt: string | null;
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  duration: number;
  monthlyPayment: number;
  totalRepayment: number;
  amountPaid: number;
  balance: number;
  status: string;
  purpose?: string;
  serviceFee: number;
  nextDueDate?: string;
  repayments?: LoanRepayment[];
}

export interface LoanRepayment {
  id: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: string;
}

export interface LoanEligibility {
  eligible: boolean;
  maxAmount: number;
  reason?: string;
}

export interface BnplCatalogItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: { url: string; sortOrder: number }[];
}

export interface BnplPlan {
  id: string;
  organizationId: string;
  catalogItemId: string;
  catalogItem?: BnplCatalogItem;
  downPaymentPercent: number;
  installmentCount: number;
  installmentFrequency: string;
  interestRate: number;
  status: string;
}

export interface BnplInstallment {
  id: string;
  subscriptionId: string;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAt?: string;
}

export interface BnplSubscription {
  id: string;
  userId: string;
  planId: string;
  plan?: BnplPlan;
  status: string;
  downPayment: number;
  totalAmount: number;
  amountPaid: number;
  nextInstallmentDate?: string;
  installments?: BnplInstallment[];
}

export interface UnifiedTransaction {
  date: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  reference: string;
}

export interface RepaymentSummary {
  totalUpcoming: number;
  pastPaid: number;
  overdueCount: number;
  bnplBalance: number;
  loanBalance: number;
  totalOutstanding: number;
  nextDueDate: string | null;
  nextDueAmount: number;
}

export interface RepaymentItem {
  id: string;
  itemName: string;
  type: 'bnpl' | 'loan';
  amount: number;
  lateFee: number;
  dueDate: string;
  status: string;
  paidAt?: string;
  paymentReference?: string;
  subscriptionId?: string;
  loanId?: string;
  isOverdue: boolean;
}

export interface RepaymentData {
  summary: RepaymentSummary;
  upcoming: RepaymentItem[];
  past: RepaymentItem[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  description?: string;
  category?: string;
  status: string;
  relatedOrderId?: string;
  relatedPaymentId?: string;
  resolutionNote?: string;
  senderName?: string;
  senderEmail?: string;
  canReply?: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  provider: string;
  last4?: string;
  cardBrand?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  details?: string | Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  createdAt: string;
}

export interface InvestmentProduct {
  id: string;
  name: string;
  description?: string;
  type: string;
  riskTier: string;
  minimumInvestment: number;
  maximumInvestment?: number | null;
  expectedReturnRate: number;
  distributionFrequency: string;
  lockInDays: number;
  tenorDays: number;
  unitPrice?: number | null;
  availableUnits?: number | null;
}

export interface InvestmentHolding {
  id: string;
  productId: string;
  productName: string;
  units: number;
  costBasis: number;
  currentValue: number;
  returnPercent: number;
  locked: boolean;
  unlockDate?: string;
  maturityDate?: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalEarned: number;
  holdingsCount: number;
  unrealizedReturn: number;
  unrealizedReturnPct?: number;
}

export interface DistributionItem {
  id: string;
  type: string;
  amount: number;
  units: number;
  recordDate: string;
  payDate: string;
  status: string;
}

export interface RedemptionRequest {
  id: string;
  productName: string;
  units: number;
  amount: number;
  status: string;
  reason?: string;
  createdAt: string;
}
