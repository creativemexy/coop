import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'

interface OrderRow {
  id: string
  planName: string
  status: string
  totalAmount: number
  amountPaid: number
  downPayment: number
  outstanding: number
  providerReference: string | null
  disbursementReference: string | null
  payoutStatus: string
  installmentCount: number
  paidInstallments: number
  createdAt: string
  settledAt: string | null
}

interface InstallmentRow {
  id: string
  subscriptionId: string
  amount: number
  lateFeeAmount: number
  dueDate: string
  status: string
  paidAt: string | null
  paymentReference: string | null
  planName: string
  organizationId: string | null
  createdAt: string
}

interface PaymentRow {
  id: string
  subscriptionId: string | null
  amount: number
  fee: number
  provider: string
  providerReference: string
  status: string
  payoutStatus: string
  payoutReference: string | null
  createdAt: string
}

interface SettlementRow {
  id: string
  subscriptionId: string | null
  amount: number
  provider: string
  providerReference: string
  payoutReference: string | null
  payoutStatus: string
  settledAt: string
}

interface Tenant {
  id: string
  name: string
  code: string
}

type Tab = 'orders' | 'installments' | 'payments' | 'settlements'

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active_repayment: 'success',
  settled: 'info',
  defaulted: 'danger',
  disbursed: 'warning',
  pending_payment: 'warning',
  created: 'default',
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  success: 'success',
  failed: 'danger',
  completed: 'success',
}

