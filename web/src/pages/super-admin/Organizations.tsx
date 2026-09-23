import { useEffect, useState, useCallback, useRef, Fragment } from 'react'
import {
  Building2, Mail, User, Landmark, Plus, Search, RefreshCw, ChevronLeft,
  ChevronRight, ChevronDown, Pencil, Eye, CheckCircle2, AlertTriangle,
  ShieldCheck, CreditCard, Copy, Check, Phone, MapPin, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { NUBAN_BANKS, parseAddress, composeAddress } from '../../lib/banks'
import { api } from '../../api/client'

interface Org {
  id: string
  name: string
  code: string
  status: string
  apexOrgId: string
  apexOrg?: { id: string; name: string }
  address?: string
  contactEmail?: string
  contactPhone?: string
  contactPersonName?: string
  contactPersonPhone?: string
  contactPersonEmail?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  sortCode?: string
  bankCode?: string
  createdAt: string
}

interface OrgForm {
  name: string
  apexOrgId: string
  houseNumber: string
  streetName: string
  city: string
  state: string
  contactEmail: string
  contactPhone: string
  contactPersonName: string
  contactPersonPhone: string
  contactPersonEmail: string
  bankName: string
  accountName: string
  accountNumber: string
  sortCode: string
  bankCode: string
}

const emptyForm = (): OrgForm => ({
  name: '', apexOrgId: '',
  houseNumber: '', streetName: '', city: '', state: '',
  contactEmail: '', contactPhone: '',
  contactPersonName: '', contactPersonPhone: '', contactPersonEmail: '',
  bankName: '', accountName: '', accountNumber: '', sortCode: '', bankCode: '',
})

const PAGE_SIZE = 10

const statusMeta = (s: string) =>
  s === 'active'
    ? { label: 'Active', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    : { label: s === 'pending' ? 'Pending' : 'Inactive', cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }

const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20 read-only:cursor-not-allowed read-only:bg-[#FFF9EF] read-only:text-[#6B5245] read-only:hover:border-[#E7DCCB]'

function Field({
  id,
  label,
  required,
  value,
  onChange,
  readOnly,
  placeholder,
  icon,
  hint,
}: {
  id: string
  label: string
  required?: boolean
  value: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  readOnly?: boolean
  placeholder?: string
  icon?: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
        {label}
        {required && <span className="text-[#E4A42A]"> *</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9B89F]">{icon}</span>
        )}
        <input
          id={id}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`${fieldCls} ${icon ? 'pl-10' : ''}`}
        />
      </div>
      {hint && <div className="mt-1 text-xs text-[#6B5245]">{hint}</div>}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
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
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`${btn} ${
              p === page
                ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm'
                : 'text-[#6B5245] hover:bg-[#F0DDAD]/50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function BrandModal({
  open,
  onClose,
  icon,
  iconCls,
  title,
  subtitle,
  wide,
  children,
}: {
  open: boolean
  onClose: () => void
  icon: React.ReactNode
  iconCls: string
  title: string
  subtitle?: string
  wide?: boolean
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
        className={`relative z-10 max-h-[92vh] w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-2xl`}
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
            ✕
          </button>
        </div>
        <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function ApexSelect({
  id,
  label,
  required,
  value,
  onChange,
  apexOrgs,
}: {
  id: string
  label: string
  required?: boolean
  value: string
  onChange: (v: string) => void
  apexOrgs: { id: string; name: string }[]
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
        {label}
        {required && <span className="text-[#E4A42A]"> *</span>}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9B89F]">
          <Landmark size={15} />
        </span>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldCls} appearance-none pl-10 pr-9`}
        >
          <option value="">Select apex org</option>
          {apexOrgs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#C9B89F]">
          <ChevronDown size={15} />
        </span>
      </div>
    </div>
  )
}

