import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Users as UsersIcon, UserPlus, Eye, ShieldCheck, Phone, Mail, CalendarDays, BadgeCheck, X, RefreshCw, AlertTriangle, Building2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'

type Role =
  | 'super_admin' | 'operational_admin' | 'customer_care' | 'accountant' | 'business_manager'
  | 'apex_business_manager' | 'bnpl_manager' | 'loan_manager' | 'investment_manager'
  | 'supervisor' | 'operations' | 'individual'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  isActive: boolean
  kycStatus: string
  kycImage?: string
  phone?: string
  organizationId?: string
  apexOrgId?: string
  createdAt: string
  registrationFeePaid?: boolean
}

interface OrgOption { id: string; name: string; code: string }

const ROLE_META: Record<string, { icon: string; label: string; cls: string; dot: string }> = {
  super_admin: { icon: '👑', label: 'Super admin', cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' },
  operational_admin: { icon: '🛠', label: 'Operational admin', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' },
  customer_care: { icon: '🎧', label: 'Customer care', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' },
  accountant: { icon: '🧮', label: 'Accountant', cls: 'bg-[#6B5245]/10 text-[#6B5245]', dot: 'bg-[#6B5245]' },
  business_manager: { icon: '🏛', label: 'Business manager', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' },
  apex_business_manager: { icon: '🌐', label: 'Apex business manager', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' },
  bnpl_manager: { icon: '💳', label: 'BNPL manager', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' },
  loan_manager: { icon: '📘', label: 'Loan manager', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' },
  investment_manager: { icon: '📈', label: 'Investment manager', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' },
  supervisor: { icon: '🛡', label: 'Supervisor', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' },
  operations: { icon: '⚙️', label: 'Operations', cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' },
  individual: { icon: '👤', label: 'Individual', cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' },
}

const CREATABLE_ROLES = [
  'operational_admin',
  'customer_care',
  'accountant',
  'bnpl_manager',
  'loan_manager',
  'investment_manager',
  'supervisor',
  'operations',
]

const COOP_ROLES = [
  'bnpl_manager',
  'accountant',
  'loan_manager',
  'investment_manager',
  'supervisor',
  'operations',
]

const PAGE_SIZE = 10

const KYC_META: Record<string, { label: string; cls: string; dot: string }> = {
  approved: { label: 'Approved', cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' },
  pending: { label: 'Pending', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' },
  none: { label: 'None', cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' },
  rejected: { label: 'Rejected', cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' },
}

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: '',
  organizationId: '',
}

const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const solidGreen =
  'inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

function Avatar({ user, size }: { user: User; size: string }) {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-[#176B5B]/10 font-black tracking-[-0.02em] text-[#176B5B] ring-1 ring-[#176B5B]/20`}>{initials}</span>
  )
}

function RolePill({ role }: { role: Role }) {
  const meta = ROLE_META[role] ?? ROLE_META.operations
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function StatusPill({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#176B5B]/10 px-2.5 py-1 text-xs font-semibold text-[#176B5B]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#176B5B]" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#B3261E]/10 px-2.5 py-1 text-xs font-semibold text-[#B3261E]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#B3261E]" /> Inactive
    </span>
  )
}

function KycPill({ status }: { status: string }) {
  const meta = KYC_META[status?.toLowerCase()] ?? KYC_META.none
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

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#EDE2D3] bg-[#FFF9EF]/50 px-3.5 py-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#176B5B]/10">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[#2C1B13]">{value}</p>
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
            className={`${btn} ${p === page ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:bg-[#F0DDAD]/50'}`}
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

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formMsg, setFormMsg] = useState('')

  const fetchUsers = useCallback(() => {
    setLoading(true)
    const params = roleFilter ? { role: roleFilter } : {}
    api.get('/users', { params })
      .then((r) => setUsers(r.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { setPage(1) }, [roleFilter])

  const pageItems = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => {
    setForm(emptyForm)
    setFormMsg('')
    setShowCreate(true)
    api.get('/organizations').then((r) => setOrgs(r.data)).catch(() => {})
  }

  const handleCreate = async () => {
    setSaving(true)
    setFormMsg('')
    try {
      await api.post('/admin/super/users', {
        ...form,
        email: form.email.trim(),
        role: form.role,
        organizationId: form.organizationId || undefined,
      })
      setShowCreate(false)
      fetchUsers()
    } catch (e: any) {
      setFormMsg(e?.response?.data?.message || 'Failed to create user')
    }
    setSaving(false)
  }

  const needsScope = COOP_ROLES.includes(form.role)
  const canSubmit = !saving && form.email.trim() && form.role && (!needsScope || form.organizationId)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <UsersIcon size={22} className="text-[#176B5B]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Users</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
              Manage staff accounts, roles, and access across the platform.
            </p>
          </div>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] cursor-pointer">
          <UserPlus size={16} /> Create User
        </button>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap gap-2">
        {['', ...CREATABLE_ROLES].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={
              roleFilter === r
                ? 'inline-flex items-center gap-1.5 rounded-full bg-[#176B5B] px-4 py-2 text-xs font-bold text-[#FFF9EF] shadow-sm transition cursor-pointer'
                : 'inline-flex items-center gap-1.5 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-xs font-semibold text-[#6B5245] transition hover:border-[#D8C9A9] hover:text-[#2C1B13] cursor-pointer'
            }
          >
            {r && <span className={`h-1.5 w-1.5 rounded-full ${r === roleFilter ? 'bg-[#F7D674]' : ROLE_META[r].dot}`} />}
            {r ? ROLE_META[r].label : 'All staff'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#F0DDAD] px-5 py-3.5">
          <p className="text-sm font-bold text-[#2C1B13]">Staff directory</p>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF9EF] px-3 py-1 text-xs font-semibold text-[#6B5245] ring-1 ring-[#E7DCCB]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#176B5B]" /> {users.length} user{users.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="bg-[#FFF9EF]/70">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">Name</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">Email</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">Role</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">KYC</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">Joined</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2D3]">
              {pageItems.map((u) => (
                <tr key={u.id} className="group transition hover:bg-[#FFF9EF]/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size="h-9 w-9" />
                      <div>
                        <p className="text-sm font-bold text-[#2C1B13]">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-[#6B5245]">{u.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-[#6B5245]">{u.email}</td>
                  <td className="px-5 py-3.5"><RolePill role={u.role} /></td>
                  <td className="px-5 py-3.5"><StatusPill isActive={u.isActive} /></td>
                  <td className="px-5 py-3.5"><KycPill status={u.kycStatus} /></td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-[#6B5245]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-bold text-[#176B5B] opacity-70 transition hover:opacity-100 group-hover:opacity-100 cursor-pointer"
                    >
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-[#C9B89F]">
                      <UsersIcon size={22} />
                      <p className="text-sm font-semibold text-[#6B5245]">No users found</p>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#6B5245]">
                      <RefreshCw size={15} className="animate-spin text-[#176B5B]" /> Loading users…
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} pageSize={PAGE_SIZE} total={users.length} onPage={setPage} />
      </div>

      {/* Profile modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 p-4 backdrop-blur-[2px]" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-md rounded-2xl border border-[#E7DCCB] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between rounded-t-2xl border-b border-[#F0DDAD] bg-[#FFF9EF] px-6 py-5">
              <div className="flex items-center gap-3">
                <Avatar user={selectedUser} size="h-11 w-11" />
                <div>
                  <h3 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">{selectedUser.firstName} {selectedUser.lastName}</h3>
                  <p className="text-xs text-[#6B5245]">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="rounded-lg p-1.5 text-[#6B5245] transition hover:bg-[#EDE2D3] hover:text-[#2C1B13] cursor-pointer" aria-label="Close">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-2.5 px-6 py-5">
              <DetailRow icon={<Mail size={14} className="text-[#176B5B]" />} label="Email" value={selectedUser.email} />
              <div className="grid grid-cols-2 gap-2.5">
                <DetailRow icon={<Phone size={14} className="text-[#176B5B]" />} label="Phone" value={selectedUser.phone || '—'} />
                <DetailRow icon={<CalendarDays size={14} className="text-[#176B5B]" />} label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString()} />
              </div>
              <DetailRow icon={<ShieldCheck size={14} className="text-[#176B5B]" />} label="Role" value={<RolePill role={selectedUser.role} />} />
              <div className="grid grid-cols-2 gap-2.5">
                <DetailRow icon={<BadgeCheck size={14} className="text-[#176B5B]" />} label="KYC" value={<KycPill status={selectedUser.kycStatus} />} />
                <DetailRow
                  icon={<CheckCircle2 size={14} className="text-[#176B5B]" />}
                  label="Account"
                  value={selectedUser.isActive ? 'Active' : 'Inactive'}
                />
              </div>
              {selectedUser.organizationId && (
                <DetailRow icon={<Building2 size={14} className="text-[#176B5B]" />} label="Organization ID" value={<span className="font-mono text-xs">{selectedUser.organizationId.slice(0, 16)}…</span>} />
              )}
              {selectedUser.apexOrgId && (
                <DetailRow icon={<Building2 size={14} className="text-[#176B5B]" />} label="Apex org ID" value={<span className="font-mono text-xs">{selectedUser.apexOrgId.slice(0, 16)}…</span>} />
              )}
              {selectedUser.kycImage && selectedUser.kycStatus === 'approved' && (
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B79B6B]">Identity document</p>
                  <img src={selectedUser.kycImage} alt="KYC identity document photo" className="h-28 w-28 rounded-xl border border-[#E7DCCB] object-cover" />
                </div>
              )}
              {selectedUser.registrationFeePaid === false && (
                <p className="flex items-center gap-1.5 rounded-xl bg-[#E4A42A]/10 px-3.5 py-2.5 text-xs font-semibold text-[#8A5A00]">
                  <AlertTriangle size={13} /> Registration fee not yet paid
                </p>
              )}
            </div>
            <div className="flex justify-end rounded-b-2xl border-t border-[#F0DDAD] bg-[#FFF9EF]/60 px-6 py-4">
              <button onClick={() => setSelectedUser(null)} className={ghost}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 p-4 backdrop-blur-[2px]" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-[#E7DCCB] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between rounded-t-2xl border-b border-[#F0DDAD] bg-[#FFF9EF] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
                  <UserPlus size={20} className="text-[#176B5B]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Create User</h3>
                  <p className="text-xs text-[#6B5245]">Provision a new staff account.</p>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 text-[#6B5245] transition hover:bg-[#EDE2D3] hover:text-[#2C1B13] cursor-pointer" aria-label="Close">
                <X size={17} />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>First Name</Label>
                  <input className={fieldCls} value={form.firstName} onChange={set('firstName')} placeholder="e.g. Amara" />
                </div>
                <div>
                  <Label required>Last Name</Label>
                  <input className={fieldCls} value={form.lastName} onChange={set('lastName')} placeholder="e.g. Okafor" />
                </div>
              </div>
              <div>
                <Label required>Email</Label>
                <input type="email" className={fieldCls} value={form.email} onChange={set('email')} placeholder="name@coop.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <input className={fieldCls} value={form.phone} onChange={set('phone')} placeholder="Optional" />
              </div>
              <div>
                <Label required>Role</Label>
                <select className={fieldCls} value={form.role} onChange={set('role')}>
                  <option value="">Select role…</option>
                  {CREATABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_META[r].label}</option>
                  ))}
                </select>
              </div>
              {needsScope && (
                <div>
                  <Label required>Organization</Label>
                  <select className={fieldCls} value={form.organizationId} onChange={set('organizationId')}>
                    <option value="">Select organization…</option>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
                  </select>
                </div>
              )}
              {formMsg && (
                <p className="flex items-center gap-1.5 rounded-xl bg-[#B3261E]/5 px-3.5 py-2.5 text-xs font-semibold text-[#B3261E]" role="alert">
                  <AlertTriangle size={13} /> {formMsg}
                </p>
              )}
              <p className="flex items-start gap-1.5 rounded-xl bg-[#176B5B]/5 px-3.5 py-2.5 text-xs leading-relaxed text-[#0F5A4B]">
                <ShieldCheck size={13} className="mt-0.5 shrink-0" />
                A temporary password will be generated and sent to the provided email.
              </p>
            </div>
            <div className="flex justify-end gap-2 rounded-b-2xl border-t border-[#F0DDAD] bg-[#FFF9EF]/60 px-6 py-4">
              <button onClick={() => setShowCreate(false)} className={ghost}>Cancel</button>
              <button onClick={handleCreate} disabled={!canSubmit} className={solidGreen}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {saving ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}