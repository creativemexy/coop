import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'

interface SettingRow {
  key: string
  label: string
  value: string
  suffix: string
}

const feeFields: SettingRow[] = [
  { key: 'registration_fee', label: 'Registration Fee (NGN)', value: '', suffix: '₦' },
  { key: 'fee_platform_percent', label: 'Platform Share %', value: '', suffix: '%' },
  { key: 'fee_organization_percent', label: 'Organization Share %', value: '', suffix: '%' },
  { key: 'fee_apex_percent', label: 'Apex Share %', value: '', suffix: '%' },
  { key: 'fee_super_admin_percent', label: 'Super Admin Share %', value: '', suffix: '%' },
]

const creditFields: SettingRow[] = [
  { key: 'credit_limit_multiplier_no_loan', label: 'BNPL Multiplier (No Loan)', value: '', suffix: 'x' },
  { key: 'credit_limit_multiplier_with_loan', label: 'BNPL Multiplier (With Loan)', value: '', suffix: 'x' },
  { key: 'credit_limit_max_cap', label: 'Max BNPL Credit Limit (NGN)', value: '', suffix: '₦' },
  { key: 'credit_limit_vesting_months', label: 'BNPL Savings Vesting', value: '', suffix: 'months' },
]

const loanFields: SettingRow[] = [
  { key: 'loan_multiplier', label: 'Loan Multiplier (× Savings)', value: '', suffix: 'x' },
  { key: 'loan_vesting_months', label: 'Loan Savings Vesting', value: '', suffix: 'months' },
]

export function Settings() {
  const [feeSettings, setFeeSettings] = useState<SettingRow[]>(feeFields)
  const [creditSettings, setCreditSettings] = useState<SettingRow[]>(creditFields)
  const [loanSettings, setLoanSettings] = useState<SettingRow[]>(loanFields)
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const allFields = [...feeFields, ...creditFields, ...loanFields]
    Promise.all([
      ...allFields.map((f) =>
        api.get(`/settings/${f.key}`).then((r) => ({ key: f.key, value: r.data.value ?? '' }))
      ),
      api.get('/settings/withdrawals_enabled').then((r) => setWithdrawalsEnabled(r.data.value === 'true')),
    ]).then((results) => {
      const settingResults = results.slice(0, allFields.length) as { key: string; value: string }[]
      const mapper = (prev: SettingRow[]) =>
        prev.map((s) => {
          const found = settingResults.find((r) => r.key === s.key)
          return found ? { ...s, value: found.value } : s
        })
      setFeeSettings(mapper)
      setCreditSettings(mapper)
      setLoanSettings(mapper)
    })
  }, [])

  const update = (key: string, value: string) => {
    setFeeSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)))
    setCreditSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)))
    setLoanSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)))
  }

  const handleSaveFee = async () => {
    setSaving(true)
    try {
      await Promise.all(feeSettings.map((s) => api.patch(`/settings/${s.key}`, { value: s.value })))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Failed to save registration fee settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCredit = async () => {
    setSaving(true)
    try {
      await Promise.all(creditSettings.map((s) => api.patch(`/settings/${s.key}`, { value: s.value })))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Failed to save BNPL credit limit settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLoan = async () => {
    setSaving(true)
    try {
      await Promise.all(loanSettings.map((s) => api.patch(`/settings/${s.key}`, { value: s.value })))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Failed to save loan eligibility settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWithdrawals = async () => {
    setSaving(true)
    try {
      await api.patch('/settings/withdrawals_enabled', { value: String(withdrawalsEnabled) })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Failed to save withdrawal settings')
    } finally {
      setSaving(false)
    }
  }

  const total = feeSettings
    .filter((s) => s.key.startsWith('fee_') && s.key.endsWith('_percent'))
    .reduce((sum, s) => sum + Number(s.value || 0), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Settings</h2>

      <Card className="max-w-lg">
        <CardTitle>Registration Fee</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          One-time fee charged when a new user registers. Fee split percentages must total 100%.
        </p>
        <div className="mt-4 space-y-4">
          {feeSettings.map((s) => (
            <div key={s.key} className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  id={s.key}
                  label={s.label}
                  type="number"
                  value={s.value}
                  onChange={(e) => update(s.key, e.target.value)}
                  min="0"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className={`text-sm font-medium ${total === 100 ? 'text-green-600' : 'text-red-600'}`}>
            Split total: {total}%
          </span>
          <Button onClick={handleSaveFee} disabled={saving || total !== 100}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardTitle>BNPL Credit Limit</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Members must save for the vesting period (consecutive months) to qualify. Credit limit = savings × multiplier, capped at the max limit.
          Multiplier is 5× when no active loan, 2× with an active loan.
        </p>
        <div className="mt-4 space-y-4">
          {creditSettings.map((s) => (
            <div key={s.key} className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  id={s.key}
                  label={s.label}
                  type="number"
                  value={s.value}
                  onChange={(e) => update(s.key, e.target.value)}
                  min="0"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveCredit} disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardTitle>Loan Eligibility</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Members must save for the vesting period (consecutive months) to qualify for loans.
          Max loan amount = savings × multiplier.
        </p>
        <div className="mt-4 space-y-4">
          {loanSettings.map((s) => (
            <div key={s.key} className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  id={s.key}
                  label={s.label}
                  type="number"
                  value={s.value}
                  onChange={(e) => update(s.key, e.target.value)}
                  min="0"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveLoan} disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </Card>

      <Card className="max-w-lg">
        <CardTitle>Withdrawals</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          Enable or disable savings withdrawals for individual members. Withdrawal policy will be configured later.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium">Allow members to withdraw savings</span>
          <button
            onClick={() => setWithdrawalsEnabled(!withdrawalsEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
              withdrawalsEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                withdrawalsEnabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSaveWithdrawals} disabled={saving}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
