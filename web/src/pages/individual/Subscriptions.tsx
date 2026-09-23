import { Fragment, useEffect, useState, useCallback, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Tags, ShoppingBag, Wallet, AlertTriangle, CheckCircle2, XCircle,
  Clock, ArrowRight, X, CalendarDays, Loader2, Landmark, RotateCcw,
} from 'lucide-react'

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

const statusMeta = (s: string) => {
  switch (s) {
    case 'created':
      return { cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
    case 'pending_payment':
      return { cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
    case 'disbursed':
      return { cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' }
    case 'active_repayment':
      return { cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    case 'settled':
      return { cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    case 'defaulted':
      return { cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }
    default:
      return { cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
  }
}

const formatStatus = (s: string) =>
  s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const ngn = (n: number) => `₦${n.toLocaleString()}`

const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidGold =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const tinyGhost =
  'inline-flex items-center gap-1.5 rounded-full border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] cursor-pointer'

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {formatStatus(status)}
    </span>
  )
}

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

function Timeline({ status }: { status: string }) {
  const steps = ['created', 'pending_payment', 'disbursed', 'active_repayment', 'settled']
  const currentIdx = statusFlow[status] ?? -1
  const isDefaulted = status === 'defaulted'

  return (
    <div className="flex items-start gap-0 py-3">
      {steps.map((step, i) => {
        const isPast = currentIdx >= i
        const isCurrent = currentIdx === i
        return (
          <div key={step} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center" style={{ minWidth: 36 }}>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                  isDefaulted && isCurrent
                    ? 'border-[#B3261E] bg-[#B3261E] text-[#FFF9EF]'
                    : isPast
                      ? 'border-[#176B5B] bg-[#176B5B] text-[#FFF9EF]'
                      : 'border-[#D8C9A9] bg-white text-[#C9B89F]'
                } ${isCurrent && !isDefaulted ? 'ring-4 ring-[#176B5B]/15' : ''}`}
              >
                {isPast ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
              </div>
              <span className={`mt-1.5 text-center text-[10px] leading-tight ${
                isCurrent ? 'font-bold text-[#2C1B13]' : isPast ? 'font-semibold text-[#6B5245]' : 'text-[#C9B89F]'
              }`}>
                {statusLabels[step]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mt-3.5 h-0.5 flex-1 self-start rounded-full ${
                isDefaulted && i >= steps.length - 2 ? 'bg-[#B3261E]/50'
                : currentIdx > i ? 'bg-[#176B5B]' : 'bg-[#EDE2D3]'
              }`} style={{ marginLeft: 8, marginRight: 8 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ icon, iconCls, label, value, sub }: {
  icon: ReactNode
  iconCls: string
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconCls}`}>{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">{label}</p>
      </div>
      <p className="mt-3 break-words text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#B79B6B]">{sub}</p>}
    </div>
  )
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
  const settledCount = subscriptions.filter((s) => s.status === 'settled').length

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-56 animate-pulse rounded-xl bg-[#F0DDAD]/40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-[#E7DCCB] bg-white p-5">
              <div className="h-4 w-24 animate-pulse rounded-full bg-[#F0DDAD]/40" />
              <div className="mt-4 h-7 w-20 animate-pulse rounded-lg bg-[#F0DDAD]/40" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">BNPL Store</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">My Subscriptions</h1>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#B3261E]/30 bg-[#B3261E]/5 px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B3261E]/10">
            <AlertTriangle size={22} className="text-[#B3261E]" />
          </div>
          <div>
            <p className="font-bold text-[#2C1B13]">Couldn't load subscriptions</p>
            <p className="mt-1 text-sm text-[#6B5245]">{error}</p>
          </div>
          <button type="button" onClick={fetch} className={solidGreen}>
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">BNPL Store</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">My Subscriptions</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Track your active plans, schedules and payments.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <Tags size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<ShoppingBag size={16} className="text-[#176B5B]" />}
          iconCls="bg-[#176B5B]/10"
          label="Active"
          value={String(activeCount)}
          sub={settledCount > 0 ? `${settledCount} settled` : 'Subscriptions in repayment'}
        />
        <StatCard
          icon={<Wallet size={16} className="text-[#8A5A00]" />}
          iconCls="bg-[#E4A42A]/15"
          label="Outstanding Balance"
          value={ngn(totalBalance)}
          sub="Across all subscriptions"
        />
        <div className="flex flex-col justify-between rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <Landmark size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Need credit?</p>
          </div>
          <Link to="/individual/catalog" className={`${solidGold} mt-3 w-full`}>
            Shop the catalog <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE2D3] px-5 py-4">
          <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">All subscriptions</h2>
          <span className="text-xs font-medium text-[#B79B6B]">{subscriptions.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#6B5245]">Item</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#6B5245]">Total</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#6B5245]">Paid</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#6B5245]">Balance</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#6B5245]">Status</th>
                <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#6B5245]">Next Due</th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-[#6B5245]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2D3]">
              {subscriptions.map((s) => {
                const balance = s.totalAmount - s.amountPaid
                const paidPct = s.totalAmount > 0 ? Math.round((s.amountPaid / s.totalAmount) * 100) : 0
                return (
                  <Fragment key={s.id}>
                    <tr className="transition hover:bg-[#FFF9EF]/50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#2C1B13]">{s.plan?.catalogItem?.name ?? '—'}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#F0DDAD]/60">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${paidPct}%`, background: paidPct >= 100 ? 'linear-gradient(90deg, #176B5B, #E4A42A)' : 'linear-gradient(90deg, #176B5B, #2A8A75)' }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-[#B79B6B]">{paidPct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[#2C1B13]">{ngn(s.totalAmount)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-[#176B5B]">{ngn(s.amountPaid)}</td>
                      <td className={`px-5 py-4 text-right font-bold ${balance > 0 ? 'text-[#B3261E]' : 'text-[#176B5B]'}`}>
                        {ngn(balance)}
                      </td>
                      <td className="px-5 py-4"><StatusPill status={s.status} /></td>
                      <td className="px-5 py-4 text-[#6B5245]">
                        {s.nextInstallmentDate
                          ? new Date(s.nextInstallmentDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button type="button" onClick={() => setTimelineSub(s)} className={tinyGhost}>
                            <Clock size={12} /> Timeline
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                            className={tinyGhost}
                          >
                            <CalendarDays size={12} /> {expandedId === s.id ? 'Hide' : 'Schedule'}
                          </button>
                          {balance > 0 && (
                            <button type="button" onClick={() => openPay(s)} className={tinyGhost}>
                              <Wallet size={12} /> Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === s.id && (
                      <tr className="bg-[#FFF9EF]/70">
                        <td colSpan={7} className="px-5 py-5">
                          <ScheduleBlock sub={s} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4A42A]/15">
                        <Tags size={26} className="text-[#8A5A00]" />
                      </div>
                      <p className="font-bold text-[#2C1B13]">No subscriptions yet</p>
                      <p className="max-w-sm text-sm text-[#6B5245]">Pick an item from the catalog and start paying in installments.</p>
                      <Link to="/individual/catalog" className={solidGreen}>
                        Browse catalog <ArrowRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline modal */}
      <BrandModal
        open={!!timelineSub}
        onClose={() => setTimelineSub(null)}
        icon={<Clock size={18} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title="Order Status Timeline"
        subtitle="Where this order stands"
      >
        {timelineSub && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4">
              <div>
                <p className="font-bold text-[#2C1B13]">{timelineSub.plan?.catalogItem?.name ?? 'Unknown'}</p>
                <p className="text-xs text-[#6B5245]">Order #{timelineSub.id.slice(0, 8)}</p>
              </div>
              <StatusPill status={timelineSub.status} />
            </div>
            <Timeline status={timelineSub.status} />
            {timelineSub.status === 'defaulted' && (
              <div className="flex items-start gap-2 rounded-xl bg-[#B3261E]/5 p-3 text-xs text-[#B3261E]">
                <AlertTriangle size={14} className="mt-px shrink-0" />
                This order has defaulted. Contact support to discuss next steps.
              </div>
            )}
            <div className="space-y-2.5 rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B5245]">Total amount</span>
                <span className="font-semibold text-[#2C1B13]">{ngn(timelineSub.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5245]">Paid so far</span>
                <span className="font-semibold text-[#176B5B]">{ngn(timelineSub.amountPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-[#E7DCCB] pt-2.5">
                <span className="text-[#6B5245]">Balance</span>
                <span className="font-bold text-[#B3261E]">{ngn(timelineSub.totalAmount - timelineSub.amountPaid)}</span>
              </div>
            </div>
          </div>
        )}
      </BrandModal>

      {/* Pay modal */}
      <BrandModal
        open={!!paySub}
        onClose={() => setPaySub(null)}
        icon={<Wallet size={18} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title={`Make Payment — ${paySub?.plan?.catalogItem?.name ?? ''}`}
        subtitle="Pay through Paystack"
      >
        {paySub && (
          <div className="space-y-5">
            <div className="space-y-2 rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B5245]">Outstanding balance</span>
                <span className="font-bold text-[#B3261E]">{ngn(paySub.totalAmount - paySub.amountPaid)}</span>
              </div>
              {paySub.nextInstallmentDate && (
                <div className="flex justify-between">
                  <span className="text-[#6B5245]">Next due</span>
                  <span className="font-semibold text-[#2C1B13]">{new Date(paySub.nextInstallmentDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
                Payment amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#B79B6B]">₦</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#E7DCCB] bg-white py-2.5 pl-9 pr-3.5 text-sm font-semibold text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setPaySub(null)} className={`${ghost} flex-1`}>Cancel</button>
              <button type="button" onClick={handlePay} disabled={paying || !payAmount || Number(payAmount) <= 0} className={`${solidGreen} flex-1`}>
                {paying ? (<><Loader2 size={15} className="animate-spin" /> Processing...</>) : 'Pay with Paystack'}
              </button>
            </div>
          </div>
        )}
      </BrandModal>

    </div>
  )
}

function ScheduleBlock({ sub }: { sub: Subscription }) {
  const upcoming = (sub.installments ?? []).filter((i) => i.status === 'pending')
  const overdue = upcoming.filter((i) => new Date(i.dueDate) < new Date())

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#2C1B13]">Installment schedule — {sub.plan?.catalogItem?.name ?? ''}</p>
        {overdue.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B3261E]/10 px-2.5 py-1 text-xs font-semibold text-[#B3261E]">
            <AlertTriangle size={12} /> {overdue.length} overdue
          </span>
        )}
      </div>
      <div className="space-y-2">
        {(sub.installments ?? []).map((inst) => {
          const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date()
          const paid = inst.status === 'paid'
          return (
            <div key={inst.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E7DCCB] bg-white px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${paid ? 'bg-[#176B5B]/10 text-[#176B5B]' : isOverdue ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#E4A42A]/15 text-[#8A5A00]'}`}>
                  {paid ? <CheckCircle2 size={14} /> : isOverdue ? <XCircle size={14} /> : <Clock size={14} />}
                </span>
                <div>
                  <p className="font-bold text-[#2C1B13]">{ngn(Number(inst.amount))}</p>
                  <p className="text-xs text-[#6B5245]">due {new Date(inst.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${paid ? 'bg-[#176B5B]/10 text-[#176B5B]' : isOverdue ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#E4A42A]/15 text-[#8A5A00]'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${paid ? 'bg-[#176B5B]' : isOverdue ? 'bg-[#B3261E]' : 'bg-[#E4A42A]'}`} />
                {isOverdue && inst.status === 'pending' ? 'overdue' : inst.status}
              </span>
            </div>
          )
        })}
        {(sub.installments ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-[#E7DCCB] px-4 py-6 text-center text-sm text-[#C9B89F]">
            No schedule has been generated yet.
          </p>
        )}
      </div>
    </div>
  )
}
