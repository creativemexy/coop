import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'

interface FinancialSummary {
  totalVolume: number
  totalFees: number
  monthVolume: number
  yearVolume: number
  outstandingPrincipal: number
  aum: number
  totalInvested: number
  defaultRate: number
  totalUsers: number
  newUsersMonth: number
  activeLoans: number
  defaultedLoans: number
  savingsBalance: number
  totalSavingsDeposits: number
  totalSavingsWithdrawals: number
  activeSavingsAccounts: number
  activeLoanCount: number
  loanOutstanding: number
}

interface MonthlyTrend {
  month: string
  volume: number
  fees: number
  users: number
}

interface FinancialReports {
  summary: FinancialSummary
  trends: MonthlyTrend[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

const fmt1 = (n: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n)

export function FinancialReports() {
  const [data, setData] = useState<FinancialReports | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/financial-reports')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-12 text-center text-gray-400">Loading financial reports...</div>
  if (!data) return <div className="py-12 text-center text-red-500">Failed to load financial reports</div>

  const { summary, trends } = data
  const maxVolume = Math.max(...trends.map((t) => t.volume), 1)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Platform Financial Reports</h2>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-500">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase">Total Volume</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">{fmt(summary.totalVolume)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Lifetime all payments</p>
        </Card>
        <Card className="border-emerald-500">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase">This Month</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">{fmt(summary.monthVolume)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmt1(summary.totalUsers)} users · {fmt(summary.yearVolume)} YTD</p>
        </Card>
        <Card className="border-green-600">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase">Fees Collected</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">{fmt(summary.totalFees)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Platform revenue</p>
        </Card>
        <Card className="border-blue-500">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase">New Users (MTD)</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">{summary.newUsersMonth}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmt1(summary.totalUsers)} total users</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-purple-500">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase">Outstanding BNPL Principal</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">{fmt(summary.outstandingPrincipal)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{summary.activeLoans} active loans</p>
        </Card>
        <Card className="border-fuchsia-500">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase">Investment AUM</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">{fmt(summary.aum)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fmt(summary.totalInvested)} total invested</p>
        </Card>
        <Card className="border-red-500">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase">Default Rate</CardTitle>
          <p className={`mt-1 text-2xl font-bold ${summary.defaultRate > 5 ? 'text-red-600' : summary.defaultRate > 2 ? 'text-yellow-600' : 'dark:text-gray-100'}`}>
            {fmt1(summary.defaultRate)}%
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{summary.defaultedLoans} defaulted / {summary.activeLoans + summary.defaultedLoans} total active</p>
        </Card>
        <Card className="border-cyan-500">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase">Platform Health</CardTitle>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span>Active loans</span><span className="font-medium">{summary.activeLoans}</span></div>
            <div className="flex justify-between"><span>Defaulted</span><span className="font-medium text-red-600">{summary.defaultedLoans}</span></div>
            <div className="flex justify-between"><span>AUM</span><span className="font-medium">{fmt(summary.aum)}</span></div>
          </div>
        </Card>
      </div>

      {/* Monthly Trends Chart */}
      <Card>
        <CardTitle className="flex items-center justify-between">
          <span>Monthly Trends (12 months)</span>
          <div className="flex gap-4 text-xs text-gray-500">
            <span><span className="inline-block w-3 h-3 rounded bg-blue-500 mr-1" />Volume</span>
            <span><span className="inline-block w-3 h-3 rounded bg-green-500 mr-1" />Fees</span>
            <span><span className="inline-block w-3 h-3 rounded bg-purple-500 mr-1" />New Users</span>
          </div>
        </CardTitle>
        <div className="mt-6 space-y-2">
          {trends.map((t) => {
            const volPct = (t.volume / maxVolume) * 100
            const feePct = (t.fees / maxVolume) * 100
            const userMax = Math.max(...trends.map((x) => x.users), 1)
            const userPct = (t.users / userMax) * 100
            return (
              <div key={t.month} className="flex items-center gap-3 text-sm">
                <span className="w-14 text-right font-medium text-gray-600 dark:text-gray-400 shrink-0">{t.month}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-blue-500 rounded transition-all" style={{ width: `${volPct}%` }} />
                    <span className="text-xs text-gray-500 w-20 shrink-0">{fmt(t.volume)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-green-500 rounded transition-all" style={{ width: `${feePct}%` }} />
                    <span className="text-xs text-gray-500 w-20 shrink-0">{fmt(t.fees)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-24 shrink-0">
                  <div className="h-2 bg-purple-500 rounded transition-all" style={{ width: `${userPct}%` }} />
                  <span className="text-xs text-gray-500 w-8">{t.users}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Summary breakdown */}
      <Card>
        <CardTitle>Revenue Breakdown</CardTitle>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">BNPL</p>
            <p className="text-lg font-bold mt-1 dark:text-gray-100">{fmt(summary.outstandingPrincipal)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Outstanding principal</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Investments</p>
            <p className="text-lg font-bold mt-1 dark:text-gray-100">{fmt(summary.aum)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Assets under management</p>
          </div>
          <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Fees</p>
            <p className="text-lg font-bold mt-1 dark:text-gray-100">{fmt(summary.totalFees)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Lifetime platform revenue</p>
          </div>
        </div>
      </Card>

      {/* Savings & Loans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500">
          <CardTitle>Savings</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total balance</p>
              <p className="text-lg font-bold mt-1 dark:text-gray-100">{fmt(summary.savingsBalance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lifetime deposits</p>
              <p className="text-lg font-bold mt-1 text-green-600">{fmt(summary.totalSavingsDeposits)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lifetime withdrawals</p>
              <p className="text-lg font-bold mt-1 text-red-600">{fmt(summary.totalSavingsWithdrawals)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active accounts</p>
              <p className="text-lg font-bold mt-1 dark:text-gray-100">{summary.activeSavingsAccounts}</p>
            </div>
          </div>
        </Card>
        <Card className="border-blue-500">
          <CardTitle>Loans</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-lg font-bold mt-1 dark:text-gray-100">{fmt(summary.loanOutstanding)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active loans</p>
              <p className="text-lg font-bold mt-1 dark:text-gray-100">{summary.activeLoanCount}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
