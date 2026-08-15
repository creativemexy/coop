import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  BadgeDollarSign,
  CreditCard,
  HandCoins,
  PiggyBank,
  Save,
  CheckCircle2,
  ReceiptText,
  Settings2,
  ShieldCheck,
} from 'lucide-react'

interface SettingRow {
  key: string
  label: string
  value: string
  suffix: string
}

const feeFields: SettingRow[] = [
  { key: 'registration_fee', label: 'Registration Fee', value: '', suffix: 'NGN' },
  { key: 'fee_platform_percent', label: 'Platform Share', value: '', suffix: '%' },
  { key: 'fee_organization_percent', label: 'Organization Share', value: '', suffix: '%' },
  { key: 'fee_apex_percent', label: 'Apex Share', value: '', suffix: '%' },
  { key: 'fee_super_admin_percent', label: 'Super Admin Share', value: '', suffix: '%' },
]

const creditFields: SettingRow[] = [
  { key: 'credit_limit_multiplier_no_loan', label: 'BNPL Multiplier (No Loan)', value: '', suffix: 'x' },
  { key: 'credit_limit_multiplier_with_loan', label: 'BNPL Multiplier (With Loan)', value: '', suffix: 'x' },
  { key: 'credit_limit_max_cap', label: 'Max BNPL Credit Limit', value: '', suffix: 'NGN' },
  { key: 'credit_limit_vesting_months', label: 'BNPL Savings Vesting', value: '', suffix: 'months' },
]

const loanFields: SettingRow[] = [
  { key: 'loan_multiplier', label: 'Loan Multiplier (× Savings)', value: '', suffix: 'x' },
  { key: 'loan_vesting_months', label: 'Loan Savings Vesting', value: '', suffix: 'months' },
]

const splitColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
]

export function Settings() {
  const [feeSettings, setFeeSettings] = useState<SettingRow[]>(feeFields)
  const [creditSettings, setCreditSettings] = useState<SettingRow[]>(creditFields)
  const [loanSettings, setLoanSettings] = useState<SettingRow[]>(loanFields)
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<string | null>(null)

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

  const flashSaved = (key: string) => {
    setSavedKey(key)
    setTimeout(() => setSavedKey((prev) => (prev === key ? null : prev)), 2000)
  }

  const handleSaveFee = async () => {
    setSaving(true)
    try {
      await Promise.all(feeSettings.map((s) => api.patch(`/settings/${s.key}`, { value: s.value })))
      flashSaved('fee')
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
      flashSaved('credit')
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
      flashSaved('loan')
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
      flashSaved('withdrawals')
    } catch {
      alert('Failed to save withdrawal settings')
    } finally {
      setSaving(false)
    }
  }

  const total = feeSettings
    .filter((s) => s.key.startsWith('fee_') && s.key.endsWith('_percent'))
    .reduce((sum, s) => sum + Number(s.value || 0), 0)

  const splitOk = total === 100

  const renderField = (s: SettingRow) => (
    <div key={s.key} className="flex items-center gap-3">
      <Input
        id={s.key}
        label={s.label}
        type="number"
        value={s.value}
        onChange={(e) => update(s.key, e.target.value)}
        min="0"
      />
      <span className="shrink-0 -mt-4 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
        {s.suffix}
      </span>
    </div>
  )

  const SaveButton = ({ onClick, section }: { onClick: () => void; section: string }) => (
    <Button onClick={onClick} disabled={saving}>
      {saving ? (
        'Saving...'
      ) : savedKey === section ? (
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 size={16} /> Saved
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Save size={16} /> Save
        </span>
      )}
    </Button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-100">Settings</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Platform-wide configuration for fees, credit limits, loan eligibility, and withdrawals.
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          <Settings2 size={14} /> Global Configuration
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardTitle className="text-xs text-gray-500 dark:text-gray-400">Registration Fee</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">
            {feeSettings[0]?.value || '—'}
            <span className="ml-1 text-sm font-medium text-gray-400">NGN</span>
          </p>
        </Card>
        <Card>
          <CardTitle className="text-xs text-gray-500 dark:text-gray-400">Fee Split Total</CardTitle>
          <div className="mt-1 flex items-center gap-2">
            <p className={`text-2xl font-bold ${splitOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {total}%
            </p>
            <Badge variant={splitOk ? 'success' : 'danger'}>
              {splitOk ? 'Balanced' : 'Check split'}
            </Badge>
          </div>
        </Card>
        <Card>
          <CardTitle className="text-xs text-gray-500 dark:text-gray-400">Max BNPL Credit</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">
            {creditSettings[2]?.value ? `₦${Number(creditSettings[2].value).toLocaleString()}` : '—'}
          </p>
        </Card>
        <Card>
          <CardTitle className="text-xs text-gray-500 dark:text-gray-400">Withdrawals</CardTitle>
          <div className="mt-1 flex items-center gap-2">
            <p className={`text-2xl font-bold ${withdrawalsEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              {withdrawalsEnabled ? 'On' : 'Off'}
            </p>
            <Badge variant={withdrawalsEnabled ? 'success' : 'warning'}>
              {withdrawalsEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40">
            <ReceiptText size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>Registration Fee</CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              One-time fee charged when a new user registers. Fee split percentages must total 100%.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {feeSettings.map(renderField)}
        </div>

        {!splitOk && total > 0 && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-300">
            Fee split currently totals {total}% — it must equal exactly 100% before saving.
          </div>
        )}

        <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
          <div className="mb-2 flex items-center justify-between text-xs font-medium">
            <span className="text-gray-500 dark:text-gray-400">Split distribution</span>
            <span className={splitOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {total}%
            </span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            {feeSettings
              .filter((s) => s.key.startsWith('fee_') && s.key.endsWith('_percent'))
              .map((s, i) => {
                const pct = Number(s.value || 0)
                return pct > 0 ? (
                  <div
                    key={s.key}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                    className={`${splitColors[i % splitColors.length]} transition-all`}
                  />
                ) : null
              })}
          </div>
          <div className="mt-4 flex justify-end">
            <SaveButton onClick={handleSaveFee} section="fee" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/40">
            <CreditCard size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle>BNPL Credit Limit</CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Members must save for the vesting period (consecutive months) to qualify. Credit limit = savings × multiplier,
              capped at the max limit. Multiplier is 5× when no active loan, 2× with an active loan.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {creditSettings.map(renderField)}
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4 flex justify-end dark:border-gray-700">
          <SaveButton onClick={handleSaveCredit} section="credit" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/40">
            <HandCoins size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle>Loan Eligibility</CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Members must save for the vesting period (consecutive months) to qualify for loans. Max loan amount = savings × multiplier.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {loanSettings.map(renderField)}
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4 flex justify-end dark:border-gray-700">
          <SaveButton onClick={handleSaveLoan} section="loan" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/40">
            <PiggyBank size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle>Withdrawals</CardTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enable or disable savings withdrawals for individual members. Withdrawal policy will be configured later.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
          <div className="flex items-center gap-3">
            <BadgeDollarSign size={20} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Allow members to withdraw savings</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                When disabled, members cannot request savings withdrawals.
              </p>
            </div>
          </div>
          <button
            onClick={() => setWithdrawalsEnabled(!withdrawalsEnabled)}
            aria-label="Toggle savings withdrawals"
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${
              withdrawalsEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                withdrawalsEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <SaveButton onClick={handleSaveWithdrawals} section="withdrawals" />
        </div>
      </Card>

      <p className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <ShieldCheck size={14} className="text-green-500" />
        Changes take effect immediately and are recorded in the audit log.
      </p>
    </div>
  )
}
