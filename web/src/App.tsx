import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './stores/auth.store'
import { useTheme } from './stores/theme.store'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/auth/Login'
import { SocialCallback } from './pages/auth/SocialCallback'
import { Register } from './pages/auth/Register'
import { Terms } from './pages/auth/Terms'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { Maintenance } from './pages/Maintenance'
import { SuperAdminDashboard } from './pages/super-admin/Dashboard'
import { ApexOrganizations } from './pages/super-admin/ApexOrganizations'
import { Organizations } from './pages/super-admin/Organizations'
import { Users } from './pages/super-admin/Users'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminConfig } from './pages/admin/Config'
import { AdminMonitoring } from './pages/admin/Monitoring'
import { AdminReports } from './pages/admin/Reports'
import { AdminApprovals } from './pages/admin/Approvals'
import { AdminUsers } from './pages/admin/Users'
import { AdminAuditLogs } from './pages/admin/AuditLogs'
import { AdminKycReview } from './pages/admin/KycReview'
import { AdminDisputes } from './pages/admin/AdminDisputes'
import { AdminMemberStatements } from './pages/admin/MemberStatements'
import { ApexBusinessManagerDashboard } from './pages/apex-business-manager/Dashboard'
import { ApexBusinessManagerUsers } from './pages/apex-business-manager/Users'
import { AccountantDashboard } from './pages/accountant/Dashboard'
import { Accounts } from './pages/accountant/Accounts'
import { JournalEntries } from './pages/accountant/JournalEntries'
import { FeePots } from './pages/accountant/FeePots'
import { Reports as AccountantReports } from './pages/accountant/Reports'
import { BnplFinancials } from './pages/accountant/BnplFinancials'
import { ReconciliationWorkbench } from './pages/accountant/ReconciliationWorkbench'
import { TransactionRegister } from './pages/accountant/TransactionRegister'
import { BusinessManagerDashboard } from './pages/business-manager/Dashboard'
import { BusinessManagerUsers } from './pages/business-manager/Users'
import { KycReview } from './pages/business-manager/KycReview'
import { BnplManagerDashboard } from './pages/bnpl-manager/Dashboard'
import { Catalog } from './pages/bnpl-manager/Catalog'
import { Plans } from './pages/bnpl-manager/Plans'
import { Subscriptions } from './pages/bnpl-manager/Subscriptions'
import { Installments } from './pages/bnpl-manager/Installments'
import { Orders } from './pages/bnpl-manager/Orders'
import { Collections } from './pages/bnpl-manager/Collections'
import { RiskConsole } from './pages/bnpl-manager/RiskConsole'
import { Reports } from './pages/bnpl-manager/Reports'
import { AuditLogs } from './pages/bnpl-manager/AuditLogs'
import { Approvals } from './pages/bnpl-manager/Approvals'
import { Support } from './pages/bnpl-manager/Support'
import { PlanConfigPage } from './pages/bnpl-manager/PlanConfig'
import { IndividualDashboard } from './pages/individual/Dashboard'
import { Catalog as IndividualCatalog } from './pages/individual/Catalog'
import { Subscriptions as IndividualSubscriptions } from './pages/individual/Subscriptions'
import { Kyc } from './pages/individual/Kyc'
import { Profile } from './pages/individual/Profile'
import { Savings } from './pages/individual/Savings'
import { Loans } from './pages/individual/Loans'
import { Statements } from './pages/individual/Statements'
import { Repayments } from './pages/individual/Repayments'
import { Support as IndividualSupport } from './pages/individual/Support'
import { Investments } from './pages/individual/Investments'
import { Portfolio } from './pages/individual/Portfolio'
import { Distributions } from './pages/individual/Distributions'
import { Redemptions } from './pages/individual/Redemptions'
import { InvestmentStatements } from './pages/individual/InvestmentStatements'
import { Notifications } from './pages/individual/Notifications'
import { Referrals } from './pages/individual/Referrals'
import { PaymentMethods } from './pages/individual/PaymentMethods'
import { ActivityLog } from './pages/individual/ActivityLog'
import { Transactions } from './pages/individual/Transactions'
import { PayRegistrationFee } from './pages/register/PayRegistrationFee'
import { PaymentCallback } from './pages/register/PaymentCallback'
import { Settings } from './pages/super-admin/Settings'
import { PolicyGovernance } from './pages/super-admin/PolicyGovernance'
import { TenantOnboarding } from './pages/super-admin/TenantOnboarding'
import { FeatureFlags } from './pages/super-admin/FeatureFlags'
import { Incidents } from './pages/super-admin/Incidents'
import { SecurityConfig } from './pages/super-admin/SecurityConfig'
import { Secrets } from './pages/super-admin/Secrets'
import { Tenants } from './pages/super-admin/Tenants'
import { SecurityAndPolicies } from './pages/super-admin/SecurityAndPolicies'
import { Releases } from './pages/super-admin/Releases'
import { Monitoring } from './pages/super-admin/Monitoring'
import { GlobalAuditLogs } from './pages/super-admin/GlobalAuditLogs'
import { InvestmentGovernance } from './pages/super-admin/InvestmentGovernance'
import { Branding } from './pages/super-admin/Branding'
import { FinancialReports } from './pages/super-admin/FinancialReports'
import { KYCComplianceOverview } from './pages/super-admin/KYCComplianceOverview'
import { PaymentTransactionLog } from './pages/super-admin/PaymentTransactionLog'
import { NotificationTemplates } from './pages/super-admin/NotificationTemplates'
import { GlobalRiskConfiguration } from './pages/super-admin/GlobalRiskConfiguration'
import { FinancialConfiguration } from './pages/super-admin/FinancialConfiguration'
import { DisputeManagement } from './pages/super-admin/DisputeManagement'
import { SystemConfiguration } from './pages/super-admin/SystemConfiguration'
import { RolePermissions } from './pages/super-admin/RolePermissions'
import { SuperAdminFeePots } from './pages/super-admin/FeePots'
import LandingLayout from './components/landing/LandingLayout'
import LandingHome from './pages/landing/Home'
import LandingAbout from './pages/landing/About'
import LandingServices from './pages/landing/Services'
import LandingMembership from './pages/landing/Membership'
import LandingFaq from './pages/landing/Faq'
import LandingContact from './pages/landing/Contact'

