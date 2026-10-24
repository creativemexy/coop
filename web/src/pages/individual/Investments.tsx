import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../../api/client'
import {
  TrendingUp, X, CheckCircle2, XCircle, Banknote, Copy, Check,
  Loader2, Lock, Hash, PieChart, ShieldAlert, Sparkles,
} from 'lucide-react'

interface InvestmentProduct {
  id: string
  name: string
  description: string | null
  type: string
  riskTier: string
  minimumInvestment: number
  maximumInvestment: number | null
  unitPrice: number | null
  lockInDays: number
  tenorDays: number | null
  managementFeeRate: number
  expectedReturnRate: number
  profitSharingRules: string | null
  distributionFrequency: string
  totalUnits: number | null
  availableUnits: number | null
  isOpen: boolean
}

interface PaymentInstruction {
  id: string
  amount: number
  type: string
  reference: string
  accountNumber: string
  accountName: string
  bankName: string
  status: string
  expiresAt?: string
  creditedAt?: string
}

interface Compliance {
  kycStatus: string
  kycApproved: boolean
  eligible: boolean
  requirements: Array<{ key: string; label: string; met: boolean; status: string }>
}

const typeMeta = (t: string) => {
  switch (t) {
    case 'shares':
      return { label: 'Shares', cls: 'bg-[#6B5245]/10 text-[#6B5245]' }
    case 'fixed_income':
      return { label: 'Fixed Income', cls: 'bg-[#176B5B]/10 text-[#176B5B]' }
    case 'pooled':
      return { label: 'Pooled Investment', cls: 'bg-[#9D4824]/10 text-[#9D4824]' }
    default:
      return { label: t.replace('_', ' '), cls: 'bg-[#EDE2D3] text-[#6B5245]' }
  }
}

