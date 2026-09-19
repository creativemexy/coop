import { NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard, Users, Package, Wallet, PiggyBank, Landmark, CircleCheck,
  BarChart3, FileText, Settings, LifeBuoy, HandCoins, TrendingUp,
  ShoppingCart, ClipboardList, Activity, Lock, Building2, ListChecks,
  Percent, AlertTriangle, Coins, SlidersHorizontal, Scale, BellRing, Monitor,
  ScrollText, BadgeCheck, ArrowLeftRight, ReceiptText, UserCircle, Send,
  NotepadText, CalendarClock, Palette, KeyRound, Library, Layers, DownloadCloud,
  Rocket, X, Menu, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../stores/auth.store'
import { useSidebar } from '../../stores/sidebar.store'
import { useBranding } from '../../stores/branding.store'
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
        'flex flex-col border-r bg-[#FFF9EF] transition-all duration-300 z-30',
        'fixed inset-y-0 left-0 lg:relative lg:inset-auto',
        collapsed ? 'lg:w-20' : 'lg:w-72',
        mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0',
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#EDE2D3] shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.organizationName} className="h-9 w-9 rounded-xl object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold text-[#FFF9EF]" style={{ backgroundColor: branding.primaryColor }}>
                  {(branding.organizationName || 'F').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-base truncate text-[#2C1B13]">{branding.organizationName}</span>
            </div>
          )}
          <button
            onClick={() => { toggle(); setMobileOpen(false) }}
            className="p-2 rounded-xl text-[#6B5245] hover:bg-[#EDE2D3] cursor-pointer hidden lg:block transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-[#6B5245] hover:bg-[#EDE2D3] cursor-pointer lg:hidden transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto space-y-1 p-3">
          {visibleItems.map((item) => {
            const Icon = iconMap[item.label] ?? fallbackIcon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    collapsed && 'lg:justify-center lg:px-3',
                    isActive
                      ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm'
                      : 'text-[#6B5245] hover:bg-white hover:shadow-sm',
                  )
                }
              >
                <Icon size={18} className={cn('shrink-0', collapsed ? 'lg:mx-0' : 'lg:mr-3', 'mr-3 lg:mr-0', !collapsed && 'lg:mr-3')} />
                <span className={cn(collapsed ? 'lg:hidden' : '', 'block')}>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#23150F]/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