export default function App() {
  const { restoreSession } = useAuth()
  const restored = useRef(false)
  useTheme()

  useEffect(() => {
    if (restored.current) return
    restored.current = true
    restoreSession()
  }, [restoreSession])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/register/pay-fee" element={<PayRegistrationFee />} />
        <Route path="/register/payment-callback" element={<PaymentCallback />} />
        <Route path="/auth/social-callback" element={<SocialCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/maintenance" element={<Maintenance />} />

        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingHome />} />
          <Route path="/about" element={<LandingAbout />} />
          <Route path="/services" element={<LandingServices />} />
          <Route path="/membership" element={<LandingMembership />} />
          <Route path="/faq" element={<LandingFaq />} />
          <Route path="/contact" element={<LandingContact />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/apex-organizations" element={<ApexOrganizations />} />
            <Route path="/super-admin/organizations" element={<Organizations />} />
            <Route path="/super-admin/users" element={<Users />} />
            <Route path="/super-admin/catalog" element={<Catalog />} />
            <Route path="/super-admin/plans" element={<Plans />} />
            <Route path="/super-admin/plan-config" element={<PlanConfigPage />} />
            <Route path="/super-admin/investment-governance" element={<InvestmentGovernance />} />
            <Route path="/super-admin/policies" element={<PolicyGovernance />} />
            <Route path="/super-admin/onboarding" element={<TenantOnboarding />} />
            <Route path="/super-admin/feature-flags" element={<FeatureFlags />} />
            <Route path="/super-admin/incidents" element={<Incidents />} />
            <Route path="/super-admin/security" element={<SecurityConfig />} />
            <Route path="/super-admin/secrets" element={<Secrets />} />
            <Route path="/super-admin/settings" element={<Settings />} />
            <Route path="/super-admin/tenants" element={<Tenants />} />
            <Route path="/super-admin/security-policies" element={<SecurityAndPolicies />} />
            <Route path="/super-admin/releases" element={<Releases />} />
            <Route path="/super-admin/monitoring" element={<Monitoring />} />
            <Route path="/super-admin/audit-logs" element={<GlobalAuditLogs />} />
            <Route path="/super-admin/branding" element={<Branding />} />
            <Route path="/super-admin/financial-reports" element={<FinancialReports />} />
            <Route path="/super-admin/kyc-compliance" element={<KYCComplianceOverview />} />
            <Route path="/super-admin/payment-transactions" element={<PaymentTransactionLog />} />
            <Route path="/super-admin/notification-templates" element={<NotificationTemplates />} />
            <Route path="/super-admin/risk-configuration" element={<GlobalRiskConfiguration />} />
            <Route path="/super-admin/financial-config" element={<FinancialConfiguration />} />
            <Route path="/super-admin/disputes" element={<DisputeManagement />} />
            <Route path="/super-admin/system-config" element={<SystemConfiguration />} />
            <Route path="/super-admin/role-permissions" element={<RolePermissions />} />
            <Route path="/super-admin/fee-pots" element={<SuperAdminFeePots />} />
            <Route path="/super-admin/support" element={<Support />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['operational_admin']} />}>
          <Route element={<AppLayout />}>
            <Route path="/operational-admin" element={<AdminDashboard />} />
            <Route path="/operational-admin/config" element={<AdminConfig />} />
            <Route path="/operational-admin/monitoring" element={<AdminMonitoring />} />
            <Route path="/operational-admin/reports" element={<AdminReports />} />
            <Route path="/operational-admin/approvals" element={<AdminApprovals />} />
            <Route path="/operational-admin/users" element={<AdminUsers />} />
            <Route path="/operational-admin/audit-logs" element={<AdminAuditLogs />} />
            <Route path="/operational-admin/kyc-review" element={<AdminKycReview />} />
            <Route path="/operational-admin/disputes" element={<AdminDisputes />} />
            <Route path="/operational-admin/member-statements" element={<AdminMemberStatements />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
          <Route element={<AppLayout />}>
            <Route path="/accountant" element={<AccountantDashboard />} />
            <Route path="/accountant/accounts" element={<Accounts />} />
            <Route path="/accountant/journal-entries" element={<JournalEntries />} />
            <Route path="/accountant/fee-pots" element={<FeePots />} />
            <Route path="/accountant/bnpl-financials" element={<BnplFinancials />} />
            <Route path="/accountant/reconciliation" element={<ReconciliationWorkbench />} />
            <Route path="/accountant/transactions" element={<TransactionRegister />} />
            <Route path="/accountant/reports" element={<AccountantReports />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['business_manager']} />}>
          <Route element={<AppLayout />}>
            <Route path="/business-manager" element={<BusinessManagerDashboard />} />
            <Route path="/business-manager/users" element={<BusinessManagerUsers />} />
            <Route path="/business-manager/catalog" element={<Catalog />} />
            <Route path="/business-manager/orders" element={<Orders />} />
            <Route path="/business-manager/collections" element={<Collections />} />
            <Route path="/business-manager/risk-console" element={<RiskConsole />} />
            <Route path="/business-manager/reports" element={<Reports />} />
            <Route path="/business-manager/audit-logs" element={<AuditLogs />} />
            <Route path="/business-manager/approvals" element={<Approvals />} />

          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['apex_business_manager']} />}>
          <Route element={<AppLayout />}>
            <Route path="/apex-bm" element={<ApexBusinessManagerDashboard />} />
            <Route path="/apex-bm/users" element={<ApexBusinessManagerUsers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['bnpl_manager']} />}>
          <Route element={<AppLayout />}>
            <Route path="/bnpl-manager" element={<BnplManagerDashboard />} />
            <Route path="/bnpl-manager/catalog" element={<Catalog />} />
            <Route path="/bnpl-manager/plans" element={<Plans />} />
            <Route path="/bnpl-manager/subscriptions" element={<Subscriptions />} />
            <Route path="/bnpl-manager/installments" element={<Installments />} />
            <Route path="/bnpl-manager/kyc-review" element={<KycReview />} />
            <Route path="/bnpl-manager/orders" element={<Orders />} />
            <Route path="/bnpl-manager/collections" element={<Collections />} />
            <Route path="/bnpl-manager/risk-console" element={<RiskConsole />} />
            <Route path="/bnpl-manager/reports" element={<Reports />} />
            <Route path="/bnpl-manager/audit-logs" element={<AuditLogs />} />
            <Route path="/bnpl-manager/approvals" element={<Approvals />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['individual']} />}>
          <Route element={<AppLayout />}>
            <Route path="/individual" element={<IndividualDashboard />} />
            <Route path="/individual/catalog" element={<IndividualCatalog />} />
            <Route path="/individual/subscriptions" element={<IndividualSubscriptions />} />
            <Route path="/individual/kyc" element={<Kyc />} />
            <Route path="/individual/savings" element={<Savings />} />
            <Route path="/individual/loans" element={<Loans />} />
            <Route path="/individual/profile" element={<Profile />} />
            <Route path="/individual/statements" element={<Statements />} />
            <Route path="/individual/repayments" element={<Repayments />} />
            <Route path="/individual/support" element={<IndividualSupport />} />
            <Route path="/individual/investments" element={<Investments />} />
            <Route path="/individual/portfolio" element={<Portfolio />} />
            <Route path="/individual/distributions" element={<Distributions />} />
            <Route path="/individual/redemptions" element={<Redemptions />} />
            <Route path="/individual/investment-statements" element={<InvestmentStatements />} />
            <Route path="/individual/notifications" element={<Notifications />} />
            <Route path="/individual/referrals" element={<Referrals />} />
            <Route path="/individual/payment-methods" element={<PaymentMethods />} />
            <Route path="/individual/activity-log" element={<ActivityLog />} />
            <Route path="/individual/transactions" element={<Transactions />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
