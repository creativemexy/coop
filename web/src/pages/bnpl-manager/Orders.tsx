import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import {
  Badge,
  Btn,
  EmptyRow,
  Modal,
  PageHeader,
  Panel,
  Select,
  Table,
  TBody,
  TBodyCell,
  TBodyRow,
  THead,
  THeadCell,
  THeadRow,
  TextInput,
  inputCls,
} from '../../components/ui/warm'

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

const fmt = (n: number) => `₦${n.toLocaleString()}`

function titleCase(s: string) {
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B79B6B]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[#2C1B13]">{children}</p>
    </div>
  )
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

  const totals = orders.reduce(
    (acc, o) => ({ total: acc.total + Number(o.totalAmount || 0), paid: acc.paid + Number(o.amountPaid || 0), balance: acc.balance + (Number(o.totalAmount || 0) - Number(o.amountPaid || 0)) }),
    { total: 0, paid: 0, balance: 0 },
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="BNPL Operations"
        title="Orders Management"
        subtitle="Every buy-now-pay-later order, from deposit to settlement."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Orders</p>
          <p className="mt-3 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{orders.length}</p>
          <p className="mt-1 text-sm text-[#6B5245]">matching filters</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Total Volume</p>
          <p className="mt-3 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{fmt(totals.total)}</p>
          <p className="mt-1 text-sm text-[#6B5245]">ordered goods</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Collected</p>
          <p className="mt-3 text-2xl font-black tracking-[-0.02em] text-[#176B5B]">{fmt(totals.paid)}</p>
          <p className="mt-1 text-sm text-[#6B5245]">repaid to date</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Outstanding</p>
          <p className="mt-3 text-2xl font-black tracking-[-0.02em] text-[#B3261E]">{fmt(totals.balance)}</p>
          <p className="mt-1 text-sm text-[#6B5245]">still to be repaid</p>
        </div>
      </div>

      <Panel title="Filters" subtitle="Narrow the order list" bodyClassName="p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <TextInput placeholder="Search product…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="md:col-span-2" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </Select>
          <Select value={payoutFilter} onChange={(e) => setPayoutFilter(e.target.value)}>
            <option value="">All settlement</option>
            {payoutOptions.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </Select>
          <Select value={tenorFilter} onChange={(e) => setTenorFilter(e.target.value)}>
            <option value="">All tenors</option>
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} aria-label="From date" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} aria-label="To date" />
          </div>
        </div>
      </Panel>

      <Panel padded={false}>
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
                    <div className="font-semibold text-[#2C1B13]">{o.plan?.catalogItem?.name ?? '—'}</div>
                    <div className="text-xs text-[#6B5245]">{tenorLabel}</div>
                  </TBodyCell>
                  <TBodyCell>
                    <Badge variant={riskColors[o.riskLevel ?? 'low']} dot>
                      {o.riskLevel ?? 'low'}
                      {(o.openRiskFlagCount ?? 0) > 0 && ` (${o.openRiskFlagCount})`}
                    </Badge>
                  </TBodyCell>
                  <TBodyCell className="font-semibold text-[#2C1B13]">{fmt(o.totalAmount)}</TBodyCell>
                  <TBodyCell>{fmt(o.amountPaid)}</TBodyCell>
                  <TBodyCell>
                    <Badge variant={statusColors[o.status] ?? 'default'} dot>{titleCase(o.status)}</Badge>
                  </TBodyCell>
                  <TBodyCell><Badge variant={payoutColors[o.payoutStatus] ?? 'default'} dot>{o.payoutStatus}</Badge></TBodyCell>
                  <TBodyCell className="text-xs">{new Date(o.createdAt).toLocaleDateString()}</TBodyCell>
                  <TBodyCell>
                    <Btn variant="ghost" size="sm" onClick={() => { setSelected(o); loadPayments(o.id) }}>View</Btn>
                  </TBodyCell>
                </TBodyRow>
              )
            })}
            {orders.length === 0 && <EmptyRow colSpan={9}>No orders found</EmptyRow>}
          </TBody>
        </Table>
      </Panel>

      <Modal open={!!selected} onClose={() => { setSelected(null); setPayments([]); setDisburseRef(''); setActionReason('') }} title={selected ? `Order — ${selected.id.slice(0, 8)}…` : ''} className="max-w-3xl">
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black text-[#2C1B13]">{selected.plan?.catalogItem?.name ?? '—'}</p>
              <Badge variant={statusColors[selected.status] ?? 'default'} dot>{titleCase(selected.status)}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <InfoField label="Total Amount">{fmt(selected.totalAmount)}</InfoField>
              <InfoField label="Amount Paid"><span className="text-[#176B5B]">{fmt(selected.amountPaid)}</span></InfoField>
              <InfoField label="Balance"><span className="text-[#B3261E]">{fmt(selected.totalAmount - selected.amountPaid)}</span></InfoField>
              <InfoField label="Down Payment">{fmt(selected.downPayment)}</InfoField>
              <InfoField label="Payout Status"><Badge variant={payoutColors[selected.payoutStatus] ?? 'default'}>{selected.payoutStatus}</Badge></InfoField>
              <InfoField label="Risk Level">
                <Badge variant={riskColors[selected.riskLevel ?? 'low']}>
                  {selected.riskLevel ?? 'low'}
                  {selected.openRiskFlagCount ? ` (${selected.openRiskFlagCount} flags)` : ''}
                </Badge>
              </InfoField>
              <InfoField label="Disbursement Ref">
                <code className="rounded-md bg-[#FFF9EF] px-1.5 py-0.5 text-xs font-mono text-[#6B5245]">{selected.disbursementReference || '—'}</code>
              </InfoField>
              <InfoField label="Provider Ref">
                <span className="font-mono text-xs text-[#6B5245]">{selected.providerReference || '—'}</span>
              </InfoField>
              <InfoField label="Installments">{selected.paidInstallmentCount ?? 0} / {selected.totalInstallmentCount ?? 0} paid</InfoField>
              <InfoField label="Disbursed At">{selected.disbursedAt ? new Date(selected.disbursedAt).toLocaleString() : '—'}</InfoField>
              <InfoField label="Settled At">{selected.settledAt ? new Date(selected.settledAt).toLocaleString() : '—'}</InfoField>
              <InfoField label="Approved At">{selected.approvedAt ? new Date(selected.approvedAt).toLocaleString() : '—'}</InfoField>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#E7DCCB]">
              <div className="border-b border-[#EDE2D3] bg-[#FFF9EF] px-5 py-3">
                <p className="text-sm font-black tracking-[-0.01em] text-[#2C1B13]">Installments</p>
              </div>
              <div className="space-y-2 p-4">
                {selected.installments?.map((inst) => {
                  const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date()
                  return (
                    <div key={inst.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-3 text-sm">
                      <div>
                        <span className="font-bold text-[#2C1B13]">{fmt(inst.amount)}</span>
                        <span className="ml-2 text-[#6B5245]">due {new Date(inst.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {inst.paymentReference && (
                          <span className="font-mono text-xs text-[#6B5245]">{inst.paymentReference}</span>
                        )}
                        <Badge variant={inst.status === 'paid' ? 'success' : isOverdue ? 'danger' : 'warning'} dot>
                          {isOverdue && inst.status === 'pending' ? 'overdue' : inst.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
                {(!selected.installments || selected.installments.length === 0) && (
                  <p className="text-sm text-[#C9B89F]">No installments</p>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#E7DCCB]">
              <div className="border-b border-[#EDE2D3] bg-[#FFF9EF] px-5 py-3">
                <p className="text-sm font-black tracking-[-0.01em] text-[#2C1B13]">Payment History & Webhook Status</p>
              </div>
              <div className="max-h-48 space-y-1.5 overflow-y-auto p-4">
                {paymentsLoading ? (
                  <p className="text-xs text-[#C9B89F]">Loading payments…</p>
                ) : payments.length > 0 ? (
                  payments.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#EDE2D3] px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === 'success' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'} dot>{p.status}</Badge>
                        <span className="font-mono text-[#6B5245]">{p.providerReference || '—'}</span>
                        <span className="text-[#6B5245]">{fmt(p.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#C9B89F]">{p.provider}</span>
                        <span className="text-[#C9B89F]">{new Date(p.createdAt).toLocaleDateString()}</span>
                        {p.status === 'failed' && (
                          <Btn size="sm" variant="secondary" onClick={async () => {
                            try {
                              await api.post(`/api/v1/business-manager/webhooks/resubmit/${p.id}`)
                              alert('Webhook resubmission prepared. Use the reference to re-trigger on the provider dashboard.')
                            } catch { alert('Failed to resubmit webhook') }
                          }}>Retry</Btn>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#C9B89F]">No payment records</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">Reason (for audit trail)</p>
                <TextInput value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Why is this change being made?" />
              </div>

              {selected.status === 'created' && (
                <div className="flex flex-wrap gap-2">
                  <Btn size="sm" onClick={() => handleStatus(selected.id, 'pending_payment')} disabled={saving}>Approve → Pending Payment</Btn>
                  <Btn size="sm" variant="secondary" onClick={() => handleStatus(selected.id, 'defaulted')} disabled={saving}>Reject</Btn>
                </div>
              )}

              {selected.status === 'pending_payment' && (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[200px] flex-1">
                    <TextInput label="Disbursement Reference" value={disburseRef} onChange={(e) => setDisburseRef(e.target.value)} placeholder="e.g. REF-001" />
                  </div>
                  <Btn size="sm" onClick={handleDisburse} disabled={saving || !disburseRef}>Disburse (Generate Installments)</Btn>
                </div>
              )}

              {selected.status === 'disbursed' && (
                <div className="flex flex-wrap gap-2">
                  <Btn size="sm" onClick={() => handleStatus(selected.id, 'active_repayment')} disabled={saving}>Activate Repayment</Btn>
                  <Btn size="sm" variant="secondary" onClick={() => handleStatus(selected.id, 'defaulted')} disabled={saving}>Mark Defaulted</Btn>
                </div>
              )}

              {selected.status === 'active_repayment' && (
                <div className="flex flex-wrap gap-2">
                  <Btn size="sm" onClick={() => handleStatus(selected.id, 'settled')} disabled={saving}>Mark Settled</Btn>
                  <Btn size="sm" variant="secondary" onClick={async () => { await api.post('/bnpl/approvals', { requestType: 'write_off', requestData: { subscriptionId: selected.id }, reason: actionReason || 'Write-off requested' }); alert('Write-off request submitted for approval'); fetch() }} disabled={saving}>
                    Request Write-Off
                  </Btn>
                  <Btn size="sm" variant="secondary" onClick={() => handleStatus(selected.id, 'defaulted')} disabled={saving}>Mark Defaulted</Btn>
                </div>
              )}

              {selected.status === 'defaulted' && (
                <Btn size="sm" onClick={() => handleStatus(selected.id, 'pending_payment')} disabled={saving}>Reactivate</Btn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}