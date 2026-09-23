import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import {
  Badge,
  Btn,
  Modal,
  PageHeader,
  Panel,
  Select,
  StatCard,
  Table,
  TBody,
  TBodyCell,
  TBodyRow,
  THead,
  THeadCell,
  THeadRow,
  TextInput,
  inputCls,
} from './ui'

interface Account {
  id: string
  code: string
  name: string
  type: string
  description?: string
  organizationId?: string
  isSystem: boolean
  isActive: boolean
  createdAt: string
}

const typeLabels: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
}

const typeOrder = ['asset', 'liability', 'equity', 'revenue', 'expense']

const typeDot: Record<string, string> = {
  asset: 'bg-[#176B5B]',
  liability: 'bg-[#E4A42A]',
  equity: 'bg-[#9D4824]',
  revenue: 'bg-[#B79B6B]',
  expense: 'bg-[#B3261E]',
}

interface AccountForm {
  code: string
  name: string
  type: string
  description: string
  isActive: boolean
}

const emptyForm = (): AccountForm => ({ code: '', name: '', type: 'asset', description: '', isActive: true })

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<AccountForm>(emptyForm())
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  const fetch = useCallback(() => {
    api.get('/ledger/accounts').then((r) => setAccounts(r.data))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = accounts.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    const matchesType = !filterType || a.type === filterType
    const matchesStatus =
      !filterStatus ||
      (filterStatus === 'active' ? a.isActive : !a.isActive)
    return matchesSearch && matchesType && matchesStatus
  })

  const grouped = typeOrder
    .map((t) => ({ type: t, items: filtered.filter((a) => a.type === t) }))
    .filter((g) => g.items.length > 0)

  const summary = typeOrder.map((t) => ({
    type: t,
    total: accounts.filter((a) => a.type === t).length,
    active: accounts.filter((a) => a.type === t && a.isActive).length,
  }))

  const handleCreate = async () => {
    setError('')
    try {
      await api.post('/ledger/accounts', {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || undefined,
      })
      setCreateOpen(false)
      setForm(emptyForm())
      fetch()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create account')
    }
  }

  const handleUpdate = async () => {
    if (!editId) return
    setError('')
    try {
      await api.patch(`/ledger/accounts/${editId}`, {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim(),
        isActive: form.isActive,
      })
      setEditOpen(false)
      setEditId(null)
      setForm(emptyForm())
      fetch()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update account')
    }
  }

  const openEdit = (a: Account) => {
    setEditId(a.id)
    setError('')
    setForm({
      code: a.code,
      name: a.name,
      type: a.type,
      description: a.description || '',
      isActive: a.isActive,
    })
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="General Ledger"
        title="Chart of Accounts"
        subtitle="Every account available to the ledger, grouped by class."
        actions={<Btn onClick={() => { setError(''); setForm(emptyForm()); setCreateOpen(true) }}>Create Account</Btn>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Accounts" value={accounts.length} sub="all classes" icon="📒" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
        {summary.map((s) => (
          <StatCard
            key={s.type}
            label={typeLabels[s.type]}
            value={s.total}
            sub={`${s.active} active`}
            icon={<span className={`inline-block h-2.5 w-2.5 rounded-full ${typeDot[s.type]}`} />}
            iconCls="bg-[#FFF9EF]"
          />
        ))}
      </div>

      <Panel>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1">
            <TextInput placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputCls + ' w-auto cursor-pointer'} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {typeOrder.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
          </select>
          <select className={inputCls + ' w-auto cursor-pointer'} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Panel>

      {grouped.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E7DCCB] bg-white py-12 text-center text-sm text-[#C9B89F]">
          No accounts match your filters.
        </div>
      )}

      {grouped.map((g) => (
        <section key={g.type} className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setCollapsed((c) => ({ ...c, [g.type]: !c[g.type] }))}
            className="flex w-full cursor-pointer items-center justify-between border-b border-[#EDE2D3] bg-[#FFF9EF] px-5 py-3.5 transition-colors hover:bg-[#F7EFDD]"
          >
            <div className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 rounded-full ${typeDot[g.type]}`} />
              <span className="text-sm font-black tracking-[-0.01em] text-[#2C1B13]">{typeLabels[g.type]}</span>
              <Badge variant="default">{g.items.length}</Badge>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B79B6B]">
              {collapsed[g.type] ? 'Expand' : 'Collapse'}
            </span>
          </button>

          {!collapsed[g.type] && (
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Code</THeadCell>
                  <THeadCell>Name</THeadCell>
                  <THeadCell>Description</THeadCell>
                  <THeadCell>Source</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell>Created</THeadCell>
                  <THeadCell />
                </THeadRow>
              </THead>
              <TBody>
                {g.items.map((a) => (
                  <TBodyRow key={a.id} className={a.isActive ? '' : 'opacity-60'}>
                    <TBodyCell>
                      <code className="rounded-md bg-[#FFF9EF] px-1.5 py-0.5 text-xs font-semibold text-[#6B5245]">{a.code}</code>
                    </TBodyCell>
                    <TBodyCell className="font-semibold text-[#2C1B13]">{a.name}</TBodyCell>
                    <TBodyCell className="max-w-xs text-xs">{a.description || '—'}</TBodyCell>
                    <TBodyCell>
                      <Badge variant={a.isSystem ? 'info' : 'default'}>{a.isSystem ? 'System' : 'Custom'}</Badge>
                    </TBodyCell>
                    <TBodyCell>
                      <Badge variant={a.isActive ? 'success' : 'danger'} dot>{a.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TBodyCell>
                    <TBodyCell>{new Date(a.createdAt).toLocaleDateString()}</TBodyCell>
                    <TBodyCell>
                      {!a.isSystem && (
                        <Btn variant="ghost" size="sm" onClick={() => openEdit(a)}>Edit</Btn>
                      )}
                    </TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
          )}
        </section>
      ))}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Account">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="acc-code" label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 5600" required />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {typeOrder.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
            </Select>
          </div>
          <TextInput id="acc-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextInput id="acc-desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <p className="text-xs font-medium text-[#B3261E]">{error}</p>}
          <Btn onClick={handleCreate} className="w-full">Create Account</Btn>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Account">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="edit-code" label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {typeOrder.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
            </Select>
          </div>
          <TextInput id="edit-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextInput id="edit-desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-[#6B5245]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-[#E7DCCB] accent-[#176B5B]"
            />
            Active (used for new journal entries)
          </label>
          {error && <p className="text-xs font-medium text-[#B3261E]">{error}</p>}
          <Btn onClick={handleUpdate} className="w-full">Save Changes</Btn>
        </div>
      </Modal>
    </div>
  )
}
