import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import {
  Badge,
  Btn,
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

  const totalDebit = data?.transactions.reduce((s, t) => s + Number(t.debit || 0), 0) ?? 0
  const totalCredit = data?.transactions.reduce((s, t) => s + Number(t.credit || 0), 0) ?? 0
  const totalFees = data?.transactions.reduce((s, t) => s + Number(t.fee || 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Money In / Money Out"
        title="Transaction Register"
        subtitle="Every posting across payments, loans, savings and BNPL."
        actions={
          <Btn onClick={() => window.open(`/api/v1/accountant/transactions/export?source=${source}&days=${days}`, '_blank')}>
            Export CSV
          </Btn>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Transactions" value={data?.total ?? 0} sub={`last ${days} days`} icon="🧮" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
        <StatCard label="Debits (page)" value={formatCurrency(totalDebit)} sub="on this page" icon="➖" iconCls="bg-[#9D4824]/10 text-[#9D4824]" />
        <StatCard label="Credits (page)" value={formatCurrency(totalCredit)} sub="on this page" icon="➕" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
        <StatCard label="Fees (page)" value={formatCurrency(totalFees)} sub="on this page" icon="💵" iconCls="bg-[#E4A42A]/15 text-[#8A5A00]" />
      </div>

      <Panel padded={false}>
        <div className="flex flex-wrap items-end gap-3 border-b border-[#EDE2D3] p-5">
          <div className="w-48">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">Source</label>
            <select className={inputCls + ' w-full cursor-pointer'} value={source} onChange={e => { setSource(e.target.value); setOffset(0) }}>
              {sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="w-24">
            <TextInput label="Days" type="number" value={days} onChange={e => { setDays(e.target.value); setOffset(0) }} />
          </div>
          <div className="ml-auto text-sm font-semibold text-[#6B5245]">
            {data ? `${data.total} transactions` : ''}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#C9B89F]">Loading...</div>
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
            <div className="flex items-center justify-between border-t border-[#EDE2D3] px-4 py-3">
              <Btn variant="secondary" size="sm" disabled={offset === 0} onClick={() => fetch(offset - limit)}>
                Previous
              </Btn>
              <span className="text-sm text-[#6B5245]">
                {offset + 1} - {Math.min(offset + limit, data.total)} of {data.total}
              </span>
              <Btn variant="secondary" size="sm" disabled={offset + limit >= data.total} onClick={() => fetch(offset + limit)}>
                Next
              </Btn>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-sm text-[#C9B89F]">No transactions found</div>
        )}
      </Panel>
    </div>
  )
}
