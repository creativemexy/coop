import { NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard, Users, Package, Wallet, PiggyBank, Landmark, CircleCheck,
  BarChart3, FileText, Settings, LifeBuoy, HandCoins, TrendingUp,
  ShoppingCart, ClipboardList, Activity, Lock, Building2, ListChecks,
  Percent, AlertTriangle, Coins, SlidersHorizontal, Scale, BellRing, Monitor,
  ScrollText, BadgeCheck, ArrowLeftRight, ReceiptText, UserCircle, Send,
  NotepadText, CalendarClock, Palette, KeyRound, Library, Layers, DownloadCloud,
  Rocket, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../stores/auth.store'
import { useSidebar } from '../../stores/sidebar.store'
import { useBranding, DEFAULT_LOGO } from '../../stores/branding.store'
import { useRolePermissions } from '../../stores/role-permissions.store'
import { cn } from '../../lib/utils'

const iconMap: Record<string, LucideIcon> = {
  'System Overview': LayoutDashboard,
  'Dashboard': LayoutDashboard,
  'Apex Dashboard': LayoutDashboard,
  'Apex Orgs': Building2,
  'Tenants': Building2,
  'Users': Users,
  'Users & Roles': Users,
  'User Management': Users,
  'Catalog': Package,
  'Plans': Library,
  'Plan Config': Settings,
  'Investment Governance': Scale,
  'Security & Policies': Lock,
  'Releases': Rocket,
  'Incidents': AlertTriangle,
  'Monitoring': Monitor,
  'Audit Logs': ScrollText,
  'Activity Log': Activity,
  'Financial Reports': BarChart3,
  'Fee Pots': Coins,
  'KYC Compliance': BadgeCheck,
  'KYC Review': BadgeCheck,
  'KYC': BadgeCheck,
  'Payment Transactions': ReceiptText,
  'Notification Templates': BellRing,
  'Risk Config': SlidersHorizontal,
  'Risk Console': AlertTriangle,
  'Financial Config': Percent,
  'Disputes': Scale,
  'System Config': Settings,
  'Branding': Palette,
  'Role Permissions': KeyRound,
  'Support': LifeBuoy,
  'Settings': Settings,
  'Accounts': Landmark,
  'Journal Entries': NotepadText,
  'BNPL Financials': Coins,
  'Reconciliation': ArrowLeftRight,
  'Transaction Register': ReceiptText,
  'Reports': BarChart3,
  'Approvals': ListChecks,
  'Orders': ShoppingCart,
  'Collections': HandCoins,
  'Subscriptions': ClipboardList,
  'Installments': CalendarClock,
  'Withdraw Share': HandCoins,
  'Member Statements': FileText,
  'Savings': PiggyBank,
  'Loans': Landmark,
  'Profile': UserCircle,
  'Investments': TrendingUp,
  'Portfolio': BarChart3,
  'Distributions': Send,
  'Redemptions': DownloadCloud,
  'Investment Statements': FileText,
  'Repayments': HandCoins,
  'Statements': FileText,
  'Transactions': ArrowLeftRight,
  'Notifications': BellRing,
  'Payment Methods': Wallet,
  'My Subscriptions': ClipboardList,
  'Config & Toggles': SlidersHorizontal,
  'System': Settings,
  'App Settings': Settings,
  'User Activities': Activity,
  'KYC Compliance Center': BadgeCheck,
  'Risk & Exceptions Console': AlertTriangle,
  'Accounts & Balances': Landmark,
  'Ledger': NotepadText,
  'Charts of Accounts': Layers,
  'Loan Approvals': ListChecks,
  'Loan Disbursements': HandCoins,
}

const fallbackIcon: LucideIcon = CircleCheck

const iconColors: Record<string, string> = {
  'System Overview': '#6366f1',
  'Dashboard': '#6366f1',
  'Apex Dashboard': '#0ea5e9',
  'Apex Orgs': '#0ea5e9',
  'Tenants': '#8b5cf6',
  'Users': '#22c55e',
  'Users & Roles': '#22c55e',
  'User Management': '#22c55e',
  'Catalog': '#f97316',
  'Plans': '#ef4444',
  'Plan Config': '#f59e0b',
  'Investment Governance': '#10b981',
  'Security & Policies': '#64748b',
  'Releases': '#a855f7',
  'Incidents': '#dc2626',
  'Monitoring': '#0ea5e9',
  'Audit Logs': '#f43f5e',
  'Activity Log': '#14b8a6',
  'Financial Reports': '#3b82f6',
  'Fee Pots': '#eab308',
  'KYC Compliance': '#10b981',
  'KYC Review': '#10b981',
  'KYC': '#10b981',
  'Payment Transactions': '#06b6d4',
  'Notification Templates': '#ec4899',
  'Risk Config': '#f97316',
  'Risk Console': '#dc2626',
  'Financial Config': '#84cc16',
  'Disputes': '#f43f5e',
  'System Config': '#64748b',
  'Branding': '#e879f9',
  'Role Permissions': '#6366f1',
  'Support': '#3b82f6',
  'Settings': '#64748b',
  'Accounts': '#0ea5e9',
  'Journal Entries': '#14b8a6',
  'BNPL Financials': '#eab308',
  'Reconciliation': '#8b5cf6',
  'Transaction Register': '#06b6d4',
  'Reports': '#3b82f6',
  'Approvals': '#10b981',
  'Orders': '#f97316',
  'Collections': '#eab308',
  'Subscriptions': '#a855f7',
  'Installments': '#0ea5e9',
  'Withdraw Share': '#f59e0e',
  'Member Statements': '#14b8a6',
  'Savings': '#22c55e',
  'Loans': '#0ea5e9',
  'Profile': '#8b5cf6',
  'Investments': '#10b981',
  'Portfolio': '#3b82f6',
  'Distributions': '#06b6d4',
  'Redemptions': '#f43f5e',
  'Investment Statements': '#14b8a6',
  'Repayments': '#f59e0e',
  'Statements': '#14b8a6',
  'Notifications': '#ec4899',
  'Payment Methods': '#eab308',
  'My Subscriptions': '#a855f7',
  'Config & Toggles': '#f97316',
  'User Activities': '#14b8a6',
  'KYC Compliance Center': '#10b981',
  'Risk & Exceptions Console': '#dc2626',
  'Accounts & Balances': '#0ea5e9',
  'Ledger': '#14b8a6',
  'Charts of Accounts': '#8b5cf6',
  'Loan Approvals': '#10b981',
  'Loan Disbursements': '#06b6d4',
  'System': '#64748b',
  'App Settings': '#64748b',
}

const navItems: Record<string, { label: string; path: string }[]> = {
  super_admin: [
    { label: 'System Overview', path: '/super-admin' },
    { label: 'Apex Orgs', path: '/super-admin/apex-organizations' },
    { label: 'Tenants', path: '/super-admin/tenants' },
    { label: 'Users', path: '/super-admin/users' },
    { label: 'Catalog', path: '/super-admin/catalog' },
    { label: 'Plans', path: '/super-admin/plans' },
    { label: 'Plan Config', path: '/super-admin/plan-config' },
    { label: 'Investment Governance', path: '/super-admin/investment-governance' },
    { label: 'Security & Policies', path: '/super-admin/security-policies' },
    { label: 'Releases', path: '/super-admin/releases' },
    { label: 'Incidents', path: '/super-admin/incidents' },
    { label: 'Monitoring', path: '/super-admin/monitoring' },
    { label: 'Audit Logs', path: '/super-admin/audit-logs' },
    { label: 'Financial Reports', path: '/super-admin/financial-reports' },
    { label: 'Fee Pots', path: '/super-admin/fee-pots' },
    { label: 'KYC Compliance', path: '/super-admin/kyc-compliance' },
    { label: 'Payment Transactions', path: '/super-admin/payment-transactions' },
    { label: 'Notification Templates', path: '/super-admin/notification-templates' },
    { label: 'Risk Config', path: '/super-admin/risk-configuration' },
    { label: 'Financial Config', path: '/super-admin/financial-config' },
    { label: 'Disputes', path: '/super-admin/disputes' },
    { label: 'System Config', path: '/super-admin/system-config' },
    { label: 'Branding', path: '/super-admin/branding' },
    { label: 'Role Permissions', path: '/super-admin/role-permissions' },
    { label: 'Support', path: '/super-admin/support' },
    { label: 'Loan Approvals', path: '/super-admin/loans' },
    { label: 'Settings', path: '/super-admin/settings' },
  ],
  operational_admin: [
    { label: 'Dashboard', path: '/operational-admin' },
    { label: 'Users & Roles', path: '/operational-admin/users' },
    { label: 'KYC Review', path: '/operational-admin/kyc-review' },
    { label: 'Disputes', path: '/operational-admin/disputes' },
    { label: 'Member Statements', path: '/operational-admin/member-statements' },
    { label: 'Reports', path: '/operational-admin/reports' },
    { label: 'Audit Logs', path: '/operational-admin/audit-logs' },
    { label: 'Approvals', path: '/operational-admin/approvals' },
    { label: 'Loan Approvals', path: '/operational-admin/loans' },
    { label: 'Config & Toggles', path: '/operational-admin/config' },
    { label: 'Monitoring', path: '/operational-admin/monitoring' },
  ],
  customer_care: [
    { label: 'Support Tickets', path: '/customer-care' },
  ],
  accountant: [
    { label: 'Dashboard', path: '/accountant' },
    { label: 'Accounts', path: '/accountant/accounts' },
    { label: 'Journal Entries', path: '/accountant/journal-entries' },
    { label: 'Fee Pots', path: '/accountant/fee-pots' },
    { label: 'BNPL Financials', path: '/accountant/bnpl-financials' },
    { label: 'Reconciliation', path: '/accountant/reconciliation' },
    { label: 'Transaction Register', path: '/accountant/transactions' },
    { label: 'Reports', path: '/accountant/reports' },
    { label: 'Loan Disbursements', path: '/accountant/loans' },
  ],
  business_manager: [
    { label: 'Dashboard', path: '/business-manager' },
    { label: 'Approvals', path: '/business-manager/approvals' },
    { label: 'Loan Approvals', path: '/business-manager/loans' },
    { label: 'Users', path: '/business-manager/users' },
    { label: 'Orders', path: '/business-manager/orders' },
    { label: 'Collections', path: '/business-manager/collections' },
    { label: 'Reports', path: '/business-manager/reports' },
  ],
  apex_business_manager: [
    { label: 'Apex Dashboard', path: '/apex-bm' },
    { label: 'Users', path: '/apex-bm/users' },
    { label: 'Loan Approvals', path: '/apex-bm/loans' },
    { label: 'Withdraw Share', path: '/apex-bm/withdraw' },
  ],
  bnpl_manager: [
    { label: 'Dashboard', path: '/bnpl-manager' },
    { label: 'Approvals', path: '/bnpl-manager/approvals' },
    { label: 'Catalog', path: '/bnpl-manager/catalog' },
    { label: 'Plans', path: '/bnpl-manager/plans' },
    { label: 'Orders', path: '/bnpl-manager/orders' },
    { label: 'Collections', path: '/bnpl-manager/collections' },
    { label: 'Risk Console', path: '/bnpl-manager/risk-console' },
    { label: 'Reports', path: '/bnpl-manager/reports' },
    { label: 'Audit Logs', path: '/bnpl-manager/audit-logs' },
    { label: 'Subscriptions', path: '/bnpl-manager/subscriptions' },
    { label: 'Installments', path: '/bnpl-manager/installments' },
    { label: 'KYC Review', path: '/bnpl-manager/kyc-review' },
  ],
  individual: [
    { label: 'Dashboard', path: '/individual' },
    { label: 'Catalog', path: '/individual/catalog' },
    { label: 'My Subscriptions', path: '/individual/subscriptions' },
    { label: 'Savings', path: '/individual/savings' },
    { label: 'Loans', path: '/individual/loans' },
    { label: 'KYC', path: '/individual/kyc' },
    { label: 'Profile', path: '/individual/profile' },
    { label: 'Investments', path: '/individual/investments' },
    { label: 'Portfolio', path: '/individual/portfolio' },
    { label: 'Distributions', path: '/individual/distributions' },
    { label: 'Redemptions', path: '/individual/redemptions' },
    { label: 'Investment Statements', path: '/individual/investment-statements' },
    { label: 'Repayments', path: '/individual/repayments' },
    { label: 'Statements', path: '/individual/statements' },
    { label: 'Transactions', path: '/individual/transactions' },
    { label: 'Notifications', path: '/individual/notifications' },
    { label: 'Payment Methods', path: '/individual/payment-methods' },
    { label: 'Activity Log', path: '/individual/activity-log' },
    { label: 'Support', path: '/individual/support' },
  ],
}

export function Sidebar() {
  const { user } = useAuth()
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const { branding } = useBranding()
  const { isMenuDisabled } = useRolePermissions()
  const location = useLocation()

  useEffect(() => { setMobileOpen(false) }, [location.pathname, setMobileOpen])

  if (!user) return null

  const items = navItems[user.role] ?? []
  const visibleItems = items.filter(item => !isMenuDisabled(user.role, item.label))

  return (
    <>
      <aside className={cn(
        'flex flex-col border-r bg-white dark:bg-gray-900 dark:border-gray-700 transition-all duration-200 z-30',
        'fixed inset-y-0 left-0 lg:relative lg:inset-auto',
        collapsed ? 'lg:w-16' : 'lg:w-64',
        mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0',
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b dark:border-gray-700 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.organizationName} className="h-8 w-8 rounded object-contain" />
              ) : (
                <img src={DEFAULT_LOGO} alt={branding.organizationName} className="h-8 w-8 rounded object-contain" />
              )}
              <span className="font-bold text-lg truncate" style={{ color: branding.primaryColor }}>{branding.organizationName}</span>
            </div>
          )}
          <button
            onClick={() => { toggle(); setMobileOpen(false) }}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer hidden lg:block"
          >
            {collapsed ? '☰' : '✕'}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer lg:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto space-y-1 p-2">
          {visibleItems.map((item) => {
            const Icon = iconMap[item.label] ?? fallbackIcon
            const iconColor = iconColors[item.label]
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'lg:justify-center lg:px-2',
                    isActive
                      ? 'text-white dark:text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
                  )
                }
                style={({ isActive }) => isActive ? { backgroundColor: branding.primaryColor } : undefined}
              >
                <Icon size={18} className={cn('shrink-0', collapsed ? 'lg:mx-0' : 'lg:mr-3', 'mr-3 lg:mr-0', !collapsed && 'lg:mr-3')}
                  style={iconColor ? { color: iconColor } : undefined} />
                <span className={cn(collapsed ? 'lg:hidden' : '', 'block')}>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