const riskMeta = (r: string) => {
  switch (r) {
    case 'low':
      return { label: 'Low risk', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    case 'medium':
      return { label: 'Medium risk', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
    case 'high':
      return { label: 'High risk', cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }
    default:
      return { label: r, cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
  }
}

const freqLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
  maturity: 'At Maturity',
}

const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidGold =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2.5 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

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

function SummaryRow({ label, value, valueCls }: { label: string; value: ReactNode; valueCls?: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-[#6B5245]">{label}</span>
      <span className={`font-semibold text-[#2C1B13] ${valueCls ?? ''}`}>{value}</span>
    </div>
  )
}

export function Investments() {
  const [products, setProducts] = useState<InvestmentProduct[]>([])
  const [compliance, setCompliance] = useState<Compliance | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [selected, setSelected] = useState<InvestmentProduct | null>(null)
  const [investAmount, setInvestAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [pay, setPay] = useState<{ orderId: string; instruction: PaymentInstruction } | null>(null)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filterType) params.type = filterType
    if (filterRisk) params.riskTier = filterRisk
    Promise.all([
      api.get('/investments/products', { params }).then((r) => setProducts(r.data)),
      api.get('/investments/compliance').then((r) => setCompliance(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [filterType, filterRisk])

  const handleInvest = async () => {
    if (!selected || !investAmount) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/investments/orders', {
        productId: selected.id,
        amount: Number(investAmount),
      })
      setOrderResult(data)
      await handleStartPayment(data.id)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Could not place order')
    }
    setSubmitting(false)
  }

  const handleStartPayment = async (orderId: string) => {
    try {
      const { data } = await api.post(`/virtual-accounts/investments/${orderId}/initiate`)
      setPay({ orderId, instruction: data })
    } catch (e: any) {
      alert(e.response?.data?.message || 'Could not start payment')
    }
  }

  const checkPayment = async (confirm = false): Promise<string | 'error'> => {
    if (!pay) return 'error'
    setChecking(true)
    try {
      const { data } = await api.post(`/virtual-accounts/investments/${pay.orderId}/verify`, confirm ? { confirm: true } : undefined)
      setPay((prev) => prev && data
        ? { orderId: prev.orderId, instruction: data }
        : prev)
      if (data && data.status === 'credited') {
        setPay(null)
        setOrderResult(null)
        setSelected(null)
        setInvestAmount('')
        alert(`Investment confirmed. Order ${pay.orderId.slice(0, 8)} is now allocated.`)
        window.location.reload()
      } else if (data && data.status === 'expired') {
        setPay(null)
        alert('This payment instruction has expired. Please try again.')
      }
      return data?.status ?? 'pending'
    } catch {
      /* keep modal open; re-poll */
      return 'error'
    } finally {
      setChecking(false)
    }
  }

  // Self-scheduling poll: the next check only starts after the previous one
  // completes, so slow network calls can never overlap. Bounded attempts,
  // capped exponential backoff, and stop on expiry / error threshold.
  useEffect(() => {
    if (!pay || pay.instruction.status !== 'pending') return
    const MAX_ATTEMPTS = 30
    const MAX_CONSECUTIVE_ERRORS = 3
    const BASE_DELAY = 5000
    const MAX_DELAY = 30000

    let cancelled = false
    let attempts = 0
    let consecutiveErrors = 0
    let delay = BASE_DELAY
    let timer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      if (cancelled) return
      attempts += 1
      const status = await checkPayment()
      if (cancelled) return
      if (status === 'credited' || status === 'expired') return
      if (status === 'error') {
        consecutiveErrors += 1
      } else if (status !== 'pending') {
        return
      } else {
        consecutiveErrors = 0
      }
      if (attempts >= MAX_ATTEMPTS || consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        setPay(null)
        alert('Payment confirmation timed out. Check your account and try again.')
        return
      }
      delay = Math.min(delay * 1.5, MAX_DELAY)
      timer = setTimeout(poll, delay)
    }

    timer = setTimeout(poll, BASE_DELAY)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay?.instruction.status, pay?.instruction.id])

  const copyAccount = async () => {
    if (!pay) return
    try {
      await navigator.clipboard.writeText(pay.instruction.accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const filtered = products.filter((p) => p.isOpen)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Investment Products</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Investment Opportunities</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Grow beyond savings with co-op investment products.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <TrendingUp size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Compliance */}
      {compliance && !compliance.eligible && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E4A42A]/30 bg-gradient-to-br from-[#F7D674]/25 to-[#FFF9EF] p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E4A42A]/20">
              <ShieldAlert size={17} className="text-[#8A5A00]" />
            </span>
            <div>
              <p className="font-bold text-[#2C1B13]">KYC verification required</p>
              <p className="mt-0.5 text-sm text-[#6B5245]">
                Your KYC status is <strong className="capitalize">{compliance.kycStatus}</strong>. You must complete KYC verification before you can invest.
              </p>
              {compliance.requirements.map((r) => !r.met && (
                <p key={r.key} className="mt-0.5 text-xs text-[#B3261E]">
                  {r.label}: {r.status}
                </p>
              ))}
            </div>
          </div>
          <a href="/individual/kyc" className={`${solidGold} shrink-0`}>Complete KYC</a>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`${fieldCls} w-auto appearance-none`}>
          <option value="">All Types</option>
          <option value="shares">Shares</option>
          <option value="fixed_income">Fixed Income</option>
          <option value="pooled">Pooled Investment</option>
        </select>
        <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className={`${fieldCls} w-auto appearance-none`}>
          <option value="">All Risk Tiers</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {!loading && (
          <span className="ml-auto self-center text-xs font-medium text-[#B79B6B]">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
              <div className="space-y-2.5 p-5">
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#F0DDAD]/50" />
                <div className="h-3 w-full animate-pulse rounded-full bg-[#F0DDAD]/30" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-[#F0DDAD]/30" />
                <div className="h-9 w-full animate-pulse rounded-full bg-[#F0DDAD]/40" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E7DCCB] bg-white/60 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4A42A]/15">
            <PieChart size={26} className="text-[#8A5A00]" />
          </div>
          <p className="font-bold text-[#2C1B13]">No investment opportunities available</p>
          <p className="max-w-sm text-sm text-[#6B5245]">Check back soon — new products open up regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const risk = riskMeta(p.riskTier)
            const type = typeMeta(p.type)
            return (
              <div key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#E4A42A]/50 hover:shadow-lg">
                <div className="border-b border-[#EDE2D3] bg-gradient-to-br from-[#FFF9EF] to-[#F0DDAD]/30 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">{p.name}</h3>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${risk.cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} /> {risk.label}
                    </span>
                  </div>
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${type.cls}`}>{type.label}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {p.description && (
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[#6B5245]">{p.description}</p>
                  )}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B5245]">Min investment</span>
                      <span className="font-semibold text-[#2C1B13]">{formatCurrency(p.minimumInvestment)}</span>
                    </div>
                    {p.expectedReturnRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#6B5245]">Expected return</span>
                        <span className="flex items-center gap-1 font-bold text-[#176B5B]"><TrendingUp size={13} /> {p.expectedReturnRate}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#6B5245]">Distribution</span>
                      <span className="font-semibold text-[#2C1B13]">{freqLabels[p.distributionFrequency] || p.distributionFrequency}</span>
                    </div>
                    {p.lockInDays > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#6B5245]">Lock-in</span>
                        <span className="font-semibold text-[#2C1B13]">{p.lockInDays} days</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!compliance?.eligible}
                    onClick={() => { setSelected(p); setInvestAmount(''); setOrderResult(null) }}
                    className={`${compliance?.eligible ? solidGold : 'inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EDE2D3] px-4 py-2.5 text-sm font-semibold text-[#6B5245] cursor-not-allowed'} mt-4`}
                  >
                    {compliance?.eligible ? (<><Sparkles size={15} /> Invest Now</>) : (<><Lock size={14} /> KYC Required</>)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Invest modal */}
      <BrandModal
        open={!!selected && !orderResult}
        onClose={() => setSelected(null)}
        icon={<Banknote size={18} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title={selected?.name ?? ''}
        subtitle="Review the product before placing your order"
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#EDE2D3] bg-[#FFF9EF] p-4 text-sm">
              <div className="space-y-2">
                <SummaryRow label="Type" value={typeMeta(selected.type).label} />
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-[#6B5245]">Risk tier</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskMeta(selected.riskTier).cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${riskMeta(selected.riskTier).dot}`} /> {riskMeta(selected.riskTier).label}
                  </span>
                </div>
                <SummaryRow label="Min / Max" value={formatCurrency(selected.minimumInvestment) + (selected.maximumInvestment ? ` - ${formatCurrency(selected.maximumInvestment)}` : ' +')} />
                {selected.unitPrice && <SummaryRow label="Unit price" value={formatCurrency(selected.unitPrice)} />}
                <SummaryRow label="Management fee" value={`${selected.managementFeeRate}%`} />
                <SummaryRow label="Expected return" value={`${selected.expectedReturnRate}%`} valueCls="text-[#176B5B]" />
                <SummaryRow label="Distribution" value={freqLabels[selected.distributionFrequency] || selected.distributionFrequency} />
                {selected.lockInDays > 0 && <SummaryRow label="Lock-in period" value={`${selected.lockInDays} days`} />}
                {selected.tenorDays && <SummaryRow label="Tenor" value={`${selected.tenorDays} days`} />}
                {selected.availableUnits !== null && <SummaryRow label="Available units" value={`${selected.availableUnits} / ${selected.totalUnits}`} />}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B5245]">Investment amount</label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                placeholder={`Min ${formatCurrency(selected.minimumInvestment)}${selected.maximumInvestment ? ` - Max ${formatCurrency(selected.maximumInvestment)}` : ''}`}
                className={fieldCls}
              />
              <p className="mt-1.5 text-xs text-[#6B5245]">
                Range: {formatCurrency(selected.minimumInvestment)}
                {selected.maximumInvestment ? ` - ${formatCurrency(selected.maximumInvestment)}` : ' or more'}
              </p>
            </div>

            {investAmount && !Number.isNaN(Number(investAmount)) && Number(investAmount) >= selected.minimumInvestment && (selected.maximumInvestment == null || Number(investAmount) <= selected.maximumInvestment) && (
              <div className="rounded-2xl border border-[#E7DCCB] bg-white p-4 text-sm shadow-sm">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8A5A00]">
                  <Hash size={13} /> Order estimate
                </p>
                <div className="space-y-2">
                  <SummaryRow label="Amount" value={formatCurrency(Number(investAmount))} />
                  <SummaryRow label={`Fee (${selected.managementFeeRate}%)`} value={formatCurrency(Number(investAmount) * selected.managementFeeRate / 100)} />
                  <SummaryRow label="Net investment" value={formatCurrency(Number(investAmount) * (1 - selected.managementFeeRate / 100))} />
                  {selected.unitPrice && (
                    <SummaryRow label="Est. units" value={String(Math.floor(Number(investAmount) * (1 - selected.managementFeeRate / 100) / selected.unitPrice))} />
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleInvest}
              disabled={submitting || !investAmount || Number.isNaN(Number(investAmount)) || Number(investAmount) < selected.minimumInvestment || (selected.maximumInvestment != null && Number(investAmount) > selected.maximumInvestment)}
              className={`${solidGreen} w-full`}
            >
              {submitting ? (<><Loader2 size={15} className="animate-spin" /> Processing...</>) : 'Place Order'}
            </button>

            {investAmount && !Number.isNaN(Number(investAmount)) && Number(investAmount) < selected.minimumInvestment && (
              <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-[#B3261E]">
                <XCircle size={13} /> Minimum investment is {formatCurrency(selected.minimumInvestment)}
              </p>
            )}
            {investAmount && !Number.isNaN(Number(investAmount)) && selected.maximumInvestment != null && Number(investAmount) > selected.maximumInvestment && (
              <p className="flex items-center justify-center gap-1.5 text-center text-xs font-medium text-[#B3261E]">
                <XCircle size={13} /> Maximum investment is {formatCurrency(selected.maximumInvestment)}
              </p>
            )}
          </div>
        )}
      </BrandModal>

      {/* Order placed modal */}
      <BrandModal
        open={!!orderResult && !pay}
        onClose={() => { setOrderResult(null); setSelected(null) }}
        icon={<CheckCircle2 size={18} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title="Order Placed"
      >
        {orderResult && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#176B5B]/20 bg-gradient-to-b from-[#176B5B]/10 to-[#FFF9EF] px-4 py-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#176B5B]">
                <CheckCircle2 size={22} className="text-[#FFF9EF]" />
              </span>
              <p className="text-lg font-black text-[#176B5B]">Order placed successfully</p>
              <p className="text-sm font-medium text-[#6B5245]">Order #<span className="font-black text-[#2C1B13]">{orderResult.id.slice(0, 8)}</span></p>
            </div>
            <div className="space-y-2 rounded-2xl border border-[#EDE2D3] bg-[#FFF9EF] p-4 text-sm">
              <SummaryRow label="Amount" value={formatCurrency(orderResult.amount)} />
              <SummaryRow label="Units" value={String(orderResult.units)} />
              <SummaryRow label="Fee" value={formatCurrency(orderResult.fee)} />
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-[#6B5245]">Status</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4A42A]/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-[#8A5A00]">
                  {orderResult.status}
                </span>
              </div>
            </div>
            <button type="button" onClick={() => handleStartPayment(orderResult.id)} className={`${solidGold} w-full`}>
              <Banknote size={15} /> Pay Now with Bank Transfer
            </button>
          </div>
        )}
      </BrandModal>

      {/* Pay via bank transfer modal */}
      <BrandModal
        open={!!pay}
        onClose={() => { setPay(null); setOrderResult(null); setSelected(null) }}
        icon={<Banknote size={18} className="text-[#8A5A00]" />}
        iconCls="bg-[#E4A42A]/15"
        title="Pay via Bank Transfer"
        subtitle="Your order is confirmed once the transfer is verified"
      >
        {pay && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-[#6B5245]">
              Transfer <strong className="text-[#2C1B13]">{formatCurrency(pay.instruction.amount)}</strong> to the account below using your bank app. Your investment order will be confirmed once the payment is verified.
            </p>

            <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF]">
              <div className="flex items-center justify-between bg-[#2C1B13] px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F0DDAD]">{pay.instruction.bankName}</p>
                <span className="rounded-full bg-[#E4A42A]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F0DDAD]">Account</span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black tracking-[0.08em] text-[#2C1B13]">{pay.instruction.accountNumber}</p>
                  <button
                    type="button"
                    onClick={copyAccount}
                    className="inline-flex items-center gap-1 rounded-full border border-[#E7DCCB] bg-white px-2.5 py-1 text-xs font-semibold text-[#176B5B] transition hover:bg-[#176B5B]/5 cursor-pointer"
                  >
                    {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <p className="mt-1 text-sm font-semibold text-[#2C1B13]">{pay.instruction.accountName}</p>
                <p className="mt-2 flex items-center gap-1 border-t border-[#EDE2D3] pt-2 text-xs text-[#6B5245]">
                  <Hash size={11} /> Ref: <span className="font-semibold text-[#2C1B13]">{pay.instruction.reference}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-[#6B5245]">
              <span>Status:</span>
              {pay.instruction.status === 'credited' ? (
                <span className="inline-flex items-center gap-1 font-bold text-[#176B5B]"><CheckCircle2 size={13} /> Credited</span>
              ) : pay.instruction.status === 'expired' ? (
                <span className="inline-flex items-center gap-1 font-bold text-[#B3261E]"><XCircle size={13} /> Expired</span>
              ) : (
                <span>
                  {pay.instruction.expiresAt
                    ? `Transfers expire ${new Date(pay.instruction.expiresAt).toLocaleTimeString()}`
                    : 'Awaiting transfer'}
                </span>
              )}
            </div>

            <button type="button" disabled={checking} onClick={() => checkPayment(true)} className={`${solidGreen} w-full`}>
              {checking ? (<><Loader2 size={15} className="animate-spin" /> Checking...</>) : "I've transferred · Check"}
            </button>
            <button type="button" onClick={() => { setPay(null); setOrderResult(null); setSelected(null) }} className={`${ghost} w-full`}>
              Close
            </button>
          </div>
        )}
      </BrandModal>
    </div>
  )
}
