import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Modal } from '../../components/ui/modal'

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

const cardBorders = [
  'border-indigo-500',
  'border-emerald-500',
  'border-blue-500',
  'border-amber-500',
  'border-fuchsia-500',
  'border-cyan-500',
]

export function Catalog() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [planModal, setPlanModal] = useState<Plan | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [eligibility, setEligibility] = useState<Record<string, Eligibility>>({})

  const fetch = useCallback(() => {
    api.get('/bnpl/catalog').then((r) => setItems(r.data))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  )

  const viewPlans = async (item: CatalogItem) => {
    setSelectedItem(item)
    setEligibility({})
    const { data } = await api.get('/bnpl/plans')
    const active = data.filter((p: Plan) => p.catalogItemId === item.id && p.status === 'active')
    setPlans(active)
    active.forEach((p: Plan) => {
      api.get('/bnpl/compliance/eligibility', { params: { planId: p.id } })
        .then((r) => setEligibility((prev) => ({ ...prev, [p.id]: r.data })))
        .catch(() => {})
    })
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
      <h2 className="text-2xl font-bold dark:text-gray-100">Browse Catalog</h2>

      <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item, idx) => (
          <Card key={item.id} className={`flex flex-col ${cardBorders[idx % cardBorders.length]}`}>
            {item.images && item.images.length > 0 ? (
              <ImageCarousel images={item.images.map((i) => i.url)} alt={item.name} />
            ) : item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-contain bg-gray-100 dark:bg-gray-800 rounded-t-lg -mx-6 -mt-6 mb-4" />
            ) : null}
            <CardTitle>{item.name}</CardTitle>
            {item.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
            )}
            <p className="text-xl font-bold mt-3">₦{Number(item.price).toLocaleString()}</p>
            <div className="mt-auto pt-4">
              <Button className="w-full" onClick={() => viewPlans(item)}>View Plans</Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">No items available</p>
        )}
      </div>

      <Modal
        open={!!selectedItem && !planModal}
        onClose={() => { setSelectedItem(null); setPlans([]) }}
        title={selectedItem?.name ?? ''}
      >
        {selectedItem && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{selectedItem.description}</p>
            <p className="text-2xl font-bold">₦{Number(selectedItem.price).toLocaleString()}</p>
            <h4 className="text-sm font-semibold dark:text-gray-200">Available Plans</h4>
            {plans.length === 0 && <p className="text-sm text-gray-400">No plans available for this item</p>}
            <div className="space-y-2">
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
                  <div key={plan.id} className="rounded-lg border dark:border-gray-700 p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{plan.downPaymentPercent}% down</span>
                      <Badge variant="info">{plan.installmentCount}x {plan.installmentFrequency}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Interest: {plan.interestRate}%</span>
                      <span className="text-gray-500">₦{Number(installmentAmount).toLocaleString()}/installment</span>
                    </div>
                    {(plan.minPrincipal || plan.maxPrincipal) && (
                      <div className="text-xs text-gray-500">
                        Limit: ₦{Number(plan.minPrincipal || 0).toLocaleString()} - ₦{Number(plan.maxPrincipal || 0).toLocaleString()}
                      </div>
                    )}
                    {el && !el.eligible && (
                      <div className="space-y-1 mt-1">
                        {el.reasons.filter((r) => !r.passed).map((r) => (
                          <div key={r.key} className="text-xs text-red-500 flex items-center gap-1">
                            <span>✗</span> {r.label}{r.detail ? ` — ${r.detail}` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                    {el?.eligible && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <span>✓</span> Eligible for this plan
                      </div>
                    )}
                    {!el && (
                      <div className="text-xs text-gray-400 animate-pulse">Checking eligibility...</div>
                    )}
                    <Button className="w-full mt-2" size="sm" onClick={() => setPlanModal(plan)} disabled={!eligible}>
                      {eligible ? 'Subscribe' : 'Not Eligible'}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!planModal} onClose={() => setPlanModal(null)} title="Confirm Subscription">
        {planModal && selectedItem && (
          <div className="space-y-4">
            <p className="text-sm">Subscribe to <strong>{selectedItem.name}</strong>?</p>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Price:</span><span className="font-medium">₦{Number(selectedItem.price).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Down payment:</span><span className="font-medium">{planModal.downPaymentPercent}%</span></div>
              <div className="flex justify-between"><span>Installments:</span><span className="font-medium">{planModal.installmentCount}x {planModal.installmentFrequency}</span></div>
              <div className="flex justify-between"><span>Interest:</span><span className="font-medium">{planModal.interestRate}%</span></div>
            </div>
            <Button className="w-full" onClick={() => handleSubscribe(planModal)} disabled={subscribing}>
              {subscribing ? 'Subscribing...' : 'Confirm'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0)
  const go = (d: number) => setIdx((p) => (p + d + images.length) % images.length)

  if (!images.length) return null

  return (
    <div className="relative w-full h-40 overflow-hidden rounded-t-lg -mx-6 -mt-6 mb-4 group">
      <img
        src={images[idx]}
        alt={`${alt} ${idx + 1}`}
        className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800 transition-opacity duration-300"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1) }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ›
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
