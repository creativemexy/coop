import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import {
  Layers, Plus, Search, RefreshCw, Pencil, Clock, ToggleLeft, ToggleRight,
  AlertTriangle, History, CheckCircle2, X,
} from 'lucide-react'

interface Plan {
  id: string
  organizationId: string
  catalogItemId: string
  catalogItem?: { id: string; name: string; price: number }
  tenorOptions?: number[]
  minPrincipal?: number
  maxPrincipal?: number
  eligibilityBands?: Array<{ minScore: number; maxScore: number; maxPrincipal: number }>
  downPaymentPercent: number
  installmentCount: number
  installmentFrequency: string
  interestType: string
  interestRate: number
  monthlyFeeRate?: number
  gracePeriodDays: number
  lateFeeRate: number
  lateFeeCapDays?: number
  isEnabled: boolean
  status: string
  version: number
  createdAt: string
}

interface CatalogItem {
  id: string
  name: string
}

interface AuditLog {
  id: string
  action: string
  changes?: Record<string, { from: any; to: any }>
  performedBy: string
  performerName?: string
  createdAt: string
}

const frequencies = ['weekly', 'biweekly', 'monthly']
const interestTypes = ['flat', 'monthly_fee', 'reducing_balance']

const PAGE_SIZE = 10

const FREQ_LABEL: Record<string, string> = { weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly' }
const INTEREST_LABEL: Record<string, string> = {
  flat: 'Flat',
  monthly_fee: 'Monthly fee',
  reducing_balance: 'Reducing balance',
}

const disabledForm = {
  catalogItemId: '',
  tenorOptions: [3, 6, 9, 12],
  minPrincipal: 0,
  maxPrincipal: 0,
  downPaymentPercent: 0,
  installmentCount: 3,
  installmentFrequency: 'monthly',
  interestType: 'flat',
  interestRate: 0,
  monthlyFeeRate: 0,
  gracePeriodDays: 0,
  lateFeeRate: 0,
  lateFeeCapDays: 30,
  isEnabled: true,
}

const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const solidGreen =
  'inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

function StatusPill({ status }: { status: string }) {
  const meta =
    status === 'active'
      ? { label: 'Active', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
      : status === 'inactive'
        ? { label: 'Inactive', cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }
        : { label: 'Retired', cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function EnabledPill({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#176B5B]/10 px-2.5 py-1 text-xs font-semibold text-[#176B5B]">
      <CheckCircle2 size={12} /> Enabled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E4A42A]/15 px-2.5 py-1 text-xs font-semibold text-[#8A5A00]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#E4A42A]" /> Disabled
    </span>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
      {children}
      {required && <span className="text-[#E4A42A]"> *</span>}
    </label>
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
  icon: React.ReactNode
  iconCls: string
  title: string
  subtitle?: string
  children: React.ReactNode
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

function PaginationBar({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
}) {
  if (total === 0) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const lo = Math.max(1, page - 2)
  const pages: number[] = []
  for (let p = lo; p <= lo + 4 && p <= totalPages; p++) pages.push(p)

  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE2D3] px-5 py-3.5">
      <p className="text-xs font-medium text-[#6B5245]">
        Showing <span className="font-bold text-[#2C1B13]">{start}–{end}</span> of{' '}
        <span className="font-bold text-[#2C1B13]">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`} aria-label="Previous page">‹</button>
        {pages.map((p) => (
          <button key={p} type="button" onClick={() => onPage(p)} className={`${btn} ${p === page ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:bg-[#F0DDAD]/50'}`}>{p}</button>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`} aria-label="Next page">›</button>
      </div>
    </div>
  )
}

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [form, setForm] = useState(disabledForm)
  const [createError, setCreateError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetch = useCallback(() => {
    api.get('/bnpl/plans').then((r) => setPlans(r.data)).catch(() => {}).finally(() => setLoading(false))
    api.get('/bnpl/catalog').then((r) => setCatalogItems(r.data)).catch(() => {})
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const refresh = async () => {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 300))
    fetch()
    setRefreshing(false)
  }

  const filtered = plans.filter((p) =>
    (p.catalogItem?.name ?? '').toLowerCase().includes(search.toLowerCase()),
  )
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeCount = plans.filter((p) => p.status === 'active').length
  const enabledCount = plans.filter((p) => p.isEnabled).length

  const openCreate = () => {
    setForm(disabledForm)
    setCreateError('')
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    setCreateError('')
    try {
      await api.post('/bnpl/plans', form)
      setCreateOpen(false)
      setPage(1)
      fetch()
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || 'Failed to create repayment plan')
    }
  }

  const handleToggleStatus = async (plan: Plan) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active'
    await api.patch(`/bnpl/plans/${plan.id}`, { status: nextStatus })
    fetch()
  }

  const handleViewHistory = async (plan: Plan) => {
    setSelectedPlan(plan)
    const { data } = await api.get(`/bnpl/plans/${plan.id}/version-history`)
    setAuditLogs(data)
    setHistoryOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <Layers size={22} className="text-[#176B5B]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Repayment Plans</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              Tenor, pricing, and repayment rules attached to catalog items.
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] cursor-pointer">
          <Plus size={16} /> Create
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <Layers size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Repayment plans</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{plans.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <CheckCircle2 size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Active</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <ToggleRight size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Enabled</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{enabledCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9B89F]">
          <Search size={16} />
        </span>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by catalog item..."
          className={`${fieldCls} pl-10`}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#C9B89F] hover:text-[#2C1B13] cursor-pointer"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE2D3] px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Plans</h2>
            <p className="text-xs text-[#6B5245]">
              {filtered.length} of {plans.length} {filtered.length === 1 ? 'result' : 'results'}{search ? ` for “${search}”` : ''}
            </p>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-3.5 py-2 text-xs font-semibold text-[#6B5245] transition hover:border-[#176B5B]/40 hover:text-[#176B5B] cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FFF9EF]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Item</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Tenor (mo)</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Principal range</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Down %</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Installments</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Interest</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Enabled</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Version</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2D3]">
              {loading && plans.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={10} className="px-5 py-6">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-[#F0DDAD]/40" />
                    </td>
                  </tr>
                ))
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-[#6B5245]">
                      <Layers size={22} className="text-[#C9B89F]" />
                      <p className="text-sm font-semibold text-[#2C1B13]">
                        {search ? 'No plans match your search' : 'No repayment plans found'}
                      </p>
                      <p className="text-xs">
                        {search ? 'Try a different catalog item name.' : 'Create your first repayment plan to get started.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => (
                  <tr key={p.id} className="transition hover:bg-[#FFF9EF]">
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-[#2C1B13]">{p.catalogItem?.name ?? '—'}</p>
                      {p.catalogItem?.price ? (
                        <p className="text-xs text-[#6B5245]">₦{Number(p.catalogItem.price).toLocaleString()}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-[#6B5245]">{p.tenorOptions?.join(', ') ?? '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-[#2C1B13]">
                      {p.minPrincipal && p.maxPrincipal
                        ? `₦${Number(p.minPrincipal).toLocaleString()} – ₦${Number(p.maxPrincipal).toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-[#2C1B13]">{p.downPaymentPercent}%</td>
                    <td className="px-5 py-3 text-sm text-[#2C1B13]">{p.installmentCount}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-semibold text-[#2C1B13]">{INTEREST_LABEL[p.interestType] ?? p.interestType}</p>
                      <p className="text-xs text-[#6B5245]">
                        {p.interestType === 'monthly_fee'
                          ? `${p.monthlyFeeRate ?? 0}% monthly fee`
                          : `${p.interestRate}% rate`}
                      </p>
                    </td>
                    <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-5 py-3"><EnabledPill enabled={p.isEnabled} /></td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0DDAD]/50 px-2.5 py-1 text-xs font-bold text-[#7A5A00]">
                        <History size={12} /> v{p.version}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleViewHistory(p)} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#F0DDAD]/50 hover:text-[#23150F] cursor-pointer">
                          <Clock size={13} /> History
                        </button>
                        <button onClick={() => handleToggleStatus(p)} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#F0DDAD]/50 hover:text-[#23150F] cursor-pointer">
                          {p.status === 'active' ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                          {p.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
      </div>

      {/* Create modal */}
      <BrandModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        icon={<Plus size={20} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title="Create repayment plan"
        subtitle="Define the repayment rules for a catalog item."
      >
        <div className="space-y-4">
          <div>
            <Label required>Catalog item</Label>
            <select
              value={form.catalogItemId}
              onChange={(e) => setForm({ ...form, catalogItemId: e.target.value })}
              className={`${fieldCls} appearance-none`}
            >
              <option value="">Select item</option>
              {catalogItems.filter((i) => i.id).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Tenor options (months)</Label>
            <div className="flex flex-wrap gap-2">
              {[3, 6, 9, 12].map((tenor) => {
                const on = form.tenorOptions.includes(tenor)
                return (
                  <button
                    key={tenor}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        tenorOptions: on
                          ? form.tenorOptions.filter((t) => t !== tenor)
                          : [...form.tenorOptions, tenor],
                      })
                    }
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 text-sm font-bold transition cursor-pointer ${
                      on
                        ? 'border-[#176B5B] bg-[#176B5B] text-[#FFF9EF] shadow-sm'
                        : 'border-[#E7DCCB] bg-white text-[#6B5245] hover:border-[#176B5B]/50'
                    }`}
                    aria-pressed={on}
                  >
                    {tenor}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Min principal (₦)</Label>
              <input type="number" min={0} value={form.minPrincipal} onChange={(e) => setForm({ ...form, minPrincipal: Number(e.target.value) })} className={fieldCls} />
            </div>
            <div>
              <Label>Max principal (₦)</Label>
              <input type="number" min={0} value={form.maxPrincipal} onChange={(e) => setForm({ ...form, maxPrincipal: Number(e.target.value) })} className={fieldCls} />
            </div>
          </div>

          <div>
            <Label required>Down payment %</Label>
            <input type="number" min={0} value={form.downPaymentPercent} onChange={(e) => setForm({ ...form, downPaymentPercent: Number(e.target.value) })} className={fieldCls} />
          </div>

          <div>
            <Label required>Installment count</Label>
            <input type="number" min={1} value={form.installmentCount} onChange={(e) => setForm({ ...form, installmentCount: Number(e.target.value) })} className={fieldCls} />
          </div>

          <div>
            <Label>Frequency</Label>
            <select
              value={form.installmentFrequency}
              onChange={(e) => setForm({ ...form, installmentFrequency: e.target.value })}
              className={`${fieldCls} appearance-none`}
            >
              {frequencies.map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
            </select>
          </div>

          <div>
            <Label>Interest type</Label>
            <select
              value={form.interestType}
              onChange={(e) => setForm({ ...form, interestType: e.target.value })}
              className={`${fieldCls} appearance-none`}
            >
              {interestTypes.map((t) => <option key={t} value={t}>{INTEREST_LABEL[t]}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Interest rate %</Label>
              <input type="number" min={0} value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })} className={fieldCls} />
            </div>
            <div>
              <Label>Monthly fee rate %</Label>
              <input type="number" min={0} value={form.monthlyFeeRate} onChange={(e) => setForm({ ...form, monthlyFeeRate: Number(e.target.value) })} className={fieldCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Grace period (days)</Label>
              <input type="number" min={0} value={form.gracePeriodDays} onChange={(e) => setForm({ ...form, gracePeriodDays: Number(e.target.value) })} className={fieldCls} />
            </div>
            <div>
              <Label>Late fee rate %</Label>
              <input type="number" min={0} value={form.lateFeeRate} onChange={(e) => setForm({ ...form, lateFeeRate: Number(e.target.value) })} className={fieldCls} />
            </div>
          </div>

          <div>
            <Label>Late fee cap (days)</Label>
            <input type="number" min={0} value={form.lateFeeCapDays} onChange={(e) => setForm({ ...form, lateFeeCapDays: Number(e.target.value) })} className={fieldCls} />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isEnabled: !form.isEnabled })}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition cursor-pointer ${
                form.isEnabled ? 'border-[#176B5B]/30 bg-[#176B5B]/5' : 'border-[#E7DCCB] bg-white'
              }`}
              aria-pressed={form.isEnabled}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[#2C1B13]">
                {form.isEnabled ? <ToggleRight size={17} className="text-[#176B5B]" /> : <ToggleLeft size={17} className="text-[#C9B89F]" />}
                Enable plan
              </span>
              <span className={`text-xs font-bold ${form.isEnabled ? 'text-[#176B5B]' : 'text-[#6B5245]'}`}>
                {form.isEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {createError && (
            <p className="flex items-center gap-1.5 rounded-xl bg-[#B3261E]/5 px-3.5 py-2.5 text-xs font-semibold text-[#B3261E]" role="alert">
              <AlertTriangle size={13} /> {createError}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-[#EDE2D3] pt-4">
            <button onClick={() => setCreateOpen(false)} className={ghost}>Cancel</button>
            <button onClick={handleCreate} disabled={!form.catalogItemId || !form.downPaymentPercent} className={solidGreen}>
              Create
            </button>
          </div>
        </div>
      </BrandModal>

      {/* Version history modal */}
      <BrandModal
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setSelectedPlan(null) }}
        icon={<Clock size={20} className="text-[#9D4824]" />}
        iconCls="bg-[#9D4824]/10"
        title="Version History"
        subtitle={selectedPlan?.catalogItem?.name ? `Changes to ${selectedPlan.catalogItem.name}` : undefined}
      >
        <div className="space-y-3">
          {auditLogs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E7DCCB] px-4 py-8 text-center text-sm text-[#6B5245]">
              No version history available
            </p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-[#E7DCCB] bg-[#FFF9EF]/50 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9D4824]/10 px-2.5 py-1 text-xs font-bold text-[#9D4824]">
                    <Pencil size={12} /> {log.action}
                  </span>
                  <span className="text-xs font-medium text-[#6B5245]">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p className="mb-2 text-xs text-[#6B5245]">
                  By: <span className="font-semibold text-[#2C1B13]">{log.performerName || log.performedBy}</span>
                </p>
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="mt-2 grid gap-1.5">
                    {Object.entries(log.changes).map(([field, change]) => (
                      <div key={field} className="rounded-lg bg-white p-2.5 ring-1 ring-[#EDE2D3]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B5245]">
                          {field.replace(/_/g, ' ')}:
                        </span>
                        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs">
                          <span className="text-[#B3261E] line-through">{String(change.from ?? '—')}</span>
                          <span className="text-[#C9B89F]">→</span>
                          <span className="font-semibold text-[#176B5B]">{String(change.to ?? '—')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <button onClick={() => setHistoryOpen(false)} className={`${ghost} w-full justify-center`}>Close</button>
        </div>
      </BrandModal>
    </div>
  )
}