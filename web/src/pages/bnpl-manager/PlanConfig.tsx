import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardTitle } from '../../components/ui/card'

interface TenorOption {
  installmentCount: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  label: string
}

interface PlanConfig {
  configured: boolean
  id?: string
  organizationId?: string
  availableTenors: TenorOption[]
  interestModel: 'fixed_monthly_fee' | 'reducing_balance' | 'simple'
  maxPrincipal?: number
  requireMembership: boolean
  dueDateRule: 'same_day_monthly' | 'end_of_month'
  gracePeriodDays: number
  lateFeeType: 'percentage' | 'flat'
  lateFeeValue: number
}

const defaultConfig: PlanConfig = {
  configured: false,
  availableTenors: [
    { installmentCount: 3, frequency: 'monthly', label: '3 Months' },
    { installmentCount: 6, frequency: 'monthly', label: '6 Months' },
  ],
  interestModel: 'simple',
  requireMembership: false,
  dueDateRule: 'same_day_monthly',
  gracePeriodDays: 0,
  lateFeeType: 'percentage',
  lateFeeValue: 5,
}

export function PlanConfigPage() {
  const [orgId, setOrgId] = useState('')
  const [config, setConfig] = useState<PlanConfig>(defaultConfig)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('organization_id')
    if (stored) setOrgId(stored)
  }, [])

  const loadConfig = async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/bnpl/plan-config/${orgId}`)
      if (data.configured) {
        setConfig(data)
      } else {
        setConfig({ ...defaultConfig, organizationId: orgId })
      }
      setLoaded(true)
    } catch {
      setConfig({ ...defaultConfig, organizationId: orgId })
      setLoaded(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (orgId) loadConfig()
  }, [orgId])

  const addTenor = () => {
    const counts = [3, 6, 9, 12]
    const count = counts[config.availableTenors.length] || 12
    setConfig({
      ...config,
      availableTenors: [
        ...config.availableTenors,
        { installmentCount: count, frequency: 'monthly', label: `${count} Months` },
      ],
    })
  }

  const removeTenor = (idx: number) => {
    setConfig({
      ...config,
      availableTenors: config.availableTenors.filter((_, i) => i !== idx),
    })
  }

  const updateTenor = (idx: number, field: keyof TenorOption, value: any) => {
    const tenors = [...config.availableTenors]
    tenors[idx] = { ...tenors[idx], [field]: value }
    if (field === 'installmentCount') {
      tenors[idx].label = `${value} Months`
    }
    setConfig({ ...config, availableTenors: tenors })
  }

  const handleSave = async () => {
    if (!orgId) return
    setSaving(true)
    setMessage('')
    try {
      await api.put(`/bnpl/plan-config/${orgId}`, {
        availableTenors: config.availableTenors,
        interestModel: config.interestModel,
        maxPrincipal: config.maxPrincipal || null,
        requireMembership: config.requireMembership,
        dueDateRule: config.dueDateRule,
        gracePeriodDays: config.gracePeriodDays,
        lateFeeType: config.lateFeeType,
        lateFeeValue: config.lateFeeValue,
      })
      setMessage('Configuration saved successfully')
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to save')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">BNPL Plan Configuration</h2>
      </div>

      <Card>
        <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">Organization</CardTitle>
        <div className="flex gap-2 items-end">
          <Input
            id="org-id"
            label="Organization ID"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="Enter organization ID"
          />
          <Button variant="secondary" onClick={loadConfig} disabled={loading || !orgId}>
            {loading ? 'Loading…' : 'Load'}
          </Button>
        </div>
      </Card>

      {loaded && (
        <>
          <Card>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">Tenor Options</CardTitle>
            <p className="text-sm text-gray-500 mb-4">Define available repayment durations for this organization.</p>
            {config.availableTenors.map((tenor, i) => (
              <div key={i} className="flex items-end gap-2 mb-3">
                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-1">Installments</label>
                  <select
                    value={tenor.installmentCount}
                    onChange={(e) => updateTenor(i, 'installmentCount', Number(e.target.value))}
                    className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                  >
                    {[1, 2, 3, 4, 6, 9, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                  <select
                    value={tenor.frequency}
                    onChange={(e) => updateTenor(i, 'frequency', e.target.value)}
                    className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input
                    value={tenor.label}
                    onChange={(e) => updateTenor(i, 'label', e.target.value)}
                    className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeTenor(i)}>✕</Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={addTenor}>+ Add Tenor</Button>
          </Card>

          <Card>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">Interest & Fees</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Interest Model</label>
                <select
                  value={config.interestModel}
                  onChange={(e) => setConfig({ ...config, interestModel: e.target.value as any })}
                  className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="simple">Simple Interest (flat rate)</option>
                  <option value="fixed_monthly_fee">Fixed Monthly Fee</option>
                  <option value="reducing_balance">Reducing Balance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Principal Amount</label>
                <input
                  type="number"
                  value={config.maxPrincipal || ''}
                  onChange={(e) => setConfig({ ...config, maxPrincipal: e.target.value ? Number(e.target.value) : undefined })}
                  className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">Schedule & Late Fee Rules</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Due Date Rule</label>
                <select
                  value={config.dueDateRule}
                  onChange={(e) => setConfig({ ...config, dueDateRule: e.target.value as any })}
                  className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="same_day_monthly">Same Day Monthly</option>
                  <option value="end_of_month">End of Month</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Grace Period (days)</label>
                <input
                  type="number"
                  value={config.gracePeriodDays}
                  onChange={(e) => setConfig({ ...config, gracePeriodDays: Number(e.target.value) })}
                  className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Late Fee Type</label>
                <select
                  value={config.lateFeeType}
                  onChange={(e) => setConfig({ ...config, lateFeeType: e.target.value as any })}
                  className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Late Fee {config.lateFeeType === 'percentage' ? '(%)' : '(₦)'}
                </label>
                <input
                  type="number"
                  value={config.lateFeeValue}
                  onChange={(e) => setConfig({ ...config, lateFeeValue: Number(e.target.value) })}
                  className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">Eligibility</CardTitle>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.requireMembership}
                  onChange={(e) => setConfig({ ...config, requireMembership: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Require cooperative membership
              </label>
            </div>
          </Card>

          {message && (
            <div className={`text-sm p-3 rounded-lg ${message.includes('successfully') ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
              {message}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save Configuration'}
          </Button>
        </>
      )}
    </div>
  )
}