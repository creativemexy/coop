import { useEffect, useState, useMemo } from 'react'
import { api } from '../../api/client'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'

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

const typeOptions = Object.entries(typeLabels).map(([key, label]) => ({ key, label }))

const ngn = (n: number) => `₦${Math.abs(n).toLocaleString()}`

const PAGE_SIZE = 10

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Transactions</h2>
        <Button variant="ghost" size="sm" onClick={exportCsv}>Export CSV</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setFilter(setTypeFilter, e.target.value)}
          className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All Types</option>
          {typeOptions.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setFilter(setStatusFilter, e.target.value)}
          className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setFilter(setDateFrom, e.target.value)}
          className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setFilter(setDateTo, e.target.value)}
          className="border rounded px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          placeholder="To"
        />
        <span className="text-sm text-gray-500 self-center">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <Card>
        <div className="space-y-1">
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No transactions found</p>
          ) : (
            paged.map((tx, i) => {
              const info = typeLabels[tx.type] ?? tx.type
              return (
                <div key={tx.reference} className={`flex items-center justify-between py-2.5 px-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg ${
                  [
                    'bg-sky-50/40 dark:bg-sky-950/10',
                    'bg-emerald-50/40 dark:bg-emerald-950/10',
                    'bg-amber-50/40 dark:bg-amber-950/10',
                    'bg-fuchsia-50/40 dark:bg-fuchsia-950/10',
                    'bg-violet-50/40 dark:bg-violet-950/10',
                  ][i % 5]
                }`}>
                  <div>
                    <p className="font-medium">{info}</p>
                    <p className="text-sm text-gray-500">{tx.description}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount >= 0 ? '+' : ''}{ngn(tx.amount)}
                    </p>
                    <Badge variant={
                      tx.status === 'success' || tx.status === 'paid' || tx.status === 'completed'
                        ? 'success'
                        : tx.status === 'pending' || tx.status === 'overdue'
                        ? 'warning'
                        : 'default'
                    }>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              )
            })
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg border cursor-pointer ${
                    p === safePage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
