import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client'
import {
  ShoppingCart, RefreshCw, Activity, MessageSquare, X, Eye, Send, Lock,
  Clock, CheckCircle2, AlertCircle, Search, Plus
} from 'lucide-react'

type Tab = 'orders' | 'repayments' | 'webhooks' | 'tickets'

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  open: { color: 'text-[#C85B23]', bg: 'bg-[#C85B23]/10', icon: Clock },
  in_progress: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: Activity },
  resolved: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: CheckCircle2 },
  closed: { color: 'text-[#6B5245]', bg: 'bg-[#6B5245]/10', icon: Lock },
  processed: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: CheckCircle2 },
  failed: { color: 'text-[#C85B23]', bg: 'bg-[#C85B23]/10', icon: AlertCircle },
  settled: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: CheckCircle2 },
  defaulted: { color: 'text-[#C85B23]', bg: 'bg-[#C85B23]/10', icon: AlertCircle },
  pending: { color: 'text-[#C85B23]', bg: 'bg-[#C85B23]/10', icon: Clock },
  paid: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: CheckCircle2 },
}

export function Support() {
  const [tab, setTab] = useState<Tab>('orders')

  // Orders
  const [orders, setOrders] = useState<any[]>([])
  const [selOrder, setSelOrder] = useState<any>(null)

  // Repayments
  const [repaymentOrderId, setRepaymentOrderId] = useState('')
  const [schedule, setSchedule] = useState<any>(null)
  const [schedLoading, setSchedLoading] = useState(false)

  // Webhook Logs
  const [webhookLogs, setWebhookLogs] = useState<any[]>([])
  const [whFilter, setWhFilter] = useState('')
  const [selWh, setSelWh] = useState<any>(null)

  // Tickets
  const [tickets, setTickets] = useState<any[]>([])
  const [ticketFilter, setTicketFilter] = useState('')
  const [newTicketModal, setNewTicketModal] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketDesc, setTicketDesc] = useState('')
  const [ticketCategory, setTicketCategory] = useState('other')
  const [ticketRelatedOrder, setTicketRelatedOrder] = useState('')

  // Ticket detail / reply
  const [selTicket, setSelTicket] = useState<any>(null)
  const [ticketMeta, setTicketMeta] = useState<any>(null)
  const [ticketMessages, setTicketMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const [saving, setSaving] = useState(false)

  /* ── Orders ── */
  const loadOrders = useCallback(async () => {
    try { const { data } = await api.get('/support/orders'); setOrders(data) } catch {}
  }, [])

  useEffect(() => { if (tab === 'orders') loadOrders() }, [tab, loadOrders])

  /* ── Repayments ── */
  const loadSchedule = useCallback(async () => {
    if (!repaymentOrderId) return; setSchedLoading(true)
    try {
      const { data } = await api.get(`/support/repayments/${repaymentOrderId}`)
      setSchedule(data)
    } catch { setSchedule(null) }
    setSchedLoading(false)
  }, [repaymentOrderId])

  /* ── Webhook Logs ── */
  const loadWebhookLogs = useCallback(async () => {
    const params: Record<string, string> = {}
    if (whFilter === 'success' || whFilter === 'failed') params.status = whFilter
    try { const { data } = await api.get('/support/webhook-logs', { params }); setWebhookLogs(data) } catch {}
  }, [whFilter])

  useEffect(() => { if (tab === 'webhooks') loadWebhookLogs() }, [tab, loadWebhookLogs])

  /* ── Tickets ── */
  const loadTickets = useCallback(async () => {
    const params: Record<string, string> = {}
    if (ticketFilter) params.status = ticketFilter
    try { const { data } = await api.get('/support/tickets', { params }); setTickets(data) } catch {}
  }, [ticketFilter])

  useEffect(() => { if (tab === 'tickets') loadTickets() }, [tab, loadTickets])

  const openTicketDetail = useCallback(async (ticket: any) => {
    setSelTicket(ticket)
    setReplyText('')
    setLoadingMessages(true)
    try {
      const { data } = await api.get(`/support/tickets/${ticket.id}/messages`)
      setTicketMeta(data.ticket ?? null)
      setTicketMessages(Array.isArray(data) ? data : data.messages ?? [])
    } catch { setTicketMeta(null); setTicketMessages([]) }
    setLoadingMessages(false)
  }, [])

  const handleSendReply = async () => {
    if (!replyText.trim() || !selTicket) return
    setSendingReply(true)
    try {
      await api.post(`/support/tickets/${selTicket.id}/messages`, { message: replyText })
      setReplyText('')
      const { data } = await api.get(`/support/tickets/${selTicket.id}/messages`)
      setTicketMeta(data.ticket ?? null)
      setTicketMessages(Array.isArray(data) ? data : data.messages ?? [])
      loadTickets()
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to send reply') }
    setSendingReply(false)
  }

  /* ── Actions ── */
  const handleResubmit = async (paymentId: string) => {
    try {
      const { data } = await api.post(`/support/webhooks/resubmit/${paymentId}`)
      alert(data.message)
    } catch (e: any) { alert(e.response?.data?.message || 'Failed') }
  }

  const handleReconcile = async () => {
    try {
      const { data } = await api.post('/support/reconciliation/trigger')
      alert(data.message)
    } catch (e: any) { alert(e.response?.data?.message || 'Failed') }
  }

  const handleCreateTicket = async () => {
    if (!ticketSubject) return; setSaving(true)
    try {
      await api.post('/support/tickets', {
        subject: ticketSubject,
        description: ticketDesc || undefined,
        category: ticketCategory,
        relatedOrderId: ticketRelatedOrder || undefined,
      })
      setNewTicketModal(false); setTicketSubject(''); setTicketDesc(''); setTicketRelatedOrder('')
      loadTickets()
    } catch (e: any) { alert(e.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const handleTicketStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/support/tickets/${id}/status`, { status })
      loadTickets()
    } catch (e: any) { alert(e.response?.data?.message || 'Failed') }
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'orders', label: 'Orders', icon: ShoppingCart },
    { key: 'repayments', label: 'Repayments', icon: RefreshCw },
    { key: 'webhooks', label: 'Webhook Logs', icon: Activity },
    { key: 'tickets', label: 'Tickets', icon: MessageSquare },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Operational Support</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5245]">
            Monitor orders, repayments, webhook logs, and manage support tickets.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#EDE2D3] pb-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              tab === key
                ? 'bg-[#176B5B] text-[#FFF9EF]'
                : 'text-[#6B5245] hover:bg-[#EDE2D3]'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ─── Orders (read-only) ─── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#D8C9A9] bg-white overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#FFF9EF]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {orders.map((o) => {
                  const statusConf = statusConfig[o.status] || statusConfig.pending
                  const StatusIcon = statusConf.icon
                  return (
                    <tr key={o.id} className="hover:bg-[#FFF9EF]/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-[#6B5245]">{o.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-sm text-[#2C1B13]">{o.plan?.catalogItem?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#2C1B13]">₦{Number(o.totalAmount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-[#6B5245]">₦{Number(o.amountPaid).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConf.color} ${statusConf.bg}`}>
                          <StatusIcon size={12} /> {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6B5245]">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelOrder(o)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B5B] hover:text-[#1a7d6a] transition-colors"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#6B5245]">No orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Order detail modal */}
          {selOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-[#2C1B13]">Order — {selOrder.id.slice(0, 8)}…</h2>
                  <button onClick={() => setSelOrder(null)} className="p-2 rounded-xl text-[#6B5245] hover:bg-[#EDE2D3] transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                      <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Item</span>
                      <p className="mt-1 font-semibold text-[#2C1B13]">{selOrder.plan?.catalogItem?.name || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                      <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Total</span>
                      <p className="mt-1 font-semibold text-[#2C1B13]">₦{Number(selOrder.totalAmount).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                      <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Paid</span>
                      <p className="mt-1 font-semibold text-[#6B5245]">₦{Number(selOrder.amountPaid).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                      <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Status</span>
                      <p className="mt-1 font-semibold text-[#2C1B13]">{selOrder.status}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">User ID</span>
                    <p className="mt-1 font-mono text-xs text-[#2C1B13]">{selOrder.userId}</p>
                  </div>
                  <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Plan</span>
                    <p className="mt-1 text-[#2C1B13]">{selOrder.plan?.name || selOrder.planId?.slice(0, 8)}</p>
                  </div>
                  <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Created</span>
                    <p className="mt-1 text-[#2C1B13]">{new Date(selOrder.createdAt).toLocaleString()}</p>
                  </div>
                  {selOrder.disbursementReference && (
                    <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                      <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Disbursement Ref</span>
                      <p className="mt-1 text-[#2C1B13]">{selOrder.disbursementReference}</p>
                    </div>
                  )}
                  {selOrder.settledAt && (
                    <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                      <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Settled</span>
                      <p className="mt-1 text-[#2C1B13]">{new Date(selOrder.settledAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-[#2C1B13] mb-3">Installments</h4>
                  <div className="space-y-2">
                    {(selOrder.installments || []).map((inst: any) => {
                      const instStatusConf = statusConfig[inst.status] || statusConfig.pending
                      const InstStatusIcon = instStatusConf.icon
                      return (
                        <div key={inst.id} className="flex justify-between items-center rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-2">
                          <span className="text-sm text-[#2C1B13]">₦{Number(inst.amount).toLocaleString()} due {new Date(inst.dueDate).toLocaleDateString()}</span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${instStatusConf.color} ${instStatusConf.bg}`}>
                            <InstStatusIcon size={12} /> {inst.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <button onClick={() => setSelOrder(null)} className="mt-4 w-full rounded-full border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B5245] hover:bg-[#EDE2D3] transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Repayments (read-only) ─── */}
      {tab === 'repayments' && (
        <div className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">Order ID</label>
              <input
                type="text"
                value={repaymentOrderId}
                onChange={(e) => setRepaymentOrderId(e.target.value)}
                placeholder="Enter order ID"
                className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm text-[#2C1B13] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
              />
            </div>
            <button
              onClick={loadSchedule}
              disabled={!repaymentOrderId || schedLoading}
              className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
            >
              <Search size={16} /> View Schedule
            </button>
          </div>

          {schedule && (
            <div className="rounded-2xl border border-[#D8C9A9] bg-white p-6">
              <h3 className="text-sm font-bold text-[#2C1B13] mb-4">Repayment Schedule</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                  <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Total</span>
                  <p className="mt-1 font-semibold text-[#2C1B13]">₦{schedule.totalAmount.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                  <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Paid</span>
                  <p className="mt-1 font-semibold text-[#176B5B]">₦{schedule.amountPaid.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                  <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Outstanding</span>
                  <p className="mt-1 font-semibold text-[#C85B23]">₦{schedule.outstanding.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-3">
                  <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Status</span>
                  <p className="mt-1 font-semibold text-[#2C1B13]">{schedule.status}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#D8C9A9] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#FFF9EF]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Paid At</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE2D3]">
                    {schedule.installments.map((inst: any) => {
                      const instStatusConf = statusConfig[inst.isOverdue ? 'failed' : inst.status] || statusConfig.pending
                      const InstStatusIcon = instStatusConf.icon
                      return (
                        <tr key={inst.id} className="hover:bg-[#FFF9EF]/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-[#2C1B13]">{new Date(inst.dueDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-[#2C1B13]">
                            ₦{inst.amount.toLocaleString()}
                            {inst.lateFee > 0 && <span className="text-[#C85B23] text-xs ml-1">+₦{inst.lateFee}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${instStatusConf.color} ${instStatusConf.bg}`}>
                              <InstStatusIcon size={12} /> {inst.isOverdue ? 'late' : inst.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#6B5245]">{inst.paidAt ? new Date(inst.paidAt).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3 text-xs font-mono text-[#6B5245]">{inst.paymentReference || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Webhook Logs ─── */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {['', 'processed', 'failed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setWhFilter(s)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    whFilter === s
                      ? 'bg-[#176B5B] text-[#FFF9EF]'
                      : 'text-[#6B5245] hover:bg-[#EDE2D3]'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
            <button
              onClick={handleReconcile}
              className="inline-flex items-center gap-2 rounded-full border border-[#176B5B] bg-[#176B5B]/10 px-4 py-2 text-sm font-semibold text-[#176B5B] hover:bg-[#176B5B]/20 transition-colors"
            >
              <RefreshCw size={16} /> Trigger Reconciliation
            </button>
          </div>

          <div className="rounded-2xl border border-[#D8C9A9] bg-white overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#FFF9EF]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Payment ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Retries</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {webhookLogs.map((wl) => {
                  const statusConf = statusConfig[wl.status] || statusConfig.pending
                  const StatusIcon = statusConf.icon
                  return (
                    <tr key={wl.id} className="hover:bg-[#FFF9EF]/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-[#6B5245]">{new Date(wl.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3"><code className="text-xs text-[#2C1B13]">{wl.eventType}</code></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConf.color} ${statusConf.bg}`}>
                          <StatusIcon size={12} /> {wl.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-[#6B5245]">{wl.paymentId?.slice(0, 12) || '—'}…</td>
                      <td className="px-4 py-3 text-sm text-[#2C1B13]">{wl.retryCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelWh(wl)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B5B] hover:text-[#1a7d6a] transition-colors"
                          >
                            <Eye size={14} /> Payload
                          </button>
                          {wl.paymentId && wl.status === 'failed' && (
                            <button
                              onClick={() => handleResubmit(wl.paymentId)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C85B23] hover:text-[#D66A2D] transition-colors"
                            >
                              <RefreshCw size={14} /> Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {webhookLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#6B5245]">No webhook logs</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selWh && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#2C1B13]">Webhook Payload</h2>
                  <button onClick={() => setSelWh(null)} className="p-2 rounded-xl text-[#6B5245] hover:bg-[#EDE2D3] transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <pre className="text-xs bg-[#FFF9EF] rounded-xl p-4 max-h-96 overflow-y-auto whitespace-pre-wrap text-[#2C1B13]">
                  {JSON.stringify(selWh.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tickets ─── */}
      {tab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setTicketFilter(s)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    ticketFilter === s
                      ? 'bg-[#176B5B] text-[#FFF9EF]'
                      : 'text-[#6B5245] hover:bg-[#EDE2D3]'
                  }`}
                >
                  {s === 'in_progress' ? 'In Progress' : s || 'All'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setNewTicketModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a]"
            >
              <Plus size={16} /> New Ticket
            </button>
          </div>

          <div className="rounded-2xl border border-[#D8C9A9] bg-white overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#FFF9EF]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Sent By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B5245] uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {tickets.map((t) => {
                  const statusConf = statusConfig[t.status] || statusConfig.pending
                  const StatusIcon = statusConf.icon
                  return (
                    <tr key={t.id} className="hover:bg-[#FFF9EF]/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#2C1B13] max-w-[200px] truncate">{t.subject}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#2C1B13]">{t.senderName || 'Unknown'}</span>
                          {t.senderEmail && <span className="text-xs text-[#6B5245]">{t.senderEmail}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-[#176B5B] bg-[#176B5B]/10">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConf.color} ${statusConf.bg}`}>
                          <StatusIcon size={12} /> {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-[#6B5245]">{t.relatedOrderId?.slice(0, 8) || '—'}…</td>
                      <td className="px-4 py-3 text-xs text-[#6B5245]">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={t.status}
                          onChange={(e) => handleTicketStatus(t.id, e.target.value)}
                          className="text-xs rounded-xl border border-[#D8C9A9] bg-white px-3 py-1.5 text-[#2C1B13] focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openTicketDetail(t)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B5B] hover:text-[#1a7d6a] transition-colors"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#6B5245]">No tickets</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#2C1B13]">{selTicket.subject || 'Ticket'}</h2>
              <button onClick={() => setSelTicket(null)} className="p-2 rounded-xl text-[#6B5245] hover:bg-[#EDE2D3] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[ticketMeta?.status || selTicket.status]?.color} ${statusConfig[ticketMeta?.status || selTicket.status]?.bg}`}>
                  {ticketMeta?.status || selTicket.status}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-[#176B5B] bg-[#176B5B]/10">
                  {selTicket.category}
                </span>
                <span className="text-xs text-[#6B5245]">{new Date(selTicket.createdAt).toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#176B5B] text-sm font-bold text-[#FFF9EF]">
                  {(selTicket.senderName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[#2C1B13]">{selTicket.senderName || 'Unknown'}</span>
                  <span className="text-xs text-[#6B5245]">{selTicket.senderEmail || 'No email'}</span>
                </div>
              </div>

              {(ticketMeta?.description ?? selTicket.description) && (
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4 text-sm">
                  <p className="text-xs font-semibold text-[#6B5245] mb-1">Initial description:</p>
                  <p className="text-[#2C1B13]">{ticketMeta?.description ?? selTicket.description}</p>
                </div>
              )}
              {(ticketMeta?.resolutionNote ?? selTicket.resolutionNote) && (
                <div className="rounded-xl border border-[#176B5B]/30 bg-[#176B5B]/10 p-4 text-sm">
                  <p className="text-xs font-semibold text-[#176B5B] mb-1">Resolution note:</p>
                  <p className="text-[#176B5B]">{ticketMeta?.resolutionNote ?? selTicket.resolutionNote}</p>
                </div>
              )}

              <div className="border-t border-[#EDE2D3] pt-4">
                <h4 className="text-sm font-bold text-[#2C1B13] mb-3">Conversation</h4>
                {loadingMessages ? (
                  <p className="text-xs text-[#6B5245]">Loading messages...</p>
                ) : ticketMessages.length === 0 ? (
                  <p className="text-xs text-[#6B5245]">No replies yet.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {ticketMessages.map((m) => {
                      const fromSupport = m.senderRole === 'super_admin' || m.senderRole === 'customer_care'
                      return (
                        <div key={m.id} className={`flex ${fromSupport ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                            fromSupport
                              ? 'bg-[#176B5B] text-[#FFF9EF]'
                              : 'bg-[#EDE2D3] text-[#2C1B13]'
                          }`}>
                            <p>{m.message}</p>
                            <p className="text-[10px] mt-1 opacity-70">
                              {m.senderName || (fromSupport ? 'Support' : 'Member')} · {new Date(m.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {(ticketMeta?.status === 'open' || ticketMeta?.status === 'in_progress' || selTicket.status === 'open' || selTicket.status === 'in_progress') ? (
                <div className="border-t border-[#EDE2D3] pt-4">
                  <h4 className="text-sm font-bold text-[#2C1B13] mb-2">Reply</h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-3 text-sm text-[#2C1B13] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                    placeholder="Type your reply..."
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
                  >
                    <Send size={16} /> {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-[#EDE2D3] px-4 py-3 text-sm text-[#6B5245]">
                  <Lock size={16} />
                  This ticket is {ticketMeta?.status || selTicket.status} and is read-only.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {newTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#2C1B13]">Create Internal Ticket</h2>
              <button onClick={() => setNewTicketModal(false)} className="p-2 rounded-xl text-[#6B5245] hover:bg-[#EDE2D3] transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">Subject</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm text-[#2C1B13] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm text-[#2C1B13] focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                >
                  <option value="order_inquiry">Order Inquiry</option>
                  <option value="repayment_issue">Repayment Issue</option>
                  <option value="technical_glitch">Technical Glitch</option>
                  <option value="reconciliation">Reconciliation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">Description</label>
                <textarea
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  rows={3}
                  placeholder="Enter description"
                  className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-3 text-sm text-[#2C1B13] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C1B13] mb-1.5">Related Order ID (optional)</label>
                <input
                  type="text"
                  value={ticketRelatedOrder}
                  onChange={(e) => setTicketRelatedOrder(e.target.value)}
                  placeholder="Enter order ID"
                  className="w-full rounded-xl border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm text-[#2C1B13] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
                />
              </div>
              <button
                onClick={handleCreateTicket}
                disabled={saving || !ticketSubject}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
