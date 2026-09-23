import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import {
  CalendarClock, CreditCard, HandCoins, AlertTriangle, Hourglass, Wallet, ChevronRight,
} from 'lucide-react'

interface RepaymentItem {
  id: string
  type: 'bnpl' | 'loan'
  itemName: string
  amount: number
  lateFee: number
  dueDate: string
  status: string
  paidAt: string | null
  paymentReference: string
  subscriptionId?: string
  loanId?: string
  isOverdue: boolean
}

interface RepaymentSummary {
  totalUpcoming: number
  pastPaid: number
  overdueCount: number
  bnplBalance: number
  loanBalance: number
  totalOutstanding: number
  nextDueDate: string | null
  nextDueAmount: number
}

interface RepaymentData {
  summary: RepaymentSummary
  upcoming: RepaymentItem[]
  past: RepaymentItem[]
}

const thCls = 'px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]'
const tdCls = 'px-5 py-3.5 text-sm text-[#2C1B13]'

function StatCard({ icon, title, value, sub, valueCls, tileCls }: {
  icon: React.ReactNode
  title: string
  value: string
  sub?: string
  valueCls?: string
  tileCls?: string
}) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tileCls ?? 'bg-[#176B5B]/10 text-[#176B5B]'}`}>{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">{title}</p>
      </div>
      <p className={`mt-3 text-2xl font-black tracking-[-0.03em] break-words ${valueCls ?? 'text-[#2C1B13]'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-[#6B5245]">{sub}</p>}
    </div>
  )
}

function TypePill({ type }: { type: 'bnpl' | 'loan' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
      type === 'bnpl' ? 'bg-[#9D4824]/10 text-[#9D4824]' : 'bg-[#176B5B]/10 text-[#176B5B]'
    }`}>
      {type === 'bnpl' ? 'BNPL' : 'Loan'}
    </span>
  )
}

function StatusPill({ item }: { item: RepaymentItem }) {
  const label = item.isOverdue && item.status !== 'paid' ? 'overdue' : item.status
  const cls = item.status === 'paid'
    ? 'bg-[#176B5B]/10 text-[#176B5B]'
    : item.isOverdue
      ? 'bg-[#B3261E]/10 text-[#B3261E]'
      : 'bg-[#E4A42A]/15 text-[#8A5A00]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'paid' ? 'bg-[#176B5B]' : item.isOverdue ? 'bg-[#B3261E]' : 'bg-[#E4A42A]'}`} /> {label}
    </span>
  )
}

interface TabBarProps {
  tab: 'upcoming' | 'past'
  upcomingCount: number
  pastCount: number
  onChange: (t: 'upcoming' | 'past') => void
}

function TabBar({ tab, upcomingCount, pastCount, onChange }: TabBarProps) {
  const tabs = [
    { key: 'upcoming' as const, label: 'Upcoming', count: upcomingCount },
    { key: 'past' as const, label: 'Paid', count: pastCount },
  ]
  return (
    <div className="inline-flex rounded-full border border-[#E7DCCB] bg-white p-1 shadow-sm">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer ${
            tab === t.key ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:text-[#2C1B13]'
          }`}
        >
          {t.label}
          <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? 'bg-[#FFF9EF]/20' : 'bg-[#EDE2D3] text-[#6B5245]'}`}>
            {t.count}
          </span>
        </button>
      ))}
    </div>
  )
}

export function Repayments() {
  const [data, setData] = useState<RepaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    api.get('/dashboard/individual/repayments').then((r) => {
      setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
      </div>
    )
  }

  const summary = data?.summary
  const items = tab === 'upcoming' ? (data?.upcoming ?? []) : (data?.past ?? [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Financial</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Repayment Schedule</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Stay on top of your BNPL installments and loan repayments.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <CalendarClock size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<AlertTriangle size={18} />}
          tileCls="bg-[#B3261E]/10 text-[#B3261E]"
          title="Outstanding"
          value={formatCurrency(summary?.totalOutstanding ?? 0)}
          valueCls={(summary?.totalOutstanding ?? 0) > 0 ? 'text-[#B3261E]' : 'text-[#176B5B]'}
        />
        <StatCard
          icon={<Hourglass size={18} />}
          tileCls="bg-[#176B5B]/10 text-[#176B5B]"
          title="Upcoming"
          value={String(summary?.totalUpcoming ?? 0)}
        />
        <StatCard
          icon={<Wallet size={18} />}
          tileCls={(summary?.overdueCount ?? 0) > 0 ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#EDE2D3] text-[#6B5245]'}
          title="Overdue"
          value={String(summary?.overdueCount ?? 0)}
          valueCls={(summary?.overdueCount ?? 0) > 0 ? 'text-[#B3261E]' : undefined}
        />
        <StatCard
          icon={<CalendarClock size={18} />}
          tileCls="bg-[#E4A42A]/15 text-[#8A5A00]"
          title="Next Due"
          value={summary?.nextDueAmount ? formatCurrency(summary.nextDueAmount) : '—'}
          sub={summary?.nextDueDate ? new Date(summary.nextDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No upcoming dues'}
        />
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7DCCB] bg-gradient-to-br from-[#FFF9EF] to-[#F0DDAD]/30 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#9D4824]/10">
              <CreditCard size={20} className="text-[#9D4824]" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">BNPL Balance</p>
              <p className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">{formatCurrency(summary?.bnplBalance ?? 0)}</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#C9B89F]" />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7DCCB] bg-gradient-to-br from-[#FFF9EF] to-[#F0DDAD]/30 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#176B5B]/10">
              <HandCoins size={20} className="text-[#176B5B]" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">Loan Balance</p>
              <p className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">{formatCurrency(summary?.loanBalance ?? 0)}</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#C9B89F]" />
        </div>
      </div>

      {/* Tabs */}
      <TabBar tab={tab} upcomingCount={data?.upcoming.length ?? 0} pastCount={data?.past.length ?? 0} onChange={setTab} />

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="border-b border-[#EDE2D3] px-6 py-4">
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">
            {tab === 'upcoming' ? 'Upcoming repayments' : 'Payment history'}
          </p>
          <p className="text-xs text-[#6B5245]">{tab === 'upcoming' ? 'Dues on your BNPL and loan schedules' : 'Repayments you have already made'}</p>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE2D3]/60">
              <CalendarClock size={26} className="text-[#6B5245]" />
            </div>
            <p className="font-bold text-[#2C1B13]">
              {tab === 'upcoming' ? 'All payments up to date' : 'No payments yet'}
            </p>
            <p className="max-w-sm text-sm text-[#6B5245]">
              {tab === 'upcoming' ? 'Nothing due right now — great job staying on schedule.' : 'Payments you make will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Item</th>
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Late Fee</th>
                  <th className={thCls}>Due Date</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {items.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="transition hover:bg-[#FFF9EF]/70">
                    <td className={`${tdCls} font-semibold`}>{item.itemName}</td>
                    <td className={tdCls}><TypePill type={item.type} /></td>
                    <td className={`${tdCls} font-semibold`}>{formatCurrency(item.amount)}</td>
                    <td className={tdCls}>
                      {item.lateFee > 0 ? (
                        <span className="font-semibold text-[#B3261E]">{formatCurrency(item.lateFee)}</span>
                      ) : '—'}
                    </td>
                    <td className={tdCls}>{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className={tdCls}><StatusPill item={item} /></td>
                    <td className={`${tdCls} max-w-[140px] truncate text-xs text-[#6B5245]`}>{item.paymentReference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
