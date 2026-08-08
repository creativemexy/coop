import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/modal'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface Product {
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
  totalCapacity: number | null
  currentCapacity: number | null
  perInvestorCaps: { min?: number; max?: number } | null
  isOpen: boolean
  status: string
  version: number
  createdAt: string
}

interface Eligibility {
  id: string
  productId: string
  kycRequiredLevel: string
  requireMembership: boolean
  allowedGeographies: string[] | null
  accreditationRequired: boolean
  investorWhitelist: string[] | null
  investorBlacklist: string[] | null
}

interface Version {
  id: string
  version: number
  snapshot: Record<string, any>
  changeSummary: string | null
  changedBy: string | null
  createdAt: string
}

interface Cycle {
  id: string
  productId: string
  product?: { name: string }
  cycleName: string
  totalUnits: number
  allocatedUnits: number
  unitPrice: number
  totalValue: number
  openDate: string | null
  closeDate: string | null
  status: string
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
}

type Tab = 'lifecycle' | 'eligibility' | 'allocation' | 'cycles' | 'pricing' | 'nav' | 'corporate_actions' | 'distributions'

const typeColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  shares: 'info',
  fixed_income: 'success',
  pooled: 'warning',
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  draft: 'default',
  pending_review: 'warning',
  active: 'success',
  suspended: 'warning',
  closed: 'danger',
  archived: 'default',
}

const cycleStatusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  pending: 'warning',
  approved: 'info',
  active: 'success',
  closed: 'default',
}

const freqLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
  maturity: 'At Maturity',
}

const lifecycleActions: Record<string, { label: string; next: string }[]> = {
  draft: [{ label: 'Submit for Review', next: 'pending_review' }],
  pending_review: [{ label: 'Approve & Activate', next: 'active' }, { label: 'Return to Draft', next: 'draft' }],
  active: [{ label: 'Suspend', next: 'suspended' }, { label: 'Close', next: 'closed' }],
  suspended: [{ label: 'Reactivate', next: 'active' }, { label: 'Close', next: 'closed' }],
  closed: [{ label: 'Archive', next: 'archived' }],
  archived: [],
}

const emptyForm = {
  name: '',
  description: '',
  type: 'shares',
  riskTier: 'medium',
  minimumInvestment: '',
  maximumInvestment: '',
  unitPrice: '',
  lockInDays: '',
  tenorDays: '',
  managementFeeRate: '',
  expectedReturnRate: '',
  profitSharingRules: '',
  distributionFrequency: 'maturity',
  totalUnits: '',
  availableUnits: '',
}

