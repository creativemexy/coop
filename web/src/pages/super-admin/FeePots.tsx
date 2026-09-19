import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../../api/client'
import { NUBAN_BANKS } from '../../lib/banks'
import {
  Wallet, PiggyBank, Building2, User, CreditCard, TrendingUp, ArrowDownUp,
  FileText, Calendar, RefreshCw, ChevronDown, ChevronLeft, ChevronRight,
  CheckCircle2, AlertTriangle, ShieldCheck, Landmark
} from 'lucide-react'

interface FeePot {
  id: string
  potType: string
  entityId: string
  balance: number
  createdAt: string
  updatedAt: string
}

interface FeeShareLedger {
  id: string
  paymentId: string
  source: string
  totalFee: number
  superAdminShare: number
  platformShare: number
  organizationShare: number
  apexShare: number
  organizationId?: string
  apexOrgId?: string
  createdAt: string
}

interface WithdrawalRequest {
  id: string
  potType: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  requestedBy: string
  approvedBy?: string
  accountNumber?: string
  bankCode?: string
  bankName?: string
  note?: string
  createdAt: string
}

type PotTypeKey = 'platform' | 'admin' | 'organization' | 'apex' | 'business_manager'

const POT_ORDER: PotTypeKey[] = ['platform', 'admin', 'organization', 'apex', 'business_manager']

const potTypeConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  business_manager: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: Building2, label: 'Business Manager' },
  platform: { color: 'text-[#E4A42A]', bg: 'bg-[#E4A42A]/10', icon: PiggyBank, label: 'Platform' },
  admin: { color: 'text-[#9D4824]', bg: 'bg-[#9D4824]/10', icon: User, label: 'Admin' },
  organization: { color: 'text-[#C85B23]', bg: 'bg-[#C85B23]/10', icon: CreditCard, label: 'Organization' },
  apex: { color: 'text-[#6B5245]', bg: 'bg-[#6B5245]/10', icon: TrendingUp, label: 'Apex' },
}

const statusStyles: Record<string, { label: string; cls: string; dot: string }> = {
  pending: { label: 'Pending', cls: 'bg-[#F7D674]/25 text-[#7A5A00]', dot: 'bg-[#E4A42A]' },
  completed: { label: 'Completed', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' },
  failed: { label: 'Failed', cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' },
}

const ngn = (n: number | string | null | undefined) =>
  '₦' + Number(n ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })

const titleCase = (s: string) =>
  s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const POT_PAGE_SIZE = 8
const LEDGER_PAGE_SIZE = 10
const WITHDRAWAL_PAGE_SIZE = 5

const selectCls =
  'appearance-none rounded-xl border border-[#E7DCCB] bg-white pl-4 pr-9 py-2.5 text-sm font-semibold text-[#23150F] shadow-sm outline-none transition cursor-pointer hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

function SelectDropdown({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5245]" />
    </div>
  )
}

