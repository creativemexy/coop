import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { api } from '../../api/client'
import {
  ShoppingBag, Search, X, ChevronLeft, ChevronRight, BadgeCheck,
  CheckCircle2, XCircle, Loader2, Sparkles, PackageOpen, ArrowRight,
} from 'lucide-react'

interface CatalogImage {
  id: string
  url: string
  sortOrder: number
}

interface CatalogItem {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  images?: CatalogImage[]
}

interface Plan {
  id: string
  catalogItemId: string
  status: string
  downPaymentPercent: number
  installmentCount: number
  installmentFrequency: string
  interestRate: number
  minPrincipal?: number
  maxPrincipal?: number
  eligibilityBands?: Array<{ minScore: number; maxScore: number; maxPrincipal: number }>
  catalogItem?: CatalogItem
}

interface Eligibility {
  eligible: boolean
  reasons: Array<{ key: string; label: string; passed: boolean; detail?: string }>
}

const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidGold =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2.5 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

const ngn = (n: number) => `₦${n.toLocaleString()}`

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

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0)
  const go = (d: number) => setIdx((p) => (p + d + images.length) % images.length)

  if (!images.length) return null

  return (
    <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#FFF9EF] to-[#F0DDAD]/40">
      <img
        src={images[idx]}
        alt={`${alt} — image ${idx + 1} of ${images.length}`}
        className="h-full w-full object-cover transition-opacity duration-300"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#23150F]/45 text-[#FFF9EF] opacity-0 transition-all hover:bg-[#23150F]/70 group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1) }}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#23150F]/45 text-[#FFF9EF] opacity-0 transition-all hover:bg-[#23150F]/70 group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                className={`h-1.5 cursor-pointer rounded-full transition-all ${i === idx ? 'w-4 bg-[#E4A42A]' : 'w-1.5 bg-white/70 hover:bg-white'}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
      <div className="aspect-[4/3] w-full animate-pulse bg-[#F0DDAD]/30" />
      <div className="space-y-2.5 p-5">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#F0DDAD]/50" />
        <div className="h-3 w-full animate-pulse rounded-full bg-[#F0DDAD]/30" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#F0DDAD]/30" />
        <div className="h-8 w-full animate-pulse rounded-full bg-[#F0DDAD]/40" />
      </div>
    </div>
  )
}

