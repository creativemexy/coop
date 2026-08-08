import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface AccountSummary {
  name: string
  email: string
  kycStatus: string
  memberSince: string
  bnplBalance: number
  savingsBalance: number
  loanBalance: number
}

interface Subscription {
  id: string
  itemName: string
  totalAmount: number
  amountPaid: number
  balance: number
  status: string
  createdAt: string
}

interface Payment {
  id: string
  date: string
  amount: number
  status: string
  provider: string
  reference: string
}

interface UpcomingPayment {
  id: string
  itemName: string
  amount: number
  dueDate: string
  lateFee: number
}

interface Loan {
  id: string
  amount: number
  totalRepayment: number
  amountPaid: number
  balance: number
  status: string
  monthlyPayment: number
}

interface StatementData {
  accountSummary: AccountSummary
  subscriptions: Subscription[]
  paymentHistory: Payment[]
  upcomingPayments: UpcomingPayment[]
  loans: Loan[]
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  success: 'success',
  paid: 'success',
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
  active_repayment: 'success',
  disbursed: 'info',
  active: 'info',
  settled: 'info',
}

const PAGE_SIZE = 10

interface PaginationBarProps {
  page: number
  totalPages: number
  total: number
  onPage: (p: number) => void
}

function PaginationBar({ page, totalPages, total, onPage }: PaginationBarProps) {
  if (totalPages <= 1) return null
  const safe = Math.min(page, totalPages)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
      <span className="text-xs text-gray-400">
        Showing {(safe - 1) * PAGE_SIZE + 1}-{Math.min(safe * PAGE_SIZE, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(safe - 1)}
          disabled={safe <= 1}
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`px-3 py-1.5 text-sm rounded-lg border cursor-pointer ${
              p === safe ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(safe + 1)}
          disabled={safe >= totalPages}
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function Statements() {
  const [data, setData] = useState<StatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [subsPage, setSubsPage] = useState(1)
  const [loansPage, setLoansPage] = useState(1)

  useEffect(() => {
    api.get('/dashboard/individual/statement').then((r) => {
      setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const slicePage = <T,>(arr: T[] | undefined, page: number): T[] =>
    (arr ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageCount = (n: number | undefined) => Math.max(1, Math.ceil((n ?? 0) / PAGE_SIZE))

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  if (loading) return <div className="py-12 text-center text-gray-500">Loading statement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">My Statements</h2>
        <Button onClick={() => window.open('/api/v1/dashboard/individual/statement/export', '_blank')}>
          Export CSV
        </Button>
      </div>

      <Card className="border-indigo-500">
        <CardTitle>Account Summary</CardTitle>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{data?.accountSummary.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{data?.accountSummary.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">KYC</p>
            <Badge variant={
              data?.accountSummary.kycStatus === 'approved' ? 'success'
              : data?.accountSummary.kycStatus === 'pending' ? 'warning'
              : data?.accountSummary.kycStatus === 'rejected' ? 'danger'
              : 'default'
            }>
              {data?.accountSummary.kycStatus ?? '—'}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium">
              {data?.accountSummary.memberSince
                ? new Date(data.accountSummary.memberSince).toLocaleDateString()
                : '—'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500">BNPL Balance</p>
            <p className={`text-xl font-bold ${(data?.accountSummary.bnplBalance ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(data?.accountSummary.bnplBalance ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Savings Balance</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(data?.accountSummary.savingsBalance ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Loan Balance</p>
            <p className={`text-xl font-bold ${(data?.accountSummary.loanBalance ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(data?.accountSummary.loanBalance ?? 0)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-blue-500">
        <CardTitle>Upcoming Payments</CardTitle>
        {!data?.upcomingPayments?.length ? (
          <p className="text-sm text-gray-400 mt-4">No upcoming payments</p>
        ) : (
          <div className="mt-4 space-y-2">
            {slicePage(data.upcomingPayments, upcomingPage).map((p, i) => {
              const isOverdue = new Date(p.dueDate) < new Date()
              return (
                <div key={p.id} className={`flex items-center justify-between rounded-lg border dark:border-gray-700 px-4 py-3 text-sm ${
                  [
                    'bg-sky-50/40 dark:bg-sky-950/10',
                    'bg-emerald-50/40 dark:bg-emerald-950/10',
                    'bg-amber-50/40 dark:bg-amber-950/10',
                    'bg-fuchsia-50/40 dark:bg-fuchsia-950/10',
                    'bg-violet-50/40 dark:bg-violet-950/10',
                  ][i % 5]
                }`}>
                  <div>
                    <p className="font-medium">{p.itemName}</p>
                    <p className="text-gray-500 text-xs">due {new Date(p.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(p.amount)}</p>
                    {p.lateFee > 0 && <p className="text-xs text-red-500">+{formatCurrency(p.lateFee)} late fee</p>}
                    {isOverdue && <Badge variant="danger">Overdue</Badge>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <PaginationBar page={upcomingPage} totalPages={pageCount(data?.upcomingPayments?.length)} total={data?.upcomingPayments?.length ?? 0} onPage={setUpcomingPage} />
      </Card>

      <Card className="border-emerald-500">
        <CardTitle>Payment History</CardTitle>
        {!data?.paymentHistory?.length ? (
          <p className="text-sm text-gray-400 mt-4">No payments yet</p>
        ) : (
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Date</THeadCell>
                <THeadCell>Amount</THeadCell>
                <THeadCell>Status</THeadCell>
                <THeadCell>Provider</THeadCell>
                <THeadCell>Reference</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {slicePage(data.paymentHistory, historyPage).map((p) => (
                <TBodyRow key={p.id}>
                  <TBodyCell>{new Date(p.date).toLocaleDateString()}</TBodyCell>
                  <TBodyCell>{formatCurrency(p.amount)}</TBodyCell>
                  <TBodyCell><Badge variant={statusColors[p.status] ?? 'default'}>{p.status}</Badge></TBodyCell>
                  <TBodyCell>{p.provider}</TBodyCell>
                  <TBodyCell className="max-w-[120px] truncate text-xs">{p.reference || '—'}</TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        )}
        <PaginationBar page={historyPage} totalPages={pageCount(data?.paymentHistory?.length)} total={data?.paymentHistory?.length ?? 0} onPage={setHistoryPage} />
      </Card>

      <Card className="border-amber-500">
        <CardTitle>Active Subscriptions</CardTitle>
        {!data?.subscriptions?.length ? (
          <p className="text-sm text-gray-400 mt-4">No subscriptions</p>
        ) : (
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Item</THeadCell>
                <THeadCell>Total</THeadCell>
                <THeadCell>Paid</THeadCell>
                <THeadCell>Balance</THeadCell>
                <THeadCell>Status</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {slicePage(data.subscriptions, subsPage).map((s) => (
                <TBodyRow key={s.id}>
                  <TBodyCell className="font-medium">{s.itemName}</TBodyCell>
                  <TBodyCell>{formatCurrency(s.totalAmount)}</TBodyCell>
                  <TBodyCell>{formatCurrency(s.amountPaid)}</TBodyCell>
                  <TBodyCell className={s.balance > 0 ? 'text-red-600 font-medium' : ''}>
                    {formatCurrency(s.balance)}
                  </TBodyCell>
                  <TBodyCell><Badge variant={statusColors[s.status] ?? 'default'}>{s.status}</Badge></TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        )}
        <PaginationBar page={subsPage} totalPages={pageCount(data?.subscriptions?.length)} total={data?.subscriptions?.length ?? 0} onPage={setSubsPage} />
      </Card>

      {data?.loans?.length ? (
        <Card className="border-purple-500">
          <CardTitle>Loans</CardTitle>
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Amount</THeadCell>
                <THeadCell>Total Repayment</THeadCell>
                <THeadCell>Paid</THeadCell>
                <THeadCell>Balance</THeadCell>
                <THeadCell>Monthly</THeadCell>
                <THeadCell>Status</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {slicePage(data.loans, loansPage).map((l) => (
                <TBodyRow key={l.id}>
                  <TBodyCell>{formatCurrency(l.amount)}</TBodyCell>
                  <TBodyCell>{formatCurrency(l.totalRepayment)}</TBodyCell>
                  <TBodyCell>{formatCurrency(l.amountPaid)}</TBodyCell>
                  <TBodyCell className={l.balance > 0 ? 'text-red-600 font-medium' : ''}>
                    {formatCurrency(l.balance)}
                  </TBodyCell>
                  <TBodyCell>{formatCurrency(l.monthlyPayment)}</TBodyCell>
                  <TBodyCell><Badge variant={statusColors[l.status] ?? 'default'}>{l.status}</Badge></TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
          <PaginationBar page={loansPage} totalPages={pageCount(data.loans?.length)} total={data.loans?.length ?? 0} onPage={setLoansPage} />
        </Card>
      ) : null}
    </div>
  )
}