export function InvestmentGovernance() {
  const [tab, setTab] = useState<Tab>('lifecycle')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [versionsProduct, setVersionsProduct] = useState<string | null>(null)
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null)
  const [detailsElig, setDetailsElig] = useState<Eligibility | null>(null)
  const [detailsPricing, setDetailsPricing] = useState<any>(null)

  const [, setEligibility] = useState<Eligibility | null>(null)
  const [eligibilityForm, setEligibilityForm] = useState({ kycRequiredLevel: 'basic', requireMembership: false, accreditationRequired: false, allowedGeographies: '', investorWhitelist: '', investorBlacklist: '' })

  const [capacityForm, setCapacityForm] = useState({ totalCapacity: '', perInvestorMin: '', perInvestorMax: '' })

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [cycleForm, setCycleForm] = useState({ cycleName: '', totalUnits: '', unitPrice: '', totalValue: '', openDate: '', closeDate: '' })
  const [showCycleForm, setShowCycleForm] = useState(false)

  const [pricingForm, setPricingForm] = useState({ formulaType: 'simple', minUnitPrice: '', maxUnitPrice: '', navSchedule: 'daily', allowCorporateActions: false, distributionApprovalRequired: true, accrualMethod: 'simple' })
  const [navSnapshots, setNavSnapshots] = useState<any[]>([])
  const [navForm, setNavForm] = useState({ nav: '', unitPrice: '', snapshotDate: '' })
  const [corpActions, setCorpActions] = useState<any[]>([])
  const [caForm, setCaForm] = useState({ type: 'split', description: '', ratioNumerator: '2', ratioDenominator: '1', effectiveDate: '' })
  const [showCaForm, setShowCaForm] = useState(false)
  const [distributions, setDistributions] = useState<any[]>([])
  const [distForm, setDistForm] = useState({ type: 'dividend', amountPerUnit: '', totalPool: '', recordDate: '', payDate: '', description: '' })
  const [showDistForm, setShowDistForm] = useState(false)
  const [distRuns, setDistRuns] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [payoutDistId, setPayoutDistId] = useState<string | null>(null)

  const selected = products.find((p) => p.id === selectedId)

  const load = () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (filterType) params.set('type', filterType)
    if (filterStatus) params.set('status', filterStatus)
    const qs = params.toString()
    api.get(`/investments/admin/products${qs ? `?${qs}` : ''}`)
      .then((r) => { setProducts(r.data); setLoading(false) })
      .catch((e) => { setError(e?.response?.data?.message || 'Failed to load products'); setLoading(false) })
  }

  useEffect(() => { load() }, [filterType, filterStatus])

  const loadEligibility = async (productId: string) => {
    const { data } = await api.get(`/investments/admin/products/${productId}/eligibility`)
    setEligibility(data)
    setEligibilityForm({
      kycRequiredLevel: data.kycRequiredLevel || 'basic',
      requireMembership: data.requireMembership || false,
      accreditationRequired: data.accreditationRequired || false,
      allowedGeographies: (data.allowedGeographies || []).join(', '),
      investorWhitelist: (data.investorWhitelist || []).join(', '),
      investorBlacklist: (data.investorBlacklist || []).join(', '),
    })
  }

  const loadCycles = async (productId: string) => {
    const { data } = await api.get(`/investments/admin/products/${productId}/issuance-cycles`)
    setCycles(data)
  }

  const selectProduct = (id: string) => {
    setSelectedId(id)
    setTab('lifecycle')
    loadEligibility(id)
    loadCycles(id)
    loadPricing(id)
    loadNavSnapshots(id)
    loadCorpActions(id)
    loadDistributions(id)
    loadDistRuns(id)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description || '',
      type: p.type,
      riskTier: p.riskTier,
      minimumInvestment: p.minimumInvestment.toString(),
      maximumInvestment: p.maximumInvestment?.toString() || '',
      unitPrice: p.unitPrice?.toString() || '',
      lockInDays: p.lockInDays.toString(),
      tenorDays: p.tenorDays?.toString() || '',
      managementFeeRate: p.managementFeeRate.toString(),
      expectedReturnRate: p.expectedReturnRate.toString(),
      profitSharingRules: p.profitSharingRules || '',
      distributionFrequency: p.distributionFrequency,
      totalUnits: p.totalUnits?.toString() || '',
      availableUnits: p.availableUnits?.toString() || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const body: Record<string, any> = {
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        riskTier: form.riskTier,
        minimumInvestment: Number(form.minimumInvestment),
        maximumInvestment: form.maximumInvestment ? Number(form.maximumInvestment) : undefined,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        lockInDays: Number(form.lockInDays),
        tenorDays: form.tenorDays ? Number(form.tenorDays) : undefined,
        managementFeeRate: Number(form.managementFeeRate),
        expectedReturnRate: Number(form.expectedReturnRate),
        profitSharingRules: form.profitSharingRules || undefined,
        distributionFrequency: form.distributionFrequency,
        totalUnits: form.totalUnits ? Number(form.totalUnits) : undefined,
        availableUnits: form.availableUnits ? Number(form.availableUnits) : undefined,
      }
      if (editing) {
        body.changeSummary = 'Updated by admin'
        await api.patch(`/investments/admin/products/${editing.id}`, body)
      } else {
        await api.post('/investments/admin/products', body)
      }
      setShowForm(false)
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save product')
    }
    setSubmitting(false)
  }

  const setStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/investments/admin/products/${id}/status`, { status })
      load()
      if (selectedId === id && selected) {
        const updated = products.find((p) => p.id === id)
        if (updated) setSelectedId(id)
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Status change failed')
    }
  }

  const saveEligibility = async () => {
    if (!selectedId) return
    try {
      await api.patch(`/investments/admin/products/${selectedId}/eligibility`, {
        kycRequiredLevel: eligibilityForm.kycRequiredLevel,
        requireMembership: eligibilityForm.requireMembership,
        accreditationRequired: eligibilityForm.accreditationRequired,
        allowedGeographies: eligibilityForm.allowedGeographies ? eligibilityForm.allowedGeographies.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        investorWhitelist: eligibilityForm.investorWhitelist ? eligibilityForm.investorWhitelist.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        investorBlacklist: eligibilityForm.investorBlacklist ? eligibilityForm.investorBlacklist.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      })
      loadEligibility(selectedId)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save eligibility')
    }
  }

  const saveCapacity = async () => {
    if (!selectedId) return
    try {
      await api.patch(`/investments/admin/products/${selectedId}/capacity`, {
        totalCapacity: capacityForm.totalCapacity ? Number(capacityForm.totalCapacity) : undefined,
        perInvestorCaps: {
          min: capacityForm.perInvestorMin ? Number(capacityForm.perInvestorMin) : undefined,
          max: capacityForm.perInvestorMax ? Number(capacityForm.perInvestorMax) : undefined,
        },
      })
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save capacity')
    }
  }

  const createCycle = async () => {
    if (!selectedId) return
    try {
      await api.post(`/investments/admin/products/${selectedId}/issuance-cycles`, {
        cycleName: cycleForm.cycleName,
        totalUnits: Number(cycleForm.totalUnits),
        unitPrice: Number(cycleForm.unitPrice),
        totalValue: Number(cycleForm.totalValue),
        openDate: cycleForm.openDate || undefined,
        closeDate: cycleForm.closeDate || undefined,
      })
      setShowCycleForm(false)
      setCycleForm({ cycleName: '', totalUnits: '', unitPrice: '', totalValue: '', openDate: '', closeDate: '' })
      loadCycles(selectedId)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create cycle')
    }
  }

  const loadPricing = async (productId: string) => {
    const { data } = await api.get(`/investments/admin/products/${productId}/pricing`)
    setPricingForm({
      formulaType: data.formulaType || 'simple',
      minUnitPrice: data.minUnitPrice?.toString() || '',
      maxUnitPrice: data.maxUnitPrice?.toString() || '',
      navSchedule: data.navSchedule || 'daily',
      allowCorporateActions: data.allowCorporateActions || false,
      distributionApprovalRequired: data.distributionApprovalRequired !== false,
      accrualMethod: data.accrualMethod || 'simple',
    })
  }

  const loadNavSnapshots = async (productId: string) => {
    const { data } = await api.get(`/investments/admin/products/${productId}/nav-snapshots`)
    setNavSnapshots(data)
  }

  const loadCorpActions = async (productId: string) => {
    const { data } = await api.get(`/investments/admin/products/${productId}/corporate-actions`)
    setCorpActions(data)
  }

  const loadDistributions = async (productId?: string) => {
    const params = productId ? `?productId=${productId}` : ''
    const { data } = await api.get(`/investments/admin/distributions${params}`)
    setDistributions(data)
  }

  const loadDistRuns = async (productId?: string) => {
    const params = productId ? `?productId=${productId}` : ''
    const { data } = await api.get(`/investments/admin/distribution-runs${params}`)
    setDistRuns(data)
  }

  const loadPayouts = async (distId: string) => {
    const { data } = await api.get(`/investments/admin/distributions/${distId}/payouts`)
    setPayouts(data)
    setPayoutDistId(distId)
  }

  const approveCycle = async (cycleId: string) => {
    try {
      await api.patch(`/investments/admin/issuance-cycles/${cycleId}/approve`)
      if (selectedId) loadCycles(selectedId)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to approve cycle')
    }
  }

  const viewVersions = async (id: string) => {
    setVersionsProduct(id)
    const { data } = await api.get(`/investments/admin/products/${id}/versions`)
    setVersions(data)
  }

  const openDetails = async (p: Product) => {
    setDetailsProduct(p)
    setDetailsElig(null)
    setDetailsPricing(null)
    try {
      const { data } = await api.get(`/investments/admin/products/${p.id}/eligibility`)
      setDetailsElig(data)
    } catch { /* ignore */ }
    try {
      const { data } = await api.get(`/investments/admin/products/${p.id}/pricing`)
      setDetailsPricing(data)
    } catch { /* ignore */ }
  }

  const formatCurrency = (n: number | null | undefined) =>
    n != null ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n) : '—'

  const formatStatus = (s: string) => s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Investment Governance</h2>
        <Button onClick={openCreate}>Create Product</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
          <option value="">All Types</option>
          <option value="shares">Shares</option>
          <option value="fixed_income">Fixed Income</option>
          <option value="pooled">Pooled</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
          <option value="">All Statuses</option>
          {['draft', 'pending_review', 'active', 'suspended', 'closed', 'archived'].map((s) => (
            <option key={s} value={s}>{formatStatus(s)}</option>
          ))}
        </select>
      </div>

      {selectedId && selected && (
        <div className="flex gap-2 flex-wrap border-b pb-2">
          <button onClick={() => setTab('lifecycle')}
            className={`px-3 py-1.5 text-sm rounded-t font-medium ${tab === 'lifecycle' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Lifecycle</button>
          <button onClick={() => { setTab('eligibility'); if (selectedId) loadEligibility(selectedId) }}
            className={`px-3 py-1.5 text-sm rounded-t font-medium ${tab === 'eligibility' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Eligibility</button>
          <button onClick={() => { setTab('allocation'); if (selectedId) loadEligibility(selectedId) }}
            className={`px-3 py-1.5 text-sm rounded-t font-medium ${tab === 'allocation' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Allocation</button>
          <button onClick={() => { setTab('cycles'); if (selectedId) loadCycles(selectedId) }}
            className={`px-3 py-1.5 text-sm rounded-t font-medium ${tab === 'cycles' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Issuance Cycles</button>
          <button onClick={() => { setTab('pricing'); if (selectedId) loadPricing(selectedId) }}
            className={`px-3 py-1.5 text-sm rounded-t font-medium ${tab === 'pricing' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Pricing</button>
          <button onClick={() => { setTab('nav'); if (selectedId) loadNavSnapshots(selectedId) }}
            className={`px-3 py-1.5 text-sm rounded-t font-medium ${tab === 'nav' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>NAV Snapshots</button>
          <button onClick={() => { setTab('corporate_actions'); if (selectedId) loadCorpActions(selectedId) }}
            className={`px-3 py-1.5 text-sm rounded-t font-medium ${tab === 'corporate_actions' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Corporate Actions</button>
          <button onClick={() => { setTab('distributions'); if (selectedId) { loadDistributions(selectedId); loadDistRuns(selectedId) } }}
            className={`px-3 py-1.5 text-sm rounded-t font-medium ${tab === 'distributions' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>Distributions</button>
        </div>
      )}

      {tab === 'lifecycle' && (
        <>
          <Card>
            <CardTitle>Products</CardTitle>
            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading products...</div>
            ) : error ? (
              <div className="py-12 text-center text-red-500">{error}</div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No investment products found. Click <strong>Create Product</strong> to add one.</div>
            ) : (
              <Table>
                <THead>
                  <THeadRow>
                    <THeadCell>Name</THeadCell>
                    <THeadCell>Type</THeadCell>
                    <THeadCell>Status</THeadCell>
                    <THeadCell>Version</THeadCell>
                    <THeadCell>Min / Max</THeadCell>
                    <THeadCell>Fee / Return</THeadCell>
                    <THeadCell>Capacity</THeadCell>
                    <THeadCell>Actions</THeadCell>
                  </THeadRow>
                </THead>
                <TBody>
                  {products.map((p) => (
                    <TBodyRow
                    key={p.id}
                    className={`cursor-pointer ${selectedId === p.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    onClick={() => selectProduct(p.id)}
                  >
                    <TBodyCell className="font-medium text-blue-600">{p.name}</TBodyCell>
                    <TBodyCell><Badge variant={typeColors[p.type] ?? 'default'}>{p.type}</Badge></TBodyCell>
                    <TBodyCell><Badge variant={statusColors[p.status] ?? 'default'}>{formatStatus(p.status)}</Badge></TBodyCell>
                    <TBodyCell>v{p.version}</TBodyCell>
                    <TBodyCell className="text-sm">{formatCurrency(p.minimumInvestment)} — {formatCurrency(p.maximumInvestment)}</TBodyCell>
                    <TBodyCell className="text-sm">{p.managementFeeRate}% / {p.expectedReturnRate}%</TBodyCell>
                    <TBodyCell className="text-sm">
                      {p.currentCapacity != null ? `${formatCurrency(p.currentCapacity)} / ${formatCurrency(p.totalCapacity)}` : '—'}
                    </TBodyCell>
                    <TBodyCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openDetails(p) }}>Details</Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(p) }}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); viewVersions(p.id) }}>History</Button>
                        {(lifecycleActions[p.status] || []).map((a) => (
                          <Button key={a.next} size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setStatus(p.id, a.next) }}>
                            {a.label}
                          </Button>
                        ))}
                      </div>
                    </TBodyCell>
                  </TBodyRow>
                  ))}
                </TBody>
              </Table>
            )}
            {selectedId && selected && (
              <div className="border-t dark:border-gray-700 px-4 py-3 flex gap-2 text-sm text-gray-500">
                <span>Selected: <strong className="text-gray-800 dark:text-gray-200">{selected.name}</strong></span>
                <span className="text-gray-300">|</span>
                <button className="text-blue-600 hover:underline" onClick={() => setTab('eligibility')}>Eligibility</button>
                <span className="text-gray-300">|</span>
                <button className="text-blue-600 hover:underline" onClick={() => setTab('allocation')}>Allocation</button>
                <span className="text-gray-300">|</span>
                <button className="text-blue-600 hover:underline" onClick={() => setTab('cycles')}>Cycles</button>
                <span className="text-gray-300">|</span>
                <button className="text-blue-600 hover:underline" onClick={() => setTab('pricing')}>Pricing</button>
                <span className="text-gray-300">|</span>
                <button className="text-blue-600 hover:underline" onClick={() => setTab('corporate_actions')}>Corporate Actions</button>
                <span className="text-gray-300">|</span>
                <button className="text-blue-600 hover:underline" onClick={() => setTab('distributions')}>Distributions</button>
              </div>
            )}
          </Card>

          {selectedId && selected && (
            <Card>
              <CardTitle>Lifecycle — {selected.name}</CardTitle>
              <div className="mt-4">
                <div className="flex items-center justify-center gap-0">
                  {['draft', 'pending_review', 'active', 'suspended', 'closed', 'archived'].map((s, i) => {
                    const idx = ['draft', 'pending_review', 'active', 'suspended', 'closed', 'archived'].indexOf(selected.status)
                    const stateIdx = ['draft', 'pending_review', 'active', 'suspended', 'closed', 'archived'].indexOf(s)
                    return (
                      <div key={s} className="flex items-center">
                        <div className={`flex flex-col items-center gap-1 ${stateIdx <= idx ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                            ${s === selected.status ? 'bg-blue-600 text-white ring-4 ring-blue-200' : stateIdx < idx ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                            {stateIdx < idx ? '✓' : s === selected.status ? s === 'active' ? '▶' : s.charAt(0).toUpperCase() : String(stateIdx + 1)}
                          </div>
                          <span className={`text-xs font-medium ${s === selected.status ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500'}`}>
                            {formatStatus(s)}
                          </span>
                        </div>
                        {i < 5 && <div className={`w-12 h-0.5 ${stateIdx < idx ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 flex justify-center gap-3">
                  {(lifecycleActions[selected.status] || []).map((a) => (
                    <Button key={a.next} size="sm" onClick={() => setStatus(selected.id, a.next)}>
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {tab === 'eligibility' && selectedId && (
        <Card>
          <CardTitle>Eligibility Rules — {selected?.name}</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">KYC Required Level</label>
              <select value={eligibilityForm.kycRequiredLevel} onChange={(e) => setEligibilityForm({ ...eligibilityForm, kycRequiredLevel: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                <option value="none">None</option>
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={eligibilityForm.requireMembership} onChange={(e) => setEligibilityForm({ ...eligibilityForm, requireMembership: e.target.checked })} />
              Require organization membership
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={eligibilityForm.accreditationRequired} onChange={(e) => setEligibilityForm({ ...eligibilityForm, accreditationRequired: e.target.checked })} />
              Require investor accreditation
            </label>
            <Input label="Allowed Geographies (comma-separated)" value={eligibilityForm.allowedGeographies} onChange={(e) => setEligibilityForm({ ...eligibilityForm, allowedGeographies: e.target.value })} placeholder="US, UK, EU" />
            <Input label="Investor Whitelist (user IDs)" value={eligibilityForm.investorWhitelist} onChange={(e) => setEligibilityForm({ ...eligibilityForm, investorWhitelist: e.target.value })} placeholder="uuid1, uuid2" />
            <Input label="Investor Blacklist (user IDs)" value={eligibilityForm.investorBlacklist} onChange={(e) => setEligibilityForm({ ...eligibilityForm, investorBlacklist: e.target.value })} placeholder="uuid3, uuid4" />
            <Button onClick={saveEligibility}>Save Eligibility Rules</Button>
          </div>
        </Card>
      )}

      {tab === 'allocation' && selectedId && (
        <Card>
          <CardTitle>Allocation Controls — {selected?.name}</CardTitle>
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Current capacity</span><span className="font-medium">{formatCurrency(selected.currentCapacity)}</span></div>
                <div className="flex justify-between"><span>Total capacity</span><span className="font-medium">{formatCurrency(selected.totalCapacity)}</span></div>
                <div className="flex justify-between"><span>Per-investor caps</span><span className="font-medium">{selected.perInvestorCaps ? `${formatCurrency(selected.perInvestorCaps.min)} — ${formatCurrency(selected.perInvestorCaps.max)}` : 'Not set'}</span></div>
              </div>
              <Input label="Total Capacity" type="number" value={capacityForm.totalCapacity} onChange={(e) => setCapacityForm({ ...capacityForm, totalCapacity: e.target.value })} placeholder="Set total capacity" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Per-investor Min" type="number" value={capacityForm.perInvestorMin} onChange={(e) => setCapacityForm({ ...capacityForm, perInvestorMin: e.target.value })} />
                <Input label="Per-investor Max" type="number" value={capacityForm.perInvestorMax} onChange={(e) => setCapacityForm({ ...capacityForm, perInvestorMax: e.target.value })} />
              </div>
              <Button onClick={saveCapacity}>Save Capacity Settings</Button>
            </div>
          )}
        </Card>
      )}

      {tab === 'cycles' && selectedId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dark:text-gray-100">Issuance Cycles — {selected?.name}</h3>
            <Button size="sm" onClick={() => setShowCycleForm(true)}>New Cycle</Button>
          </div>

          {cycles.length === 0 ? (
            <Card><div className="py-8 text-center text-gray-400">No issuance cycles</div></Card>
          ) : (
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Cycle</THeadCell>
                  <THeadCell>Units</THeadCell>
                  <THeadCell>Unit Price</THeadCell>
                  <THeadCell>Total Value</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell>Dates</THeadCell>
                  <THeadCell />
                </THeadRow>
              </THead>
              <TBody>
                {cycles.map((c) => (
                  <TBodyRow key={c.id}>
                    <TBodyCell className="font-medium">{c.cycleName}</TBodyCell>
                    <TBodyCell>{c.allocatedUnits} / {c.totalUnits}</TBodyCell>
                    <TBodyCell>{formatCurrency(c.unitPrice)}</TBodyCell>
                    <TBodyCell>{formatCurrency(c.totalValue)}</TBodyCell>
                    <TBodyCell><Badge variant={cycleStatusColors[c.status] ?? 'default'}>{c.status}</Badge></TBodyCell>
                    <TBodyCell className="text-xs">
                      {c.openDate ? `Open: ${c.openDate}` : ''}{c.closeDate ? ` Close: ${c.closeDate}` : ''}
                    </TBodyCell>
                    <TBodyCell>
                      {c.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => approveCycle(c.id)}>Approve</Button>}
                    </TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
          )}

          <Modal open={showCycleForm} onClose={() => setShowCycleForm(false)} title="New Issuance Cycle">
            <div className="space-y-4">
              <Input label="Cycle Name" value={cycleForm.cycleName} onChange={(e) => setCycleForm({ ...cycleForm, cycleName: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Total Units" type="number" value={cycleForm.totalUnits} onChange={(e) => setCycleForm({ ...cycleForm, totalUnits: e.target.value })} />
                <Input label="Unit Price" type="number" value={cycleForm.unitPrice} onChange={(e) => setCycleForm({ ...cycleForm, unitPrice: e.target.value })} />
              </div>
              <Input label="Total Value" type="number" value={cycleForm.totalValue} onChange={(e) => setCycleForm({ ...cycleForm, totalValue: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Open Date" type="date" value={cycleForm.openDate} onChange={(e) => setCycleForm({ ...cycleForm, openDate: e.target.value })} />
                <Input label="Close Date" type="date" value={cycleForm.closeDate} onChange={(e) => setCycleForm({ ...cycleForm, closeDate: e.target.value })} />
              </div>
              <Button className="w-full" onClick={createCycle} disabled={!cycleForm.cycleName || !cycleForm.totalUnits || !cycleForm.unitPrice}>Create Cycle</Button>
            </div>
          </Modal>
        </div>
      )}

      {tab === 'pricing' && selectedId && (
        <Card>
          <CardTitle>Pricing Config — {selected?.name}</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pricing Formula</label>
              <select value={pricingForm.formulaType} onChange={(e) => setPricingForm({ ...pricingForm, formulaType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                <option value="simple">Simple (amount ÷ unit price)</option>
                <option value="nav_based">NAV-based</option>
              </select>
            </div>
            {pricingForm.formulaType === 'nav_based' && (
              <div>
                <label className="block text-sm font-medium mb-1">NAV Schedule</label>
                <select value={pricingForm.navSchedule} onChange={(e) => setPricingForm({ ...pricingForm, navSchedule: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Min Unit Price" type="number" value={pricingForm.minUnitPrice} onChange={(e) => setPricingForm({ ...pricingForm, minUnitPrice: e.target.value })} />
              <Input label="Max Unit Price" type="number" value={pricingForm.maxUnitPrice} onChange={(e) => setPricingForm({ ...pricingForm, maxUnitPrice: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Accrual Method</label>
              <select value={pricingForm.accrualMethod} onChange={(e) => setPricingForm({ ...pricingForm, accrualMethod: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                <option value="simple">Simple</option>
                <option value="compound">Compound</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pricingForm.allowCorporateActions} onChange={(e) => setPricingForm({ ...pricingForm, allowCorporateActions: e.target.checked })} />
              Allow corporate actions (splits, buybacks, etc.)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pricingForm.distributionApprovalRequired} onChange={(e) => setPricingForm({ ...pricingForm, distributionApprovalRequired: e.target.checked })} />
              Require approval before distribution payout
            </label>
            <Button onClick={async () => {
              try {
                await api.patch(`/investments/admin/products/${selectedId}/pricing`, {
                  formulaType: pricingForm.formulaType,
                  minUnitPrice: pricingForm.minUnitPrice ? Number(pricingForm.minUnitPrice) : undefined,
                  maxUnitPrice: pricingForm.maxUnitPrice ? Number(pricingForm.maxUnitPrice) : undefined,
                  navSchedule: pricingForm.navSchedule,
                  allowCorporateActions: pricingForm.allowCorporateActions,
                  distributionApprovalRequired: pricingForm.distributionApprovalRequired,
                  accrualMethod: pricingForm.accrualMethod,
                })
                loadPricing(selectedId)
              } catch (e: any) {
                alert(e?.response?.data?.message || 'Failed to save pricing config')
              }
            }}>Save Pricing Config</Button>
          </div>
        </Card>
      )}

      {tab === 'nav' && selectedId && (
        <Card>
          <CardTitle>NAV Snapshots — {selected?.name}</CardTitle>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Input label="NAV" type="number" value={navForm.nav} onChange={(e) => setNavForm({ ...navForm, nav: e.target.value })} />
              <Input label="Unit Price" type="number" value={navForm.unitPrice} onChange={(e) => setNavForm({ ...navForm, unitPrice: e.target.value })} />
              <Input label="Date" type="date" value={navForm.snapshotDate} onChange={(e) => setNavForm({ ...navForm, snapshotDate: e.target.value })} />
            </div>
            <Button onClick={async () => {
              try {
                await api.post(`/investments/admin/products/${selectedId}/nav-snapshots`, {
                  nav: Number(navForm.nav),
                  unitPrice: Number(navForm.unitPrice),
                  snapshotDate: navForm.snapshotDate,
                })
                setNavForm({ nav: '', unitPrice: '', snapshotDate: '' })
                loadNavSnapshots(selectedId)
              } catch (e: any) {
                alert(e?.response?.data?.message || 'Failed to record NAV snapshot')
              }
            }} disabled={!navForm.nav || !navForm.unitPrice || !navForm.snapshotDate}>Record Snapshot</Button>
          </div>
          {navSnapshots.length === 0 ? (
            <div className="py-6 text-center text-gray-400">No NAV snapshots recorded</div>
          ) : (
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Date</THeadCell>
                  <THeadCell>NAV</THeadCell>
                  <THeadCell>Unit Price</THeadCell>
                  <THeadCell>Recorded At</THeadCell>
                </THeadRow>
              </THead>
              <TBody>
                {navSnapshots.map((s: any) => (
                  <TBodyRow key={s.id}>
                    <TBodyCell>{s.snapshotDate}</TBodyCell>
                    <TBodyCell>{formatCurrency(s.nav)}</TBodyCell>
                    <TBodyCell>{formatCurrency(s.unitPrice)}</TBodyCell>
                    <TBodyCell className="text-xs">{new Date(s.createdAt).toLocaleString()}</TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      )}

      {tab === 'corporate_actions' && selectedId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dark:text-gray-100">Corporate Actions — {selected?.name}</h3>
            <Button size="sm" onClick={() => setShowCaForm(true)}>New Action</Button>
          </div>
          {corpActions.length === 0 ? (
            <Card><div className="py-8 text-center text-gray-400">No corporate actions</div></Card>
          ) : (
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Type</THeadCell>
                  <THeadCell>Ratio</THeadCell>
                  <THeadCell>Effective Date</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell />
                </THeadRow>
              </THead>
              <TBody>
                {corpActions.map((a: any) => (
                  <TBodyRow key={a.id}>
                    <TBodyCell className="font-medium">{a.type}</TBodyCell>
                    <TBodyCell>{a.ratioNumerator}:{a.ratioDenominator}</TBodyCell>
                    <TBodyCell>{a.effectiveDate}</TBodyCell>
                    <TBodyCell><Badge variant={a.status === 'executed' ? 'success' : a.status === 'approved' ? 'info' : a.status === 'cancelled' ? 'danger' : 'warning'}>{a.status}</Badge></TBodyCell>
                    <TBodyCell>
                      {a.status === 'pending' && (
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try {
                            await api.patch(`/investments/admin/corporate-actions/${a.id}/approve`)
                            loadCorpActions(selectedId)
                          } catch (e: any) { alert(e?.response?.data?.message || 'Approval failed') }
                        }}>Approve</Button>
                      )}
                      {a.status === 'approved' && (
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try {
                            await api.post(`/investments/admin/corporate-actions/${a.id}/execute`)
                            loadCorpActions(selectedId)
                          } catch (e: any) { alert(e?.response?.data?.message || 'Execution failed') }
                        }}>Execute</Button>
                      )}
                    </TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
          )}
          <Modal open={showCaForm} onClose={() => setShowCaForm(false)} title="New Corporate Action">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={caForm.type} onChange={(e) => setCaForm({ ...caForm, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                  <option value="split">Split</option>
                  <option value="bonus">Bonus Shares</option>
                  <option value="dividend">Dividend</option>
                  <option value="buyback">Buyback</option>
                </select>
              </div>
              <Input label="Description" value={caForm.description} onChange={(e) => setCaForm({ ...caForm, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ratio (numerator)" type="number" value={caForm.ratioNumerator} onChange={(e) => setCaForm({ ...caForm, ratioNumerator: e.target.value })} />
                <Input label="Ratio (denominator)" type="number" value={caForm.ratioDenominator} onChange={(e) => setCaForm({ ...caForm, ratioDenominator: e.target.value })} />
              </div>
              <Input label="Effective Date" type="date" value={caForm.effectiveDate} onChange={(e) => setCaForm({ ...caForm, effectiveDate: e.target.value })} />
              <Button className="w-full" onClick={async () => {
                try {
                  await api.post(`/investments/admin/products/${selectedId}/corporate-actions`, {
                    type: caForm.type,
                    description: caForm.description || undefined,
                    ratioNumerator: Number(caForm.ratioNumerator),
                    ratioDenominator: Number(caForm.ratioDenominator),
                    effectiveDate: caForm.effectiveDate,
                  })
                  setShowCaForm(false)
                  setCaForm({ type: 'split', description: '', ratioNumerator: '2', ratioDenominator: '1', effectiveDate: '' })
                  loadCorpActions(selectedId)
                } catch (e: any) { alert(e?.response?.data?.message || 'Failed to create action') }
              }} disabled={!caForm.effectiveDate}>Create Corporate Action</Button>
            </div>
          </Modal>
        </div>
      )}

      {tab === 'distributions' && selectedId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold dark:text-gray-100">Distributions — {selected?.name}</h3>
            <Button size="sm" onClick={() => setShowDistForm(true)}>New Distribution</Button>
          </div>

          {distributions.length === 0 ? (
            <Card><div className="py-8 text-center text-gray-400">No distributions created</div></Card>
          ) : (
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Type</THeadCell>
                  <THeadCell>Per Unit</THeadCell>
                  <THeadCell>Total Pool</THeadCell>
                  <THeadCell>Record Date</THeadCell>
                  <THeadCell>Pay Date</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell />
                </THeadRow>
              </THead>
              <TBody>
                {distributions.map((d: any) => (
                  <TBodyRow key={d.id}>
                    <TBodyCell className="font-medium">{d.type}</TBodyCell>
                    <TBodyCell>{formatCurrency(d.amountPerUnit)}</TBodyCell>
                    <TBodyCell>{formatCurrency(d.totalPool)}</TBodyCell>
                    <TBodyCell className="text-xs">{d.recordDate}</TBodyCell>
                    <TBodyCell className="text-xs">{d.payDate}</TBodyCell>
                    <TBodyCell><Badge variant={d.status === 'executed' ? 'success' : d.status === 'approved' ? 'info' : d.status === 'pending_approval' ? 'warning' : 'default'}>{d.status}</Badge></TBodyCell>
                    <TBodyCell>
                      <div className="flex gap-1">
                        {d.status === 'draft' && (
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try {
                              await api.patch(`/investments/admin/distributions/${d.id}/submit`)
                              loadDistributions(selectedId)
                            } catch (e: any) { alert(e?.response?.data?.message || 'Submission failed') }
                          }}>Submit</Button>
                        )}
                        {d.status === 'pending_approval' && (
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try {
                              await api.patch(`/investments/admin/distributions/${d.id}/approve`)
                              loadDistributions(selectedId)
                            } catch (e: any) { alert(e?.response?.data?.message || 'Approval failed') }
                          }}>Approve</Button>
                        )}
                        {d.status === 'approved' && (
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try {
                              await api.post(`/investments/admin/distributions/${d.id}/compute-run`)
                              loadDistRuns(selectedId)
                              loadDistributions(selectedId)
                            } catch (e: any) { alert(e?.response?.data?.message || 'Compute failed') }
                          }}>Compute Run</Button>
                        )}
                        {d.status === 'executed' && (
                          <Button size="sm" variant="ghost" onClick={() => { loadPayouts(d.id) }}>Payouts</Button>
                        )}
                      </div>
                    </TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
          )}

          <Modal open={showDistForm} onClose={() => setShowDistForm(false)} title="New Distribution">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={distForm.type} onChange={(e) => setDistForm({ ...distForm, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                  <option value="dividend">Dividend</option>
                  <option value="interest">Interest</option>
                  <option value="profit_share">Profit Share</option>
                </select>
              </div>
              <Input label="Amount Per Unit" type="number" value={distForm.amountPerUnit} onChange={(e) => setDistForm({ ...distForm, amountPerUnit: e.target.value })} />
              <Input label="Total Pool" type="number" value={distForm.totalPool} onChange={(e) => setDistForm({ ...distForm, totalPool: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Record Date" type="date" value={distForm.recordDate} onChange={(e) => setDistForm({ ...distForm, recordDate: e.target.value })} />
                <Input label="Pay Date" type="date" value={distForm.payDate} onChange={(e) => setDistForm({ ...distForm, payDate: e.target.value })} />
              </div>
              <Input label="Description" value={distForm.description} onChange={(e) => setDistForm({ ...distForm, description: e.target.value })} />
              <Button className="w-full" onClick={async () => {
                try {
                  await api.post('/investments/admin/distributions', {
                    productId: selectedId,
                    type: distForm.type,
                    amountPerUnit: Number(distForm.amountPerUnit),
                    totalPool: Number(distForm.totalPool),
                    recordDate: distForm.recordDate,
                    payDate: distForm.payDate,
                    description: distForm.description || undefined,
                  })
                  setShowDistForm(false)
                  setDistForm({ type: 'dividend', amountPerUnit: '', totalPool: '', recordDate: '', payDate: '', description: '' })
                  loadDistributions(selectedId)
                } catch (e: any) { alert(e?.response?.data?.message || 'Failed to create distribution') }
              }} disabled={!distForm.amountPerUnit || !distForm.totalPool || !distForm.recordDate || !distForm.payDate}>Create Distribution</Button>
            </div>
          </Modal>

          <Card>
            <CardTitle>Distribution Runs</CardTitle>
            {distRuns.length === 0 ? (
              <div className="py-6 text-center text-gray-400">No distribution runs yet. Create & compute a distribution above.</div>
            ) : (
              <Table>
                <THead>
                  <THeadRow>
                    <THeadCell>Period</THeadCell>
                    <THeadCell>Accrued</THeadCell>
                    <THeadCell>Payouts</THeadCell>
                    <THeadCell>Success / Failed</THeadCell>
                    <THeadCell>Status</THeadCell>
                    <THeadCell />
                  </THeadRow>
                </THead>
                <TBody>
                  {distRuns.map((r: any) => (
                    <TBodyRow key={r.id}>
                      <TBodyCell className="text-xs">{r.periodStart?.slice(0, 10)} → {r.periodEnd?.slice(0, 10)}</TBodyCell>
                      <TBodyCell>{formatCurrency(r.totalAccrued)}</TBodyCell>
                      <TBodyCell>{r.payoutCount}</TBodyCell>
                      <TBodyCell>{r.successCount} / {r.failedCount}</TBodyCell>
                      <TBodyCell><Badge variant={r.status === 'paid' ? 'success' : r.status === 'approved' ? 'info' : r.status === 'payouts_ready' ? 'warning' : r.status === 'failed' ? 'danger' : 'default'}>{r.status}</Badge></TBodyCell>
                      <TBodyCell>
                        {r.status === 'payouts_ready' && (
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try {
                              await api.patch(`/investments/admin/distribution-runs/${r.id}/approve`)
                              loadDistRuns(selectedId)
                            } catch (e: any) { alert(e?.response?.data?.message || 'Approval failed') }
                          }}>Approve</Button>
                        )}
                        {r.status === 'approved' && (
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try {
                              await api.post(`/investments/admin/distribution-runs/${r.id}/execute`)
                              loadDistRuns(selectedId)
                              loadDistributions(selectedId)
                            } catch (e: any) { alert(e?.response?.data?.message || 'Execution failed') }
                          }}>Execute Payouts</Button>
                        )}
                      </TBodyCell>
                    </TBodyRow>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          {payoutDistId && (
            <Card>
              <CardTitle>Payouts <span className="text-sm font-normal text-gray-500">(click a row to toggle paid status)</span></CardTitle>
              {payouts.length === 0 ? (
                <div className="py-6 text-center text-gray-400">No payouts in this distribution</div>
              ) : (
                <Table>
                  <THead>
                    <THeadRow>
                      <THeadCell>User</THeadCell>
                      <THeadCell>Amount</THeadCell>
                      <THeadCell>Units</THeadCell>
                      <THeadCell>Paid</THeadCell>
                      <THeadCell>Paid At</THeadCell>
                    </THeadRow>
                  </THead>
                  <TBody>
                    {payouts.map((p: any) => (
                      <TBodyRow key={p.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={async () => {
                          try {
                            await api.patch(`/investments/admin/payouts/${p.id}`, { isPaid: !p.isPaid })
                            loadPayouts(payoutDistId)
                          } catch (e: any) { alert(e?.response?.data?.message || 'Failed to update payout') }
                        }}>
                        <TBodyCell className="text-xs font-mono">{p.userId.slice(0, 8)}…</TBodyCell>
                        <TBodyCell>{formatCurrency(p.amount)}</TBodyCell>
                        <TBodyCell>{p.unitsAtRecord}</TBodyCell>
                        <TBodyCell>{p.isPaid ? '✓' : '✗'}</TBodyCell>
                        <TBodyCell className="text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleString() : '—'}</TBodyCell>
                      </TBodyRow>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Product' : 'Create Product'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                <option value="shares">Shares</option>
                <option value="fixed_income">Fixed Income</option>
                <option value="pooled">Pooled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Risk Tier</label>
              <select value={form.riskTier} onChange={(e) => setForm({ ...form, riskTier: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min Investment *" type="number" value={form.minimumInvestment} onChange={(e) => setForm({ ...form, minimumInvestment: e.target.value })} />
            <Input label="Max Investment" type="number" value={form.maximumInvestment} onChange={(e) => setForm({ ...form, maximumInvestment: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Unit Price" type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
            <Input label="Lock-in Days" type="number" value={form.lockInDays} onChange={(e) => setForm({ ...form, lockInDays: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tenor Days" type="number" value={form.tenorDays} onChange={(e) => setForm({ ...form, tenorDays: e.target.value })} />
            <div>
              <label className="block text-sm font-medium mb-1">Distribution</label>
              <select value={form.distributionFrequency} onChange={(e) => setForm({ ...form, distributionFrequency: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
                {Object.entries(freqLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Mgmt Fee (%)" type="number" value={form.managementFeeRate} onChange={(e) => setForm({ ...form, managementFeeRate: e.target.value })} />
            <Input label="Return (%)" type="number" value={form.expectedReturnRate} onChange={(e) => setForm({ ...form, expectedReturnRate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total Units" type="number" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: e.target.value })} />
            <Input label="Available Units" type="number" value={form.availableUnits} onChange={(e) => setForm({ ...form, availableUnits: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Profit Sharing Rules</label>
            <textarea value={form.profitSharingRules} onChange={(e) => setForm({ ...form, profitSharingRules: e.target.value })} rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting || !form.name}>
            {submitting ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!detailsProduct} onClose={() => setDetailsProduct(null)} title={detailsProduct?.name ?? ''} className="max-w-2xl">
        {detailsProduct && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={typeColors[detailsProduct.type] ?? 'default'}>{detailsProduct.type}</Badge>
              <Badge variant={statusColors[detailsProduct.status] ?? 'default'}>{formatStatus(detailsProduct.status)}</Badge>
              <Badge variant="info">v{detailsProduct.version}</Badge>
            </div>

            {detailsProduct.description ? (
              <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{detailsProduct.description}</div>
            ) : (
              <p className="text-sm text-gray-400">No description provided.</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Investment Range</div>
                <div className="font-medium mt-1">{formatCurrency(detailsProduct.minimumInvestment)} — {formatCurrency(detailsProduct.maximumInvestment)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Unit Price</div>
                <div className="font-medium mt-1">{formatCurrency(detailsProduct.unitPrice)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Lock-in Period</div>
                <div className="font-medium mt-1">{detailsProduct.lockInDays} days</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Tenor</div>
                <div className="font-medium mt-1">{detailsProduct.tenorDays ? `${detailsProduct.tenorDays} days` : 'Open-ended'}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Management Fee</div>
                <div className="font-medium mt-1">{detailsProduct.managementFeeRate}%</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Expected Return</div>
                <div className="font-medium mt-1">{detailsProduct.expectedReturnRate}%</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Distribution</div>
                <div className="font-medium mt-1">{freqLabels[detailsProduct.distributionFrequency] ?? detailsProduct.distributionFrequency}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Capacity</div>
                <div className="font-medium mt-1">{formatCurrency(detailsProduct.currentCapacity)} / {formatCurrency(detailsProduct.totalCapacity)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Units</div>
                <div className="font-medium mt-1">{detailsProduct.availableUnits ?? '—'} / {detailsProduct.totalUnits ?? '—'}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase">Per-Investor Caps</div>
                <div className="font-medium mt-1">
                  {detailsProduct.perInvestorCaps
                    ? `${formatCurrency(detailsProduct.perInvestorCaps.min)} — ${formatCurrency(detailsProduct.perInvestorCaps.max)}`
                    : 'None'}
                </div>
              </div>
            </div>

            {detailsProduct.profitSharingRules && (
              <div className="rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase mb-1">Profit Sharing Rules</div>
                <div className="text-sm">{detailsProduct.profitSharingRules}</div>
              </div>
            )}

            {detailsElig && (
              <div className="rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase mb-1">Eligibility</div>
                <ul className="text-sm space-y-1">
                  <li>KYC required: <strong className="capitalize">{detailsElig.kycRequiredLevel}</strong></li>
                  <li>Membership required: <strong>{detailsElig.requireMembership ? 'Yes' : 'No'}</strong></li>
                  <li>Accreditation required: <strong>{detailsElig.accreditationRequired ? 'Yes' : 'No'}</strong></li>
                  <li>Allowed geographies: <strong>{detailsElig.allowedGeographies?.length ? detailsElig.allowedGeographies.join(', ') : 'All'}</strong></li>
                </ul>
              </div>
            )}

            {detailsPricing && (
              <div className="rounded-lg border dark:border-gray-700 p-3">
                <div className="text-xs text-gray-400 uppercase mb-1">Pricing</div>
                <ul className="text-sm space-y-1">
                  <li>Formula: <strong className="capitalize">{detailsPricing.formulaType}</strong></li>
                  <li>NAV schedule: <strong className="capitalize">{detailsPricing.navSchedule ?? 'n/a'}</strong></li>
                  <li>Corporate actions allowed: <strong>{detailsPricing.allowCorporateActions ? 'Yes' : 'No'}</strong></li>
                  <li>Distribution approval required: <strong>{detailsPricing.distributionApprovalRequired ? 'Yes' : 'No'}</strong></li>
                  <li>Accrual method: <strong className="capitalize">{detailsPricing.accrualMethod}</strong></li>
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!versionsProduct} onClose={() => { setVersionsProduct(null); setVersions([]) }} title="Version History">
        {versions.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No version history</div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {versions.map((v) => (
              <Card key={v.id}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">v{v.version}</span>
                  <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</span>
                </div>
                {v.changeSummary && <p className="text-sm text-gray-500 mt-1">{v.changeSummary}</p>}
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer">View snapshot</summary>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">{JSON.stringify(v.snapshot, null, 2)}</pre>
                </details>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
