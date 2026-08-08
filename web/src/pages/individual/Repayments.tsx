import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

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

  if (loading) return <div className="py-12 text-center text-gray-500">Loading repayment schedule...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Repayment Schedule</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-red-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Outstanding</CardTitle>
          <p className="mt-2 text-2xl font-bold text-red-600 break-words">
            {formatCurrency(data?.summary.totalOutstanding ?? 0)}
          </p>
        </Card>
        <Card className="border-blue-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Upcoming</CardTitle>
          <p className="mt-2 text-2xl font-bold">{data?.summary.totalUpcoming ?? 0}</p>
        </Card>
        <Card className="border-amber-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Overdue</CardTitle>
          <p className={`mt-2 text-2xl font-bold ${(data?.summary.overdueCount ?? 0) > 0 ? 'text-red-600' : ''}`}>
            {data?.summary.overdueCount ?? 0}
          </p>
        </Card>
        <Card className="border-purple-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Next Due</CardTitle>
          <p className="mt-2 text-2xl font-bold break-words">
            {data?.summary.nextDueAmount ? formatCurrency(data.summary.nextDueAmount) : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data?.summary.nextDueDate ? new Date(data.summary.nextDueDate).toLocaleDateString() : ''}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-indigo-500">
          <CardTitle className="text-sm font-medium text-gray-500">BNPL Balance</CardTitle>
          <p className="mt-2 text-xl font-bold">{formatCurrency(data?.summary.bnplBalance ?? 0)}</p>
        </Card>
        <Card className="border-emerald-500">
          <CardTitle className="text-sm font-medium text-gray-500">Loan Balance</CardTitle>
          <p className="mt-2 text-xl font-bold">{formatCurrency(data?.summary.loanBalance ?? 0)}</p>
        </Card>
      </div>

      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        <Button variant={tab === 'upcoming' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('upcoming')}>
          Upcoming ({data?.upcoming.length ?? 0})
        </Button>
        <Button variant={tab === 'past' ? 'primary' : 'ghost'} size="sm" onClick={() => setTab('past')}>
          Paid ({data?.past.length ?? 0})
        </Button>
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Item</THeadCell>
            <THeadCell>Type</THeadCell>
            <THeadCell>Amount</THeadCell>
            <THeadCell>Late Fee</THeadCell>
            <THeadCell>Due Date</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Reference</THeadCell>
          </THeadRow>
        </THead>
        <TBody>
          {(tab === 'upcoming' ? data?.upcoming : data?.past)?.map((item) => (
            <TBodyRow key={`${item.type}-${item.id}`}>
              <TBodyCell className="font-medium">{item.itemName}</TBodyCell>
              <TBodyCell>
                <Badge variant={item.type === 'bnpl' ? 'info' : 'default'}>
                  {item.type === 'bnpl' ? 'BNPL' : 'Loan'}
                </Badge>
              </TBodyCell>
              <TBodyCell>{formatCurrency(item.amount)}</TBodyCell>
              <TBodyCell>{item.lateFee > 0 ? formatCurrency(item.lateFee) : '—'}</TBodyCell>
              <TBodyCell>{new Date(item.dueDate).toLocaleDateString()}</TBodyCell>
              <TBodyCell>
                <Badge variant={
                  item.status === 'paid' ? 'success'
                  : item.isOverdue ? 'danger'
                  : 'warning'
                }>
                  {item.isOverdue && item.status !== 'paid' ? 'overdue' : item.status}
                </Badge>
              </TBodyCell>
              <TBodyCell className="max-w-[120px] truncate text-xs">
                {item.paymentReference || '—'}
              </TBodyCell>
            </TBodyRow>
          ))}
          {((tab === 'upcoming' ? data?.upcoming : data?.past)?.length ?? 0) === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={7} className="text-center text-gray-400 py-8">
                {tab === 'upcoming' ? 'All payments up to date' : 'No payments yet'}
              </TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>
    </div>
  )
}
