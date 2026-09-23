import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Undo2, X, Loader2, Layers, Unlock, MessageSquare, Calculator, XCircle, Coins,
} from 'lucide-react'

interface Holding {
  id: string
  product: { name: string }
  units: number
  currentValue: number
  isLocked: boolean
  lockedUntil: string | null
  costBasis: number
}

interface Redemption {
  id: string
  holding: { product: { name: string } }
  units: number
  amount: number
  status: string
  reason: string | null
  rejectionReason: string | null
  createdAt: string
  processedAt: string | null
}

const statusMeta = (s: string) => {
  switch (s) {
    case 'requested':
      return { label: 'Requested', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
    case 'approved':
    case 'processed':
      return { label: s, cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' }
    case 'paid':
      return { label: 'Paid', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    case 'rejected':
      return { label: 'Rejected', cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }
    default:
      return { label: s, cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
  }
}

const solidGold =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2.5 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] disabled:opacity-50 disabled:pointer-events-none cursor-pointer'
const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const thCls = 'px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]'
const tdCls = 'px-5 py-3.5 text-sm text-[#2C1B13]'

const ticketBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-semibold text-[#176B5B] transition hover:bg-[#176B5B]/5 cursor-pointer'

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

function StatCard({ icon, title, value, tileCls }: { icon: ReactNode; title: string; value: string; tileCls: string }) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tileCls}`}>{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">{title}</p>
      </div>
      <p className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#2C1B13]">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.label}
    </span>
  )
}

export function Redemptions() {
  const navigate = useNavigate()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])

  const raiseTicket = (subject: string, refId: string) => {
    navigate(`/individual/support?subject=${encodeURIComponent(subject)}&orderId=${refId}`)
  }
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null)
  const [redeemUnits, setRedeemUnits] = useState('')
  const [redeemReason, setRedeemReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetch = () => {
    setLoading(true)
    Promise.all([
      api.get('/investments/holdings').then((r) => setHoldings(r.data)),
      api.get('/investments/redemptions').then((r) => setRedemptions(r.data)),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  const handleSubmit = async () => {
    if (!selectedHolding || !redeemUnits) return
    setSubmitting(true)
    try {
      await api.post('/investments/redemptions', {
        holdingId: selectedHolding.id,
        units: Number(redeemUnits),
        reason: redeemReason || undefined,
      })
      setShowForm(false)
      setSelectedHolding(null)
      setRedeemUnits('')
      setRedeemReason('')
      fetch()
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const availableHoldings = holdings.filter((h) => !h.isLocked)
  const unitsValid = redeemUnits && !Number.isNaN(Number(redeemUnits))
    && Number(redeemUnits) >= 1 && Number(redeemUnits) <= (selectedHolding?.units ?? -1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Investments</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Redemptions / Withdrawals</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Convert units from your unlocked holdings back into cash.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={availableHoldings.length === 0}
            className={solidGold}
          >
            <Undo2 size={15} /> Request Redemption
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-28 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
            <div className="h-28 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatCard icon={<Layers size={20} />} tileCls="bg-[#9D4824]/10 text-[#9D4824]" title="Total Holdings" value={String(holdings.length)} />
            <StatCard icon={<Unlock size={20} />} tileCls="bg-[#176B5B]/10 text-[#176B5B]" title="Available for Redemption" value={String(availableHoldings.length)} />
          </div>

          {/* History */}
          {redemptions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
                <Coins size={16} className="text-[#8A5A00]" />
                <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Redemption History</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                      <th className={thCls}>Product</th>
                      <th className={thCls}>Units</th>
                      <th className={thCls}>Amount</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>Reason</th>
                      <th className={thCls}>Date</th>
                      <th className={thCls}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE2D3]">
                    {redemptions.map((r) => (
                      <tr key={r.id} className="transition hover:bg-[#FFF9EF]/70">
                        <td className={`${tdCls} font-semibold`}>{r.holding?.product?.name || 'Unknown'}</td>
                        <td className={tdCls}>{r.units}</td>
                        <td className={`${tdCls} font-semibold`}>{formatCurrency(Number(r.amount))}</td>
                        <td className={tdCls}><StatusPill status={r.status} /></td>
                        <td className={`${tdCls} max-w-[150px] truncate text-xs text-[#6B5245]`}>{r.reason || '—'}</td>
                        <td className={tdCls}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className={tdCls}>
                          <button type="button" onClick={() => raiseTicket('Issue with redemption: ' + (r.holding?.product?.name || ''), r.id)} className={ticketBtn}>
                            <MessageSquare size={13} /> Ticket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E7DCCB] bg-white/60 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#176B5B]/10">
                <Undo2 size={26} className="text-[#176B5B]" />
              </div>
              <p className="font-bold text-[#2C1B13]">No redemption requests yet</p>
              <p className="max-w-sm text-sm text-[#6B5245]">Submit a request to withdraw from an unlocked holding.</p>
              {availableHoldings.length > 0 && (
                <button type="button" onClick={() => setShowForm(true)} className={`${solidGold} mt-2`}>
                  <Undo2 size={15} /> Request Redemption
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Redemption form modal */}
      <BrandModal
        open={showForm}
        onClose={() => setShowForm(false)}
        icon={<Undo2 size={18} className="text-[#8A5A00]" />}
        iconCls="bg-[#E4A42A]/15"
        title="Request Redemption"
        subtitle="Withdraw units from an unlocked holding"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">Holding</label>
            <select
              value={selectedHolding?.id || ''}
              onChange={(e) => {
                const h = holdings.find((h) => h.id === e.target.value)
                setSelectedHolding(h || null)
                setRedeemUnits('')
              }}
              className={`${fieldCls} appearance-none`}
            >
              <option value="">Select holding</option>
              {availableHoldings.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.product?.name} ({h.units} units - {formatCurrency(Number(h.currentValue))})
                </option>
              ))}
            </select>
          </div>

          {selectedHolding && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">
                  Units <span className="text-[#6B5245]">(max {selectedHolding.units})</span>
                </label>
                <input
                  type="number"
                  value={redeemUnits}
                  onChange={(e) => setRedeemUnits(e.target.value)}
                  placeholder={`Max ${selectedHolding.units}`}
                  className={fieldCls}
                />
              </div>

              {unitsValid && (
                <div className="rounded-2xl border border-[#E7DCCB] bg-gradient-to-br from-[#FFF9EF] to-[#F0DDAD]/30 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8A5A00]">
                    <Calculator size={13} /> Estimated payout
                  </p>
                  <p className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">
                    {formatCurrency(Number(redeemUnits) * (Number(selectedHolding.currentValue) / selectedHolding.units))}
                  </p>
                  <p className="mt-1 text-xs text-[#6B5245]">
                    {Number(redeemUnits)} units × {formatCurrency(Number(selectedHolding.currentValue) / selectedHolding.units)}/unit
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">Reason (optional)</label>
                <input
                  value={redeemReason}
                  onChange={(e) => setRedeemReason(e.target.value)}
                  placeholder="e.g. Moving funds to savings"
                  className={fieldCls}
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !unitsValid}
                className={`${solidGreen} w-full`}
              >
                {submitting ? (<><Loader2 size={15} className="animate-spin" /> Submitting...</>) : 'Submit Request'}
              </button>

              {redeemUnits && !unitsValid && (
                <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-[#B3261E]">
                  <XCircle size={13} /> Enter between 1 and {selectedHolding.units} units
                </p>
              )}
            </>
          )}
        </div>
      </BrandModal>
    </div>
  )
}
