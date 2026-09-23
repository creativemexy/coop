import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Badge, PageHeader, Panel, StatCard } from './ui'

interface DashboardStats {
  totalPots: number
  totalBalance: number
  platformBalance: number
  adminBalance: number
  pendingReconciliations: number
  pendingAdjustments: number
  pendingJournalEntries: number
  pendingFeeWithdrawals: number
  totalSavings: number
  totalWithdrawals: number
  totalLoans: number
  totalDividends: number
  totalFeeIncome: number
  totalMembers: number
  bnplOutstanding: number
  bnplVolume: number
  postedJournalEntries: number
}

export function AccountantDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    api.get('/accountant/dashboard').then((r) => setStats(r.data)).catch(() => {})
  }, [])

  const formatNgn = (v: number) => `₦${v.toLocaleString()}`

  const balanceCards = [
    { label: 'Total Fee Pots Balance', value: formatNgn(stats?.totalBalance ?? 0), sub: `${stats?.totalPots ?? 0} pots`, icon: '🏦', iconCls: 'bg-[#176B5B]/10 text-[#176B5B]' },
    { label: 'Platform Pot (30%)', value: formatNgn(stats?.platformBalance ?? 0), sub: 'platform share', icon: '📊', iconCls: 'bg-[#E4A42A]/15 text-[#8A5A00]' },
    { label: 'Admin Pot', value: formatNgn(stats?.adminBalance ?? 0), sub: 'admin share', icon: '⚖️', iconCls: 'bg-[#9D4824]/10 text-[#9D4824]' },
    { label: 'Total Fee Income', value: formatNgn(stats?.totalFeeIncome ?? 0), sub: 'sum of all fee shares', icon: '💰', iconCls: 'bg-[#176B5B]/10 text-[#176B5B]' },
  ]

  const activityCards = [
    { label: 'Total Savings', value: formatNgn(stats?.totalSavings ?? 0), sub: 'member deposits', icon: '🐖', iconCls: 'bg-[#176B5B]/10 text-[#176B5B]' },
    { label: 'Total Withdrawals', value: formatNgn(stats?.totalWithdrawals ?? 0), sub: 'paid out', icon: '📤', iconCls: 'bg-[#B3261E]/10 text-[#B3261E]' },
    { label: 'Total Loans', value: formatNgn(stats?.totalLoans ?? 0), sub: 'active + completed', icon: '🤝', iconCls: 'bg-[#E4A42A]/15 text-[#8A5A00]' },
    { label: 'Dividends', value: formatNgn(stats?.totalDividends ?? 0), sub: 'investment payouts', icon: '📈', iconCls: 'bg-[#9D4824]/10 text-[#9D4824]' },
    { label: 'BNPL Volume', value: formatNgn(stats?.bnplVolume ?? 0), sub: `₦${formatNgn(stats?.bnplOutstanding ?? 0)} outstanding`, icon: '🛍️', iconCls: 'bg-[#176B5B]/10 text-[#176B5B]' },
    { label: 'Registered Members', value: stats?.totalMembers ?? 0, sub: 'on the platform', icon: '👥', iconCls: 'bg-[#E4A42A]/15 text-[#8A5A00]' },
  ]

  const queue = [
    { label: 'Pending Journal Entries', value: stats?.pendingJournalEntries ?? 0, tone: 'warning' as const },
    { label: 'Pending Reconciliations', value: stats?.pendingReconciliations ?? 0, tone: 'info' as const },
    { label: 'Pending Adjustments', value: stats?.pendingAdjustments ?? 0, tone: 'danger' as const },
    { label: 'Pending Fee Withdrawals', value: stats?.pendingFeeWithdrawals ?? 0, tone: 'warning' as const },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Accountant Dashboard"
        subtitle="A live view of fee pots, member flows and the approval queue."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {balanceCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <Panel title="Member & Platform Activity" subtitle="Cumulative totals across the ledger">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activityCards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title="Approval Queue"
          subtitle="Items waiting on finance review"
          className="lg:col-span-2"
          padded={false}
        >
          <div className="divide-y divide-[#EDE2D3]">
            {queue.map((q) => (
              <div key={q.label} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-medium text-[#2C1B13]">{q.label}</span>
                <Badge variant={q.tone} dot>
                  {q.value} pending
                </Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Ledger Health" subtitle="Posted journal entries">
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <p className="text-4xl font-black tracking-[-0.04em] text-[#176B5B]">{stats?.postedJournalEntries ?? 0}</p>
            <p className="mt-1 text-sm text-[#6B5245]">entries posted to the general ledger</p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
