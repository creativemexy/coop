import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { naira } from '../../lib/utils'
import { Card, CardTitle } from '../../components/ui/card'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface Stats {
  totalMembers: number
  totalSavings: number
  totalLoans: number
  loanBalance: number
  pendingLoans: number
  rejectedLoans: number
  organizationFeePotBalance: number
  organizationName?: string | null
  organization?: {
    bankName?: string | null
    accountName?: string | null
    accountNumber?: string | null
    sortCode?: string | null
    bankCode?: string | null
  } | null
}

interface MemberTransaction {
  reference?: string
  date: string
  type: string
  amount: number
  description: string
  status: string
  memberName: string
  memberEmail: string
}

const PAGE_SIZE = 10

export function BusinessManagerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [transactions, setTransactions] = useState<MemberTransaction[]>([])
  const [page, setPage] = useState(1)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState('')
  const [bankEdit, setBankEdit] = useState(false)
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '', sortCode: '', bankCode: '' })
  const [bankSaving, setBankSaving] = useState(false)
  const [bankMsg, setBankMsg] = useState('')

  const load = () => {
    api.get('/dashboard/business-manager').then((r) => setStats(r.data))
    api.get('/dashboard/business-manager/members/transactions').then((r) => { setTransactions(r.data); setPage(1) }).catch(() => setTransactions([]))
  }

  useEffect(() => { load() }, [])

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return transactions.slice(start, start + PAGE_SIZE)
  }, [transactions, page])

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages)
    setPage(next)
  }

  const withdraw = async () => {
    setWithdrawing(true)
    setWithdrawMsg('')
    try {
      const { data: res } = await api.post('/ledger/fee-pots/withdraw/share')
      setWithdrawMsg(`Withdrawn ${naira(res.withdrawn)}. Remaining: ${naira(res.remaining)}`)
      load()
    } catch {
      setWithdrawMsg('Withdrawal failed')
    }
    setWithdrawing(false)
  }

  const openBankEdit = () => {
    setBankForm({
      bankName: stats?.organization?.bankName || '',
      accountName: stats?.organization?.accountName || '',
      accountNumber: stats?.organization?.accountNumber || '',
      sortCode: stats?.organization?.sortCode || '',
      bankCode: stats?.organization?.bankCode || '',
    })
    setBankEdit(true)
    setBankMsg('')
  }

  const saveBank = async () => {
    setBankSaving(true)
    try {
      await api.patch('/dashboard/business-manager/bank', bankForm)
      setBankMsg('Bank details saved')
      setBankEdit(false)
      load()
    } catch {
      setBankMsg('Failed to save bank details')
    }
    setBankSaving(false)
  }

  const hasBank = !!stats?.organization?.accountNumber

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">
        {stats?.organizationName ? `${stats.organizationName} Dashboard` : 'Business Manager Dashboard'}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <Card className="border-emerald-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Total Savings</CardTitle>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 break-words">{naira(Number(stats?.totalSavings ?? 0))}</p>
        </Card>
        <Card className="border-blue-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Total Membership</CardTitle>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold">{stats?.totalMembers ?? '—'}</p>
        </Card>
        <Card className="border-indigo-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Total Loans</CardTitle>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold">{stats?.totalLoans ?? '—'}</p>
        </Card>
        <Card className="border-amber-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Loan Balance (Unpaid)</CardTitle>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold break-words">{naira(Number(stats?.loanBalance ?? 0))}</p>
        </Card>
        <Card className="border-orange-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Pending Loans</CardTitle>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold">{stats?.pendingLoans ?? '—'}</p>
        </Card>
        <Card className="border-red-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Rejected Loans</CardTitle>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold">{stats?.rejectedLoans ?? '—'}</p>
        </Card>
        <Card className="border-amber-500">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">Fee Pot Balance</CardTitle>
          <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold break-words text-amber-600">{naira(Number(stats?.organizationFeePotBalance ?? 0))}</p>
        </Card>
      </div>

      {hasBank ? (
        <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500">Organization Bank Details</span>
            <button onClick={openBankEdit} className="text-xs text-blue-600 hover:underline cursor-pointer">Edit</button>
          </div>
          <div className="text-sm space-y-1 dark:text-gray-200">
            <p>Bank: {stats?.organization?.bankName}</p>
            <p>Account: {stats?.organization?.accountName}</p>
            <p>Number: {stats?.organization?.accountNumber}</p>
            <p>Sort Code: {stats?.organization?.sortCode}{stats?.organization?.bankCode ? ` / Bank Code: ${stats?.organization?.bankCode}` : ''}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-white dark:bg-gray-800 dark:border-gray-600 p-4">
          <p className="text-sm text-gray-400 mb-2">No bank details set. Add bank details to enable withdrawals.</p>
          <button onClick={openBankEdit} className="text-sm text-blue-600 hover:underline cursor-pointer">Add Bank Details</button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50 cursor-pointer"
          onClick={withdraw}
          disabled={withdrawing || !hasBank || (stats?.organizationFeePotBalance ?? 0) <= 0}
          title={!hasBank ? 'Set bank details first' : ''}
        >
          {withdrawing ? 'Processing...' : 'Withdraw Organization Fee Share'}
        </button>
        {withdrawMsg && <span className="text-sm text-green-600">{withdrawMsg}</span>}
      </div>

      {bankEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setBankEdit(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold dark:text-gray-100">Bank Details</h3>
            <input placeholder="Bank Name" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
            <input placeholder="Account Name" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} />
            <input placeholder="Account Number" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
            <input placeholder="Sort Code" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={bankForm.sortCode} onChange={(e) => setBankForm({ ...bankForm, sortCode: e.target.value })} />
            <input placeholder="Bank Code" className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={bankForm.bankCode} onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={saveBank} disabled={bankSaving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 cursor-pointer">
                {bankSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setBankEdit(false)} className="px-4 py-2 border rounded-lg text-sm cursor-pointer">Cancel</button>
            </div>
            {bankMsg && <p className="text-sm text-green-600">{bankMsg}</p>}
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold dark:text-gray-100">Member Transactions</h3>
          {transactions.length > 0 && (
            <span className="text-xs text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, transactions.length)} of {transactions.length}
            </span>
          )}
        </div>
        <Table borderClass="border-emerald-500" className="min-w-[640px]">
          <THead>
            <THeadRow>
              <THeadCell>Date</THeadCell>
              <THeadCell>Member</THeadCell>
              <THeadCell>Type</THeadCell>
              <THeadCell>Description</THeadCell>
              <THeadCell>Amount</THeadCell>
              <THeadCell>Status</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {paginated.map((tx, i) => (
              <TBodyRow key={`${tx.reference ?? ''}-${i}`}>
                <TBodyCell className="whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</TBodyCell>
                <TBodyCell>
                  <span className="font-medium">{tx.memberName}</span>
                  <span className="block text-xs text-gray-400 max-w-[180px] truncate">{tx.memberEmail}</span>
                </TBodyCell>
                <TBodyCell className="capitalize whitespace-nowrap">{tx.type.replace(/_/g, ' ')}</TBodyCell>
                <TBodyCell className="text-gray-500">{tx.description}</TBodyCell>
                <TBodyCell className={`font-medium whitespace-nowrap ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {naira(tx.amount)}
                </TBodyCell>
                <TBodyCell className="capitalize whitespace-nowrap">{tx.status}</TBodyCell>
              </TBodyRow>
            ))}
            {transactions.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={6} className="text-center text-gray-400 py-8">No member transactions yet</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg border cursor-pointer ${
                    p === page ? 'bg-green-600 text-white border-green-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
