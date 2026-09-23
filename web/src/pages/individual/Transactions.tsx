import { useEffect, useState, useMemo } from 'react'
import { api } from '../../api/client'
import {
  ArrowLeftRight, Download, PiggyBank, Landmark, TrendingUp, CreditCard, CalendarClock,
  AlertCircle, HandCoins, ChevronLeft, ChevronRight, Receipt, ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react'

interface Transaction {
  date: string
  type: string
  amount: number
  description: string
  status: string
  reference: string
}

const typeLabels: Record<string, string> = {
  savings_deposit: 'Savings Deposit',
  savings_withdrawal: 'Savings Withdrawal',
  savings_interest: 'Savings Interest',
  payment: 'Subscription Payment',
  installment: 'Installment Due',
  loan_due: 'Loan Due',
  loan_repayment: 'Loan Repayment',
}

const typeMeta = (t: string) => {
  switch (t) {
    case 'savings_deposit':
      return { icon: PiggyBank, tile: 'bg-[#176B5B]/10 text-[#176B5B]' }
    case 'savings_withdrawal':
      return { icon: Landmark, tile: 'bg-[#E4A42A]/15 text-[#8A5A00]' }
    case 'savings_interest':
    case 'loan_repayment':
      return { icon: t === 'savings_interest' ? TrendingUp : HandCoins, tile: 'bg-[#176B5B]/10 text-[#176B5B]' }
    case 'payment':
      return { icon: CreditCard, tile: 'bg-[#9D4824]/10 text-[#9D4824]' }
    case 'installment':
      return { icon: CalendarClock, tile: 'bg-[#6B5245]/10 text-[#6B5245]' }
    case 'loan_due':
      return { icon: AlertCircle, tile: 'bg-[#B3261E]/10 text-[#B3261E]' }
    default:
      return { icon: ArrowLeftRight, tile: 'bg-[#EDE2D3] text-[#6B5245]' }
  }
}

const statusMeta = (s: string) => {
  if (s === 'success' || s === 'paid' || s === 'completed') {
    return { label: s, cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
  }
  if (s === 'pending' || s === 'overdue') {
    return { label: s, cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
  }
  return { label: s, cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
}

const typeOptions = Object.entries(typeLabels).map(([key, label]) => ({ key, label }))

const ngn = (n: number) => `₦${Math.abs(n).toLocaleString()}`

const PAGE_SIZE = 10

const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

const pagerCls =
  'inline-flex h-8 items-center justify-center gap-1 rounded-full border border-[#E7DCCB] bg-white px-3 text-xs font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] hover:text-[#2C1B13] disabled:opacity-40 disabled:pointer-events-none cursor-pointer'

function MiniStat({ label, value, positive }: { label: string; value: string; positive: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E7DCCB] bg-white px-4 py-3 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${positive ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'}`}>
        {positive ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
      </span>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">{label}</p>
        <p className={`text-base font-black tracking-[-0.02em] ${positive ? 'text-[#176B5B]' : 'text-[#B3261E]'}`}>{value}</p>
      </div>
    </div>
  )
}

export function Transactions() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.get('/dashboard/individual/transactions').then((r) => setAllTxns(r.data))
  }, [])

  const filtered = useMemo(() => {
    let result = allTxns
    if (typeFilter) result = result.filter((t) => t.type === typeFilter)
    if (statusFilter) result = result.filter((t) => t.status === statusFilter)
    if (dateFrom) result = result.filter((t) => new Date(t.date) >= new Date(dateFrom))
    if (dateTo) result = result.filter((t) => new Date(t.date) <= new Date(dateTo + 'T23:59:59'))
    return result
  }, [allTxns, typeFilter, statusFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage])

  const totals = useMemo(() => {
    let credit = 0
    let debit = 0
    for (const t of filtered) {
      if (t.amount >= 0) credit += t.amount
      else debit += t.amount
    }
    return { credit, debit }
  }, [filtered])

  const setFilter = (fn: (v: string) => void, v: string) => { fn(v); setPage(1) }

  const exportCsv = () => {
    const rows = [['Date', 'Type', 'Description', 'Amount', 'Status', 'Reference'].join(',')]
    filtered.forEach((t) => {
      rows.push([t.date, typeLabels[t.type] || t.type, `"${t.description}"`, t.amount, t.status, t.reference].join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Financial</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Transactions</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Every payment, deposit, and adjustment across your accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-semibold text-[#8A5A00] shadow-sm transition hover:bg-[#FFF9EF] cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <Receipt size={22} className="text-[#176B5B]" />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniStat label="Total in" value={ngn(totals.credit)} positive />
        <MiniStat label="Total out" value={ngn(totals.debit)} positive={false} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setFilter(setTypeFilter, e.target.value)}
          className={`${fieldCls} w-auto appearance-none`}
        >
          <option value="">All Types</option>
          {typeOptions.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setFilter(setStatusFilter, e.target.value)}
          className={`${fieldCls} w-auto appearance-none`}
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setFilter(setDateFrom, e.target.value)} className={`${fieldCls} w-auto`} />
        <input type="date" value={dateTo} onChange={(e) => setFilter(setDateTo, e.target.value)} className={`${fieldCls} w-auto`} />
        {filtered.length > 0 && (
          <span className="ml-auto self-center text-xs font-medium text-[#B79B6B]">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE2D3]/60">
              <ArrowLeftRight size={26} className="text-[#6B5245]" />
            </div>
            <p className="font-bold text-[#2C1B13]">No transactions found</p>
            <p className="max-w-sm text-sm text-[#6B5245]">Adjust your filters or check back after your next payment.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#EDE2D3]">
              {paged.map((tx) => {
                const info = typeLabels[tx.type] ?? tx.type
                const meta = typeMeta(tx.type)
                const Icon = meta.icon
                const status = statusMeta(tx.status)
                const positive = tx.amount >= 0
                return (
                  <div key={tx.reference} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#FFF9EF]/70">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tile}`}>
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[#2C1B13]">{info}</p>
                      <p className="truncate text-sm text-[#6B5245]">{tx.description}</p>
                      <p className="mt-0.5 text-xs text-[#B79B6B]">
                        {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}<span className="font-medium text-[#6B5245]">{tx.reference.slice(0, 12)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <p className={`text-base font-black tracking-[-0.02em] ${positive ? 'text-[#176B5B]' : 'text-[#B3261E]'}`}>
                        {positive ? '+' : ''}{ngn(tx.amount)}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${status.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} /> {status.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE2D3] px-5 py-3.5">
                <span className="text-xs font-medium text-[#6B5245]">
                  Showing <span className="font-bold text-[#2C1B13]">{(safePage - 1) * PAGE_SIZE + 1}</span>
                  –<span className="font-bold text-[#2C1B13]">{Math.min(safePage * PAGE_SIZE, filtered.length)}</span> of{' '}
                  <span className="font-bold text-[#2C1B13]">{filtered.length}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className={pagerCls}>
                    <ChevronLeft size={14} /> Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition cursor-pointer ${
                        p === safePage
                          ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm'
                          : 'border border-[#E7DCCB] bg-white text-[#6B5245] hover:bg-[#FFF9EF] hover:text-[#2C1B13]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className={pagerCls}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
