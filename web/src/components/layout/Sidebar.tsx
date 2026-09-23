import { NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import {
  LayoutDashboard, Users, Package, Wallet, PiggyBank, Landmark, CircleCheck,
  BarChart3, FileText, Settings, LifeBuoy, HandCoins, TrendingUp,
  ShoppingCart, ClipboardList, Activity, Lock, Building2, ListChecks,
  Percent, AlertTriangle, Coins, SlidersHorizontal, Scale, BellRing, Monitor,
  ScrollText, BadgeCheck, ArrowLeftRight, ReceiptText, UserCircle, Send,
  NotepadText, CalendarClock, Palette, KeyRound, Library, Layers, DownloadCloud,
  Rocket, X, Menu, Gauge, ShieldCheck, LogOut, type LucideIcon,
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

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  operational_admin: 'Operational Admin',
  customer_care: 'Customer Care',
  accountant: 'Accountant',
  business_manager: 'Business Manager',
  apex_business_manager: 'Apex BM',
  bnpl_manager: 'BNPL Manager',
  individual: 'Member',
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

const INDIVIDUAL_SECTIONS: Record<string, string> = {
  'Dashboard': 'Overview',
  'Investments': 'Money',
  'Portfolio': 'Money',
  'Distributions': 'Money',
  'Redemptions': 'Money',
  'Savings': 'Money',
  'Investment Statements': 'Money',
  'Loans': 'Borrowing',
  'Repayments': 'Borrowing',
  'Catalog': 'Shopping',
  'My Subscriptions': 'Shopping',
  'Profile': 'Account',
  'KYC': 'Account',
  'Payment Methods': 'Account',
  'Statements': 'Account',
  'Transactions': 'Account',
  'Notifications': 'Account',
  'Activity Log': 'Account',
  'Support': 'Support',
}

const SUPER_ADMIN_SECTIONS: Record<string, string> = {
  'System Overview': 'Overview',
  'Apex Orgs': 'Organizations',
  'Tenants': 'Organizations',
  'Users': 'Organizations',
  'Catalog': 'Organizations',
  'Plans': 'Organizations',
  'Plan Config': 'Organizations',
  'Investment Governance': 'Governance',
  'Security & Policies': 'Governance',
  'Role Permissions': 'Governance',
  'Loan Approvals': 'Operations',
  'Disputes': 'Operations',
  'Fee Pots': 'Financial',
  'Financial Reports': 'Financial',
  'Payment Transactions': 'Financial',
  'Financial Config': 'Financial',
  'Incidents': 'Risk & Monitoring',
  'Monitoring': 'Risk & Monitoring',
  'Audit Logs': 'Risk & Monitoring',
  'KYC Compliance': 'Risk & Monitoring',
  'Risk Config': 'Risk & Monitoring',
  'Releases': 'Product & Growth',
  'Branding': 'Product & Growth',
  'Notification Templates': 'Product & Growth',
  'System Config': 'System',
  'Support': 'System',
  'Settings': 'System',
}

const SECTION_META: { label: string; icon: LucideIcon }[] = [
  { label: 'Overview', icon: Gauge },
  { label: 'Organizations', icon: Building2 },
  { label: 'Governance', icon: Scale },
  { label: 'Operations', icon: ListChecks },
  { label: 'Financial', icon: Coins },
  { label: 'Risk & Monitoring', icon: ShieldCheck },
  { label: 'Product & Growth', icon: Rocket },
  { label: 'System', icon: Settings },
  { label: 'Support', icon: LifeBuoy },
  { label: 'Workspace', icon: LayoutDashboard },
]

const INDIVIDUAL_SECTION_META: { label: string; icon: LucideIcon }[] = [
  { label: 'Overview', icon: Gauge },
  { label: 'Money', icon: PiggyBank },
  { label: 'Borrowing', icon: Landmark },
  { label: 'Shopping', icon: ShoppingCart },
  { label: 'Account', icon: UserCircle },
  { label: 'Support', icon: LifeBuoy },
]

const ROLE_SECTION_META: Record<string, { label: string; icon: LucideIcon }[]> = {
  individual: INDIVIDUAL_SECTION_META,
  super_admin: SECTION_META,
  operational_admin: SECTION_META,
  accountant: SECTION_META,
  business_manager: SECTION_META,
  apex_business_manager: SECTION_META,
  bnpl_manager: SECTION_META,
  customer_care: SECTION_META,
}

const OPERATIONAL_ADMIN_SECTIONS: Record<string, string> = {
  'Dashboard': 'Overview',
  'Users & Roles': 'Operations',
  'KYC Review': 'Risk & Monitoring',
  'Disputes': 'Operations',
  'Member Statements': 'Financial',
  'Reports': 'Financial',
  'Audit Logs': 'Risk & Monitoring',
  'Approvals': 'Operations',
  'Loan Approvals': 'Operations',
  'Config & Toggles': 'System',
  'Monitoring': 'Risk & Monitoring',
}

const ACCOUNTANT_SECTIONS: Record<string, string> = {
  'Dashboard': 'Overview',
  'Accounts': 'Financial',
  'Journal Entries': 'Financial',
  'Fee Pots': 'Financial',
  'BNPL Financials': 'Financial',
  'Reconciliation': 'Financial',
  'Transaction Register': 'Financial',
  'Reports': 'Financial',
  'Loan Disbursements': 'Operations',
}

const BUSINESS_MANAGER_SECTIONS: Record<string, string> = {
  'Dashboard': 'Overview',
  'Approvals': 'Operations',
  'Loan Approvals': 'Operations',
  'Users': 'Organizations',
  'Orders': 'Operations',
  'Collections': 'Operations',
  'Reports': 'Financial',
}

const APEX_BM_SECTIONS: Record<string, string> = {
  'Apex Dashboard': 'Overview',
  'Users': 'Organizations',
  'Loan Approvals': 'Operations',
  'Withdraw Share': 'Financial',
}

const BNPL_MANAGER_SECTIONS: Record<string, string> = {
  'Dashboard': 'Overview',
  'Approvals': 'Operations',
  'Catalog': 'Organizations',
  'Plans': 'Organizations',
  'Orders': 'Operations',
  'Collections': 'Operations',
  'Risk Console': 'Risk & Monitoring',
  'Reports': 'Financial',
  'Audit Logs': 'Risk & Monitoring',
  'Subscriptions': 'Operations',
  'Installments': 'Operations',
  'KYC Review': 'Risk & Monitoring',
}

const ROLE_SECTIONS: Record<string, Record<string, string>> = {
  super_admin: SUPER_ADMIN_SECTIONS,
  individual: INDIVIDUAL_SECTIONS,
  operational_admin: OPERATIONAL_ADMIN_SECTIONS,
  accountant: ACCOUNTANT_SECTIONS,
  business_manager: BUSINESS_MANAGER_SECTIONS,
  apex_business_manager: APEX_BM_SECTIONS,
  bnpl_manager: BNPL_MANAGER_SECTIONS,
  customer_care: { 'Support Tickets': 'Support' },
}

const sectionOf = (label: string, role: string) =>
  ROLE_SECTIONS[role]?.[label] ?? 'Workspace'

export function Sidebar() {
  const { user, logout } = useAuth()
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()
  const { branding } = useBranding()
  const { isMenuDisabled } = useRolePermissions()
  const location = useLocation()

  useEffect(() => { setMobileOpen(false) }, [location.pathname, setMobileOpen])

  if (!user) return null

  const items = navItems[user.role] ?? []
  const visibleItems = items.filter(item => !isMenuDisabled(user.role, item.label))
  const isMember = user.role === 'individual'
  const sectionMeta = ROLE_SECTION_META[user.role] ?? SECTION_META
  const groups = sectionMeta
    .map((section) => ({
      ...section,
      items: visibleItems.filter((item) => sectionOf(item.label, user.role) === section.label),
    }))
    .filter((g) => g.items.length > 0)

  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() || '•'
  const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  const itemCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative flex items-center rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 outline-none cursor-pointer',
      collapsed ? 'lg:justify-center lg:px-0' : 'px-3.5',
      isActive
        ? 'bg-[#176B5B] text-white shadow-[0_10px_24px_-10px_rgba(23,107,91,0.55)]'
        : 'text-[#6B5245] hover:bg-white hover:text-[#23150F] hover:shadow-sm',
    )

  return (
    <>
      <aside className={cn(
        'flex flex-col border-r border-[#EDE2D3] bg-[#FFF9EF] transition-all duration-300 z-30',
        'fixed inset-y-0 left-0 lg:relative lg:inset-auto',
        collapsed ? 'lg:w-20' : 'lg:w-72',
        mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0',
      )}>
        {/* Brand header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#EDE2D3] px-4">
          <div className="flex min-w-0 items-center gap-3">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.organizationName} className="h-10 w-10 rounded-2xl object-contain ring-1 ring-[#E7DCCB]" />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg font-black text-[#FFF9EF] shadow-sm ring-1 ring-[#E7DCCB]/60"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {(branding.organizationName || 'F').charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-black tracking-[-0.02em] text-[#2C1B13]">
                  {isMember ? branding.organizationName : (ROLE_LABELS[user.role] ?? user.role.replace(/_/g, ' '))}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B79B6B]">
                  {isMember ? 'Member portal' : branding.organizationName}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => { toggle(); setMobileOpen(false) }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#6B5245] transition-colors hover:bg-[#EDE2D3] hover:text-[#23150F] cursor-pointer lg:inline-flex"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#6B5245] transition-colors hover:bg-[#EDE2D3] cursor-pointer lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Member greeting card */}
        {isMember && !collapsed && (
          <div className="border-b border-[#EDE2D3] px-4 py-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#EDE2D3]">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black text-[#FFF9EF]"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black leading-tight text-[#2C1B13]">
                    Welcome back, {displayName || user.email}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#176B5B]">
                    {user.kycStatus === 'verified' ? 'Verified member' : 'Member'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {groups.map((group, gi) => (
            <div key={group.label} className={cn(gi < groups.length - 1 && 'mb-4')}>
              <div className={cn('flex items-center gap-1.5 px-3', collapsed ? 'mb-0' : 'mb-1.5', gi !== 0 && !collapsed && 'mt-2')}>
                {collapsed ? (
                  <div className="mx-auto my-1.5 h-px w-8 bg-[#EDE2D3]" />
                ) : (
                  <>
                    <group.icon size={12} className="text-[#B79B6B]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B79B6B]">{group.label}</span>
                  </>
                )}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = iconMap[item.label] ?? fallbackIcon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end
                      title={collapsed ? item.label : undefined}
                      className={itemCls}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !collapsed && (
                            <span className="absolute left-1.5 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#F7D674] lg:block" />
                          )}
                          <Icon size={18} className={cn('shrink-0 transition-colors mr-3 lg:mr-3', collapsed && 'lg:mr-0')} />
                          <span className={cn('block', collapsed && 'lg:hidden')}>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <div className="px-4 py-10 text-center text-xs text-[#6B5245]">
              No sections are available for your role.
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-[#EDE2D3] p-3">
          <div className={cn('flex items-center gap-3 rounded-xl px-2 py-2', collapsed && 'lg:justify-center')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#176B5B] text-sm font-black text-[#FFF9EF] shadow-sm">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight text-[#2C1B13]">{displayName || user.email}</p>
                <p className="truncate text-xs leading-tight text-[#6B5245]">{user.role.replace('_', ' ')}</p>
              </div>
            )}
            <button
              onClick={() => logout()}
              title="Sign out"
              aria-label="Sign out"
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#6B5245] transition-colors hover:bg-[#B3261E]/10 hover:text-[#B3261E] cursor-pointer',
                !collapsed && 'ml-1',
              )}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-[#23150F]/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}