import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Accountant Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card className="border-indigo-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Fee Pots Balance</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.totalBalance ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">{stats?.totalPots ?? 0} pots</p>
        </Card>
        <Card className="border-emerald-500">
          <CardTitle className="text-sm font-medium text-gray-500">Platform Pot (30%)</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.platformBalance ?? 0)}</p>
        </Card>
        <Card className="border-cyan-500">
          <CardTitle className="text-sm font-medium text-gray-500">Admin Pot</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.adminBalance ?? 0)}</p>
        </Card>
        <Card className="border-blue-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Fee Income</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.totalFeeIncome ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">sum of all fee shares</p>
        </Card>
        <Card className="border-green-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Savings</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.totalSavings ?? 0)}</p>
        </Card>
        <Card className="border-red-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Withdrawals</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.totalWithdrawals ?? 0)}</p>
        </Card>
        <Card className="border-amber-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Loans (Active + Completed)</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.totalLoans ?? 0)}</p>
        </Card>
        <Card className="border-violet-500">
          <CardTitle className="text-sm font-medium text-gray-500">Dividends (Investment Payouts)</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.totalDividends ?? 0)}</p>
        </Card>
        <Card className="border-fuchsia-500">
          <CardTitle className="text-sm font-medium text-gray-500">BNPL Volume</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNgn(stats?.bnplVolume ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">₦{formatNgn(stats?.bnplOutstanding ?? 0)} outstanding</p>
        </Card>
        <Card className="border-teal-500">
          <CardTitle className="text-sm font-medium text-gray-500">Registered Members</CardTitle>
          <p className="mt-2 text-3xl font-bold">{stats?.totalMembers ?? 0}</p>
        </Card>
        <Card className="border-gray-400">
          <CardTitle className="text-sm font-medium text-gray-500">Posted Journal Entries</CardTitle>
          <p className="mt-2 text-3xl font-bold">{stats?.postedJournalEntries ?? 0}</p>
        </Card>
        <Card className="border-orange-500">
          <CardTitle className="text-sm font-medium text-gray-500">Pending Journal Entries</CardTitle>
          <p className="mt-2 text-3xl font-bold">{stats?.pendingJournalEntries ?? 0}</p>
        </Card>
        <Card className="border-yellow-500">
          <CardTitle className="text-sm font-medium text-gray-500">Pending Reconciliations</CardTitle>
          <p className="mt-2 text-3xl font-bold">{stats?.pendingReconciliations ?? 0}</p>
        </Card>
        <Card className="border-rose-500">
          <CardTitle className="text-sm font-medium text-gray-500">Pending Adjustments</CardTitle>
          <p className="mt-2 text-3xl font-bold">{stats?.pendingAdjustments ?? 0}</p>
        </Card>
        <Card className="border-sky-500">
          <CardTitle className="text-sm font-medium text-gray-500">Pending Fee Withdrawals</CardTitle>
          <p className="mt-2 text-3xl font-bold">{stats?.pendingFeeWithdrawals ?? 0}</p>
        </Card>
      </div>
    </div>
  )
}
