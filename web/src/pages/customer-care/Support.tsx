import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Modal } from '../../components/ui/modal'
import { useTicketStream } from '../../hooks/useTicketStream'
import type { TicketStreamEvent } from '../../hooks/useTicketStream'

const statusColors: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
}

const statusText: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

interface TicketRow {
  id: string
  subject: string
  category: string
  status: string
  relatedOrderId: string | null
  description?: string | null
  resolutionNote?: string | null
  createdAt: string
  senderName?: string
  senderEmail?: string
  sender?: { firstName: string; lastName: string; email: string; role: string } | null
}

const senderLabel = (role?: string) => (role === 'super_admin' || role === 'customer_care' ? 'Support' : 'Member')

export function Support() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [ticketFilter, setTicketFilter] = useState('')

  const [selTicket, setSelTicket] = useState<TicketRow | null>(null)
  const [ticketMeta, setTicketMeta] = useState<any>(null)
  const [ticketMessages, setTicketMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const loadTickets = useCallback(async () => {
    const params: Record<string, string> = {}
    if (ticketFilter) params.status = ticketFilter
    try { const { data } = await api.get('/support/tickets', { params }); setTickets(data) } catch {}
  }, [ticketFilter])

  useEffect(() => { loadTickets() }, [loadTickets])

  useTicketStream(
    'support/tickets/stream',
    useCallback(() => { loadTickets() }, [loadTickets]),
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

  const handleTicketStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/support/tickets/${id}/status`, { status })
      loadTickets()
    } catch (e: any) { alert(e.response?.data?.message || 'Failed') }
  }

  const isOpen = ticketMeta?.status === 'open' || ticketMeta?.status === 'in_progress' || selTicket?.status === 'open' || selTicket?.status === 'in_progress'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Support Tickets</h2>
        <div className="flex gap-2">
          {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <Button key={s} variant={ticketFilter === s ? 'primary' : 'ghost'} size="sm" onClick={() => setTicketFilter(s)}>
              {statusText[s] || 'All'}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-teal-100 bg-white/80 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
        <Table>
          <THead><THeadRow>
            <THeadCell>Subject</THeadCell>
            <THeadCell>Sent By</THeadCell>
            <THeadCell>Category</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Created</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell />
          </THeadRow></THead>
          <TBody>
            {tickets.map((t) => (
              <TBodyRow key={t.id}>
                <TBodyCell className="font-medium max-w-[220px] truncate">{t.subject}</TBodyCell>
                <TBodyCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">{t.senderName || 'Unknown'}</span>
                    {t.senderEmail && <span className="text-xs text-gray-400">{t.senderEmail}</span>}
                  </div>
                </TBodyCell>
                <TBodyCell><Badge variant="info">{t.category}</Badge></TBodyCell>
                <TBodyCell><Badge variant={statusColors[t.status] || 'warning'}>{statusText[t.status] || t.status}</Badge></TBodyCell>
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
            {tickets.length === 0 && <TBodyRow><TBodyCell colSpan={7} className="text-center py-4 text-gray-400">No tickets</TBodyCell></TBodyRow>}
          </TBody>
        </Table>
      </Card>

      <Modal open={!!selTicket} onClose={() => setSelTicket(null)} title={selTicket?.subject || 'Ticket'}>
        {selTicket && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={statusColors[ticketMeta?.status || selTicket.status] || 'warning'}>{statusText[ticketMeta?.status || selTicket.status] || selTicket.status}</Badge>
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
                            {m.senderName || senderLabel(m.senderRole)} &middot; {new Date(m.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {isOpen ? (
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
                This ticket is {statusText[ticketMeta?.status || selTicket.status] || selTicket.status} and is read-only.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}