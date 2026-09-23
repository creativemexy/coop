import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import {
  Badge,
  Btn,
  EmptyRow,
  Modal,
  PageHeader,
  Panel,
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
      <PageHeader
        eyebrow="General Ledger"
        title="Journal Entries"
        subtitle="Double-entry records posted to the ledger."
        actions={<Btn onClick={() => { setError(''); setCreateOpen(true) }}>Post Entry</Btn>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total Entries" value={entries.length} sub="all statuses" icon="🧾" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
        <StatCard label="Total Debits" value={fmt(totalDebitsAll)} sub="across all entries" icon="➖" iconCls="bg-[#9D4824]/10 text-[#9D4824]" />
        <StatCard
          label="Total Credits"
          value={fmt(totalCreditsAll)}
          sub={
            Math.abs(totalDebitsAll - totalCreditsAll) > 0.01 ? (
              <span className="font-semibold text-[#B3261E]">Ledger out of balance!</span>
            ) : (
              <span className="text-[#176B5B]">Balanced ✓</span>
            )
          }
          icon="➕"
          iconCls="bg-[#176B5B]/10 text-[#176B5B]"
        />
      </div>

      <Panel padded={false}>
        <div className="flex flex-wrap gap-3 p-5">
          <div className="min-w-[200px] flex-1">
            <TextInput placeholder="Search by description..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={inputCls + ' w-auto cursor-pointer'} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
                  <TBodyCell className="max-w-xs truncate font-semibold text-[#2C1B13]">{e.description || '—'}</TBodyCell>
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
                    <Btn variant="ghost" size="sm" onClick={() => setSelected(e)}>View</Btn>
                  </TBodyCell>
                </TBodyRow>
              )
            })}
            {filtered.length === 0 && (
              <EmptyRow colSpan={8}>No entries found. Post your first entry to get started.</EmptyRow>
            )}
          </TBody>
        </Table>
      </Panel>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Entry: ${selected?.id?.slice(0, 8)}...`}>
        {selected && (
          <div className="space-y-4">
            <div className="space-y-1 text-sm text-[#6B5245]">
              <p><span className="text-[#B79B6B]">Date:</span> <span className="text-[#2C1B13]">{new Date(selected.entryDate).toLocaleDateString()}</span></p>
              <p><span className="text-[#B79B6B]">Description:</span> <span className="text-[#2C1B13]">{selected.description || '—'}</span></p>
              <p className="flex items-center gap-2">
                <span className="text-[#B79B6B]">Status:</span>
                <Badge variant={selected.status === 'posted' ? 'success' : 'warning'}>{selected.status}</Badge>
              </p>
              {selected.postedBy && <p><span className="text-[#B79B6B]">Posted By:</span> <span className="text-[#2C1B13]">{selected.postedBy.slice(0, 8)}</span></p>}
            </div>
            <div className="overflow-hidden rounded-xl border border-[#E7DCCB]">
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
                        <TBodyCell className="text-[#2C1B13]">{acc ? `${acc.code} — ${acc.name}` : l.accountId.slice(0, 8)}</TBodyCell>
                        <TBodyCell>{Number(l.debit) > 0 ? fmt(l.debit) : '—'}</TBodyCell>
                        <TBodyCell>{Number(l.credit) > 0 ? fmt(l.credit) : '—'}</TBodyCell>
                      </TBodyRow>
                    )
                  })}
                </TBody>
              </Table>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Post Journal Entry" className="max-w-2xl">
        <div className="space-y-4">
          <TextInput id="entry-desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Registration fee received from new member" />
          <TextInput id="entry-date" label="Entry Date" type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">Lines</span>
              <Btn variant="ghost" size="sm" onClick={addLine}>+ Add Line</Btn>
            </div>
            <div className="space-y-2">
              {form.lines.map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <select
                    value={line.accountId}
                    onChange={(e) => updateLine(i, 'accountId', e.target.value)}
                    className={inputCls + ' flex-1 cursor-pointer'}
                  >
                    <option value="">Select account</option>
                    {accounts.filter((a) => a.isActive !== false).map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Debit" value={line.debit} onChange={(e) => updateLine(i, 'debit', Number(e.target.value))} className={inputCls + ' w-28'} />
                  <input type="number" placeholder="Credit" value={line.credit} onChange={(e) => updateLine(i, 'credit', Number(e.target.value))} className={inputCls + ' w-28'} />
                  {form.lines.length > 1 && (
                    <button onClick={() => removeLine(i)} className="mt-2 cursor-pointer text-[#B3261E] transition-colors hover:text-[#9A2019]">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#6B5245]">
              <span>Total Debits: <strong className="text-[#2C1B13]">{fmt(totalDebits)}</strong></span>
              <span>Total Credits: <strong className="text-[#2C1B13]">{fmt(totalCredits)}</strong></span>
              {!isBalanced && <span className="font-semibold text-[#B3261E]">Not balanced</span>}
              {isBalanced && totalDebits > 0 && <span className="font-semibold text-[#176B5B]">Balanced ✓</span>}
            </div>
          </div>

          {error && <p className="text-xs font-medium text-[#B3261E]">{error}</p>}

          <Btn onClick={handlePost} className="w-full" disabled={!isBalanced || !linesValid}>
            Post Entry
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
