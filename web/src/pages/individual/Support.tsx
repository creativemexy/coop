import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  LifeBuoy, X, Plus, MessageSquare, Send, Loader2, CheckCircle2, CreditCard, Package, StickyNote,
} from 'lucide-react'

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

const statusMeta = (s: string) => {
  switch (s) {
    case 'open':
      return { label: 'Open', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
    case 'in_progress':
      return { label: 'In Progress', cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' }
    case 'resolved':
      return { label: 'Resolved', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    default:
      return { label: 'Closed', cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
  }
}

const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidGold =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2.5 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghostSm =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] hover:text-[#2C1B13] cursor-pointer'
const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

function BrandModal({
  open,
  onClose,
  icon,
  iconCls,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  icon: ReactNode
  iconCls: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#23150F]/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#EDE2D3] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>{icon}</div>
            <div>
              <h2 className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">{title}</h2>
              {subtitle && <p className="text-xs text-[#6B5245]">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6B5245] transition hover:bg-[#FFF9EF] hover:text-[#2C1B13] cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#E7DCCB] bg-white px-3 py-2 text-xs font-medium text-[#6B5245]">
      {icon}
      <span className="text-[#6B5245]">{label}:</span>
      <span className="font-bold text-[#2C1B13]">{value}</span>
    </div>
  )
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Support</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Support Tickets</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Track your open tickets and see support responses here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="text-xs font-medium text-[#B79B6B]">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} ·{' '}
              {tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length} open
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setForm({ subject: '', description: '', category: 'other', relatedOrderId: '', relatedPaymentId: '' })
              setShowForm(true)
            }}
            className={solidGold}
          >
            <Plus size={15} /> Open New Ticket
          </button>
        </div>
      </div>

      {/* New ticket modal */}
      <BrandModal
        open={showForm}
        onClose={() => setShowForm(false)}
        icon={<MessageSquare size={18} className="text-[#8A5A00]" />}
        iconCls="bg-[#E4A42A]/15"
        title="Open Support Ticket"
        subtitle="Tell us what you need help with"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">Subject <span className="text-[#B3261E]">*</span></label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. My last order has not been delivered"
              className={fieldCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`${fieldCls} appearance-none`}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Give us as much detail as possible so we can help faster."
              className={fieldCls}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">Related Order ID</label>
              <input
                value={form.relatedOrderId}
                onChange={(e) => setForm({ ...form, relatedOrderId: e.target.value })}
                placeholder="Optional"
                className={fieldCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">Related Payment Ref</label>
              <input
                value={form.relatedPaymentId}
                onChange={(e) => setForm({ ...form, relatedPaymentId: e.target.value })}
                placeholder="Optional"
                className={fieldCls}
              />
            </div>
          </div>
          <button type="button" onClick={handleSubmit} disabled={submitting || !form.subject} className={`${solidGreen} w-full`}>
            {submitting ? (<><Loader2 size={15} className="animate-spin" /> Submitting...</>) : (<><Send size={15} /> Submit Ticket</>)}
          </button>
        </div>
      </BrandModal>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
              <div className="space-y-2.5">
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-[#F0DDAD]/50" />
                <div className="h-3 w-1/4 animate-pulse rounded-full bg-[#F0DDAD]/30" />
                <div className="h-3 w-full animate-pulse rounded-full bg-[#F0DDAD]/30" />
              </div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E7DCCB] bg-white/60 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <LifeBuoy size={26} className="text-[#176B5B]" />
          </div>
          <p className="font-bold text-[#2C1B13]">No support tickets</p>
          <p className="max-w-sm text-sm text-[#6B5245]">Open a ticket if you need help with an order or payment.</p>
          <button
            type="button"
            onClick={() => {
              setForm({ subject: '', description: '', category: 'other', relatedOrderId: '', relatedPaymentId: '' })
              setShowForm(true)
            }}
            className={`${solidGold} mt-2`}
          >
            <Plus size={15} /> Open New Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const status = statusMeta(t.status)
            return (
              <div key={t.id} className="group rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm transition hover:border-[#176B5B]/30 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold text-[#2C1B13]">{t.subject}</p>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#6B5245]">
                      <span className="font-semibold text-[#9D4824]">{categoryLabels[t.category] || t.category}</span>{' '}
                      &middot; {formatDate(t.createdAt)}
                    </p>
                    {t.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#6B5245]">{t.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {t.relatedOrderId && <DetailRow icon={<Package size={13} />} label="Order" value={`${t.relatedOrderId.slice(0, 8)}...`} />}
                      {t.relatedPaymentId && <DetailRow icon={<CreditCard size={13} />} label="Payment" value={`${t.relatedPaymentId.slice(0, 8)}...`} />}
                      {t.resolutionNote && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#176B5B]/10 px-3 py-2 text-xs font-semibold text-[#176B5B]">
                          <CheckCircle2 size={13} /> Resolution: {t.resolutionNote}
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => openTicketDetail(t)} className={`${ghostSm} shrink-0 sm:mt-1`}>
                    View <MessageSquare size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ticket detail modal */}
      <BrandModal
        open={!!selTicket}
        onClose={() => setSelTicket(null)}
        icon={<MessageSquare size={18} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title={selTicket?.subject ?? 'Ticket'}
        subtitle={selTicket ? `${categoryLabels[selTicket.category] || selTicket.category} · ${formatDate(selTicket.createdAt)}` : undefined}
      >
        {selTicket && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta(selTicket.status).cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta(selTicket.status).dot}`} /> {statusMeta(selTicket.status).label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9D4824]/10 px-2.5 py-1 text-xs font-semibold text-[#9D4824]">
                {categoryLabels[selTicket.category] || selTicket.category}
              </span>
            </div>

            {selTicket.description && (
              <div className="rounded-2xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">
                  <StickyNote size={12} /> Description
                </p>
                <p className="text-sm leading-relaxed text-[#2C1B13]">{selTicket.description}</p>
              </div>
            )}

            {selTicket.resolutionNote && (
              <div className="rounded-2xl border border-[#176B5B]/25 bg-[#176B5B]/5 p-4">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#176B5B]">
                  <CheckCircle2 size={12} /> Resolution
                </p>
                <p className="text-sm leading-relaxed text-[#176B5B]">{selTicket.resolutionNote}</p>
              </div>
            )}

            <div className="border-t border-[#EDE2D3] pt-4">
              <h4 className="mb-3 text-sm font-black uppercase tracking-[0.12em] text-[#2C1B13]">Conversation</h4>
              {loadingMessages ? (
                <p className="flex items-center gap-2 text-xs text-[#6B5245]">
                  <Loader2 size={13} className="animate-spin" /> Loading messages...
                </p>
              ) : ticketMessages.length === 0 ? (
                <p className="text-xs text-[#6B5245]">No replies from support team yet — we'll get back to you soon.</p>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {ticketMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.senderRole === 'super_admin' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                        m.senderRole === 'super_admin'
                          ? 'rounded-tl-sm bg-[#176B5B] text-[#FFF9EF]'
                          : 'rounded-tr-sm bg-[#2C1B13] text-[#FFF9EF]'
                      }`}>
                        <p className="leading-relaxed">{m.message}</p>
                        <p className="mt-1.5 text-[10px] opacity-60">
                          {m.senderRole === 'super_admin' ? 'Support Team' : 'You'} &middot; {formatDate(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </BrandModal>
    </div>
  )
}
