import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { naira } from '../../lib/utils'
import { Card, CardTitle } from '../../components/ui/card'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface ApexOrg {
  id: string
  name: string
  code: string
  bankName?: string | null
  accountName?: string | null
  accountNumber?: string | null
  sortCode?: string | null
  bankCode?: string | null
}

interface LedgerEntry {
  id: string
  totalFee: number
  apexShare: number
  organizationShare: number
  createdAt: string
}

interface ApexDashboard {
  apexOrg: ApexOrg
  stats: { organizations: number; members: number }
  fees: { totalFees: number; apexShare: number; orgShares: number; apexBalance: number; ledgerEntries: number }
  recentLedger: LedgerEntry[]
}

export function ApexBusinessManagerDashboard() {
  const [data, setData] = useState<ApexDashboard | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState('')
  const [bankEdit, setBankEdit] = useState(false)
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '', sortCode: '', bankCode: '' })
  const [bankSaving, setBankSaving] = useState(false)
  const [bankMsg, setBankMsg] = useState('')

  const load = () => api.get('/apex-bm/dashboard').then(r => setData(r.data))

  useEffect(() => { load() }, [])

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
    if (!data) return
    setBankForm({
      bankName: data.apexOrg.bankName || '',
      accountName: data.apexOrg.accountName || '',
      accountNumber: data.apexOrg.accountNumber || '',
      sortCode: data.apexOrg.sortCode || '',
      bankCode: data.apexOrg.bankCode || '',
    })
    setBankEdit(true)
    setBankMsg('')
  }

  const saveBank = async () => {
    setBankSaving(true)
    try {
      await api.patch('/apex-bm/bank', bankForm)
      setBankMsg('Bank details saved')
      setBankEdit(false)
      load()
    } catch {
      setBankMsg('Failed to save bank details')
    }
    setBankSaving(false)
  }

  if (!data) return <div className="p-6">Loading...</div>

  const hasBank = !!data.apexOrg.accountNumber

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Apex Dashboard — {data.apexOrg.name}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="border-blue-500">
          <CardTitle className="text-sm font-medium text-gray-500">Organizations</CardTitle>
          <p className="mt-2 text-3xl font-bold">{data.stats.organizations}</p>
        </Card>
        <Card className="border-emerald-500">
          <CardTitle className="text-sm font-medium text-gray-500">Members</CardTitle>
          <p className="mt-2 text-3xl font-bold">{data.stats.members}</p>
        </Card>
        <Card className="border-green-600">
          <CardTitle className="text-sm font-medium text-gray-500">Apex Fee Balance</CardTitle>
          <p className="mt-2 text-3xl font-bold text-green-600 break-words">{naira(data.fees.apexBalance)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="border-indigo-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Registration Fees</CardTitle>
          <p className="mt-2 text-xl font-bold break-words">{naira(data.fees.totalFees)}</p>
        </Card>
        <Card className="border-fuchsia-500">
          <CardTitle className="text-sm font-medium text-gray-500">Apex Share (15%)</CardTitle>
          <p className="mt-2 text-xl font-bold break-words">{naira(data.fees.apexShare)}</p>
        </Card>
        <Card className="border-cyan-500">
          <CardTitle className="text-sm font-medium text-gray-500">Org Share (35%)</CardTitle>
          <p className="mt-2 text-xl font-bold break-words">{naira(data.fees.orgShares)}</p>
        </Card>
      </div>

      {hasBank ? (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500">Bank Details</span>
            <button onClick={openBankEdit} className="text-xs text-blue-600 hover:underline cursor-pointer">Edit</button>
          </div>
          <div className="text-sm space-y-1 dark:text-gray-200">
            <p>Bank: {data.apexOrg.bankName}</p>
            <p>Account: {data.apexOrg.accountName}</p>
            <p>Number: {data.apexOrg.accountNumber}</p>
            <p>Sort Code: {data.apexOrg.sortCode}{data.apexOrg.bankCode ? ` / Bank Code: ${data.apexOrg.bankCode}` : ''}</p>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-dashed dark:border-gray-600">
          <p className="text-sm text-gray-400 mb-2">No bank details set. Add bank details to enable withdrawals.</p>
          <button onClick={openBankEdit} className="text-sm text-blue-600 hover:underline cursor-pointer">Add Bank Details</button>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50 cursor-pointer"
          onClick={withdraw}
          disabled={withdrawing || !hasBank || data.fees.apexBalance <= 0}
          title={!hasBank ? 'Set bank details first' : ''}
        >
          {withdrawing ? 'Processing...' : 'Withdraw Apex Share'}
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
        <h3 className="text-lg font-semibold mb-3 dark:text-gray-100">Recent Fee Ledger</h3>
        <Table borderClass="border-fuchsia-500">
          <THead>
            <THeadRow>
              <THeadCell>Total Fee</THeadCell>
              <THeadCell>Apex Share</THeadCell>
              <THeadCell>Org Share</THeadCell>
              <THeadCell>Date</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {data.recentLedger.map((l) => (
              <TBodyRow key={l.id}>
                <TBodyCell>{naira(Number(l.totalFee))}</TBodyCell>
                <TBodyCell>{naira(Number(l.apexShare))}</TBodyCell>
                <TBodyCell>{naira(Number(l.organizationShare))}</TBodyCell>
                <TBodyCell className="text-gray-500">{new Date(l.createdAt).toLocaleDateString()}</TBodyCell>
              </TBodyRow>
            ))}
            {data.recentLedger.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={4} className="text-center text-gray-400 py-8">No fee entries yet</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  )
}