export function Organizations() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Org | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [apexOrgs, setApexOrgs] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<OrgForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [step, setStep] = useState(1)
  const [stepError, setStepError] = useState('')
  const [createdResult, setCreatedResult] = useState<{ email: string; password: string; code: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const resolveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetch = useCallback(() => {
    api.get('/organizations').then((r) => setOrgs(r.data)).catch(() => {}).finally(() => setLoading(false))
    api.get('/apex-organizations').then((r) => setApexOrgs(r.data)).catch(() => {})
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = orgs.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.code.toLowerCase().includes(search.toLowerCase()),
  )
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const activeCount = orgs.filter((o) => o.status === 'active').length
  const inactiveCount = orgs.length - activeCount

  const handleCreate = async () => {
    setSaving(true)
    try {
      const { data } = await api.post('/organizations', { ...form, address: composeAddress(form) })
      setCreatedResult({
        email: data.generatedEmail || '',
        password: data.generatedPassword || '',
        code: data.code || '',
      })
      setCreateOpen(false)
      setForm(emptyForm())
      fetch()
    } catch {
      // creation failed — keep wizard open
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.patch(`/organizations/${selected.id}`, { ...form, address: composeAddress(form) })
      setEditOpen(false)
      setSelected(null)
      setForm(emptyForm())
      fetch()
    } catch {
      // save failed
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setForm(emptyForm())
    setStep(1)
    setStepError('')
    setPage(1)
    setCreateOpen(true)
  }

  const openEdit = (o: Org) => {
    setSelected(o)
    const addr = parseAddress(o.address)
    setForm({
      name: o.name, apexOrgId: o.apexOrgId,
      houseNumber: addr.houseNumber, streetName: addr.streetName, city: addr.city, state: addr.state,
      contactEmail: o.contactEmail || '', contactPhone: o.contactPhone || '',
      contactPersonName: o.contactPersonName || '', contactPersonPhone: o.contactPersonPhone || '',
      contactPersonEmail: o.contactPersonEmail || '',
      bankName: o.bankName || '', accountName: o.accountName || '',
      accountNumber: o.accountNumber || '', sortCode: o.sortCode || '',
      bankCode: o.bankCode || '',
    })
    setEditOpen(true)
  }

  const resolveAccountName = async (accountNumber: string, bankCode: string) => {
    if (accountNumber.length !== 10 || !bankCode) return
    setResolving(true)
    try {
      const { data } = await api.get('/organizations/bank/resolve', {
        params: { accountNumber, bankCode },
      })
      if (data?.resolved && data.accountName) {
        setForm((f) => ({ ...f, accountName: f.accountName || data.accountName }))
      }
    } catch {
      // name enquiry unavailable — user can type the account name manually
    } finally {
      setResolving(false)
    }
  }

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm((f) => ({ ...f, accountNumber: digits }))

    if (resolveTimer.current) clearTimeout(resolveTimer.current)

    if (digits.length === 10) {
      const bank = NUBAN_BANKS[digits.slice(0, 3)]
      if (bank) {
        setForm((f) => ({
          ...f,
          bankName: f.bankName || bank.name,
          bankCode: f.bankCode || digits.slice(0, 3),
          sortCode: f.sortCode || bank.sortCode,
        }))
      }
      resolveTimer.current = setTimeout(() => {
        const code = bank ? digits.slice(0, 3) : ''
        resolveAccountName(digits, code)
      }, 400)
    }
  }

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      // clipboard unavailable
    }
  }

  const normalize = (s: string) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim()

  const requiredFields: (keyof OrgForm)[] = [
    'name', 'apexOrgId', 'houseNumber', 'streetName', 'city', 'state',
    'contactEmail', 'contactPhone',
    'contactPersonName', 'contactPersonPhone', 'contactPersonEmail',
    'bankName', 'accountName', 'accountNumber', 'sortCode', 'bankCode',
  ]
  const allRequiredFilled = requiredFields.every((k) => (form[k] ?? '').toString().trim() !== '')
  const accountNameMatchesOrg = normalize(form.accountName) === normalize(form.name)
  const canCreate = allRequiredFilled && accountNameMatchesOrg

  const stepTitles = ['Organization', 'Contact Details', 'Contact Person', 'Bank Details']
  const stepIcons = [Building2, Mail, User, Landmark]
  const stepFields: (keyof OrgForm)[][] = [
    ['name', 'apexOrgId', 'houseNumber', 'streetName', 'city', 'state'],
    ['contactEmail', 'contactPhone'],
    ['contactPersonName', 'contactPersonPhone', 'contactPersonEmail'],
    ['bankName', 'accountName', 'accountNumber', 'sortCode', 'bankCode'],
  ]
  const currentStepComplete = stepFields[step - 1].every((k) => (form[k] ?? '').toString().trim() !== '')
  const isLastStep = step === stepTitles.length

  const nextStep = () => {
    if (!currentStepComplete) {
      setStepError(`Please complete all fields in the "${stepTitles[step - 1]}" step.`)
      return
    }
    setStepError('')
    setStep((s) => Math.min(s + 1, stepTitles.length))
  }
  const backStep = () => {
    setStepError('')
    setStep((s) => Math.max(s - 1, 1))
  }

  const UnknownBankNote = () => (
    <p className="inline-flex items-center gap-1.5 rounded-lg bg-[#F7D674]/25 px-3 py-2 text-xs font-medium text-[#7A5A00]">
      <AlertTriangle size={13} /> Unknown bank code — auto-fill stays locked until a known bank is entered.
    </p>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
              <Building2 size={22} className="text-[#176B5B]" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Tenant Organizations</h1>
              <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
                Member organizations, their apex groups, contacts, and settlement bank details.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] cursor-pointer"
        >
          <Plus size={16} /> New organization
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <Building2 size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Tenant groups</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{orgs.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <ShieldCheck size={16} className="text-[#176B5B]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Active</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B3261E]/10">
              <AlertTriangle size={16} className="text-[#B3261E]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Inactive</p>
          </div>
          <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{inactiveCount}</p>
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
          placeholder="Search by name or code..."
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
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Organizations</h2>
            <p className="text-xs text-[#6B5245]">
              {filtered.length} of {orgs.length} {filtered.length === 1 ? 'result' : 'results'}{search ? ` for “${search}”` : ''}
            </p>
          </div>
          <button
            onClick={fetch}
            className="inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-3.5 py-2 text-xs font-semibold text-[#6B5245] transition hover:border-[#176B5B]/40 hover:text-[#176B5B] cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FFF9EF]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Apex org</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Created</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2D3]">
              {loading && orgs.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-6">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-[#F0DDAD]/40" />
                    </td>
                  </tr>
                ))
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-[#6B5245]">
                      <Building2 size={22} className="text-[#C9B89F]" />
                      <p className="text-sm font-semibold text-[#2C1B13]">
                        {search ? 'No organizations match your search' : 'No organizations yet'}
                      </p>
                      <p className="text-xs">
                        {search ? 'Try a different name or code.' : orgs.length === 0 ? 'Create the first tenant organization to get started.' : 'Nothing in this view.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((o) => (
                  <tr key={o.id} className="transition hover:bg-[#FFF9EF]">
                    <td className="px-5 py-3 text-sm font-semibold text-[#2C1B13]">{o.name}</td>
                    <td className="px-5 py-3">
                      <code className="rounded-lg bg-[#FFF9EF] px-1.5 py-0.5 font-mono text-xs font-semibold text-[#176B5B] ring-1 ring-[#E7DCCB]">{o.code}</code>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-[#6B5245]">{o.apexOrg?.name ?? '—'}</td>
                    <td className="px-5 py-3"><StatusPill status={o.status} /></td>
                    <td className="max-w-[240px] truncate px-5 py-3 text-xs text-[#6B5245]">{o.contactEmail || o.contactPhone || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-[#6B5245]">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelected(o)}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#F0DDAD]/50 hover:text-[#23150F] cursor-pointer"
                        >
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => openEdit(o)}
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#F0DDAD]/50 hover:text-[#23150F] cursor-pointer"
                        >
                          <Pencil size={13} /> Edit
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

      {/* Create wizard modal */}
      <BrandModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        icon={<Plus size={20} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title="Create organization"
        subtitle="Code and business-manager credentials are generated automatically."
        wide
      >
        {/* Steps */}
        <div className="mb-6 flex items-start">
          {stepTitles.map((t, i) => {
            const n = i + 1
            const active = n === step
            const done = n < step
            const Icon = stepIcons[i]
            const clickable = done || stepFields[i].every((k) => (form[k] ?? '').toString().trim() !== '')
            return (
              <Fragment key={t}>
                {i > 0 && (
                  <div className={`mt-4 h-px flex-1 ${done ? 'bg-[#176B5B]' : 'bg-[#E7DCCB]'}`} />
                )}
                <button
                  type="button"
                  onClick={() => { if (clickable) { setStep(n); setStepError('') } }}
                  className={`group flex w-24 flex-col items-center gap-1.5 ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                      active
                        ? 'border-[#176B5B] bg-[#176B5B] text-[#FFF9EF] shadow-sm'
                        : done
                          ? 'border-[#176B5B] bg-[#176B5B]/10 text-[#176B5B]'
                          : 'border-[#E7DCCB] bg-white text-[#C9B89F]'
                    }`}
                  >
                    {done ? <Check size={15} strokeWidth={3} /> : <Icon size={15} strokeWidth={2.5} />}
                  </span>
                  <span
                    className={`text-center text-[11px] font-semibold leading-tight ${
                      active ? 'text-[#176B5B]' : done ? 'text-[#2C1B13]' : 'text-[#C9B89F]'
                    }`}
                  >
                    {t}
                  </span>
                </button>
              </Fragment>
            )
          })}
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <>
              <Field
                id="org-create-name"
                label="Organization name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                icon={<Building2 size={15} />}
                placeholder="e.g. Ilera Savings Co-operative"
              />
              <p className="text-xs text-[#6B5245]">A short code will be auto-generated from the name.</p>
              <ApexSelect
                id="org-create-apex"
                label="Apex organization"
                required
                value={form.apexOrgId}
                onChange={(v) => setForm({ ...form, apexOrgId: v })}
                apexOrgs={apexOrgs}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="org-create-house" label="House number" required value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} placeholder="12" />
                <Field id="org-create-street" label="Street name" required value={form.streetName} onChange={(e) => setForm({ ...form, streetName: e.target.value })} placeholder="Allen Avenue" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="org-create-city" label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ikeja" />
                <Field id="org-create-state" label="State" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Lagos" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-[#2C1B13]">Primary contact</p>
              <Field id="org-create-email" label="Contact email" required value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} icon={<Mail size={15} />} placeholder="org@example.com" />
              <Field id="org-create-phone" label="Contact phone" required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} icon={<Phone size={15} />} placeholder="+234 800 000 0000" />
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm font-semibold text-[#2C1B13]">Business manager contact person</p>
              <Field id="org-create-cp-name" label="Name" required value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} icon={<User size={15} />} placeholder="Full name" />
              <Field id="org-create-cp-phone" label="Phone" required value={form.contactPersonPhone} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} icon={<Phone size={15} />} placeholder="+234 800 000 0000" />
              <Field id="org-create-cp-email" label="Email" required value={form.contactPersonEmail} onChange={(e) => setForm({ ...form, contactPersonEmail: e.target.value })} icon={<Mail size={15} />} placeholder="bm@example.com" />
            </>
          )}

          {step === 4 && (
            <>
              <p className="text-sm font-semibold text-[#2C1B13]">Bank details (for fee withdrawals)</p>
              <Field
                id="org-create-acct"
                label="Account number"
                required
                value={form.accountNumber}
                onChange={handleAccountNumberChange}
                placeholder="10-digit account number"
                icon={<CreditCard size={15} />}
              />
              {form.accountNumber && !NUBAN_BANKS[form.accountNumber.slice(0, 3)] ? (
                <UnknownBankNote />
              ) : (
                <p className="text-xs text-[#6B5245]">Bank, sort code, and bank code fill in automatically.</p>
              )}
              <Field id="org-create-bank" label="Bank name" required value={form.bankName} readOnly placeholder="Auto-filled from account number" />
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
                  Account name <span className="text-[#E4A42A]"> *</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C9B89F]"><User size={15} /></span>
                  <input
                    value={form.accountName}
                    readOnly
                    placeholder={resolving ? 'Resolving…' : 'Auto-filled from bank enquiry'}
                    className={`${fieldCls} pl-10`}
                  />
                  {resolving && (
                    <span className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-[#C9B89F]/30 border-t-[#176B5B]" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="org-create-sort" label="Sort code" required value={form.sortCode} readOnly placeholder="Auto-filled" />
                <Field id="org-create-bank-code" label="Bank code" required value={form.bankCode} readOnly placeholder="Auto-filled" />
              </div>
            </>
          )}
        </div>

        {stepError && (
          <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#B3261E]">
            <AlertTriangle size={13} /> {stepError}
          </p>
        )}
        {isLastStep && !allRequiredFilled && (
          <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#B3261E]">
            <AlertTriangle size={13} /> All fields are required before creating.
          </p>
        )}
        {isLastStep && allRequiredFilled && !accountNameMatchesOrg && (
          <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#B3261E]">
            <AlertTriangle size={13} /> Account name must match the organization name.
          </p>
        )}

        <div className="mt-6 flex gap-2 border-t border-[#EDE2D3] pt-4">
          {step > 1 && (
            <button
              onClick={backStep}
              className="inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] px-4 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] cursor-pointer"
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}
          {!isLastStep ? (
            <button
              onClick={nextStep}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] cursor-pointer"
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving || !canCreate}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Creating…' : 'Create organization'}
            </button>
          )}
        </div>
      </BrandModal>

      {/* Edit modal */}
      <BrandModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelected(null) }}
        icon={<Pencil size={20} className="text-[#9D4824]" />}
        iconCls="bg-[#9D4824]/10"
        title="Edit organization"
        subtitle={selected?.code ? `Code ${selected.code}` : undefined}
        wide
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B5245]"><Building2 size={13} /> Organization & address</p>
            <div className="space-y-3">
              <Field id="org-edit-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <ApexSelect
                id="org-edit-apex"
                label="Apex organization"
                value={form.apexOrgId}
                onChange={(v) => setForm({ ...form, apexOrgId: v })}
                apexOrgs={apexOrgs}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="org-edit-house" label="House number" value={form.houseNumber} onChange={(e) => setForm({ ...form, houseNumber: e.target.value })} />
                <Field id="org-edit-street" label="Street name" value={form.streetName} onChange={(e) => setForm({ ...form, streetName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="org-edit-city" label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <Field id="org-edit-state" label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="border-t border-[#EDE2D3]" />

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B5245]"><Mail size={13} /> Contact details</p>
            <div className="space-y-3">
              <Field id="org-edit-email" label="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              <Field id="org-edit-phone" label="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            </div>
          </div>

          <div className="border-t border-[#EDE2D3]" />

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B5245]"><User size={13} /> Contact person</p>
            <div className="space-y-3">
              <Field id="org-edit-cp-name" label="Name" value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} />
              <Field id="org-edit-cp-phone" label="Phone" value={form.contactPersonPhone} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} />
              <Field id="org-edit-cp-email" label="Email" value={form.contactPersonEmail} onChange={(e) => setForm({ ...form, contactPersonEmail: e.target.value })} />
            </div>
          </div>

          <div className="border-t border-[#EDE2D3]" />

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B5245]"><CreditCard size={13} /> Bank details (for fee withdrawals)</p>
            <div className="space-y-3">
              <Field id="org-edit-acct" label="Account number" required value={form.accountNumber} onChange={handleAccountNumberChange} placeholder="10-digit account number" />
              {form.accountNumber && !NUBAN_BANKS[form.accountNumber.slice(0, 3)] && <UnknownBankNote />}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="org-edit-bank" label="Bank name" value={form.bankName} readOnly placeholder="Auto-filled from account number" />
                <Field id="org-edit-acct-name" label="Account name" value={form.accountName} readOnly placeholder={resolving ? 'Resolving…' : 'Auto-filled from bank enquiry'} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field id="org-edit-sort" label="Sort code" value={form.sortCode} readOnly placeholder="Auto-filled" />
                <Field id="org-edit-bank-code" label="Bank code" value={form.bankCode} readOnly placeholder="Auto-filled" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-[#EDE2D3] pt-4">
          <button
            onClick={() => { setEditOpen(false); setSelected(null) }}
            className="rounded-full border border-[#E7DCCB] px-4 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#9D4824] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#B85A38] disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </BrandModal>

      {/* View modal */}
      <BrandModal
        open={!!selected && !editOpen}
        onClose={() => setSelected(null)}
        icon={<Building2 size={20} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title={selected?.name ?? ''}
        subtitle={selected ? `Created ${new Date(selected.createdAt).toLocaleDateString()}` : undefined}
        wide
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-[#FFF9EF] px-2 py-1 font-mono text-xs font-semibold text-[#176B5B] ring-1 ring-[#E7DCCB]">
                {selected.code}
              </code>
              <StatusPill status={selected.status} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B5245]/10 px-2.5 py-1 text-xs font-semibold text-[#6B5245]">
                <Building2 size={13} /> {selected.apexOrg?.name ?? 'No apex org'}
              </span>
            </div>

            {(selected.address || selected.contactEmail || selected.contactPhone) && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B5245]"><MapPin size={13} /> Contact</p>
                <div className="space-y-1.5 rounded-xl bg-[#FFF9EF] p-4 text-sm text-[#23150F]">
                  {selected.address && <p>{selected.address}</p>}
                  {selected.contactEmail && <p className="flex items-center gap-1.5"><Mail size={13} className="text-[#6B5245]" /> {selected.contactEmail}</p>}
                  {selected.contactPhone && <p className="flex items-center gap-1.5"><Phone size={13} className="text-[#6B5245]" /> {selected.contactPhone}</p>}
                </div>
              </div>
            )}

            {(selected.contactPersonName || selected.contactPersonEmail || selected.contactPersonPhone) && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B5245]"><User size={13} /> Contact person</p>
                <div className="space-y-1.5 rounded-xl bg-[#FFF9EF] p-4 text-sm text-[#23150F]">
                  {selected.contactPersonName && <p className="font-semibold">{selected.contactPersonName}</p>}
                  {selected.contactPersonEmail && <p className="flex items-center gap-1.5"><Mail size={13} className="text-[#6B5245]" /> {selected.contactPersonEmail}</p>}
                  {selected.contactPersonPhone && <p className="flex items-center gap-1.5"><Phone size={13} className="text-[#6B5245]" /> {selected.contactPersonPhone}</p>}
                </div>
              </div>
            )}

            {selected.bankName && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6B5245]"><CreditCard size={13} /> Bank details</p>
                <div className="space-y-1.5 rounded-xl bg-[#FFF9EF] p-4 text-sm text-[#23150F]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{selected.bankName}</p>
                    <p className="font-mono text-[#6B5245]">{selected.accountNumber}</p>
                  </div>
                  <p>Account name: {selected.accountName || '—'}</p>
                  <p className="font-mono text-xs text-[#6B5245]">
                    Sort: {selected.sortCode || '—'}
                    {selected.bankCode ? ` · Bank code: ${selected.bankCode}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </BrandModal>

      {/* Created credentials modal */}
      <BrandModal
        open={!!createdResult}
        onClose={() => setCreatedResult(null)}
        icon={<CheckCircle2 size={20} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title="Organization created"
        subtitle="Business manager can now sign in with these credentials."
      >
        {createdResult && (
          <div className="space-y-4">
            <p className="flex items-start gap-2 rounded-xl border border-[#176B5B]/25 bg-[#176B5B]/5 p-3.5 text-xs leading-relaxed text-[#176B5B]">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              Email and SMS were sent with these login details. The password is temporary — the business manager must change it on first login.
            </p>

            <div className="space-y-2.5 rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Org code</span>
                <span className="flex items-center gap-2">
                  <code className="font-mono text-sm font-bold text-[#176B5B]">{createdResult.code}</code>
                  <button onClick={() => copy('code', createdResult.code)} className="rounded-md p-1 text-[#6B5245] transition hover:bg-[#F0DDAD]/50 cursor-pointer" aria-label="Copy org code">
                    {copied === 'code' ? <Check size={14} className="text-[#176B5B]" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">BM email</span>
                <span className="flex items-center gap-2">
                  <code className="font-mono text-sm font-bold text-[#2C1B13]">{createdResult.email}</code>
                  <button onClick={() => copy('email', createdResult.email)} className="rounded-md p-1 text-[#6B5245] transition hover:bg-[#F0DDAD]/50 cursor-pointer" aria-label="Copy email">
                    {copied === 'email' ? <Check size={14} className="text-[#176B5B]" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[#EDE2D3] pt-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">BM password</span>
                <span className="flex items-center gap-2">
                  <code className="font-mono text-sm font-bold text-[#9D4824]">{createdResult.password}</code>
                  <button onClick={() => copy('password', createdResult.password)} className="rounded-md p-1 text-[#6B5245] transition hover:bg-[#F0DDAD]/50 cursor-pointer" aria-label="Copy password">
                    {copied === 'password' ? <Check size={14} className="text-[#176B5B]" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>
            </div>

            <button
              onClick={() => setCreatedResult(null)}
              className="w-full rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </BrandModal>
    </div>
  )
}