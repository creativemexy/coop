import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'

interface Plan {
  id: string
  catalogItem?: { name: string; price: number }
  downPaymentPercent: number
  installmentCount: number
  installmentFrequency: string
  interestRate: number
  organizationId: string
}

interface Installment {
  id: string
  dueDate: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  paidAt?: string
  paymentReference?: string
}

interface Order {
  id: string
  userId: string
  planId: string
  plan?: Plan
  status: string
  downPayment: number
  totalAmount: number
  amountPaid: number
  nextInstallmentDate?: string
  payoutStatus: string
  disbursementReference?: string
  disbursedAt?: string
  settledAt?: string
  approvedAt?: string
  providerReference?: string
  createdAt: string
  installments?: Installment[]
  riskFlagCount?: number
  openRiskFlagCount?: number
  riskLevel?: 'low' | 'medium' | 'high'
  overdueInstallmentCount?: number
  totalInstallmentCount?: number
  paidInstallmentCount?: number
}

interface PaymentRecord {
  id: string
  amount: number
  fee: number
  provider: string
  providerReference: string
  status: string
  payoutStatus: string
  metadata?: any
  createdAt: string
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  created: 'default',
  pending_payment: 'warning',
  disbursed: 'info',
  active_repayment: 'success',
  settled: 'info',
  defaulted: 'danger',
}

const riskColors: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

const payoutColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  completed: 'success',
  pending: 'warning',
  failed: 'danger',
}

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [payoutFilter, setPayoutFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [tenorFilter, setTenorFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [disburseRef, setDisburseRef] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionReason, setActionReason] = useState('')

  const loadPayments = async (orderId: string) => {
    setPaymentsLoading(true)
    try {
      const res = await api.get(`/bnpl/subscriptions/orders/${orderId}/payments`)
      setPayments(res.data)
    } catch { setPayments([]) }
    setPaymentsLoading(false)
  }

  function formatOrderStatus(s: string) {
    return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const fetch = useCallback(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (payoutFilter) params.payoutStatus = payoutFilter
    if (searchQuery) params.search = searchQuery
    if (tenorFilter) params.tenor = tenorFilter
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    api.get('/bnpl/subscriptions/orders', { params }).then((r) => setOrders(r.data))
  }, [statusFilter, payoutFilter, searchQuery, tenorFilter, dateFrom, dateTo])

  useEffect(() => { fetch() }, [fetch])

  const handleStatus = async (id: string, status: string) => {
    setSaving(true)
    try {
      await api.patch(`/bnpl/subscriptions/orders/${id}/status`, { status, reason: actionReason || undefined })
      setSelected(null)
      setActionReason('')
      setPayments([])
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update status')
    }
    setSaving(false)
  }

  const handleDisburse = async () => {
    if (!selected || !disburseRef) return
    setSaving(true)
    try {
      await api.patch(`/bnpl/subscriptions/orders/${selected.id}/disburse`, { disbursementReference: disburseRef, reason: actionReason || undefined })
      setSelected(null)
      setDisburseRef('')
      setActionReason('')
      setPayments([])
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to mark disbursed')
    }
    setSaving(false)
  }

  const statusOptions: string[] = ['created', 'pending_payment', 'disbursed', 'active_repayment', 'settled', 'defaulted']
  const payoutOptions: string[] = ['pending', 'completed', 'failed']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Orders Management</h2>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          placeholder="Search product…"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
          ))}
        </select>

        <select
          value={payoutFilter}
          onChange={(e) => setPayoutFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All settlement</option>
          {payoutOptions.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={tenorFilter}
          onChange={(e) => setTenorFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All tenors</option>
          <option value="3">3 months</option>
          <option value="6">6 months</option>
          <option value="12">12 months</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          placeholder="To"
        />
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Order ID</THeadCell>
            <THeadCell>Item / Tenor</THeadCell>
            <THeadCell>Risk</THeadCell>
            <THeadCell>Total</THeadCell>
            <THeadCell>Paid</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Payout</THeadCell>
            <THeadCell>Created</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {orders.map((o) => {
            const tenorLabel = o.plan ? `${o.plan.installmentCount}m ${o.plan.installmentFrequency}` : '—'
            return (
              <TBodyRow key={o.id}>
                <TBodyCell className="font-mono text-xs">{o.id.slice(0, 8)}…</TBodyCell>
                <TBodyCell>
                  <div className="font-medium">{o.plan?.catalogItem?.name ?? '—'}</div>
                  <div className="text-xs text-gray-500">{tenorLabel}</div>
                </TBodyCell>
                <TBodyCell>
                  <Badge variant={riskColors[o.riskLevel ?? 'low']}>
                    {o.riskLevel ?? 'low'}
                    {(o.openRiskFlagCount ?? 0) > 0 && ` (${o.openRiskFlagCount})`}
                  </Badge>
                </TBodyCell>
                <TBodyCell>₦{o.totalAmount.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{o.amountPaid.toLocaleString()}</TBodyCell>
                <TBodyCell>
                  <Badge variant={statusColors[o.status] ?? 'default'}>{formatOrderStatus(o.status)}</Badge>
                </TBodyCell>
                <TBodyCell><Badge variant={payoutColors[o.payoutStatus] ?? 'default'}>{o.payoutStatus}</Badge></TBodyCell>
                <TBodyCell className="text-xs">{new Date(o.createdAt).toLocaleDateString()}</TBodyCell>
                <TBodyCell>
                  <Button variant="ghost" size="sm" onClick={() => { setSelected(o); loadPayments(o.id) }}>View</Button>
                </TBodyCell>
              </TBodyRow>
            )
          })}
          {orders.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={9} className="text-center text-gray-400 py-8">No orders found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setSelected(null); setPayments([]) }}>
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">
              Order — {selected.id.slice(0, 8)}…
            </CardTitle>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Item</p>
                  <p className="font-medium">{selected.plan?.catalogItem?.name ?? '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Status</p>
                  <Badge variant={statusColors[selected.status] ?? 'default'}>{selected.status}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Total Amount</p>
                  <p className="font-medium">₦{selected.totalAmount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Amount Paid</p>
                  <p className="font-medium">₦{selected.amountPaid.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Down Payment</p>
                  <p className="font-medium">₦{selected.downPayment.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 text-xs">Balance</p>
                  <p className="font-medium text-red-600">₦{(selected.totalAmount - selected.amountPaid).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Settlement & References</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Payout Status</p>
                    <Badge variant={payoutColors[selected.payoutStatus] ?? 'default'}>{selected.payoutStatus}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Risk Level</p>
                    <Badge variant={riskColors[selected.riskLevel ?? 'low']}>
                      {selected.riskLevel ?? 'low'}
                      {selected.openRiskFlagCount ? ` (${selected.openRiskFlagCount} flags)` : ''}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Disbursement Ref</p>
                    <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{selected.disbursementReference || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Disbursed At</p>
                    <p>{selected.disbursedAt ? new Date(selected.disbursedAt).toLocaleString() : '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Settled At</p>
                    <p>{selected.settledAt ? new Date(selected.settledAt).toLocaleString() : '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Approved At</p>
                    <p>{selected.approvedAt ? new Date(selected.approvedAt).toLocaleString() : '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Provider Ref</p>
                    <p className="font-mono text-xs">{selected.providerReference || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-xs">Installments</p>
                    <p>{selected.paidInstallmentCount ?? 0} / {selected.totalInstallmentCount ?? 0} paid</p>
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Installments</h4>
                <div className="space-y-2">
                  {selected.installments?.map((inst) => {
                    const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date()
                    return (
                      <div key={inst.id} className="flex items-center justify-between rounded-lg border dark:border-gray-700 px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">₦{inst.amount.toLocaleString()}</span>
                          <span className="text-gray-500 ml-2">due {new Date(inst.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {inst.paymentReference && (
                            <span className="text-xs font-mono text-gray-400">{inst.paymentReference}</span>
                          )}
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
                      </div>
                    )
                  })}
                  {(!selected.installments || selected.installments.length === 0) && (
                    <p className="text-sm text-gray-400">No installments</p>
                  )}
                </div>
              </div>

              {/* Payment History & Webhook Status */}
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Payment History & Webhook Status</h4>
                {paymentsLoading ? (
                  <p className="text-xs text-gray-400">Loading payments…</p>
                ) : payments.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded border dark:border-gray-700 px-3 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant={p.status === 'success' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'}>{p.status}</Badge>
                          <span className="font-mono">{p.providerReference || '—'}</span>
                          <span className="text-gray-500">₦{p.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{p.provider}</span>
                          <span className="text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                          {p.status === 'failed' && (
                            <Button size="sm" variant="ghost" onClick={async () => {
                              try {
                                await api.post(`/api/v1/business-manager/webhooks/resubmit/${p.id}`)
                                alert('Webhook resubmission prepared. Use the reference to re-trigger on the provider dashboard.')
                              } catch { alert('Failed to resubmit webhook') }
                            }}>Retry</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No payment records</p>
                )}
              </div>

              <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                <h4 className="text-sm font-semibold dark:text-gray-200">Actions</h4>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reason (for audit trail)</label>
                  <input
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                    placeholder="Why is this change being made?"
                  />
                </div>

                {selected.status === 'created' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleStatus(selected.id, 'pending_payment')} disabled={saving}>
                      Approve → Pending Payment
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleStatus(selected.id, 'defaulted')} disabled={saving}>
                      Reject
                    </Button>
                  </div>
                )}

                {selected.status === 'pending_payment' && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Disbursement Reference</label>
                      <input
                        value={disburseRef}
                        onChange={(e) => setDisburseRef(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                        placeholder="e.g. REF-001"
                      />
                    </div>
                    <Button size="sm" variant="primary" onClick={handleDisburse} disabled={saving || !disburseRef}>
                      Disburse (Generate Installments)
                    </Button>
                  </div>
                )}

                {selected.status === 'disbursed' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleStatus(selected.id, 'active_repayment')} disabled={saving}>
                      Activate Repayment
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleStatus(selected.id, 'defaulted')} disabled={saving}>
                      Mark Defaulted
                    </Button>
                  </div>
                )}

                {selected.status === 'active_repayment' && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleStatus(selected.id, 'settled')} disabled={saving}>
                      Mark Settled
                    </Button>
                    <div className="w-full flex gap-2">
                      <Button size="sm" variant="secondary" onClick={async () => { await api.post('/bnpl/approvals', { requestType: 'write_off', requestData: { subscriptionId: selected.id }, reason: actionReason || 'Write-off requested' }); alert('Write-off request submitted for approval'); fetch() }} disabled={saving}>
                        Request Write-Off
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleStatus(selected.id, 'defaulted')} disabled={saving}>
                        Mark Defaulted
                      </Button>
                    </div>
                  </div>
                )}

                {selected.status === 'defaulted' && (
                  <Button size="sm" variant="primary" onClick={() => handleStatus(selected.id, 'pending_payment')} disabled={saving}>
                    Reactivate
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Button variant="ghost" className="w-full" onClick={() => { setSelected(null); setDisburseRef(''); setActionReason(''); setPayments([]) }}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}