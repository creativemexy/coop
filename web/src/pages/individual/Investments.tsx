import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/modal'

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

const typeColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  shares: 'info',
  fixed_income: 'success',
  pooled: 'warning',
}

const riskColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

const freqLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
  maturity: 'At Maturity',
}

const productBorders = [
  'border-indigo-500',
  'border-emerald-500',
  'border-blue-500',
  'border-amber-500',
  'border-fuchsia-500',
  'border-cyan-500',
]

interface Compliance {
  kycStatus: string
  kycApproved: boolean
  eligible: boolean
  requirements: Array<{ key: string; label: string; met: boolean; status: string }>
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
  const [orderResult, setOrderResult] = useState<any>(null)

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

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  const handleInvest = async () => {
    if (!selected || !investAmount) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/investments/orders', {
        productId: selected.id,
        amount: Number(investAmount),
      })
      setOrderResult(data)
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const filtered = products.filter((p) => p.isOpen)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Investment Opportunities</h2>

      {compliance && !compliance.eligible && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 flex items-start gap-3">
          <div className="text-amber-500 text-lg shrink-0">⚠</div>
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">KYC verification required</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Your KYC status is <strong>{compliance.kycStatus}</strong>. You must complete KYC verification before you can invest.
            </p>
            {compliance.requirements.map((r) => !r.met && (
              <p key={r.key} className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                {r.label}: {r.status}
              </p>
            ))}
            <Button size="sm" className="mt-2" onClick={() => window.location.href = '/individual/kyc'}>
              Complete KYC
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All Types</option>
          <option value="shares">Shares</option>
          <option value="fixed_income">Fixed Income</option>
          <option value="pooled">Pooled Investment</option>
        </select>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All Risk Tiers</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">No investment opportunities available</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <Card key={p.id} className={`flex flex-col ${productBorders[filtered.indexOf(p) % productBorders.length]}`}>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <Badge variant={riskColors[p.riskTier] ?? 'default'}>{p.riskTier}</Badge>
              </div>
              <Badge variant={typeColors[p.type] ?? 'default'} className="self-start mb-2">
                {p.type.replace('_', ' ')}
              </Badge>
              {p.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{p.description}</p>
              )}
              <div className="space-y-1 text-sm mt-auto">
                <div className="flex justify-between">
                  <span className="text-gray-500">Min investment</span>
                  <span className="font-medium">{formatCurrency(p.minimumInvestment)}</span>
                </div>
                {p.expectedReturnRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected return</span>
                    <span className="font-medium text-green-600">{p.expectedReturnRate}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Distribution</span>
                  <span className="font-medium">{freqLabels[p.distributionFrequency] || p.distributionFrequency}</span>
                </div>
                {p.lockInDays > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lock-in</span>
                    <span className="font-medium">{p.lockInDays} days</span>
                  </div>
                )}
              </div>
              <Button className="w-full mt-4" disabled={!compliance?.eligible} onClick={() => { setSelected(p); setInvestAmount(''); setOrderResult(null) }}>
                {compliance?.eligible ? 'Invest Now' : 'KYC Required'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!selected && !orderResult} onClose={() => setSelected(null)} title={selected?.name || ''}>
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium capitalize">{selected.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Risk tier</span>
                <Badge variant={riskColors[selected.riskTier] ?? 'default'}>{selected.riskTier}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Min / Max</span>
                <span className="font-medium">{formatCurrency(selected.minimumInvestment)} {selected.maximumInvestment ? `- ${formatCurrency(selected.maximumInvestment)}` : '+'}</span>
              </div>
              {selected.unitPrice && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit price</span>
                  <span className="font-medium">{formatCurrency(selected.unitPrice)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Management fee</span>
                <span className="font-medium">{selected.managementFeeRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expected return</span>
                <span className="font-medium text-green-600">{selected.expectedReturnRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Distribution</span>
                <span className="font-medium">{freqLabels[selected.distributionFrequency]}</span>
              </div>
              {selected.lockInDays > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Lock-in period</span>
                  <span className="font-medium">{selected.lockInDays} days</span>
                </div>
              )}
              {selected.tenorDays && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tenor</span>
                  <span className="font-medium">{selected.tenorDays} days</span>
                </div>
              )}
              {selected.availableUnits !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Available units</span>
                  <span className="font-medium">{selected.availableUnits} / {selected.totalUnits}</span>
                </div>
              )}
            </div>

            <Input
              label="Investment amount"
              type="number"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
              placeholder={`Min ${formatCurrency(selected.minimumInvestment)}${selected.maximumInvestment ? ` - Max ${formatCurrency(selected.maximumInvestment)}` : ''}`}
            />

            <p className="text-xs text-gray-500">
              Range: {formatCurrency(selected.minimumInvestment)}
              {selected.maximumInvestment ? ` - ${formatCurrency(selected.maximumInvestment)}` : ' or more'}
            </p>

            {investAmount && !Number.isNaN(Number(investAmount)) && Number(investAmount) >= selected.minimumInvestment && (selected.maximumInvestment == null || Number(investAmount) <= selected.maximumInvestment) && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-medium">{formatCurrency(Number(investAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fee ({selected.managementFeeRate}%)</span>
                  <span className="font-medium">{formatCurrency(Number(investAmount) * selected.managementFeeRate / 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net investment</span>
                  <span className="font-medium">{formatCurrency(Number(investAmount) * (1 - selected.managementFeeRate / 100))}</span>
                </div>
                {selected.unitPrice && (
                  <div className="flex justify-between">
                    <span>Est. units</span>
                    <span className="font-medium">{Math.floor(Number(investAmount) * (1 - selected.managementFeeRate / 100) / selected.unitPrice)}</span>
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleInvest}
              disabled={submitting || !investAmount || Number.isNaN(Number(investAmount)) || Number(investAmount) < selected.minimumInvestment || (selected.maximumInvestment != null && Number(investAmount) > selected.maximumInvestment)}
            >
              {submitting ? 'Processing...' : 'Place Order'}
            </Button>
            {investAmount && !Number.isNaN(Number(investAmount)) && Number(investAmount) < selected.minimumInvestment && (
              <p className="text-xs text-red-500 text-center">Minimum investment is {formatCurrency(selected.minimumInvestment)}</p>
            )}
            {investAmount && !Number.isNaN(Number(investAmount)) && selected.maximumInvestment != null && Number(investAmount) > selected.maximumInvestment && (
              <p className="text-xs text-red-500 text-center">Maximum investment is {formatCurrency(selected.maximumInvestment)}</p>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!orderResult} onClose={() => { setOrderResult(null); setSelected(null) }} title="Order Placed">
        {orderResult && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center">
              <p className="text-green-600 font-medium text-lg">Order placed successfully</p>
              <p className="text-sm text-green-600 mt-1">Order #{orderResult.id.slice(0, 8)}</p>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">{formatCurrency(orderResult.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Units</span>
                <span className="font-medium">{orderResult.units}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fee</span>
                <span className="font-medium">{formatCurrency(orderResult.fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant="warning">{orderResult.status}</Badge>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Complete payment to confirm your investment. Visit Portfolio to make payment.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
