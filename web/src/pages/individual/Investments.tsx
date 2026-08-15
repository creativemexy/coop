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

  const checkPayment = async (): Promise<string | 'error'> => {
    if (!pay) return 'error'
    setChecking(true)
    try {
      const { data } = await api.post(`/virtual-accounts/investments/${pay.orderId}/verify`)
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

      <Modal open={!!orderResult && !pay} onClose={() => { setOrderResult(null); setSelected(null) }} title="Order Placed">
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
            <Button className="w-full" onClick={() => handleStartPayment(orderResult.id)}>
              Pay Now with Bank Transfer
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={!!pay} onClose={() => { setPay(null); setOrderResult(null); setSelected(null) }} title="Pay via Bank Transfer">
        {pay && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transfer <strong className="text-gray-900 dark:text-gray-100">{formatCurrency(pay.instruction.amount)}</strong>{' '}
              to the account below using your bank app. Your investment order will be confirmed once the payment is verified.
            </p>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-sm">
              <p className="text-xs text-gray-500">{pay.instruction.bankName}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold tracking-wider text-gray-900 dark:text-gray-100">
                  {pay.instruction.accountNumber}
                </p>
                <button onClick={copyAccount} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{pay.instruction.accountName}</p>
              <p className="text-xs text-gray-400 mt-2">Ref: {pay.instruction.reference}</p>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Status: {pay.instruction.status}{' · '}
              {pay.instruction.status === 'credited' ? 'Credited'
                : pay.instruction.status === 'expired' ? 'Expired'
                  : pay.instruction.expiresAt
                    ? `Transfers expire ${new Date(pay.instruction.expiresAt).toLocaleTimeString()}`
                    : 'Awaiting transfer'}
            </p>
            <Button className="w-full" disabled={checking} onClick={checkPayment}>
              {checking ? 'Checking...' : "I've transferred · Check"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => { setPay(null); setOrderResult(null); setSelected(null) }}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
