import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'
import { Modal } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'

interface Installment {
  id: string
  dueDate: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  paidAt?: string
}

interface Subscription {
  id: string
  plan?: { catalogItem?: { name: string; price: number } }
  status: string
  downPayment: number
  totalAmount: number
  amountPaid: number
  nextInstallmentDate?: string
  createdAt: string
  installments?: Installment[]
}

const statusFlow: Record<string, number> = {
  created: 0,
  pending_payment: 1,
  disbursed: 2,
  active_repayment: 3,
  settled: 4,
  defaulted: -1,
}

const statusLabels: Record<string, string> = {
  created: 'Order Created',
  pending_payment: 'Pending Payment',
  disbursed: 'Disbursed',
  active_repayment: 'Repayment Active',
  settled: 'Settled',
  defaulted: 'Defaulted',
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  created: 'default',
  pending_payment: 'warning',
  disbursed: 'info',
  active_repayment: 'success',
  settled: 'info',
  defaulted: 'danger',
}

function Timeline({ status }: { status: string }) {
  const steps = ['created', 'pending_payment', 'disbursed', 'active_repayment', 'settled']
  const currentIdx = statusFlow[status] ?? -1

  return (
    <div className="flex items-center gap-1 py-2">
      {steps.map((step, i) => {
        const isPast = currentIdx >= i
        const isCurrent = currentIdx === i
        const isDefaulted = status === 'defaulted'
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isDefaulted && isCurrent ? 'border-red-500 bg-red-100 text-red-700'
                  : isPast ? 'border-green-500 bg-green-100 text-green-700'
                  : 'border-gray-300 bg-white text-gray-400'
                } ${isCurrent && !isDefaulted ? 'ring-2 ring-green-300' : ''}`}
              >
                {isPast ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight max-w-16 ${
                isCurrent ? 'font-semibold text-gray-800' : 'text-gray-400'
              }`}>
                {statusLabels[step].replace(' ', '\n')}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-1.5rem] ${
                isDefaulted && i === steps.length - 2 ? 'bg-red-300'
                : currentIdx > i ? 'bg-green-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatStatus(s: string) {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [timelineSub, setTimelineSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paySub, setPaySub] = useState<Subscription | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [paying, setPaying] = useState(false)

  const fetch = useCallback(() => {
    setLoading(true)
    setError('')
    api.get('/bnpl/subscriptions')
      .then((r) => setSubscriptions(r.data))
      .catch((e: any) => {
        setSubscriptions([])
        setError(e.response?.data?.message || 'Failed to load subscriptions')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const activeCount = subscriptions.filter((s) => s.status === 'active_repayment' || s.status === 'disbursed').length
  const totalBalance = subscriptions.reduce((s, sub) => s + (sub.totalAmount - sub.amountPaid), 0)

  const openPay = (s: Subscription) => {
    const nextDue = (s.installments ?? []).find((i) => i.status === 'pending')
    setPaySub(s)
    setPayAmount(String(nextDue?.amount ?? (s.totalAmount - s.amountPaid)))
  }

  const handlePay = async () => {
    if (!paySub || !payAmount || Number(payAmount) <= 0) {
      alert('Enter a valid payment amount')
      return
    }
    setPaying(true)
    try {
      const { data } = await api.post('/payments/initiate', {
        subscriptionId: paySub.id,
        amount: Number(payAmount),
        provider: 'paystack',
        purpose: `Subscription payment - ${paySub.plan?.catalogItem?.name ?? 'BNPL'}`,
        callbackUrl: `${window.location.origin}/individual/subscriptions`,
      })
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        alert('Payment could not be initiated. Please try again.')
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-500">Loading subscriptions...</div>

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold dark:text-gray-100">My Subscriptions</h2>
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 text-sm text-yellow-800 dark:text-yellow-200">
          {error}
        </div>
        <Button variant="primary" size="sm" onClick={fetch}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">My Subscriptions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-emerald-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Active</CardTitle>
          <p className="mt-2 text-2xl sm:text-3xl font-bold">{activeCount}</p>
        </Card>
        <Card className="border-amber-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Outstanding Balance</CardTitle>
          <p className="mt-2 text-2xl sm:text-3xl font-bold break-words">₦{totalBalance.toLocaleString()}</p>
        </Card>
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Item</THeadCell>
            <THeadCell>Total</THeadCell>
            <THeadCell>Paid</THeadCell>
            <THeadCell>Balance</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Next Due</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {subscriptions.map((s) => {
            const balance = s.totalAmount - s.amountPaid
            return (
              <TBodyRow key={s.id}>
                <TBodyCell className="font-medium">{s.plan?.catalogItem?.name ?? '—'}</TBodyCell>
                <TBodyCell>₦{s.totalAmount.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{s.amountPaid.toLocaleString()}</TBodyCell>
                <TBodyCell className={balance > 0 ? 'text-red-600 font-medium' : ''}>
                  ₦{balance.toLocaleString()}
                </TBodyCell>
                <TBodyCell>
                  <Badge variant={statusColors[s.status] ?? 'default'}>{formatStatus(s.status)}</Badge>
                </TBodyCell>
                <TBodyCell>
                  {s.nextInstallmentDate
                    ? new Date(s.nextInstallmentDate).toLocaleDateString()
                    : '—'}
                </TBodyCell>
                <TBodyCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setTimelineSub(s)}>
                      Timeline
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    >
                      {expandedId === s.id ? 'Hide' : 'Schedule'}
                    </Button>
                    {balance > 0 && (
                      <Button variant="primary" size="sm" onClick={() => openPay(s)}>
                        Pay
                      </Button>
                    )}
                  </div>
                </TBodyCell>
              </TBodyRow>
            )
          })}
            {subscriptions.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={7} className="text-center text-gray-400 py-8">
                  No subscriptions yet.{' '}
                  <Link to="/individual/catalog" className="text-blue-600 hover:underline">Browse catalog</Link>
                </TBodyCell>
              </TBodyRow>
            )}
        </TBody>
      </Table>

      <Modal open={!!timelineSub} onClose={() => setTimelineSub(null)} title="Order Status Timeline">
        {timelineSub && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{timelineSub.plan?.catalogItem?.name ?? 'Unknown'}</span>
              <Badge variant={statusColors[timelineSub.status] ?? 'default'}>
                {formatStatus(timelineSub.status)}
              </Badge>
            </div>
            <Timeline status={timelineSub.status} />
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Total amount</span>
                <span className="font-medium">₦{timelineSub.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid so far</span>
                <span className="font-medium">₦{timelineSub.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Balance</span>
                <span className="font-medium text-red-600">₦{(timelineSub.totalAmount - timelineSub.amountPaid).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!paySub} onClose={() => setPaySub(null)} title={`Make Payment — ${paySub?.plan?.catalogItem?.name ?? ''}`}>
        {paySub && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Outstanding balance</span>
                <span className="font-medium">₦{(paySub.totalAmount - paySub.amountPaid).toLocaleString()}</span>
              </div>
              {paySub.nextInstallmentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Next due</span>
                  <span className="font-medium">{new Date(paySub.nextInstallmentDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <Input
              label="Payment amount"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="Amount"
            />

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setPaySub(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handlePay} disabled={paying || !payAmount || Number(payAmount) <= 0}>
                {paying ? 'Processing...' : 'Pay with Paystack'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {expandedId && (() => {
        const sub = subscriptions.find((s) => s.id === expandedId)
        if (!sub || !sub.installments) return null
        const upcoming = sub.installments.filter((i) => i.status === 'pending')
        const overdue = upcoming.filter((i) => new Date(i.dueDate) < new Date())

        return (
          <Card>
            <CardTitle>Installment Schedule — {sub.plan?.catalogItem?.name ?? ''}</CardTitle>
            {overdue.length > 0 && (
              <Badge variant="danger" className="mb-3">{overdue.length} overdue</Badge>
            )}
            <div className="space-y-2 mt-3">
              {sub.installments.map((inst) => {
                const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date()
                return (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between rounded-lg border dark:border-gray-700 px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">₦{Number(inst.amount).toLocaleString()}</span>
                      <span className="text-gray-500 ml-3">
                        due {new Date(inst.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <Badge
                      variant={
                        inst.status === 'paid' ? 'success'
                        : isOverdue ? 'danger'
                        : 'warning'
                      }
                    >
                      {isOverdue && inst.status === 'pending' ? 'overdue' : inst.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })()}
    </div>
  )
}