export function BnplFinancials() {
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [installments, setInstallments] = useState<InstallmentRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [settlements, setSettlements] = useState<SettlementRow[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [orgId, setOrgId] = useState('')
  const [days, setDays] = useState('30')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/accountant/tenants').then((r) => setTenants(r.data)).catch(() => {})
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (orgId) params.set('orgId', orgId)
      if (days) params.set('days', days)
      const { data } = await api.get(`/accountant/bnpl/orders?${params}`)
      setOrders(data)
    } finally { setLoading(false) }
  }, [orgId, days])

  const fetchInstallments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (orgId) params.set('orgId', orgId)
      if (days) params.set('days', days)
      const { data } = await api.get(`/accountant/bnpl/installments?${params}`)
      setInstallments(data)
    } finally { setLoading(false) }
  }, [orgId, days])

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (orgId) params.set('orgId', orgId)
      if (days) params.set('days', days)
      const { data } = await api.get(`/accountant/bnpl/payments?${params}`)
      setPayments(data)
    } finally { setLoading(false) }
  }, [orgId, days])

  const fetchSettlements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (orgId) params.set('orgId', orgId)
      if (days) params.set('days', days)
      const { data } = await api.get(`/accountant/bnpl/settlements?${params}`)
      setSettlements(data)
    } finally { setLoading(false) }
  }, [orgId, days])

  useEffect(() => {
    if (tab === 'orders') fetchOrders()
    else if (tab === 'installments') fetchInstallments()
    else if (tab === 'payments') fetchPayments()
    else if (tab === 'settlements') fetchSettlements()
  }, [tab, fetchOrders, fetchInstallments, fetchPayments, fetchSettlements])

  const downloadCsv = (endpoint: string) => {
    const params = new URLSearchParams()
    if (orgId) params.set('orgId', orgId)
    if (days) params.set('days', days)
    window.open(`/api/v1/accountant/bnpl/${endpoint}/export?${params}`, '_blank')
  }

  const tabLabel = (t: Tab) => {
    const labels: Record<Tab, string> = { orders: 'Order Ledger', installments: 'Installment Postings', payments: 'Payment References', settlements: 'Settlement References' }
    return labels[t]
  }

  const totalOutstanding = orders.reduce((s, o) => s + o.outstanding, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold dark:text-gray-100">BNPL Financial Ledger</h2>
        <div className="flex items-center gap-3">
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="">All Tenants</option>
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
          </select>
          <Button size="sm" onClick={() => downloadCsv(tab)}>Export CSV</Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b dark:border-gray-700">
        {(['orders', 'installments', 'payments', 'settlements'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === t
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {/* KPI strip for orders */}
      {tab === 'orders' && (
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-indigo-500 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-xl font-bold dark:text-gray-100">{orders.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-500 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Volume</p>
            <p className="text-xl font-bold dark:text-gray-100">₦{orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-amber-500 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total Outstanding</p>
            <p className="text-xl font-bold text-yellow-600">₦{totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-cyan-500 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Avg Installments Paid</p>
            <p className="text-xl font-bold dark:text-gray-100">{orders.length > 0 ? (orders.reduce((s, o) => s + o.paidInstallments, 0) / orders.length).toFixed(1) : '—'}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : tab === 'orders' ? (
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>Order ID</THeadCell>
              <THeadCell>Plan</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Total</THeadCell>
              <THeadCell>Paid</THeadCell>
              <THeadCell>Outstanding</THeadCell>
              <THeadCell>Installments</THeadCell>
              <THeadCell>Provider Ref</THeadCell>
              <THeadCell>Disbursement Ref</THeadCell>
              <THeadCell>Payout</THeadCell>
              <THeadCell>Created</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {orders.map((o) => (
              <TBodyRow key={o.id}>
                <TBodyCell className="font-mono text-xs">{o.id.slice(0, 8)}</TBodyCell>
                <TBodyCell className="font-medium">{o.planName}</TBodyCell>
                <TBodyCell><Badge variant={statusColors[o.status] || 'default'}>{o.status.replace(/_/g, ' ')}</Badge></TBodyCell>
                <TBodyCell className="font-medium">₦{o.totalAmount.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{o.amountPaid.toLocaleString()}</TBodyCell>
                <TBodyCell className={o.outstanding > 0 ? 'text-yellow-600 font-medium' : ''}>₦{o.outstanding.toLocaleString()}</TBodyCell>
                <TBodyCell>{o.paidInstallments}/{o.installmentCount}</TBodyCell>
                <TBodyCell className="text-xs font-mono">{o.providerReference?.slice(0, 12) || '—'}</TBodyCell>
                <TBodyCell className="text-xs font-mono">{o.disbursementReference?.slice(0, 12) || '—'}</TBodyCell>
                <TBodyCell><Badge variant={statusColors[o.payoutStatus] || 'default'}>{o.payoutStatus}</Badge></TBodyCell>
                <TBodyCell className="text-xs">{new Date(o.createdAt).toLocaleDateString()}</TBodyCell>
              </TBodyRow>
            ))}
            {orders.length === 0 && <TBodyRow><TBodyCell colSpan={11} className="text-center text-gray-400 py-6">No order records found</TBodyCell></TBodyRow>}
          </TBody>
        </Table>
      ) : tab === 'installments' ? (
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>ID</THeadCell>
              <THeadCell>Plan</THeadCell>
              <THeadCell>Amount</THeadCell>
              <THeadCell>Late Fee</THeadCell>
              <THeadCell>Due Date</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Paid At</THeadCell>
              <THeadCell>Payment Ref</THeadCell>
              <THeadCell>Org ID</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {installments.map((i) => (
              <TBodyRow key={i.id}>
                <TBodyCell className="font-mono text-xs">{i.id.slice(0, 8)}</TBodyCell>
                <TBodyCell className="font-medium">{i.planName}</TBodyCell>
                <TBodyCell>₦{i.amount.toLocaleString()}</TBodyCell>
                <TBodyCell>{i.lateFeeAmount > 0 ? `₦${i.lateFeeAmount.toLocaleString()}` : '—'}</TBodyCell>
                <TBodyCell className="text-xs">{new Date(i.dueDate).toLocaleDateString()}</TBodyCell>
                <TBodyCell><Badge variant={statusColors[i.status] || 'default'}>{i.status}</Badge></TBodyCell>
                <TBodyCell className="text-xs">{i.paidAt ? new Date(i.paidAt).toLocaleDateString() : '—'}</TBodyCell>
                <TBodyCell className="font-mono text-xs">{i.paymentReference?.slice(0, 12) || '—'}</TBodyCell>
                <TBodyCell className="font-mono text-xs">{i.organizationId?.slice(0, 8) || '—'}</TBodyCell>
              </TBodyRow>
            ))}
            {installments.length === 0 && <TBodyRow><TBodyCell colSpan={9} className="text-center text-gray-400 py-6">No installment records found</TBodyCell></TBodyRow>}
          </TBody>
        </Table>
      ) : tab === 'payments' ? (
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>ID</THeadCell>
              <THeadCell>Subscription</THeadCell>
              <THeadCell>Amount</THeadCell>
              <THeadCell>Fee</THeadCell>
              <THeadCell>Provider</THeadCell>
              <THeadCell>Provider Ref</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Payout Status</THeadCell>
              <THeadCell>Payout Ref</THeadCell>
              <THeadCell>Date</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {payments.map((p) => (
              <TBodyRow key={p.id}>
                <TBodyCell className="font-mono text-xs">{p.id.slice(0, 8)}</TBodyCell>
                <TBodyCell className="font-mono text-xs">{p.subscriptionId?.slice(0, 8) || '—'}</TBodyCell>
                <TBodyCell className="font-medium">₦{p.amount.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{p.fee.toLocaleString()}</TBodyCell>
                <TBodyCell><Badge variant="info">{p.provider}</Badge></TBodyCell>
                <TBodyCell className="font-mono text-xs">{p.providerReference.slice(0, 16)}</TBodyCell>
                <TBodyCell><Badge variant={statusColors[p.status] || 'default'}>{p.status}</Badge></TBodyCell>
                <TBodyCell><Badge variant={statusColors[p.payoutStatus] || 'default'}>{p.payoutStatus}</Badge></TBodyCell>
                <TBodyCell className="font-mono text-xs">{p.payoutReference?.slice(0, 12) || '—'}</TBodyCell>
                <TBodyCell className="text-xs">{new Date(p.createdAt).toLocaleDateString()}</TBodyCell>
              </TBodyRow>
            ))}
            {payments.length === 0 && <TBodyRow><TBodyCell colSpan={10} className="text-center text-gray-400 py-6">No payment records found</TBodyCell></TBodyRow>}
          </TBody>
        </Table>
      ) : (
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>ID</THeadCell>
              <THeadCell>Subscription</THeadCell>
              <THeadCell>Amount</THeadCell>
              <THeadCell>Provider</THeadCell>
              <THeadCell>Provider Ref</THeadCell>
              <THeadCell>Payout Ref</THeadCell>
              <THeadCell>Payout Status</THeadCell>
              <THeadCell>Settled At</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {settlements.map((s) => (
              <TBodyRow key={s.id}>
                <TBodyCell className="font-mono text-xs">{s.id.slice(0, 8)}</TBodyCell>
                <TBodyCell className="font-mono text-xs">{s.subscriptionId?.slice(0, 8) || '—'}</TBodyCell>
                <TBodyCell className="font-medium">₦{s.amount.toLocaleString()}</TBodyCell>
                <TBodyCell><Badge variant="info">{s.provider}</Badge></TBodyCell>
                <TBodyCell className="font-mono text-xs">{s.providerReference.slice(0, 16)}</TBodyCell>
                <TBodyCell className="font-mono text-xs">{s.payoutReference?.slice(0, 12) || '—'}</TBodyCell>
                <TBodyCell><Badge variant={statusColors[s.payoutStatus] || 'default'}>{s.payoutStatus}</Badge></TBodyCell>
                <TBodyCell className="text-xs">{new Date(s.settledAt).toLocaleDateString()}</TBodyCell>
              </TBodyRow>
            ))}
            {settlements.length === 0 && <TBodyRow><TBodyCell colSpan={8} className="text-center text-gray-400 py-6">No settlement records found</TBodyCell></TBodyRow>}
          </TBody>
        </Table>
      )}
    </div>
  )
}
