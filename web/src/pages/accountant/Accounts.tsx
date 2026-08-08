import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Modal } from '../../components/ui/modal'
import { Card, CardTitle } from '../../components/ui/card'

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

const typeBorder: Record<string, string> = {
  total: 'border-indigo-500',
  asset: 'border-blue-500',
  liability: 'border-amber-500',
  equity: 'border-green-500',
  revenue: 'border-purple-500',
  expense: 'border-red-500',
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Chart of Accounts</h2>
        <Button onClick={() => { setError(''); setForm(emptyForm()); setCreateOpen(true) }}>Create</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Card className={typeBorder.total}>
          <CardTitle className="text-xs font-medium text-gray-500">Total Accounts</CardTitle>
          <p className="mt-1 text-2xl font-bold">{accounts.length}</p>
        </Card>
        {summary.map((s) => (
          <Card key={s.type} className={typeBorder[s.type]}>
            <CardTitle className="text-xs font-medium text-gray-500">{typeLabels[s.type]}</CardTitle>
            <p className="mt-1 text-2xl font-bold">{s.total}</p>
            <p className="text-xs text-gray-400">{s.active} active</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {typeOrder.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {grouped.length === 0 && (
        <p className="text-gray-500 text-sm py-8 text-center">No accounts found.</p>
      )}

      {grouped.map((g) => (
        <div key={g.type} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setCollapsed((c) => ({ ...c, [g.type]: !c[g.type] }))}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${g.type === 'asset' ? 'bg-blue-500' : g.type === 'liability' ? 'bg-amber-500' : g.type === 'equity' ? 'bg-green-500' : g.type === 'revenue' ? 'bg-purple-500' : 'bg-red-500'}`} />
              <span className="font-semibold text-sm dark:text-gray-100">{typeLabels[g.type]}</span>
              <Badge variant="default">{g.items.length}</Badge>
            </div>
            <span className="text-gray-400 text-sm">{collapsed[g.type] ? 'Expand' : 'Collapse'}</span>
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
                    <TBodyCell><code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{a.code}</code></TBodyCell>
                    <TBodyCell className="font-medium">{a.name}</TBodyCell>
                    <TBodyCell className="text-xs text-gray-500 max-w-xs">{a.description || '—'}</TBodyCell>
                    <TBodyCell>
                      <Badge variant={a.isSystem ? 'info' : 'default'}>{a.isSystem ? 'System' : 'Custom'}</Badge>
                    </TBodyCell>
                    <TBodyCell>
                      <Badge variant={a.isActive ? 'success' : 'danger'}>{a.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TBodyCell>
                    <TBodyCell>{new Date(a.createdAt).toLocaleDateString()}</TBodyCell>
                    <TBodyCell>
                      {!a.isSystem && (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>Edit</Button>
                      )}
                    </TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      ))}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Account">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input id="acc-code" label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 5600" required />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
              >
                {typeOrder.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
              </select>
            </div>
          </div>
          <Input id="acc-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="acc-desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button onClick={handleCreate} className="w-full">Create</Button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Account">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input id="edit-code" label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
              >
                {typeOrder.map((t) => <option key={t} value={t}>{typeLabels[t]}</option>)}
              </select>
            </div>
          </div>
          <Input id="edit-name" label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="edit-desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            Active (used for new journal entries)
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button onClick={handleUpdate} className="w-full">Save</Button>
        </div>
      </Modal>
    </div>
  )
}
