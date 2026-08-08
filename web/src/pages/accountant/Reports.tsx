import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'

interface Account {
  id: string
  code: string
  name: string
  type: string
}

interface JournalLine {
  accountId: string
  debit: number
  credit: number
}

interface JournalEntry {
  lines: JournalLine[]
}

interface FeeShareLedger {
  id: string
  source: string
  totalFee: number
  superAdminShare: number
  platformShare: number
  organizationShare: number
  apexShare: number
  createdAt: string
}

interface TrialBalanceRow {
  code: string
  name: string
  type: string
  totalDebit: number
  totalCredit: number
  balance: number
}

export function Reports() {
  const [tab, setTab] = useState<'trial' | 'fees'>('trial')
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([])
  const [feeLedger, setFeeLedger] = useState<FeeShareLedger[]>([])

  const fetchTrialBalance = useCallback(async () => {
    const [accountsRes, entriesRes] = await Promise.all([
      api.get('/ledger/accounts'),
      api.get('/ledger/journal-entries'),
    ])
    const accounts: Account[] = accountsRes.data
    const entries: JournalEntry[] = entriesRes.data

    const lineMap: Record<string, { totalDebit: number; totalCredit: number }> = {}
    for (const entry of entries) {
      for (const line of entry.lines) {
        if (!lineMap[line.accountId]) {
          lineMap[line.accountId] = { totalDebit: 0, totalCredit: 0 }
        }
        lineMap[line.accountId].totalDebit += Number(line.debit)
        lineMap[line.accountId].totalCredit += Number(line.credit)
      }
    }

    const rows: TrialBalanceRow[] = accounts.map((a) => {
      const totals = lineMap[a.id] ?? { totalDebit: 0, totalCredit: 0 }
      return {
        code: a.code,
        name: a.name,
        type: a.type,
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
        balance: Math.abs(totals.totalDebit - totals.totalCredit),
      }
    })

    rows.sort((a, b) => a.code.localeCompare(b.code))
    setTrialBalance(rows)
  }, [])

  const fetchFeeLedger = useCallback(async () => {
    const { data } = await api.get('/ledger/fee-pots/ledger')
    setFeeLedger(data)
  }, [])

  useEffect(() => {
    if (tab === 'trial') fetchTrialBalance()
    else fetchFeeLedger()
  }, [tab, fetchTrialBalance, fetchFeeLedger])

  const downloadCSV = () => {
    const headers = tab === 'trial'
      ? ['Code', 'Name', 'Type', 'Total Debit', 'Total Credit', 'Balance']
      : ['Date', 'Source', 'Total Fee', 'Super Admin', 'Platform', 'Org', 'Apex']

    const rows = tab === 'trial'
      ? trialBalance.map((r) => [r.code, r.name, r.type, r.totalDebit, r.totalCredit, r.balance])
      : feeLedger.map((r) => [
          new Date(r.createdAt).toLocaleDateString(),
          r.source,
          r.totalFee,
          r.superAdminShare,
          r.platformShare,
          r.organizationShare,
          r.apexShare,
        ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((val) => (typeof val === 'string' && val.includes(',') ? `"${val}"` : val)).join(','),
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = tab === 'trial' ? 'trial-balance.csv' : 'fee-share-summary.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const grandTotalDebit = trialBalance.reduce((s, r) => s + r.totalDebit, 0)
  const grandTotalCredit = trialBalance.reduce((s, r) => s + r.totalCredit, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Reports</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('trial')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${tab === 'trial' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Trial Balance
          </button>
          <button
            onClick={() => setTab('fees')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${tab === 'fees' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Fee Summary
          </button>
          <Button variant="secondary" size="sm" onClick={downloadCSV}>Download CSV</Button>
        </div>
      </div>

      {tab === 'trial' ? (
        <>
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Code</THeadCell>
                <THeadCell>Account</THeadCell>
                <THeadCell>Type</THeadCell>
                <THeadCell>Total Debit</THeadCell>
                <THeadCell>Total Credit</THeadCell>
                <THeadCell>Balance</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {trialBalance.map((r) => (
                <TBodyRow key={r.code}>
                  <TBodyCell><code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{r.code}</code></TBodyCell>
                  <TBodyCell className="font-medium">{r.name}</TBodyCell>
                  <TBodyCell><Badge variant={r.type === 'asset' ? 'info' : r.type === 'liability' ? 'warning' : r.type === 'equity' ? 'success' : 'default'}>{r.type}</Badge></TBodyCell>
                  <TBodyCell>₦{r.totalDebit.toLocaleString()}</TBodyCell>
                  <TBodyCell>₦{r.totalCredit.toLocaleString()}</TBodyCell>
                  <TBodyCell className="font-medium">₦{r.balance.toLocaleString()}</TBodyCell>
                </TBodyRow>
              ))}
              <TBodyRow className="font-bold bg-gray-50 dark:bg-gray-800">
                <TBodyCell colSpan={3}>Grand Total</TBodyCell>
                <TBodyCell>₦{grandTotalDebit.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{grandTotalCredit.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{Math.abs(grandTotalDebit - grandTotalCredit).toLocaleString()}</TBodyCell>
              </TBodyRow>
            </TBody>
          </Table>
        </>
      ) : (
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>Date</THeadCell>
              <THeadCell>Source</THeadCell>
              <THeadCell>Total Fee</THeadCell>
              <THeadCell>Super Admin</THeadCell>
              <THeadCell>Platform</THeadCell>
              <THeadCell>Org</THeadCell>
              <THeadCell>Apex</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {feeLedger.map((l) => (
              <TBodyRow key={l.id}>
                <TBodyCell>{new Date(l.createdAt).toLocaleDateString()}</TBodyCell>
                <TBodyCell><Badge variant="info">{l.source}</Badge></TBodyCell>
                <TBodyCell className="font-medium">₦{Number(l.totalFee).toLocaleString()}</TBodyCell>
                <TBodyCell>₦{Number(l.superAdminShare).toLocaleString()}</TBodyCell>
                <TBodyCell>₦{Number(l.platformShare).toLocaleString()}</TBodyCell>
                <TBodyCell>₦{Number(l.organizationShare).toLocaleString()}</TBodyCell>
                <TBodyCell>₦{Number(l.apexShare).toLocaleString()}</TBodyCell>
              </TBodyRow>
            ))}
            {feeLedger.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={7} className="text-center text-gray-400 py-8">No fee records found</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      )}
    </div>
  )
}
