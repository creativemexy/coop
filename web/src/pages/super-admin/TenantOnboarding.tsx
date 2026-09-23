import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import {
  ClipboardList, Building2, Plus, RefreshCw, ChevronDown, Send,
  CheckCircle2, XCircle, CheckCheck, Inbox, AlertTriangle, Braces,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

interface OnboardingRequest {
  id: string
  orgName: string
  orgCode: string
  apexOrgId: string
  status: string
  complianceDocs: Record<string, any> | null
  kycRequirements: Record<string, any> | null
  productConfig: Record<string, any> | null
  contactInfo: Record<string, any> | null
  rejectionReason: string | null
  reviewNotes: string | null
  submittedBy: string
  reviewedBy: string | null
  createdAt: string
}

const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'compliance_review', label: 'Compliance review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'onboarded', label: 'Onboarded' },
]

const PAGE_SIZE = 10

const statusMeta = (s: string) => {
  const meta: Record<string, { label: string; cls: string; dot: string }> = {
    draft: { label: 'Draft', cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' },
    submitted: { label: 'Submitted', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' },
    compliance_review: { label: 'Compliance review', cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' },
    approved: { label: 'Approved', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' },
    rejected: { label: 'Rejected', cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' },
    onboarded: { label: 'Onboarded', cls: 'bg-[#176B5B] text-[#FFF9EF]', dot: 'bg-[#FFF9EF]' },
  }
  return meta[s] ?? { label: s, cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
}

const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const solidGreen =
  'inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidMaroon =
  'inline-flex items-center gap-2 rounded-full bg-[#9D4824] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#B85A38] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghostRed =
  'inline-flex items-center gap-2 rounded-full border border-[#B3261E]/30 bg-white px-4 py-2 text-sm font-semibold text-[#B3261E] transition hover:bg-[#B3261E]/5 disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
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
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`} aria-label="Previous page"><ChevronLeft size={16} /></button>
        {pages.map((p) => (
          <button key={p} type="button" onClick={() => onPage(p)} className={`${btn} ${p === page ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:bg-[#F0DDAD]/50'}`}>{p}</button>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}

export function TenantOnboarding() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [form, setForm] = useState({ orgName: '', orgCode: '', apexOrgId: '', contactInfo: '{}', productConfig: '{}' })

  useEffect(() => { setPage(1) }, [filterStatus])

  const pageRequests = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const load = (silent = false) => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (!silent) setError('')
    api.get(`/admin/super/onboarding?${params}`).then((r) => setRequests(r.data)).catch(() => setError('Failed to load onboarding requests'))
  }

  useEffect(() => { load() }, [filterStatus])

  const refresh = async () => {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 300))
    load(true)
    setRefreshing(false)
  }

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusy(id)
    setError('')
    try {
      await fn()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  const create = async () => {
    let contact: Record<string, any>
    let product: Record<string, any>
    try {
      contact = JSON.parse(form.contactInfo)
    } catch {
      setError('Contact info must be valid JSON.')
      return
    }
    try {
      product = JSON.parse(form.productConfig)
    } catch {
      setError('Product config must be valid JSON.')
      return
    }
    setBusy('create')
    setError('')
    try {
      await api.post('/admin/super/onboarding', {
        ...form,
        contactInfo: contact,
        productConfig: product,
      })
      setShowNew(false)
      setForm({ orgName: '', orgCode: '', apexOrgId: '', contactInfo: '{}', productConfig: '{}' })
      load()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create request')
    } finally {
      setBusy(null)
    }
  }

  const submit = (id: string) => run(id, () => api.post(`/admin/super/onboarding/${id}/submit`).then(() => load()))
  const approve = (id: string) => run(id, () => api.post(`/admin/super/onboarding/${id}/approve`).then(() => load()))
  const complete = (id: string) => run(id, () => api.post(`/admin/super/onboarding/${id}/complete`).then(() => load()))
  const reject = (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    run(id, () => api.post(`/admin/super/onboarding/${id}/reject`, { reason }).then(() => load()))
  }

  const hasJson = (r: OnboardingRequest) =>
    !!(r.complianceDocs || r.kycRequirements || r.productConfig || r.contactInfo)

  const jsonBlocks = (r: OnboardingRequest) => {
    const blocks: { title: string; data: Record<string, any> }[] = []
    if (r.complianceDocs) blocks.push({ title: 'Compliance docs', data: r.complianceDocs })
    if (r.kycRequirements) blocks.push({ title: 'KYC requirements', data: r.kycRequirements })
    if (r.productConfig) blocks.push({ title: 'Product config', data: r.productConfig })
    if (r.contactInfo) blocks.push({ title: 'Contact info', data: r.contactInfo })
    return blocks
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
              <ClipboardList size={22} className="text-[#176B5B]" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Onboarding Requests</h1>
              <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
                Review tenant onboarding requests and progress them through to live.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setShowNew(!showNew); setError('') }}
          className={showNew ? ghost : 'inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] cursor-pointer'}
        >
          {showNew ? <XCircle size={16} /> : <Plus size={16} />}
          {showNew ? 'Cancel' : 'New request'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#B3261E]/25 bg-[#B3261E]/5 px-4 py-3 text-sm font-medium text-[#B3261E]" role="alert">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* New request form */}
      {showNew && (
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176B5B]/10">
              <Building2 size={17} className="text-[#176B5B]" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-[-0.02em] text-[#2C1B13]">New onboarding request</h2>
              <p className="text-xs text-[#6B5245]">Create a draft that can be submitted for review.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label required>Organization name</Label>
              <input value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} placeholder="e.g. Ilera Savings Co-operative" className={fieldCls} />
            </div>
            <div>
              <Label required>Organization code</Label>
              <input value={form.orgCode} onChange={(e) => setForm({ ...form, orgCode: e.target.value })} placeholder="e.g. ILERA" className={`${fieldCls} font-mono`} />
            </div>
            <div>
              <Label required>Apex org ID</Label>
              <input value={form.apexOrgId} onChange={(e) => setForm({ ...form, apexOrgId: e.target.value })} placeholder="UUID of the apex organization" className={`${fieldCls} font-mono`} />
            </div>
            <div>
              <Label required>Contact info (JSON)</Label>
              <input value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} placeholder='{ "email": "...", "phone": "..." }' className={`${fieldCls} font-mono`} />
            </div>
            <div className="md:col-span-2">
              <Label required>Product config (JSON)</Label>
              <input value={form.productConfig} onChange={(e) => setForm({ ...form, productConfig: e.target.value })} placeholder='{ "plansEnabled": true }' className={`${fieldCls} font-mono`} />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={create} disabled={busy === 'create'} className={solidGreen}>
              {busy === 'create' && <RefreshCw size={15} className="animate-spin" />}
              {busy === 'create' ? 'Creating…' : 'Create request'}
            </button>
          </div>
        </div>
      )}

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none rounded-xl border border-[#E7DCCB] bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-[#23150F] shadow-sm outline-none transition cursor-pointer hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20"
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5245]" />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF9EF] px-3.5 py-1.5 text-xs font-semibold text-[#6B5245] ring-1 ring-[#E7DCCB]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#176B5B]" /> {requests.length} request{requests.length === 1 ? '' : 's'}
        </span>
        <button onClick={refresh} className={ghost.replace('px-4 py-2', 'px-3.5 py-2')}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Requests */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E7DCCB] bg-white/60 px-6 py-14 text-center">
          <Inbox size={26} className="text-[#C9B89F]" />
          <p className="text-sm font-semibold text-[#2C1B13]">
            {filterStatus ? 'No requests in this status' : 'No onboarding requests'}
          </p>
          <p className="max-w-sm text-xs leading-relaxed text-[#6B5245]">
            {filterStatus
              ? 'Try a different status filter.'
              : 'Start a new request to bring a tenant through onboarding.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pageRequests.map((r) => {
            const isOpen = expanded === r.id
            return (
              <div key={r.id} className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black tracking-[-0.01em] text-[#2C1B13]">{r.orgName}</p>
                      <code className="rounded-lg bg-[#FFF9EF] px-1.5 py-0.5 font-mono text-xs font-semibold text-[#176B5B] ring-1 ring-[#E7DCCB]">{r.orgCode}</code>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-[#6B5245]">
                      Apex: <span className="font-mono text-[#6B5245]">{r.apexOrgId.slice(0, 8)}</span>
                      <span className="mx-1.5 text-[#F0DDAD]">|</span>
                      Created {new Date(r.createdAt).toLocaleString()}
                    </p>
                    {r.rejectionReason && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#B3261E]/5 px-3 py-1.5 text-xs font-medium text-[#B3261E]">
                        <XCircle size={13} /> Reason: {r.rejectionReason}
                      </p>
                    )}
                    {r.reviewNotes && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-[#6B5245]">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#176B5B]" /> Notes: {r.reviewNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {r.status === 'draft' && (
                      <button onClick={() => submit(r.id)} disabled={busy === r.id} className={solidGreen}>
                        {busy === r.id ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        {busy === r.id ? 'Submitting…' : 'Submit'}
                      </button>
                    )}
                    {r.status === 'submitted' && (
                      <>
                        <button onClick={() => approve(r.id)} disabled={busy === r.id} className={solidGreen}>
                          {busy === r.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          {busy === r.id ? 'Approving…' : 'Approve'}
                        </button>
                        <button onClick={() => reject(r.id)} disabled={busy === r.id} className={ghostRed}>
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button onClick={() => complete(r.id)} disabled={busy === r.id} className={solidMaroon}>
                        {busy === r.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                        {busy === r.id ? 'Completing…' : 'Complete onboarding'}
                      </button>
                    )}
                    {hasJson(r) && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : r.id)}
                        className={`${ghost} px-3.5 py-2`}
                        aria-expanded={isOpen}
                      >
                        <Braces size={14} /> {isOpen ? 'Hide details' : 'View details'}
                        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
                {isOpen && (
                  <div className="space-y-3 border-t border-[#EDE2D3] bg-[#FFF9EF]/50 px-5 py-4">
                    {jsonBlocks(r).map((block) => (
                      <div key={block.title}>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">{block.title}</p>
                        <pre className="overflow-x-auto rounded-xl border border-[#E7DCCB] bg-white p-3 font-mono text-xs leading-relaxed text-[#23150F]">
                          {JSON.stringify(block.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
          <PaginationBar page={page} pageSize={PAGE_SIZE} total={requests.length} onPage={setPage} />
        </>
      )}
    </div>
  )
}