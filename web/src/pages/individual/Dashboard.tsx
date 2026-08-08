import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../stores/auth.store'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'

interface Transaction {
  date: string
  type: string
  amount: number
  description: string
  status: string
  reference: string
}

interface Portfolio {
  totalInvested: number
  currentValue: number
  totalEarned: number
  holdingCount: number
  unrealizedReturn: number
  unrealizedReturnPct: number
}

interface DashboardStats {
  activeSubscriptions: number
  nextPaymentDate?: string
  nextPaymentAmount: number
  kycStatus: string
  kycImage?: string
  savingsBalance: number
  goalBalance: number
  savingsTarget: number
  activeLoans: number
  totalOutstanding: number
  portfolio: Portfolio
  bnplEligible: boolean
  bnplAvailable: number
  bnplUsed: number
  bnplCreditLimit: number
}

const typeLabels: Record<string, { label: string; color: string }> = {
  savings_deposit: { label: 'Savings Deposit', color: 'text-green-600' },
  savings_withdrawal: { label: 'Savings Withdrawal', color: 'text-red-600' },
  savings_interest: { label: 'Savings Interest', color: 'text-green-600' },
  payment: { label: 'Subscription Payment', color: 'text-red-600' },
  installment: { label: 'Installment Due', color: 'text-orange-600' },
  loan_due: { label: 'Loan Due', color: 'text-orange-600' },
  loan_repayment: { label: 'Loan Repayment', color: 'text-red-600' },
}

const ngn = (n: number) => `₦${n.toLocaleString()}`

const TXN_PAGE_SIZE = 10