function PaginationBar({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
}) {
  if (total === 0) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const lo = Math.max(1, page - 2)
  const pages: number[] = []
  for (let p = lo; p <= lo + 4 && p <= totalPages; p++) pages.push(p)

  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE2D3] px-5 py-3.5">
      <p className="text-xs font-medium text-[#6B5245]">
        Showing <span className="font-bold text-[#2C1B13]">{start}–{end}</span> of{' '}
        <span className="font-bold text-[#2C1B13]">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`${btn} ${
              p === page
                ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm'
                : 'text-[#6B5245] hover:bg-[#F0DDAD]/50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export function SuperAdminFeePots() {
  const [pots, setPots] = useState<FeePot[]>([])
  const [ledger, setLedger] = useState<FeeShareLedger[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [orgNames, setOrgNames] = useState<Record<string, string>>({})
  const [apexNames, setApexNames] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'pots' | 'ledger'>('pots')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'balance_high' | 'balance_low' | 'updated_new' | 'updated_old'>('balance_high')
  const [potsPage, setPotsPage] = useState(1)
  const [ledgerPage, setLedgerPage] = useState(1)
  const [withdrawalPage, setWithdrawalPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminForm, setAdminForm] = useState({ accountNumber: '', bankName: '', bankCode: '' })
  const [adminError, setAdminError] = useState('')

  const [approving, setApproving] = useState<WithdrawalRequest | null>(null)
  const [approveForm, setApproveForm] = useState({ accountNumber: '', bankCode: '', bankName: '' })
  const [approveError, setApproveError] = useState('')

  const requestsRef = useRef<HTMLDivElement>(null)

  const fetch = useCallback(async () => {
    try {
      const [p, l, w, orgs, apexes] = await Promise.all([
        api.get('/ledger/fee-pots'),
        api.get('/ledger/fee-pots/ledger'),
        api.get('/ledger/fee-pots/withdrawals'),
        api.get('/organizations'),
        api.get('/apex-organizations'),
      ])
      setPots(p.data)
      setLedger(l.data)
      setWithdrawals(w.data)
      setOrgNames((orgs.data ?? []).reduce((m: Record<string, string>, o: any) => { m[o.id] = o.name; return m }, {}))
      setApexNames((apexes.data ?? []).reduce((m: Record<string, string>, a: any) => { m[a.id] = a.name; return m }, {}))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const refresh = () => { setRefreshing(true); fetch() }

  const filteredPots = pots
    .filter((p) => roleFilter === 'all' || p.potType === roleFilter)
    .slice()
    .sort((a, b) => {
      if (sortBy === 'balance_high') return Number(b.balance) - Number(a.balance)
      if (sortBy === 'balance_low') return Number(a.balance) - Number(b.balance)
      if (sortBy === 'updated_old') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  const totalBalance = filteredPots.reduce((s, p) => s + Number(p.balance), 0)
  const platformPot = filteredPots.find((p) => p.potType === 'platform')
  const adminPot = filteredPots.find((p) => p.potType === 'admin')
  const latestPlatformRequest = withdrawals.find((w) => w.potType === 'platform')

  const potsPageItems = filteredPots.slice((potsPage - 1) * POT_PAGE_SIZE, potsPage * POT_PAGE_SIZE)
  const ledgerPageItems = ledger.slice((ledgerPage - 1) * LEDGER_PAGE_SIZE, ledgerPage * LEDGER_PAGE_SIZE)
  const withdrawalPageItems = withdrawals.slice((withdrawalPage - 1) * WITHDRAWAL_PAGE_SIZE, withdrawalPage * WITHDRAWAL_PAGE_SIZE)

  const showNotice = (kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text })
    window.setTimeout(() => setNotice(null), 5000)
  }

  const beneficiaryName = (pot: FeePot) => {
    if (pot.potType === 'organization') return orgNames[pot.entityId]
    if (pot.potType === 'apex') return apexNames[pot.entityId]
    if (pot.potType === 'platform') return 'Platform'
    if (pot.potType === 'admin') return 'Admin'
    return potTypeConfig[pot.potType]?.label
  }

  const handleWithdrawAdmin = async () => {
    if (!/^\d{10}$/.test(adminForm.accountNumber) || !adminForm.bankCode) {
      setAdminError('Enter a valid 10-digit account number to detect the bank.')
      return
    }
    setBusy('admin')
    setAdminError('')
    try {
      await api.post('/ledger/fee-pots/withdraw/admin', {
        accountNumber: adminForm.accountNumber,
        bankCode: adminForm.bankCode,
        bankName: adminForm.bankName,
      })
      setShowAdminModal(false)
      setAdminForm({ accountNumber: '', bankName: '', bankCode: '' })
      showNotice('ok', 'Admin pot payout initiated successfully.')
      await fetch()
    } catch (e: any) {
      setAdminError(e?.response?.data?.message || 'Failed to submit the admin pot withdrawal.')
    } finally {
      setBusy(null)
    }
  }

  const handleApprove = async () => {
    if (!approving) return
    if (!/^\d{10}$/.test(approveForm.accountNumber) || !approveForm.bankCode) {
      setApproveError('Destination account and bank code are required to approve.')
      return
    }
    setBusy('approve')
    setApproveError('')
    try {
      await api.patch(`/ledger/fee-pots/withdrawals/${approving.id}/approve`, {
        accountNumber: approveForm.accountNumber,
        bankCode: approveForm.bankCode,
        bankName: approveForm.bankName,
      })
      setApproving(null)
      showNotice('ok', 'Withdrawal approved and payout completed.')
      await fetch()
    } catch (e: any) {
      setApproveError(e?.response?.data?.message || 'Failed to approve the withdrawal.')
    } finally {
      setBusy(null)
    }
  }

  const handleReject = async (w: WithdrawalRequest) => {
    if (!window.confirm('Reject this withdrawal request? The pot balance will be retained.')) return
    setBusy('reject')
    try {
      await api.patch(`/ledger/fee-pots/withdrawals/${w.id}/reject`)
      showNotice('ok', 'Withdrawal request rejected.')
      await fetch()
    } catch (e: any) {
      showNotice('err', e?.response?.data?.message || 'Failed to reject the withdrawal.')
    } finally {
      setBusy(null)
    }
  }

  const openApproveModal = (w: WithdrawalRequest) => {
    setApproveForm({
      accountNumber: w.accountNumber ?? '',
      bankCode: w.bankCode ?? '',
      bankName: w.bankName ?? '',
    })
    setApproveError('')
    setApproving(w)
  }

  const scrollToRequests = () => requestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
              <Wallet size={22} className="text-[#176B5B]" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Fee Pots</h1>
              <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
                Monitor fee distribution, balances, and payouts across platform, admin, and member-organization pots.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B5245] shadow-sm transition hover:border-[#176B5B]/40 hover:text-[#176B5B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
            notice.kind === 'ok'
              ? 'border-[#176B5B]/25 bg-[#176B5B]/5 text-[#176B5B]'
              : 'border-[#B3261E]/25 bg-[#B3261E]/5 text-[#B3261E]'
          }`}
          role="status"
        >
          {notice.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {notice.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#EDE2D3] pb-2">
        <button
          onClick={() => setTab('pots')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            tab === 'pots' ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:bg-[#EDE2D3]'
          }`}
        >
          <Wallet size={16} /> Pots
        </button>
        <button
          onClick={() => setTab('ledger')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
            tab === 'ledger' ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:bg-[#EDE2D3]'
          }`}
        >
          <FileText size={16} /> Fee Ledger
        </button>
      </div>

      {tab === 'pots' ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#E7DCCB] bg-white px-5 py-4 shadow-sm">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B5245]">View by role</p>
              <SelectDropdown
                value={roleFilter}
                onChange={(v) => { setRoleFilter(v); setPotsPage(1) }}
                options={[
                  { value: 'all', label: 'All roles' },
                  ...POT_ORDER.map((r) => ({ value: r, label: potTypeConfig[r].label })),
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Sort balances</p>
              <SelectDropdown
                value={sortBy}
                onChange={(v) => { setSortBy(v as typeof sortBy); setPotsPage(1) }}
                options={[
                  { value: 'balance_high', label: 'Balance: high → low' },
                  { value: 'balance_low', label: 'Balance: low → high' },
                  { value: 'updated_new', label: 'Recently updated' },
                  { value: 'updated_old', label: 'Oldest updated' },
                ]}
              />
            </div>
            <div className="ml-auto hidden items-center gap-2 rounded-full bg-[#FFF9EF] px-4 py-2 text-xs font-semibold text-[#6B5245] sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-[#176B5B]" />
              {filteredPots.length} pot{filteredPots.length === 1 ? '' : 's'} in current view
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-2xl border border-[#176B5B]/25 bg-white p-5 shadow-sm sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Total balance</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{ngn(totalBalance)}</p>
              <p className="mt-1 text-xs text-[#6B5245]">
                {roleFilter === 'all' ? 'Across all pots' : potTypeConfig[roleFilter]?.label ?? 'Filtered view'}
              </p>
            </div>
            {POT_ORDER.filter((r) => filteredPots.some((p) => p.potType === r)).map((role) => {
              const config = potTypeConfig[role]
              const Icon = config.icon
              const sum = filteredPots
                .filter((p) => p.potType === role)
                .reduce((s, p) => s + Number(p.balance), 0)
              const count = filteredPots.filter((p) => p.potType === role).length
              return (
                <div
                  key={role}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setRoleFilter(roleFilter === role ? 'all' : role); setPotsPage(1) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setRoleFilter(roleFilter === role ? 'all' : role)
                      setPotsPage(1)
                    }
                  }}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition cursor-pointer hover:-translate-y-0.5 ${
                    roleFilter === role ? 'border-[#176B5B] ring-2 ring-[#176B5B]/20' : 'border-[#E7DCCB]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon size={16} className={config.color} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">{config.label}</p>
                  </div>
                  <p className="mt-2 truncate text-xl font-black tracking-[-0.02em] text-[#2C1B13]">{ngn(sum)}</p>
                  <p className="mt-0.5 text-xs text-[#6B5245]">{count} pot{count === 1 ? '' : 's'}</p>
                </div>
              )
            })}
          </div>

          {/* Payout actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E4A42A]/40 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4A42A]/10">
                      <PiggyBank size={20} className="text-[#E4A42A]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2C1B13]">Platform Pot</p>
                      <p className="text-xs text-[#6B5245]">30% of registration fees</p>
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#2C1B13]">
                    {platformPot ? ngn(platformPot.balance) : ngn(0)}
                  </p>
                  {latestPlatformRequest && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFF9EF] px-3 py-1 text-xs font-semibold text-[#6B5245]">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusStyles[latestPlatformRequest.status].dot}`} />
                      Latest request: {statusStyles[latestPlatformRequest.status].label.toLowerCase()} · {ngn(latestPlatformRequest.amount)}
                    </p>
                  )}
                </div>
                <button
                  onClick={scrollToRequests}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E4A42A]/50 bg-[#E4A42A]/5 px-4 py-2.5 text-sm font-semibold text-[#8A5A00] transition hover:bg-[#E4A42A]/15 cursor-pointer"
                >
                  <ShieldCheck size={15} /> Review payouts
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#9D4824]/40 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9D4824]/10">
                      <User size={20} className="text-[#9D4824]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2C1B13]">Admin Pot</p>
                      <p className="text-xs text-[#6B5245]">20% of registration fees</p>
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#2C1B13]">
                    {adminPot ? ngn(adminPot.balance) : ngn(0)}
                  </p>
                  <p className="mt-2 text-xs text-[#6B5245]">Payouts settle to a bank account you specify.</p>
                </div>
                <button
                  disabled={!adminPot || Number(adminPot.balance) <= 0 || busy === 'admin'}
                  onClick={() => { setAdminError(''); setShowAdminModal(true) }}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#9D4824] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#B85A38] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  <ArrowDownUp size={15} /> {busy === 'admin' ? 'Processing…' : 'Withdraw all'}
                </button>
              </div>
            </div>
          </div>

          {/* Pots table */}
          <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EDE2D3] px-5 py-4">
              <div>
                <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Pot balances</h2>
                <p className="text-xs text-[#6B5245]">Aligned to the {roleFilter === 'all' ? 'all-roles' : `${potTypeConfig[roleFilter]?.label ?? 'selected'} role`} view · sorted by {sortBy.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FFF9EF]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Beneficiary</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Balance</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE2D3]">
                  {loading && pots.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-5 py-6">
                          <div className="h-4 w-1/3 animate-pulse rounded bg-[#F0DDAD]/40" />
                        </td>
                      </tr>
                    ))
                  ) : potsPageItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center">
                        <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-[#6B5245]">
                          <Landmark size={22} className="text-[#C9B89F]" />
                          <p className="text-sm font-semibold text-[#2C1B13]">No pots in this view</p>
                          <p className="text-xs">Adjust the role dropdown to see other fee pots.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    potsPageItems.map((pot) => {
                      const config = potTypeConfig[pot.potType] || potTypeConfig.platform
                      const Icon = config.icon
                      return (
                        <tr key={pot.id} className="transition-colors hover:bg-[#FFF9EF]/60">
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.color} ${config.bg}`}>
                              <Icon size={12} /> {config.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
  <p className="text-sm font-semibold text-[#2C1B13]">{beneficiaryName(pot)?.trim() || '—'}</p>
  <p className="mt-0.5 font-mono text-[11px] text-[#6B5245]">
    {pot.entityId === 'PLATFORM' || pot.entityId === 'ADMIN' ? 'Global pot' : `${pot.entityId.slice(0, 12)}…`}
  </p>
</td>
                          <td className="px-5 py-3.5 text-right text-sm font-bold text-[#2C1B13]">{ngn(pot.balance)}</td>
                          <td className="px-5 py-3.5 text-right text-xs text-[#6B5245]">{new Date(pot.updatedAt).toLocaleString()}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <PaginationBar page={potsPage} pageSize={POT_PAGE_SIZE} total={filteredPots.length} onPage={setPotsPage} />
          </div>

          {/* Withdrawal requests */}
          <div ref={requestsRef} className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#EDE2D3] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176B5B]/10">
                  <ArrowDownUp size={17} className="text-[#176B5B]" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Withdrawal requests</h2>
                  <p className="text-xs text-[#6B5245]">Review and approve platform payouts.</p>
                </div>
              </div>
              {withdrawals.some((w) => w.status === 'pending') && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7D674]/30 px-3 py-1 text-xs font-bold text-[#7A5A00]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E4A42A]" />
                  {withdrawals.filter((w) => w.status === 'pending').length} pending
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FFF9EF]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Pot</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Destination</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Requested</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE2D3]">
                  {withdrawalPageItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-[#6B5245]">
                        No withdrawal requests yet.
                      </td>
                    </tr>
                  )}
                  {withdrawalPageItems.map((w) => {
                    const config = potTypeConfig[w.potType] || potTypeConfig.platform
                    const Icon = config.icon
                    const st = statusStyles[w.status] || statusStyles.pending
                    return (
                      <tr key={w.id} className="transition-colors hover:bg-[#FFF9EF]/60">
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.color} ${config.bg}`}>
                            <Icon size={12} /> {config.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-bold text-[#2C1B13]">{ngn(w.amount)}</td>
                        <td className="px-5 py-3.5 text-xs text-[#6B5245]">
                          {w.bankName ? (
                            <>{w.bankName} · {w.accountNumber ? `••${w.accountNumber.slice(-4)}` : 'no account set'}</>
                          ) : (
                            <span className="text-[#C9B89F]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#6B5245]">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#C9B89F]" />
                            {new Date(w.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {w.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openApproveModal(w)}
                                disabled={busy === 'reject'}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B] px-3 py-1.5 text-xs font-semibold text-[#FFF9EF] transition hover:bg-[#0F5A4B] disabled:opacity-50 cursor-pointer"
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(w)}
                                disabled={busy === 'reject' || busy === 'approve'}
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#B3261E]/30 px-3 py-1.5 text-xs font-semibold text-[#B3261E] transition hover:bg-[#B3261E]/5 disabled:opacity-50 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <p className="text-right text-xs text-[#C9B89F]">—</p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <PaginationBar page={withdrawalPage} pageSize={WITHDRAWAL_PAGE_SIZE} total={withdrawals.length} onPage={setWithdrawalPage} />
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EDE2D3] px-5 py-4">
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Fee share ledger</h2>
              <p className="text-xs text-[#6B5245]">
                Most recent {ledger.length} fee splits across all sources, newest first.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FFF9EF]">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Source</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Total fee</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#E4A42A]">Platform 30%</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#9D4824]">Admin 20%</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#C85B23]">Org 35%</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Apex 15%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {loading && ledger.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-5 py-6">
                        <div className="h-4 w-1/3 animate-pulse rounded bg-[#F0DDAD]/40" />
                      </td>
                    </tr>
                  ))
                ) : ledgerPageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-[#6B5245]">
                      No fee share records found yet.
                    </td>
                  </tr>
                ) : (
                  ledgerPageItems.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-[#FFF9EF]/60">
                      <td className="px-5 py-3.5 text-xs text-[#6B5245]">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-[#C9B89F]" />
                          {new Date(l.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-[#176B5B]/10 px-2.5 py-1 text-xs font-semibold text-[#176B5B]">
                          {titleCase(l.source)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-bold text-[#2C1B13]">{ngn(l.totalFee)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#E4A42A]">{ngn(l.platformShare)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#9D4824]">{ngn(l.superAdminShare)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#C85B23]">{ngn(l.organizationShare)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-[#6B5245]">{ngn(l.apexShare)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar page={ledgerPage} pageSize={LEDGER_PAGE_SIZE} total={ledger.length} onPage={setLedgerPage} />
        </div>
      )}

      {/* Admin pot withdraw modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#23150F]/50 backdrop-blur-[2px]" onClick={() => setShowAdminModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9D4824]/10">
                  <User size={20} className="text-[#9D4824]" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">Withdraw admin pot</h2>
                  <p className="text-xs text-[#6B5245]">
                    Balance: <span className="font-bold text-[#2C1B13]">{adminPot ? ngn(adminPot.balance) : ngn(0)}</span>
                  </p>
                </div>
              </div>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); handleWithdrawAdmin() }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
                  Destination account number
                </label>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10-digit NUBAN account"
                  value={adminForm.accountNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setAdminForm((f) => {
                      const bank = digits.length === 10 ? NUBAN_BANKS[digits.slice(0, 3)] : undefined
                      return {
                        accountNumber: digits,
                        bankName: bank ? bank.name : f.bankName,
                        bankCode: bank ? digits.slice(0, 3) : f.bankCode,
                      }
                    })
                  }}
                  className="w-full rounded-xl border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20"
                />
                {adminForm.accountNumber.length === 10 && adminForm.bankName && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#176B5B]">
                    <CheckCircle2 size={13} /> {adminForm.bankName} detected
                  </p>
                )}
                {adminForm.accountNumber.length === 10 && !adminForm.bankName && (
                  <p className="mt-1.5 text-xs text-[#B3261E]">Bank not recognised — check the account number.</p>
                )}
              </div>
              {adminError && <p className="text-sm font-medium text-[#B3261E]">{adminError}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="rounded-full border border-[#E7DCCB] px-4 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'admin'}
                  className="inline-flex items-center gap-2 rounded-full bg-[#9D4824] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#B85A38] disabled:opacity-60 cursor-pointer"
                >
                  <ArrowDownUp size={15} /> {busy === 'admin' ? 'Processing…' : 'Withdraw all'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve payout modal */}
      {approving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#23150F]/50 backdrop-blur-[2px]" onClick={() => setApproving(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#176B5B]/10">
                  <ShieldCheck size={20} className="text-[#176B5B]" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">Approve payout</h2>
                  <p className="text-xs text-[#6B5245]">
                    {potTypeConfig[approving.potType]?.label ?? 'Pot'} pot ·{' '}
                    <span className="font-bold text-[#2C1B13]">{ngn(approving.amount)}</span>
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleApprove() }} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
                  Destination account number
                </label>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10-digit NUBAN account"
                  value={approveForm.accountNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setApproveForm((f) => {
                      const bank = digits.length === 10 ? NUBAN_BANKS[digits.slice(0, 3)] : undefined
                      return {
                        accountNumber: digits,
                        bankName: bank ? bank.name : f.bankName,
                        bankCode: bank ? digits.slice(0, 3) : f.bankCode,
                      }
                    })
                  }}
                  className="w-full rounded-xl border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20"
                />
                {approveForm.accountNumber.length === 10 && approveForm.bankName && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#176B5B]">
                    <CheckCircle2 size={13} /> {approveForm.bankName} detected
                  </p>
                )}
                {approveForm.accountNumber.length === 10 && !approveForm.bankName && (
                  <p className="mt-1.5 text-xs text-[#B3261E]">Bank not recognised — check the account number.</p>
                )}
              </div>
              {approveError && <p className="text-sm font-medium text-[#B3261E]">{approveError}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setApproving(null)}
                  className="rounded-full border border-[#E7DCCB] px-4 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'approve'}
                  className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 cursor-pointer"
                >
                  <CheckCircle2 size={15} /> {busy === 'approve' ? 'Processing…' : 'Confirm & pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}