import { config } from '../config';

export const API_BASE_URL = config.apiUrl;

export const API_PREFIX = 'api/v1';

export const ENDPOINTS = {
  auth: {
    login: `${API_PREFIX}/auth/login`,
    register: `${API_PREFIX}/auth/register`,
    refresh: `${API_PREFIX}/auth/refresh`,
    logout: `${API_PREFIX}/auth/logout`,
    me: `${API_PREFIX}/users/me`,
    socialExchange: `${API_PREFIX}/auth/social/exchange`,
  },
  users: {
    me: `${API_PREFIX}/users/me`,
    updateMe: `${API_PREFIX}/users/me`,
    deleteMe: `${API_PREFIX}/users/me`,
    export: `${API_PREFIX}/users/me/export`,
    activity: `${API_PREFIX}/users/me/activity`,
    changePassword: `${API_PREFIX}/auth/change-password`,
    notificationPreferences: `${API_PREFIX}/users/me/notification-preferences`,
    referralCode: `${API_PREFIX}/users/me/referral-code`,
    referralStats: `${API_PREFIX}/users/me/referral-stats`,
    referrals: `${API_PREFIX}/users/me/referrals`,
  },
  dashboard: {
    individual: `${API_PREFIX}/dashboard/individual`,
    transactions: `${API_PREFIX}/dashboard/individual/transactions`,
    statement: `${API_PREFIX}/dashboard/individual/statement`,
    statementExport: `${API_PREFIX}/dashboard/individual/statement/export`,
    repayments: `${API_PREFIX}/dashboard/individual/repayments`,
    tickets: `${API_PREFIX}/dashboard/individual/tickets`,
  },
  catalog: `${API_PREFIX}/bnpl/catalog`,
  plans: `${API_PREFIX}/bnpl/plans`,
  subscriptions: `${API_PREFIX}/bnpl/subscriptions`,
  installments: (subscriptionId: string) =>
    `${API_PREFIX}/bnpl/installments/subscription/${subscriptionId}`,
  registrations: {
    apexOrganizations: `${API_PREFIX}/registrations/apex-organizations`,
    organizations: `${API_PREFIX}/registrations/organizations`,
  },
  payments: `${API_PREFIX}/payments`,
  verifyPayment: (reference: string) => `${API_PREFIX}/payments/verify/${reference}`,
  paymentMethods: `${API_PREFIX}/payment-methods`,
  savings: {
    account: `${API_PREFIX}/savings`,
    transactions: `${API_PREFIX}/savings/transactions`,
    deposit: `${API_PREFIX}/savings/deposit`,
    withdraw: `${API_PREFIX}/savings/withdraw`,
    target: `${API_PREFIX}/savings/target`,
  },
  loans: {
    apply: `${API_PREFIX}/loans/apply`,
    eligibility: `${API_PREFIX}/loans/eligibility`,
    list: `${API_PREFIX}/loans`,
    repay: (loanId: string, repaymentId: string) =>
      `${API_PREFIX}/loans/${loanId}/repay/${repaymentId}`,
  },
  kyc: {
    initiate: `${API_PREFIX}/kyc/initiate`,
    status: `${API_PREFIX}/kyc/status`,
  },
  notifications: `${API_PREFIX}/notifications`,
  investments: {
    products: `${API_PREFIX}/investments/products`,
    orders: `${API_PREFIX}/investments/orders`,
    holdings: `${API_PREFIX}/investments/holdings`,
    portfolio: `${API_PREFIX}/investments/portfolio`,
    distributions: `${API_PREFIX}/investments/distributions/mine`,
    pendingDistributions: `${API_PREFIX}/investments/distributions/pending`,
    redemptions: `${API_PREFIX}/investments/redemptions`,
    invest: `${API_PREFIX}/investments/invest`,
    statement: `${API_PREFIX}/investments/statement`,
    compliance: `${API_PREFIX}/investments/compliance`,
    confirmOrder: (id: string) =>
      `${API_PREFIX}/investments/orders/${id}/confirm`,
  },
};
