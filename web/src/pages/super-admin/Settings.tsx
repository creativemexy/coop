import { useEffect, useState } from 'react'
import { api } from '../../api/client'
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
  AlertCircle,
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
  'bg-[#176B5B]',
  'bg-[#E4A42A]',
  'bg-[#C85B23]',
  'bg-[#9D4824]',
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
      <div className="flex-1">
        <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">{s.label}</label>
        <div className="relative">
          <input
            id={s.key}
            type="number"
            value={s.value}
            onChange={(e) => update(s.key, e.target.value)}
            min="0"
            className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm text-[#23150F] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B5245]">
            {s.suffix}
          </span>
        </div>
      </div>
    </div>
  )

  const SaveButton = ({ onClick, section }: { onClick: () => void; section: string }) => (
    <button
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
    >
      {saving ? (
        'Saving...'
      ) : savedKey === section ? (
        <>
          <CheckCircle2 size={16} /> Saved
        </>
      ) : (
        <>
          <Save size={16} /> Save
        </>
      )}
    </button>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Settings</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5245]">
            Platform-wide configuration for fees, credit limits, loan eligibility, and withdrawals.
          </p>
        </div>
        <span className="hidden sm:flex items-center gap-2 rounded-full border border-[#D8C9A9] bg-[#FFF9EF] px-4 py-2 text-xs font-semibold text-[#2C1B13]">
          <Settings2 size={14} /> Global Configuration
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#D8C9A9] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Registration Fee</p>
          <p className="mt-2 text-2xl font-black text-[#2C1B13]">
            {feeSettings[0]?.value || '—'}
            <span className="ml-1 text-sm font-medium text-[#6B5245]">NGN</span>
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8C9A9] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Fee Split Total</p>
          <div className="mt-2 flex items-center gap-2">
            <p className={`text-2xl font-black ${splitOk ? 'text-[#176B5B]' : 'text-[#C85B23]'}`}>
              {total}%
            </p>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              splitOk ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#C85B23]/10 text-[#C85B23]'
            }`}>
              {splitOk ? 'Balanced' : 'Check split'}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-[#D8C9A9] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Max BNPL Credit</p>
          <p className="mt-2 text-2xl font-black text-[#2C1B13]">
            {creditSettings[2]?.value ? `₦${Number(creditSettings[2].value).toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#D8C9A9] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Withdrawals</p>
          <div className="mt-2 flex items-center gap-2">
            <p className={`text-2xl font-black ${withdrawalsEnabled ? 'text-[#176B5B]' : 'text-[#6B5245]'}`}>
              {withdrawalsEnabled ? 'On' : 'Off'}
            </p>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              withdrawalsEnabled ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#6B5245]/10 text-[#6B5245]'
            }`}>
              {withdrawalsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176B5B]/10">
            <ReceiptText size={22} className="text-[#176B5B]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2C1B13]">Registration Fee</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              One-time fee charged when a new user registers. Fee split percentages must total 100%.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {feeSettings.map(renderField)}
        </div>

        {!splitOk && total > 0 && (
          <div className="mt-4 rounded-xl bg-[#C85B23]/10 border border-[#C85B23]/30 px-4 py-3 flex items-start gap-3">
            <AlertCircle size={18} className="text-[#C85B23] shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-[#C85B23]">
              Fee split currently totals {total}% — it must equal exactly 100% before saving.
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-[#EDE2D3] pt-6">
          <div className="mb-3 flex items-center justify-between text-sm font-medium">
            <span className="text-[#6B5245]">Split distribution</span>
            <span className={splitOk ? 'text-[#176B5B]' : 'text-[#C85B23]'}>
              {total}%
            </span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-[#EDE2D3]">
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
      </div>

      <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E4A42A]/10">
            <CreditCard size={22} className="text-[#E4A42A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2C1B13]">BNPL Credit Limit</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              Members must save for the vesting period (consecutive months) to qualify. Credit limit = savings × multiplier,
              capped at the max limit. Multiplier is 5× when no active loan, 2× with an active loan.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {creditSettings.map(renderField)}
        </div>

        <div className="mt-6 border-t border-[#EDE2D3] pt-6 flex justify-end">
          <SaveButton onClick={handleSaveCredit} section="credit" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C85B23]/10">
            <HandCoins size={22} className="text-[#C85B23]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2C1B13]">Loan Eligibility</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              Members must save for the vesting period (consecutive months) to qualify for loans. Max loan amount = savings × multiplier.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {loanSettings.map(renderField)}
        </div>

        <div className="mt-6 border-t border-[#EDE2D3] pt-6 flex justify-end">
          <SaveButton onClick={handleSaveLoan} section="loan" />
        </div>
      </div>

      <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9D4824]/10">
            <PiggyBank size={22} className="text-[#9D4824]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2C1B13]">Withdrawals</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              Enable or disable savings withdrawals for individual members. Withdrawal policy will be configured later.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4A42A]/10">
              <BadgeDollarSign size={20} className="text-[#E4A42A]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2C1B13]">Allow members to withdraw savings</p>
              <p className="text-xs text-[#6B5245]">
                When disabled, members cannot request savings withdrawals.
              </p>
            </div>
          </div>
          <button
            onClick={() => setWithdrawalsEnabled(!withdrawalsEnabled)}
            aria-label="Toggle savings withdrawals"
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${
              withdrawalsEnabled ? 'bg-[#176B5B]' : 'bg-[#D8C9A9]'
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
      </div>

      <div className="flex items-center gap-2 text-xs text-[#6B5245]">
        <ShieldCheck size={14} className="text-[#176B5B]" />
        Changes take effect immediately and are recorded in the audit log.
      </div>
    </div>
  )
}
