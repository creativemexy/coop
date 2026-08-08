import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Modal } from '../../components/ui/modal'
import { Card, CardTitle } from '../../components/ui/card'

interface JournalLine {
  id: string
  accountId: string
  debit: number
  credit: number
  organizationId?: string
}

interface JournalEntry {
  id: string
  description?: string
  entryDate: string
  status: string
  postedBy?: string
  postedAt?: string
  createdAt: string
  lines: JournalLine[]
}

interface Account {
  id: string
  code: string
  name: string
  isActive?: boolean
}

const fmt = (v: number | string) => `₦${Number(v || 0).toLocaleString()}`

export function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<JournalEntry | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    description: '',
    entryDate: new Date().toISOString().split('T')[0],
    lines: [{ accountId: '', debit: 0, credit: 0 }],
  })

  const fetch = useCallback(() => {
    api.get('/ledger/journal-entries').then((r) => setEntries(r.data))
    api.get('/ledger/accounts').then((r) => setAccounts(r.data))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = entries.filter((e) => {
    const matchesSearch = !search || e.description?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !filterStatus || e.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const accountName = (id: string) => accounts.find((a) => a.id === id)

  const totalDebitsAll = entries.reduce((s, e) => s + e.lines.reduce((a, l) => a + Number(l.debit), 0), 0)
  const totalCreditsAll = entries.reduce((s, e) => s + e.lines.reduce((a, l) => a + Number(l.credit), 0), 0)

  const addLine = () => setForm({ ...form, lines: [...form.lines, { accountId: '', debit: 0, credit: 0 }] })
  const removeLine = (i: number) => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) })
  const updateLine = (i: number, field: string, value: string | number) => {
    const lines = [...form.lines]
    lines[i] = { ...lines[i], [field]: value }
    setForm({ ...form, lines })
  }

  const totalDebits = form.lines.reduce((s, l) => s + Number(l.debit), 0)
  const totalCredits = form.lines.reduce((s, l) => s + Number(l.credit), 0)
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01
  const linesValid = form.lines.length >= 2 && form.lines.every((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0))

  const handlePost = async () => {
    if (!isBalanced || !linesValid) {
      setError('Entry must be balanced with at least two lines, each referencing an account with an amount.')
      return
    }
    setError('')
    try {
      await api.post('/ledger/journal-entries', {
        description: form.description,
        entryDate: form.entryDate,
        lines: form.lines.map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit),
          credit: Number(l.credit),
        })),
      })
      setCreateOpen(false)
      setForm({ description: '', entryDate: new Date().toISOString().split('T')[0], lines: [{ accountId: '', debit: 0, credit: 0 }] })
      fetch()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to post entry')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Journal Entries</h2>
        <Button onClick={() => { setError(''); setCreateOpen(true) }}>Post Entry</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-indigo-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Entries</CardTitle>
          <p className="mt-2 text-3xl font-bold">{entries.length}</p>
        </Card>
        <Card className="border-red-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Debits</CardTitle>
          <p className="mt-2 text-3xl font-bold">{fmt(totalDebitsAll)}</p>
        </Card>
        <Card className="border-emerald-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Credits</CardTitle>
          <p className="mt-2 text-3xl font-bold">{fmt(totalCreditsAll)}</p>
          {Math.abs(totalDebitsAll - totalCreditsAll) > 0.01 && (
            <p className="text-xs text-red-500 mt-1">Ledger out of balance!</p>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search by description..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="posted">Posted</option>
          <option value="draft">Draft</option>
          <option value="voided">Voided</option>
        </select>
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Date</THeadCell>
            <THeadCell>Description</THeadCell>
            <THeadCell>Lines</THeadCell>
            <THeadCell>Debit</THeadCell>
            <THeadCell>Credit</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Posted At</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {filtered.map((e) => {
            const d = e.lines.reduce((s, l) => s + Number(l.debit), 0)
            const c = e.lines.reduce((s, l) => s + Number(l.credit), 0)
            const balanced = Math.abs(d - c) < 0.01
            return (
              <TBodyRow key={e.id}>
                <TBodyCell>{new Date(e.entryDate).toLocaleDateString()}</TBodyCell>
                <TBodyCell className="max-w-xs truncate font-medium">{e.description || '—'}</TBodyCell>
                <TBodyCell>{e.lines?.length ?? 0}</TBodyCell>
                <TBodyCell className="text-right">{d > 0 ? fmt(d) : '—'}</TBodyCell>
                <TBodyCell className="text-right">{c > 0 ? fmt(c) : '—'}</TBodyCell>
                <TBodyCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={balanced ? 'success' : 'danger'}>{balanced ? 'Balanced' : 'Unbalanced'}</Badge>
                    <Badge variant={e.status === 'posted' ? 'info' : 'warning'}>{e.status}</Badge>
                  </div>
                </TBodyCell>
                <TBodyCell>{e.postedAt ? new Date(e.postedAt).toLocaleString() : '—'}</TBodyCell>
                <TBodyCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(e)}>View</Button>
                </TBodyCell>
              </TBodyRow>
            )
          })}
          {filtered.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={8} className="text-center text-gray-400 py-8">No entries found. Post your first entry to get started.</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Entry: ${selected?.id?.slice(0, 8)}...`}>
        {selected && (
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Date:</span> {new Date(selected.entryDate).toLocaleDateString()}</p>
              <p><span className="text-gray-500">Description:</span> {selected.description || '—'}</p>
              <p>
                <span className="text-gray-500">Status:</span>{' '}
                <Badge variant={selected.status === 'posted' ? 'success' : 'warning'}>{selected.status}</Badge>
              </p>
              {selected.postedBy && <p><span className="text-gray-500">Posted By:</span> {selected.postedBy.slice(0, 8)}</p>}
            </div>
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Account</THeadCell>
                  <THeadCell>Debit</THeadCell>
                  <THeadCell>Credit</THeadCell>
                </THeadRow>
              </THead>
              <TBody>
                {selected.lines.map((l) => {
                  const acc = accountName(l.accountId)
                  return (
                    <TBodyRow key={l.id}>
                      <TBodyCell>{acc ? `${acc.code} — ${acc.name}` : l.accountId.slice(0, 8)}</TBodyCell>
                      <TBodyCell>{Number(l.debit) > 0 ? fmt(l.debit) : '—'}</TBodyCell>
                      <TBodyCell>{Number(l.credit) > 0 ? fmt(l.credit) : '—'}</TBodyCell>
                    </TBodyRow>
                  )
                })}
              </TBody>
            </Table>
          </div>
        )}
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Post Journal Entry" className="max-w-2xl">
        <div className="space-y-4">
          <Input id="entry-desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Registration fee received from new member" />
          <Input id="entry-date" label="Entry Date" type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lines</label>
              <Button variant="ghost" size="sm" onClick={addLine}>+ Add Line</Button>
            </div>
            <div className="space-y-2">
              {form.lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select
                    value={line.accountId}
                    onChange={(e) => updateLine(i, 'accountId', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
                  >
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.isActive !== false).map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                  <Input type="number" placeholder="Debit" value={line.debit} onChange={(e) => updateLine(i, 'debit', Number(e.target.value))} className="w-28" />
                  <Input type="number" placeholder="Credit" value={line.credit} onChange={(e) => updateLine(i, 'credit', Number(e.target.value))} className="w-28" />
                  {form.lines.length > 1 && (
                    <button onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700 mt-2 cursor-pointer">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span>Total Debits: <strong>{fmt(totalDebits)}</strong></span>
              <span>Total Credits: <strong>{fmt(totalCredits)}</strong></span>
              {!isBalanced && <span className="text-red-600 font-medium">Not balanced</span>}
              {isBalanced && totalDebits > 0 && <span className="text-green-600 font-medium">Balanced ✓</span>}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button onClick={handlePost} className="w-full" disabled={!isBalanced || !linesValid}>
            Post Entry
          </Button>
        </div>
      </Modal>
    </div>
  )
}
