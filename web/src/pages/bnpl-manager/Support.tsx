import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/modal'
import { useTicketStream } from '../../hooks/useTicketStream'
import type { TicketStreamEvent } from '../../hooks/useTicketStream'

type Tab = 'orders' | 'repayments' | 'webhooks' | 'tickets'

const statusColors: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  open: 'warning', in_progress: 'info', resolved: 'success', closed: 'info',
  processed: 'success', failed: 'danger',
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

  useTicketStream(
    'support/tickets/stream',
    useCallback(() => { if (tab === 'tickets') loadTickets() }, [tab, loadTickets]),
  )

  const loadTicketDetail = useCallback(async (ticket: any) => {
    try {
      const { data } = await api.get(`/support/tickets/${ticket.id}/messages`)
      setTicketMeta(data.ticket ?? null)
      setTicketMessages(Array.isArray(data) ? data : data.messages ?? [])
    } catch { /* keep last known */ }
  }, [])

  useTicketStream(
    selTicket ? `support/tickets/${selTicket.id}/stream` : null,
    useCallback((ev: TicketStreamEvent) => {
      if (!selTicket) return
      if (ev.type === 'status') {
        setTickets((prev) => prev.map((t) => (t.id === selTicket.id ? { ...t, status: ev.status || t.status } : t)))
        setTicketMeta((prev: any) => (prev ? { ...prev, status: ev.status || prev.status } : prev))
        return
      }
      void loadTicketDetail(selTicket)
    }, [selTicket, loadTicketDetail]),
  )

  /* ── Ticket Detail / Reply ── */
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Operational Support</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        {([['orders', 'Orders'], ['repayments', 'Repayments'], ['webhooks', 'Webhook Logs'], ['tickets', 'Tickets']] as [Tab, string][]).map(([k, v]) => (
          <Button key={k} variant={tab === k ? 'primary' : 'ghost'} size="sm" onClick={() => setTab(k)}>{v}</Button>
        ))}
      </div>

      {/* ─── Orders (read-only) ─── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <Table>
            <THead><THeadRow>
              <THeadCell>ID</THeadCell>
              <THeadCell>Item</THeadCell>
              <THeadCell>Total</THeadCell>
              <THeadCell>Paid</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Created</THeadCell>
              <THeadCell />
            </THeadRow></THead>
            <TBody>
              {orders.map((o) => (
                <TBodyRow key={o.id}>
                  <TBodyCell className="text-xs font-mono">{o.id.slice(0, 8)}…</TBodyCell>
                  <TBodyCell>{o.plan?.catalogItem?.name || '—'}</TBodyCell>
                  <TBodyCell>₦{Number(o.totalAmount).toLocaleString()}</TBodyCell>
                  <TBodyCell>₦{Number(o.amountPaid).toLocaleString()}</TBodyCell>
                  <TBodyCell><Badge variant={o.status === 'settled' ? 'success' : o.status === 'defaulted' ? 'danger' : 'warning'}>{o.status}</Badge></TBodyCell>
                  <TBodyCell className="text-xs">{new Date(o.createdAt).toLocaleDateString()}</TBodyCell>
                  <TBodyCell><Button variant="ghost" size="sm" onClick={() => setSelOrder(o)}>View</Button></TBodyCell>
                </TBodyRow>
              ))}
              {orders.length === 0 && <TBodyRow><TBodyCell colSpan={7} className="text-center py-4 text-gray-400">No orders</TBodyCell></TBodyRow>}
            </TBody>
          </Table>

          {/* Order detail modal */}
          {selOrder && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelOrder(null)}>
              <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">Order — {selOrder.id.slice(0, 8)}…</CardTitle>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Item:</span> {selOrder.plan?.catalogItem?.name || '—'}</p>
                  <p><span className="text-gray-500">Total:</span> ₦{Number(selOrder.totalAmount).toLocaleString()}</p>
                  <p><span className="text-gray-500">Paid:</span> ₦{Number(selOrder.amountPaid).toLocaleString()}</p>
                  <p><span className="text-gray-500">Status:</span> <Badge variant={selOrder.status === 'settled' ? 'success' : 'warning'}>{selOrder.status}</Badge></p>
                  <p><span className="text-gray-500">User ID:</span> <span className="font-mono text-xs">{selOrder.userId}</span></p>
                  <p><span className="text-gray-500">Plan:</span> {selOrder.plan?.name || selOrder.planId?.slice(0, 8)}</p>
                  <p><span className="text-gray-500">Created:</span> {new Date(selOrder.createdAt).toLocaleString()}</p>
                  {selOrder.disbursementReference && <p><span className="text-gray-500">Disbursement Ref:</span> {selOrder.disbursementReference}</p>}
                  {selOrder.settledAt && <p><span className="text-gray-500">Settled:</span> {new Date(selOrder.settledAt).toLocaleString()}</p>}
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Installments</h4>
                  {(selOrder.installments || []).map((inst: any) => (
                    <div key={inst.id} className="flex justify-between text-xs border-b dark:border-gray-700 py-1">
                      <span>₦{Number(inst.amount).toLocaleString()} due {new Date(inst.dueDate).toLocaleDateString()}</span>
                      <Badge variant={inst.status === 'paid' ? 'success' : 'warning'}>{inst.status}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4" onClick={() => setSelOrder(null)}>Close</Button>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ─── Repayments (read-only) ─── */}
      {tab === 'repayments' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <Input id="ro-search" label="Order ID" value={repaymentOrderId} onChange={(e) => setRepaymentOrderId(e.target.value)} />
            <Button onClick={loadSchedule} disabled={!repaymentOrderId || schedLoading}>View Schedule</Button>
          </div>

          {schedule && (
            <Card>
              <CardTitle className="text-sm">Repayment Schedule</CardTitle>
              <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Total</span><p className="font-semibold">₦{schedule.totalAmount.toLocaleString()}</p></div>
                <div><span className="text-gray-500">Paid</span><p className="font-semibold text-green-600">₦{schedule.amountPaid.toLocaleString()}</p></div>
                <div><span className="text-gray-500">Outstanding</span><p className="font-semibold text-red-600">₦{schedule.outstanding.toLocaleString()}</p></div>
                <div><span className="text-gray-500">Status</span><Badge>{schedule.status}</Badge></div>
              </div>

              <Table>
                <THead><THeadRow>
                  <THeadCell>Due Date</THeadCell>
                  <THeadCell>Amount</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell>Paid At</THeadCell>
                  <THeadCell>Reference</THeadCell>
                </THeadRow></THead>
                <TBody>
                  {schedule.installments.map((inst: any) => (
                    <TBodyRow key={inst.id}>
                      <TBodyCell>{new Date(inst.dueDate).toLocaleDateString()}</TBodyCell>
                      <TBodyCell>₦{inst.amount.toLocaleString()}{inst.lateFee > 0 && <span className="text-red-500 text-xs ml-1">+₦{inst.lateFee}</span>}</TBodyCell>
                      <TBodyCell><Badge variant={inst.isOverdue ? 'danger' : inst.status === 'paid' ? 'success' : 'warning'}>{inst.isOverdue ? 'late' : inst.status}</Badge></TBodyCell>
                      <TBodyCell className="text-xs">{inst.paidAt ? new Date(inst.paidAt).toLocaleDateString() : '—'}</TBodyCell>
                      <TBodyCell className="text-xs font-mono">{inst.paymentReference || '—'}</TBodyCell>
                    </TBodyRow>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* ─── Webhook Logs ─── */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {['', 'processed', 'failed'].map((s) => (
                <Button key={s} variant={whFilter === s ? 'primary' : 'ghost'} size="sm" onClick={() => setWhFilter(s)}>
                  {s || 'All'}
                </Button>
              ))}
            </div>
            <Button variant="secondary" size="sm" onClick={handleReconcile}>Trigger Reconciliation</Button>
          </div>

          <Table>
            <THead><THeadRow>
              <THeadCell>Date</THeadCell>
              <THeadCell>Event</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Payment ID</THeadCell>
              <THeadCell>Retries</THeadCell>
              <THeadCell />
            </THeadRow></THead>
            <TBody>
              {webhookLogs.map((wl) => (
                <TBodyRow key={wl.id}>
                  <TBodyCell className="text-xs">{new Date(wl.createdAt).toLocaleString()}</TBodyCell>
                  <TBodyCell><code className="text-xs">{wl.eventType}</code></TBodyCell>
                  <TBodyCell><Badge variant={statusColors[wl.status] || 'warning'}>{wl.status}</Badge></TBodyCell>
                  <TBodyCell className="text-xs font-mono">{wl.paymentId?.slice(0, 12) || '—'}…</TBodyCell>
                  <TBodyCell>{wl.retryCount}</TBodyCell>
                  <TBodyCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelWh(wl)}>Payload</Button>
                      {wl.paymentId && wl.status === 'failed' && (
                        <Button variant="ghost" size="sm" onClick={() => handleResubmit(wl.paymentId)}>Resubmit</Button>
                      )}
                    </div>
                  </TBodyCell>
                </TBodyRow>
              ))}
              {webhookLogs.length === 0 && <TBodyRow><TBodyCell colSpan={6} className="text-center py-4 text-gray-400">No webhook logs</TBodyCell></TBodyRow>}
            </TBody>
          </Table>

          {selWh && (
            <Modal open={!!selWh} onClose={() => setSelWh(null)} title="Webhook Payload">
              <pre className="text-xs bg-gray-50 dark:bg-gray-800 rounded p-3 max-h-96 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(selWh.payload, null, 2)}
              </pre>
            </Modal>
          )}
        </div>
      )}

      {/* ─── Tickets ─── */}
      {tab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
                <Button key={s} variant={ticketFilter === s ? 'primary' : 'ghost'} size="sm" onClick={() => setTicketFilter(s)}>
                  {s === 'in_progress' ? 'In Progress' : s || 'All'}
                </Button>
              ))}
            </div>
            <Button onClick={() => setNewTicketModal(true)}>New Ticket</Button>
          </div>

          <Table>
            <THead><THeadRow>
              <THeadCell>Subject</THeadCell>
              <THeadCell>Sent By</THeadCell>
              <THeadCell>Category</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Order</THeadCell>
              <THeadCell>Created</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell />
            </THeadRow></THead>
            <TBody>
              {tickets.map((t) => (
                <TBodyRow key={t.id}>
                  <TBodyCell className="font-medium max-w-[200px] truncate">{t.subject}</TBodyCell>
                  <TBodyCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">{t.senderName || 'Unknown'}</span>
                      {t.senderEmail && <span className="text-xs text-gray-400">{t.senderEmail}</span>}
                    </div>
                  </TBodyCell>
                  <TBodyCell><Badge variant="info">{t.category}</Badge></TBodyCell>
                  <TBodyCell><Badge variant={statusColors[t.status] || 'warning'}>{t.status}</Badge></TBodyCell>
                  <TBodyCell className="text-xs font-mono">{t.relatedOrderId?.slice(0, 8) || '—'}…</TBodyCell>
                  <TBodyCell className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</TBodyCell>
                  <TBodyCell>
                    <select
                      value={t.status}
                      onChange={(e) => handleTicketStatus(t.id, e.target.value)}
                      className="text-xs rounded border dark:border-gray-700 dark:bg-gray-800 px-1 py-0.5"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </TBodyCell>
                  <TBodyCell>
                    <Button variant="ghost" size="sm" onClick={() => openTicketDetail(t)}>View</Button>
                  </TBodyCell>
                </TBodyRow>
              ))}
              {tickets.length === 0 && <TBodyRow><TBodyCell colSpan={8} className="text-center py-4 text-gray-400">No tickets</TBodyCell></TBodyRow>}
            </TBody>
          </Table>
        </div>
      )}

      {/* Ticket Detail Modal */}
      <Modal open={!!selTicket} onClose={() => setSelTicket(null)} title={selTicket?.subject || 'Ticket'}>
        {selTicket && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={statusColors[ticketMeta?.status || selTicket.status] || 'warning'}>{ticketMeta?.status || selTicket.status}</Badge>
              <Badge variant="info">{selTicket.category}</Badge>
              <span className="text-xs text-gray-400">{new Date(selTicket.createdAt).toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                {(selTicket.senderName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold dark:text-gray-100">{selTicket.senderName || 'Unknown'}</span>
                <span className="text-xs text-gray-400">{selTicket.senderEmail || 'No email'}</span>
              </div>
            </div>

            {(ticketMeta?.description ?? selTicket.description) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                <p className="text-xs text-gray-500 mb-1">Initial description:</p>
                <p className="text-gray-700 dark:text-gray-200">{ticketMeta?.description ?? selTicket.description}</p>
              </div>
            )}
            {(ticketMeta?.resolutionNote ?? selTicket.resolutionNote) && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-sm">
                <p className="text-xs text-green-600 mb-1">Resolution note:</p>
                <p className="text-green-700 dark:text-green-300">{ticketMeta?.resolutionNote ?? selTicket.resolutionNote}</p>
              </div>
            )}

            <div className="border-t dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold mb-3 dark:text-gray-200">Conversation</h4>
              {loadingMessages ? (
                <p className="text-xs text-gray-400">Loading messages...</p>
              ) : ticketMessages.length === 0 ? (
                <p className="text-xs text-gray-400">No replies yet.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {ticketMessages.map((m) => {
                    const fromSupport = m.senderRole === 'super_admin' || m.senderRole === 'customer_care'
                    return (
                      <div key={m.id} className={`flex ${fromSupport ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          fromSupport
                            ? 'bg-teal-700 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          <p>{m.message}</p>
                          <p className={`text-[10px] mt-1 opacity-70 ${fromSupport ? '' : 'dark:text-gray-400'}`}>
                            {m.senderName || (fromSupport ? 'Support' : 'Member')} &middot; {new Date(m.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {(ticketMeta?.status === 'open' || ticketMeta?.status === 'in_progress' || selTicket.status === 'open' || selTicket.status === 'in_progress') ? (
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Reply</h4>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                  placeholder="Type your reply..."
                />
                <Button className="mt-2 w-full bg-teal-700 hover:bg-teal-800" onClick={handleSendReply} disabled={sendingReply || !replyText.trim()}>
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                This ticket is {ticketMeta?.status || selTicket.status} and is read-only.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* New Ticket Modal */}
      <Modal open={newTicketModal} onClose={() => setNewTicketModal(false)} title="Create Internal Ticket">
        <div className="space-y-4">
          <Input id="t-sub" label="Subject" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} required />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}
              className="block w-full rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm">
              <option value="order_inquiry">Order Inquiry</option>
              <option value="repayment_issue">Repayment Issue</option>
              <option value="technical_glitch">Technical Glitch</option>
              <option value="reconciliation">Reconciliation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input id="t-desc" label="Description" value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} />
          <Input id="t-order" label="Related Order ID (optional)" value={ticketRelatedOrder} onChange={(e) => setTicketRelatedOrder(e.target.value)} />
          <Button onClick={handleCreateTicket} className="w-full" disabled={saving || !ticketSubject}>Create</Button>
        </div>
      </Modal>
    </div>
  )
}
