import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface Transaction {
  id: string
  date: string
  type: string
  source: string
  description: string
  debit: number
  credit: number
  fee: number
  reference: string
  status: string
  userId: string
  subscriptionId: string
}

interface PageData {
  total: number
  limit: number
  offset: number
  returned: number
  transactions: Transaction[]
}

const sourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'payment', label: 'Payments' },
  { value: 'bnpl_installment', label: 'BNPL Installments' },
  { value: 'bnpl_subscription', label: 'BNPL Orders' },
  { value: 'loan', label: 'Loans' },
  { value: 'loan_repayment', label: 'Loan Repayments' },
  { value: 'savings', label: 'Savings' },
  { value: 'journal', label: 'Journal Entries' },
  { value: 'fee_share', label: 'Fee Shares' },
]

const typeColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  payment: 'success',
  bnpl_installment: 'warning',
  bnpl_subscription: 'info',
  loan_disbursement: 'danger',
  loan_repayment: 'success',
  savings_deposit: 'success',
  savings_withdrawal: 'danger',
  journal_entry: 'info',
  fee_share: 'warning',
}

export function TransactionRegister() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState('')
  const [days, setDays] = useState('90')
  const [offset, setOffset] = useState(0)
  const limit = 100

  const fetch = async (newOffset = 0) => {
    setLoading(true)
    const params: Record<string, string> = { limit: String(limit), offset: String(newOffset) }
    if (source) params.source = source
    if (days) params.days = days
    const res = await api.get('/accountant/transactions', { params })
    setData(res.data)
    setOffset(newOffset)
    setLoading(false)
  }

  useEffect(() => { fetch() }, [source, days])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Transaction Register</CardTitle>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Source</label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={source}
              onChange={e => { setSource(e.target.value); setOffset(0) }}
            >
              {sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Days</label>
            <Input type="number" value={days} onChange={e => { setDays(e.target.value); setOffset(0) }} className="w-20" />
          </div>
          <Button onClick={() => window.open(`/api/v1/accountant/transactions/export?source=${source}&days=${days}`, '_blank')}>
            Export CSV
          </Button>
          <div className="text-sm text-gray-500 ml-auto">
            {data ? `${data.total} transactions` : ''}
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : data && data.transactions.length > 0 ? (
          <>
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Date</THeadCell>
                  <THeadCell>Type</THeadCell>
                  <THeadCell>Description</THeadCell>
                  <THeadCell>Debit</THeadCell>
                  <THeadCell>Credit</THeadCell>
                  <THeadCell>Fee</THeadCell>
                  <THeadCell>Reference</THeadCell>
                  <THeadCell>Status</THeadCell>
                </THeadRow>
              </THead>
              <TBody>
                {data.transactions.map((t, i) => (
                  <TBodyRow key={`${t.type}-${t.id}-${i}`}>
                    <TBodyCell>{new Date(t.date).toLocaleDateString()}</TBodyCell>
                    <TBodyCell>
                      <Badge variant={typeColors[t.type.split('_')[0]] || 'default'}>
                        {t.type}
                      </Badge>
                    </TBodyCell>
                    <TBodyCell className="max-w-xs truncate">{t.description}</TBodyCell>
                    <TBodyCell>{t.debit > 0 ? formatCurrency(t.debit) : '-'}</TBodyCell>
                    <TBodyCell>{t.credit > 0 ? formatCurrency(t.credit) : '-'}</TBodyCell>
                    <TBodyCell>{t.fee > 0 ? formatCurrency(t.fee) : '-'}</TBodyCell>
                    <TBodyCell className="max-w-[120px] truncate text-xs">{t.reference || '-'}</TBodyCell>
                    <TBodyCell><Badge variant="info">{t.status}</Badge></TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <Button variant="secondary" disabled={offset === 0} onClick={() => fetch(offset - limit)}>
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                {offset + 1} - {Math.min(offset + limit, data.total)} of {data.total}
              </span>
              <Button variant="secondary" disabled={offset + limit >= data.total} onClick={() => fetch(offset + limit)}>
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">No transactions found</div>
        )}
      </Card>
    </div>
  )
}
