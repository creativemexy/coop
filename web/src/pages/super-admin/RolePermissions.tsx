import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const ALL_ROLES = [
  'super_admin',
  'operational_admin',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Role Permissions</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {ALL_ROLES.map((role, i) => (
          <div key={role} className={`rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 ${
            [
              'border-sky-500 bg-sky-50/20',
              'border-emerald-500 bg-emerald-50/20',
              'border-amber-500 bg-amber-50/20',
              'border-fuchsia-500 bg-fuchsia-50/20',
              'border-violet-500 bg-violet-50/20',
            ][i % 5]
          }`}>
            <button
              onClick={() => setExpanded(expanded === role ? null : role)}
              className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <span>{ROLE_LABELS[role] || role}</span>
              <span>{expanded === role ? '▲' : '▼'}</span>
            </button>

            {expanded === role && (
              <div className="border-t px-4 py-4 space-y-6 dark:border-gray-700">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {ALL_FEATURES.map((feature) => {
                      const disabled = (config[role]?.disabledFeatures ?? []).includes(feature)
                      return (
                        <button
                          key={feature}
                          onClick={() => toggleFeature(role, feature)}
                          className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                            disabled
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {disabled ? `✕ ${feature}` : `✓ ${feature}`}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">Menu Items</h3>
                  <div className="flex flex-wrap gap-2">
                    {ALL_MENU_ITEMS.map((item) => {
                      const disabled = (config[role]?.disabledMenuItems ?? []).includes(item)
                      return (
                        <button
                          key={item}
                          onClick={() => toggleMenuItem(role, item)}
                          className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                            disabled
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {disabled ? `✕ ${item}` : `✓ ${item}`}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