export function IndividualDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [txnPage, setTxnPage] = useState(1)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/dashboard/individual').then((r) => setStats(r.data))
    api.get('/dashboard/individual/transactions').then((r) => setTxns(r.data))
  }, [])

  const kycBanner = () => {
    const kyc = stats?.kycStatus ?? user?.kycStatus
    if (kyc === 'none')
      return (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">KYC verification required</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Complete your identity verification to access BNPL subscriptions.</p>
          </div>
          <Link to="/individual/kyc"><Button variant="primary" size="sm">Start KYC</Button></Link>
        </div>
      )
    if (kyc === 'pending')
      return (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">KYC verification in progress</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">We are reviewing your documents. Check back soon.</p>
          </div>
          <Link to="/individual/kyc"><Button variant="secondary" size="sm">View Status</Button></Link>
        </div>
      )
    if (kyc === 'rejected')
      return (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">KYC verification rejected</p>
            <p className="text-sm text-red-700 dark:text-red-300">Your verification was rejected. Please resubmit with valid documents.</p>
          </div>
          <Link to="/individual/kyc"><Button variant="primary" size="sm">Resubmit</Button></Link>
        </div>
      )
    if (kyc === 'approved')
      return (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {stats?.kycImage && (
              <img src={stats.kycImage} alt="KYC" className="w-14 h-14 rounded-full object-cover border-2 border-green-300" />
            )}
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">KYC verified</p>
              <p className="text-sm text-green-700 dark:text-green-300">Your identity has been verified.</p>
            </div>
          </div>
          <Link to="/individual/kyc"><Button variant="secondary" size="sm">View Details</Button></Link>
        </div>
      )
    return null
  }

  const savingsProgress = stats && stats.savingsTarget > 0
    ? Math.min(100, (stats.goalBalance / stats.savingsTarget) * 100)
    : 0

  const bnplPercent = stats && stats.bnplCreditLimit > 0 ? (stats.bnplUsed / stats.bnplCreditLimit) * 100 : 0

  const txnTotalPages = Math.max(1, Math.ceil(txns.length / TXN_PAGE_SIZE))
  const pagedTxns = useMemo(() => {
    const start = (txnPage - 1) * TXN_PAGE_SIZE
    return txns.slice(start, start + TXN_PAGE_SIZE)
  }, [txns, txnPage])

  const goTxnPage = (p: number) => {
    setTxnPage(Math.min(Math.max(1, p), txnTotalPages))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">My Dashboard</h2>
      </div>
      {kycBanner()}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-indigo-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Active Subscriptions</CardTitle>
          <p className="mt-2 text-2xl sm:text-3xl font-bold break-words">{stats?.activeSubscriptions ?? '—'}</p>
          <Link to="/individual/subscriptions">
            <Button variant="ghost" size="sm" className="mt-2">View all</Button>
          </Link>
        </Card>

        <Card className="border-emerald-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Next Payment</CardTitle>
          <p className="mt-2 text-2xl sm:text-3xl font-bold break-words">
            {stats?.nextPaymentAmount ? ngn(stats.nextPaymentAmount) : '—'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats?.nextPaymentDate ? `Due ${new Date(stats.nextPaymentDate).toLocaleDateString()}` : 'No upcoming'}
          </p>
        </Card>

        <Card className="border-blue-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Savings</CardTitle>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm gap-2">
              <span className="shrink-0">General</span>
              <span className="font-bold text-green-600 break-words">{stats?.savingsBalance !== undefined ? ngn(stats.savingsBalance) : '—'}</span>
            </div>
            <div className="flex justify-between text-sm gap-2">
              <span className="shrink-0">Goal</span>
              <span className="font-bold text-blue-600 break-words">{stats?.goalBalance !== undefined ? ngn(stats.goalBalance) : '—'}</span>
            </div>
          </div>
          {stats?.savingsTarget ? (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1 gap-2">
                <span className="truncate">Target: {ngn(stats.savingsTarget)}</span>
                <span className="shrink-0">{savingsProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${savingsProgress}%` }} />
              </div>
            </div>
          ) : null}
          <Link to="/individual/savings">
            <Button variant="ghost" size="sm" className="mt-2">Manage Savings</Button>
          </Link>
        </Card>

        <Card className="border-amber-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Active Loans</CardTitle>
          <p className="mt-2 text-2xl sm:text-3xl font-bold break-words">{stats?.activeLoans ?? '—'}</p>
          {stats?.totalOutstanding ? (
            <p className="text-sm text-red-600 mt-1 break-words">{ngn(stats.totalOutstanding)} outstanding</p>
          ) : null}
          <Link to="/individual/loans">
            <Button variant="ghost" size="sm" className="mt-2">Apply / View</Button>
          </Link>
        </Card>
      </div>

      {stats?.portfolio && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Portfolio Value</CardTitle>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-blue-600 break-words">{ngn(stats.portfolio.currentValue)}</p>
            <p className="text-xs text-gray-500">{stats.portfolio.holdingCount} holding{stats.portfolio.holdingCount !== 1 ? 's' : ''}</p>
          </Card>
          <Card>
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Total Invested</CardTitle>
            <p className="mt-2 text-xl sm:text-2xl font-bold break-words">{ngn(stats.portfolio.totalInvested)}</p>
            <p className="text-xs text-gray-500 mt-1">Cost basis</p>
          </Card>
          <Card>
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Dividends Earned</CardTitle>
            <p className="mt-2 text-xl sm:text-2xl font-bold text-green-600 break-words">{ngn(stats.portfolio.totalEarned)}</p>
          </Card>
          <Card>
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Unrealized P&L</CardTitle>
            <p className={`mt-2 text-xl sm:text-2xl font-bold break-words ${stats.portfolio.unrealizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.portfolio.unrealizedReturn >= 0 ? '+' : ''}{ngn(stats.portfolio.unrealizedReturn)}
            </p>
            <p className="text-xs text-gray-500">{stats.portfolio.unrealizedReturnPct.toFixed(1)}%</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <Card className="border-purple-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">BNPL Available Credit</CardTitle>
          {stats && !stats.bnplEligible ? (
            <div className="mt-2">
              <p className="text-lg font-bold text-gray-400">Not yet eligible</p>
              <p className="text-xs text-gray-500 mt-1">Save consistently for 6+ months to unlock BNPL credit</p>
            </div>
          ) : (
            <>
              <p className="mt-2 text-2xl font-bold text-purple-600 break-words">{stats ? ngn(stats.bnplAvailable) : '—'}</p>
              {stats && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1 gap-2">
                    <span className="truncate">{ngn(stats.bnplUsed)} used</span>
                    <span className="shrink-0">Limit: {ngn(stats.bnplCreditLimit)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${bnplPercent}%` }} />
                  </div>
                </div>
              )}
            </>
          )}
          <Link to="/individual/catalog">
            <Button variant="ghost" size="sm" className="mt-2">Shop Now</Button>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/individual/savings">
          <Button variant="primary" className="w-full">Deposit</Button>
        </Link>
        <Link to="/individual/savings">
          <Button variant="secondary" className="w-full">Withdraw</Button>
        </Link>
        <Link to="/individual/loans">
          <Button variant="primary" className="w-full">Apply for Loan</Button>
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-sm font-medium text-gray-500">Recent Activity</CardTitle>
          <Link to="/individual/transactions">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {txns.length === 0 && <p className="text-gray-400 text-sm">No transactions yet</p>}
          {pagedTxns.map((tx, i) => {
            const info = typeLabels[tx.type] ?? { label: tx.type, color: 'text-gray-600' }
            return (
              <div key={tx.reference} className={`flex items-start sm:items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0 rounded-lg px-2 ${
                [
                  'bg-sky-50/40 dark:bg-sky-950/10',
                  'bg-emerald-50/40 dark:bg-emerald-950/10',
                  'bg-amber-50/40 dark:bg-amber-950/10',
                  'bg-fuchsia-50/40 dark:bg-fuchsia-950/10',
                  'bg-violet-50/40 dark:bg-violet-950/10',
                ][i % 5]
              }`}>
                <div className="min-w-0">
                  <p className={`font-medium ${info.color}`}>{info.label}</p>
                  <p className="text-sm text-gray-500 truncate max-w-[60vw] sm:max-w-xs">{tx.description}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount >= 0 ? '+' : ''}{ngn(Math.abs(tx.amount))}
                  </p>
                  <Badge variant={
                    tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed'
                      ? 'success'
                      : tx.status === 'pending' || tx.status === 'overdue'
                      ? 'warning'
                      : 'default'
                  }>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
        {txnTotalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">
              Page {txnPage} of {txnTotalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goTxnPage(txnPage - 1)}
                disabled={txnPage <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: txnTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goTxnPage(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg border cursor-pointer ${
                    p === txnPage ? 'bg-green-600 text-white border-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goTxnPage(txnPage + 1)}
                disabled={txnPage >= txnTotalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
