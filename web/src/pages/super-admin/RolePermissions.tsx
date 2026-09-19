import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { ChevronDown, ChevronUp, ShieldCheck, Check, X, Save, Lock, Unlock } from 'lucide-react'

const ALL_ROLES = [
  'super_admin',
  'operational_admin',
  'customer_care',
  'accountant',
  'business_manager',
  'apex_business_manager',
  'bnpl_manager',
  'supervisor',
  'loan_manager',
  'investment_manager',
  'individual',
  'operations',
]

const ALL_FEATURES = [
  'dashboards',
  'users',
  'kyc',
  'disputes',
  'reports',
  'audit_logs',
  'approvals',
  'catalog',
  'plans',
  'orders',
  'collections',
  'risk',
  'support',
  'investments',
  'savings',
  'loans',
  'payments',
  'subscriptions',
  'installments',
]

const ALL_MENU_ITEMS = [
  'System Overview', 'Apex Orgs', 'Tenants', 'Users', 'Catalog', 'Plans',
  'Investment Governance', 'Security & Policies', 'Releases', 'Incidents',
  'Monitoring', 'Audit Logs', 'Financial Reports', 'KYC Compliance',
  'Payment Transactions', 'Notification Templates', 'Risk Config',
  'Financial Config', 'Disputes', 'System Config', 'Branding', 'Settings',
  'Dashboard', 'Users & Roles', 'KYC Review', 'Member Statements', 'Reports',
  'Approvals', 'Config & Toggles', 'Accounts', 'Journal Entries', 'Fee Pots',
  'BNPL Financials', 'Reconciliation', 'Transaction Register',
  'Plan Config', 'Orders', 'Collections', 'Risk Console', 'Support',
  'Apex Dashboard', 'Withdraw Share', 'Subscriptions', 'Installments',
  'My Subscriptions', 'Savings', 'Loans', 'KYC', 'Profile', 'Investments',
  'Portfolio', 'Distributions', 'Redemptions', 'Investment Statements',
  'Repayments', 'Statements',
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  operational_admin: 'Operational Admin',
  customer_care: 'Customer Care',
  accountant: 'Accountant',
  business_manager: 'Business Manager',
  apex_business_manager: 'Apex Business Manager',
  bnpl_manager: 'BNPL Manager',
  supervisor: 'Supervisor',
  loan_manager: 'Loan Manager',
  investment_manager: 'Investment Manager',
  individual: 'Individual',
  operations: 'Operations',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: '#176B5B',
  operational_admin: '#E4A42A',
  customer_care: '#C85B23',
  accountant: '#9D4824',
  business_manager: '#6B5245',
  apex_business_manager: '#176B5B',
  bnpl_manager: '#E4A42A',
  supervisor: '#C85B23',
  loan_manager: '#9D4824',
  investment_manager: '#6B5245',
  individual: '#176B5B',
  operations: '#E4A42A',
}

export function RolePermissions() {
  const [config, setConfig] = useState<Record<string, { disabledFeatures: string[]; disabledMenuItems: string[] }>>({})
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/super/role-permissions').then(({ data }) => setConfig(data ?? {}))
  }, [])

  const toggleFeature = (role: string, feature: string) => {
    setConfig((prev) => {
      const cfg = { ...(prev[role] || { disabledFeatures: [], disabledMenuItems: [] }) }
      const idx = cfg.disabledFeatures.indexOf(feature)
      if (idx >= 0) cfg.disabledFeatures = cfg.disabledFeatures.filter((f) => f !== feature)
      else cfg.disabledFeatures = [...cfg.disabledFeatures, feature]
      return { ...prev, [role]: cfg }
    })
  }

  const toggleMenuItem = (role: string, item: string) => {
    setConfig((prev) => {
      const cfg = { ...(prev[role] || { disabledFeatures: [], disabledMenuItems: [] }) }
      const idx = cfg.disabledMenuItems.indexOf(item)
      if (idx >= 0) cfg.disabledMenuItems = cfg.disabledMenuItems.filter((i) => i !== item)
      else cfg.disabledMenuItems = [...cfg.disabledMenuItems, item]
      return { ...prev, [role]: cfg }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/super/role-permissions', config)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Role Permissions</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5245]">
            Configure feature access and menu visibility for each user role.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {ALL_ROLES.map((role) => {
          const roleColor = ROLE_COLORS[role] || '#176B5B'
          const isExpanded = expanded === role
          const roleConfig = config[role] || { disabledFeatures: [], disabledMenuItems: [] }
          const disabledFeatureCount = roleConfig.disabledFeatures.length
          const disabledMenuCount = roleConfig.disabledMenuItems.length

          return (
            <div key={role} className="rounded-2xl border border-[#D8C9A9] bg-white overflow-hidden shadow-sm">
              <button
                onClick={() => setExpanded(isExpanded ? null : role)}
                className="flex w-full items-center justify-between px-6 py-4 hover:bg-[#FFF9EF]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${roleColor}15` }}>
                    <ShieldCheck size={20} style={{ color: roleColor }} />
                  </div>
                  <div className="text-left">
                    <span className="text-base font-bold text-[#2C1B13]">{ROLE_LABELS[role] || role}</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#6B5245]">
                        {disabledFeatureCount} feature{disabledFeatureCount !== 1 ? 's' : ''} disabled
                      </span>
                      <span className="text-xs text-[#6B5245]">
                        {disabledMenuCount} menu item{disabledMenuCount !== 1 ? 's' : ''} disabled
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-[#6B5245]" /> : <ChevronDown size={20} className="text-[#6B5245]" />}
              </button>

              {isExpanded && (
                <div className="border-t border-[#EDE2D3] px-6 py-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Unlock size={18} className="text-[#176B5B]" />
                      <h3 className="text-sm font-bold text-[#2C1B13]">Features</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_FEATURES.map((feature) => {
                        const disabled = roleConfig.disabledFeatures.includes(feature)
                        return (
                          <button
                            key={feature}
                            onClick={() => toggleFeature(role, feature)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                              disabled
                                ? 'bg-[#C85B23]/10 text-[#C85B23] border border-[#C85B23]/30 hover:bg-[#C85B23]/20'
                                : 'bg-[#176B5B]/10 text-[#176B5B] border border-[#176B5B]/30 hover:bg-[#176B5B]/20'
                            }`}
                          >
                            {disabled ? <X size={12} /> : <Check size={12} />} {feature}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Lock size={18} className="text-[#176B5B]" />
                      <h3 className="text-sm font-bold text-[#2C1B13]">Menu Items</h3>
                  </div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_MENU_ITEMS.map((item) => {
                        const disabled = roleConfig.disabledMenuItems.includes(item)
                        return (
                          <button
                            key={item}
                            onClick={() => toggleMenuItem(role, item)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                              disabled
                                ? 'bg-[#C85B23]/10 text-[#C85B23] border border-[#C85B23]/30 hover:bg-[#C85B23]/20'
                                : 'bg-[#176B5B]/10 text-[#176B5B] border border-[#176B5B]/30 hover:bg-[#176B5B]/20'
                            }`}
                          >
                            {disabled ? <X size={12} /> : <Check size={12} />} {item}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
