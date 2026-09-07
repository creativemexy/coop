import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/modal'

interface Ticket {
  id: string
  subject: string
  description: string | null
  category: string
  status: string
  relatedOrderId: string | null
  relatedPaymentId: string | null
  resolutionNote: string | null
  createdAt: string
  resolvedAt: string | null
}

const categoryLabels: Record<string, string> = {
  order_inquiry: 'Order Inquiry',
  repayment_issue: 'Repayment Issue',
  technical_glitch: 'Technical Glitch',
  reconciliation: 'Reconciliation',
  investment_issue: 'Investment Issue',
  other: 'Other',
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'default',
}

export function Support() {
  const [searchParams] = useSearchParams()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', category: 'other', relatedOrderId: '', relatedPaymentId: '' })
  const [submitting, setSubmitting] = useState(false)

  const [selTicket, setSelTicket] = useState<Ticket | null>(null)
  const [ticketMessages, setTicketMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const fetch = () => {
    setLoading(true)
    api.get('/dashboard/individual/tickets').then((r) => {
      setTickets(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  useEffect(() => {
    const subject = searchParams.get('subject')
    const description = searchParams.get('description')
    const orderId = searchParams.get('orderId')
    const paymentRef = searchParams.get('paymentRef')
    if (subject || description || orderId || paymentRef) {
      const category = (subject || '').toLowerCase().includes('investment') ? 'investment_issue' : 'other'
      setForm((prev) => ({
        ...prev,
        subject: subject || prev.subject,
        description: description || prev.description,
        relatedOrderId: orderId || prev.relatedOrderId,
        relatedPaymentId: paymentRef || prev.relatedPaymentId,
        category,
      }))
      setShowForm(true)
    }
  }, [searchParams])

  const openTicketDetail = async (ticket: Ticket) => {
    setSelTicket(ticket)
    setLoadingMessages(true)
    try {
      const { data } = await api.get(`/dashboard/individual/tickets/${ticket.id}/messages`)
      setTicketMessages(data)
    } catch { setTicketMessages([]) }
    setLoadingMessages(false)
  }

  const handleSubmit = async () => {
    if (!form.subject) return
    setSubmitting(true)
    try {
      await api.post('/dashboard/individual/tickets', {
        subject: form.subject,
        description: form.description || undefined,
        category: form.category || undefined,
        relatedOrderId: form.relatedOrderId || undefined,
        relatedPaymentId: form.relatedPaymentId || undefined,
      })
      setShowForm(false)
      setForm({ subject: '', description: '', category: 'other', relatedOrderId: '', relatedPaymentId: '' })
      fetch()
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Support Tickets</h2>
        <Button onClick={() => {
          setForm({ subject: '', description: '', category: 'other', relatedOrderId: '', relatedPaymentId: '' })
          setShowForm(true)
        }}>Open New Ticket</Button>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Open Support Ticket">
        <div className="space-y-4">
          <Input label="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <Input label="Related Order ID (optional)" value={form.relatedOrderId} onChange={(e) => setForm({ ...form, relatedOrderId: e.target.value })} />
          <Input label="Related Payment Reference (optional)" value={form.relatedPaymentId} onChange={(e) => setForm({ ...form, relatedPaymentId: e.target.value })} />
          <Button className="w-full" onClick={handleSubmit} disabled={submitting || !form.subject}>
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </Button>
        </div>
      </Modal>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">
            <p className="font-medium">No support tickets</p>
            <p className="text-sm mt-1">Open a ticket if you need help with an order or payment.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{t.subject}</p>
                    <Badge variant={statusColors[t.status] ?? 'default'}>{t.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {categoryLabels[t.category] || t.category} &middot; {new Date(t.createdAt).toLocaleString()}
                  </p>
                  {t.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{t.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    {t.relatedOrderId && <span>Order: {t.relatedOrderId.slice(0, 8)}...</span>}
                    {t.relatedPaymentId && <span>Payment: {t.relatedPaymentId.slice(0, 8)}...</span>}
                    {t.resolutionNote && <span className="text-green-600">Resolution: {t.resolutionNote}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 ml-2" onClick={() => openTicketDetail(t)}>View</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selTicket} onClose={() => setSelTicket(null)} title={selTicket?.subject || 'Ticket'}>
        {selTicket && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={statusColors[selTicket.status] ?? 'default'}>{selTicket.status.replace('_', ' ')}</Badge>
              <Badge variant="info">{selTicket.category}</Badge>
              <span className="text-xs text-gray-400">{new Date(selTicket.createdAt).toLocaleString()}</span>
            </div>
            {selTicket.description && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                <p className="text-xs text-gray-500 mb-1">Description:</p>
                <p className="text-gray-700 dark:text-gray-200">{selTicket.description}</p>
              </div>
            )}
            {selTicket.resolutionNote && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-sm">
                <p className="text-xs text-green-600 mb-1">Resolution:</p>
                <p className="text-green-700 dark:text-green-300">{selTicket.resolutionNote}</p>
              </div>
            )}

            <div className="border-t dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold mb-3 dark:text-gray-200">Conversation</h4>
              {loadingMessages ? (
                <p className="text-xs text-gray-400">Loading messages...</p>
              ) : ticketMessages.length === 0 ? (
                <p className="text-xs text-gray-400">No replies from support team yet.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {ticketMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.senderRole === 'super_admin' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        m.senderRole === 'super_admin'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        <p>{m.message}</p>
                        <p className="text-[10px] mt-1 opacity-60">
                          {m.senderRole === 'super_admin' ? 'Support Team' : 'You'} &middot; {new Date(m.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