export function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [plansError, setPlansError] = useState<string | null>(null)
  const [planModal, setPlanModal] = useState<Plan | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [eligibility, setEligibility] = useState<Record<string, Eligibility>>({})

  const fetch = useCallback(() => {
    setLoading(true)
    api.get('/bnpl/catalog')
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  )

  const viewPlans = async (item: CatalogItem) => {
    setSelectedItem(item)
    setPlans([])
    setPlansLoading(true)
    setPlansError(null)
    setEligibility({})
    try {
      const { data } = await api.get('/bnpl/plans')
      const active = data.filter((p: Plan) => p.catalogItemId === item.id && p.status === 'active')
      setPlans(active)
      active.forEach((p: Plan) => {
        api.get('/bnpl/compliance/eligibility', { params: { planId: p.id } })
          .then((r) => setEligibility((prev) => ({ ...prev, [p.id]: r.data })))
          .catch(() => {})
      })
    } catch (error: any) {
      setPlansError(
        error?.response?.status === 403
          ? 'Complete KYC verification to view repayment plans.'
          : 'Unable to load repayment plans. Please try again.',
      )
    } finally {
      setPlansLoading(false)
    }
  }

  const handleSubscribe = async (plan: Plan) => {
    setSubscribing(true)
    try {
      await api.post('/bnpl/subscriptions', { planId: plan.id })
      setPlanModal(null)
      setSelectedItem(null)
      setPlans([])
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">BNPL Store</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Browse Catalog</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Pick an item, choose a payment plan, and split the cost with installments.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <ShoppingBag size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9B89F]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full rounded-full border border-[#E7DCCB] bg-white py-2.5 pl-10 pr-10 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[#C9B89F] transition hover:bg-[#FFF9EF] hover:text-[#6B5245]"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
        {!loading && (
          <span className="absolute -bottom-5 right-0 text-xs font-medium text-[#B79B6B]">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E7DCCB] bg-white/60 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4A42A]/15">
            <PackageOpen size={26} className="text-[#8A5A00]" />
          </div>
          <p className="text-base font-bold text-[#2C1B13]">No items available</p>
          <p className="max-w-sm text-sm text-[#6B5245]">
            {search ? `Nothing matches “${search}”. Try a different search term.` : 'New catalog items will appear here as they are added.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#E4A42A]/50 hover:shadow-lg"
            >
              {item.images && item.images.length > 0 ? (
                <ImageCarousel images={item.images.map((i) => i.url)} alt={item.name} />
              ) : item.imageUrl ? (
                <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-[#FFF9EF] to-[#F0DDAD]/40">
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                </div>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[#FFF9EF] to-[#F0DDAD]/40">
                  <ShoppingBag size={34} className="text-[#C9B89F]" />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black tracking-[-0.02em] text-[#2C1B13]">{item.name}</h3>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#6B5245]">{item.description}</p>
                    )}
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E4A42A]/15">
                    <Sparkles size={14} className="text-[#8A5A00]" />
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <p className="text-2xl font-black tracking-[-0.02em] text-[#176B5B]">{ngn(Number(item.price))}</p>
                  <p className="text-[11px] font-medium text-[#B79B6B]">Pay monthly</p>
                </div>

                <button type="button" onClick={() => viewPlans(item)} className={`${solidGreen} mt-4 w-full`}>
                  View Plans <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plans modal */}
      <BrandModal
        open={!!selectedItem && !planModal}
        onClose={() => { setSelectedItem(null); setPlans([]) }}
        icon={<ShoppingBag size={18} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title={selectedItem?.name ?? ''}
        subtitle="Choose a repayment plan"
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Item strip */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4">
              {selectedItem.images && selectedItem.images.length > 0 ? (
                <img src={selectedItem.images[0].url} alt={selectedItem.name} className="h-16 w-16 shrink-0 rounded-xl border border-[#E7DCCB] object-cover" />
              ) : selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="h-16 w-16 shrink-0 rounded-xl border border-[#E7DCCB] object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#E4A42A]/15 text-[#8A5A00]">
                  <ShoppingBag size={26} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#2C1B13]">{selectedItem.name}</p>
                {selectedItem.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-[#6B5245]">{selectedItem.description}</p>
                )}
                <p className="mt-1 text-lg font-black text-[#176B5B]">{ngn(Number(selectedItem.price))}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#6B5245]">Available Plans</p>
              {plansLoading ? (
                <p className="rounded-2xl border border-dashed border-[#E7DCCB] px-4 py-8 text-center text-sm text-[#6B5245]">
                  Loading plans...
                </p>
              ) : plansError ? (
                <p className="rounded-2xl border border-dashed border-[#E7DCCB] px-4 py-8 text-center text-sm text-[#6B5245]">
                  {plansError}
                </p>
              ) : plans.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#E7DCCB] px-4 py-8 text-center text-sm text-[#C9B89F]">
                  No plans available for this item
                </p>
              ) : null}
              <div className="space-y-3">
                {plans.map((plan) => {
                  const el = eligibility[plan.id]
                  const price = Number(selectedItem.price) || 0
                  const rate = Number(plan.interestRate) || 0
                  const downPct = Number(plan.downPaymentPercent) || 0
                  const installments = Number(plan.installmentCount) || 0
                  const downPayment = price * (downPct / 100)
                  const totalWithInterest = price + (price * rate / 100)
                  const installmentAmount = installments > 0 ? (totalWithInterest - downPayment) / installments : 0
                  const priceOk = (!plan.minPrincipal || price >= Number(plan.minPrincipal)) &&
                    (!plan.maxPrincipal || price <= Number(plan.maxPrincipal))
                  const eligible = priceOk && el?.eligible !== false
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-4 transition ${
                        eligible
                          ? 'border-[#176B5B]/30 bg-[#176B5B]/5'
                          : 'border-[#E7DCCB] bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#E4A42A]/15 px-2.5 py-1 text-xs font-bold text-[#8A5A00]">
                            {plan.downPaymentPercent}% down
                          </span>
                          <span className="rounded-full bg-[#176B5B]/10 px-2.5 py-1 text-xs font-bold text-[#176B5B]">
                            {plan.installmentCount}x {plan.installmentFrequency}
                          </span>
                        </div>
                        {priceOk && el?.eligible && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#176B5B]">
                            <CheckCircle2 size={13} /> Eligible
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#6B5245]">Interest</span>
                          <span className="font-semibold text-[#2C1B13]">{plan.interestRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B5245]">Installment</span>
                          <span className="font-semibold text-[#2C1B13]">{ngn(Math.round(installmentAmount))}</span>
                        </div>
                      </div>

                      {(plan.minPrincipal || plan.maxPrincipal) && (
                        <p className="mt-2 text-xs text-[#6B5245]">
                          Price limit: {ngn(Number(plan.minPrincipal || 0))} – {ngn(Number(plan.maxPrincipal || 0))}
                        </p>
                      )}

                      {el && !el.eligible && (
                        <div className="mt-3 space-y-1 rounded-xl bg-[#B3261E]/5 p-3">
                          {el.reasons.filter((r) => !r.passed).map((r) => (
                            <div key={r.key} className="flex items-start gap-1.5 text-xs text-[#B3261E]">
                              <XCircle size={13} className="mt-px shrink-0" />
                              <span>{r.label}{r.detail ? ` — ${r.detail}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {priceOk && el?.eligible && (
                        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#176B5B]/10 px-3 py-2 text-xs font-semibold text-[#176B5B]">
                          <BadgeCheck size={14} /> You qualify for this plan
                        </div>
                      )}
                      {!priceOk && (
                        <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#E4A42A]/10 px-3 py-2 text-xs font-semibold text-[#8A5A00]">
                          <XCircle size={14} /> Item price is outside this plan's range
                        </div>
                      )}
                      {!el && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#6B5245]">
                          <Loader2 size={13} className="animate-spin" /> Checking eligibility...
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setPlanModal(plan)}
                        disabled={!eligible}
                        className={`${eligible ? solidGold : ghost} mt-4 w-full`}
                      >
                        {eligible ? 'Subscribe' : 'Not Eligible'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </BrandModal>

      {/* Confirm modal */}
      <BrandModal
        open={!!planModal}
        onClose={() => setPlanModal(null)}
        icon={<BadgeCheck size={18} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title="Confirm Subscription"
        subtitle="Review before you commit"
      >
        {planModal && selectedItem && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-[#6B5245]">
              Subscribe to <strong className="font-bold text-[#2C1B13]">{selectedItem.name}</strong>?
            </p>
            <div className="space-y-2.5 rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B5245]">Price</span>
                <span className="font-semibold text-[#2C1B13]">{ngn(Number(selectedItem.price))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5245]">Down payment</span>
                <span className="font-semibold text-[#2C1B13]">{planModal.downPaymentPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5245]">Installments</span>
                <span className="font-semibold text-[#2C1B13]">{planModal.installmentCount}x {planModal.installmentFrequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5245]">Interest</span>
                <span className="font-semibold text-[#2C1B13]">{planModal.interestRate}%</span>
              </div>
              <div className="flex justify-between border-t border-[#E7DCCB] pt-2.5">
                <span className="font-semibold text-[#2C1B13]">Total after interest</span>
                <span className="font-black text-[#176B5B]">{ngn(Math.round(Number(selectedItem.price) * (1 + (Number(planModal.interestRate) || 0) / 100)))}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPlanModal(null)} className={`${ghost} flex-1`}>
                Cancel
              </button>
              <button type="button" onClick={() => handleSubscribe(planModal)} disabled={subscribing} className={`${solidGreen} flex-1`}>
                {subscribing ? (<><Loader2 size={15} className="animate-spin" /> Subscribing...</>) : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </BrandModal>
    </div>
  )
}