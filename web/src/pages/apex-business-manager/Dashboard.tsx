import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { naira } from '../../lib/utils'
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
} from '../../components/ui/warm'

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
  const [withdrawMsg, setWithdrawMsg] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [bankEdit, setBankEdit] = useState(false)
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '', sortCode: '', bankCode: '' })
  const [bankSaving, setBankSaving] = useState(false)
  const [bankMsg, setBankMsg] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)

  const load = () => api.get('/apex-bm/dashboard').then(r => setData(r.data))

  useEffect(() => { load() }, [])

  const withdraw = async () => {
    setWithdrawing(true)
    setWithdrawMsg(null)
    try {
      const { data: res } = await api.post('/ledger/fee-pots/withdraw/share')
      setWithdrawMsg({ tone: 'success', text: `Withdrawn ${naira(res.withdrawn)}. Remaining: ${naira(res.remaining)}` })
      load()
    } catch {
      setWithdrawMsg({ tone: 'danger', text: 'Withdrawal failed' })
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
    setBankMsg(null)
  }

  const saveBank = async () => {
    setBankSaving(true)
    try {
      await api.patch('/apex-bm/bank', bankForm)
      setBankMsg({ tone: 'success', text: 'Bank details saved' })
      setBankEdit(false)
      load()
    } catch {
      setBankMsg({ tone: 'danger', text: 'Failed to save bank details' })
    }
    setBankSaving(false)
  }

  if (!data) return <div className="p-6 text-sm text-[#6B5245]">Loading...</div>

  const hasBank = !!data.apexOrg.accountNumber

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Apex Overview"
        title={data.apexOrg.name}
        subtitle="Fee balances, settlement bank and the most recent fee ledger entries."
        actions={<Badge variant="default">Code · {data.apexOrg.code}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Organizations" value={data.stats.organizations} sub="affiliate cooperatives" icon="🏢" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
        <StatCard label="Members" value={data.stats.members} sub="across all members" icon="👥" iconCls="bg-[#E4A42A]/15 text-[#8A5A00]" />
        <StatCard
          label="Apex Fee Balance"
          value={naira(data.fees.apexBalance)}
          sub="eligible for withdrawal"
          valueCls="text-[#176B5B]"
          icon="💰"
          iconCls="bg-[#176B5B]/10 text-[#176B5B]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Registration Fees" value={naira(data.fees.totalFees)} sub="cumulative" icon="🧾" iconCls="bg-[#9D4824]/10 text-[#9D4824]" />
        <StatCard label="Apex Share (15%)" value={naira(data.fees.apexShare)} sub="apex cut of registration fees" icon="📈" iconCls="bg-[#E4A42A]/15 text-[#8A5A00]" />
        <StatCard label="Org Share (35%)" value={naira(data.fees.orgShares)} sub="passed to organizations" icon="🏛️" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
      </div>

      <Panel title="Settlement Bank" subtitle={hasBank ? 'Withdrawal destination' : 'Add bank details to enable withdrawals'} actions={<Btn variant="ghost" size="sm" onClick={openBankEdit}>{hasBank ? 'Edit' : 'Add Bank Details'}</Btn>}>
        {hasBank ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B79B6B]">Bank</p>
              <p className="mt-0.5 font-semibold text-[#2C1B13]">{data.apexOrg.bankName}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B79B6B]">Account</p>
              <p className="mt-0.5 font-semibold text-[#2C1B13]">{data.apexOrg.accountName}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B79B6B]">Number</p>
              <p className="mt-0.5 font-semibold text-[#2C1B13]">{data.apexOrg.accountNumber}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B79B6B]">Codes</p>
              <p className="mt-0.5 text-[#6B5245]">
                {data.apexOrg.sortCode}{data.apexOrg.bankCode ? ` / ${data.apexOrg.bankCode}` : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#6B5245]">No bank details set yet.</p>
            <Btn size="sm" onClick={openBankEdit}>Add Bank Details</Btn>
          </div>
        )}
      </Panel>

      <Panel title="Withdraw Apex Share" subtitle="Settle the apex fee balance to your bank account">
        <div className="flex flex-wrap items-center gap-4">
          <Btn
            onClick={withdraw}
            disabled={withdrawing || !hasBank || data.fees.apexBalance <= 0}
          >
            {withdrawing ? 'Processing...' : 'Withdraw Apex Share'}
          </Btn>
          {!hasBank && <p className="text-xs text-[#B79B6B]">Set bank details first to withdraw.</p>}
          {withdrawMsg && <Badge variant={withdrawMsg.tone}>{withdrawMsg.text}</Badge>}
        </div>
      </Panel>

      <Panel title="Recent Fee Ledger" subtitle="Latest registration fee splits hitting this apex" padded={false}>
        <Table>
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
                <TBodyCell className="font-semibold text-[#2C1B13]">{naira(Number(l.totalFee))}</TBodyCell>
                <TBodyCell>{naira(Number(l.apexShare))}</TBodyCell>
                <TBodyCell>{naira(Number(l.organizationShare))}</TBodyCell>
                <TBodyCell>{new Date(l.createdAt).toLocaleDateString()}</TBodyCell>
              </TBodyRow>
            ))}
            {data.recentLedger.length === 0 && (
              <EmptyRow colSpan={4}>No fee entries yet</EmptyRow>
            )}
          </TBody>
        </Table>
      </Panel>

      <Modal open={bankEdit} onClose={() => setBankEdit(false)} title="Bank Details">
        <div className="space-y-4">
          <TextInput label="Bank Name" placeholder="e.g. GTBank" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} />
          <TextInput label="Account Name" placeholder="e.g. FENAC Apex Cooperative" value={bankForm.accountName} onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })} />
          <TextInput label="Account Number" placeholder="e.g. 0123456789" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Sort Code" placeholder="e.g. 044" value={bankForm.sortCode} onChange={(e) => setBankForm({ ...bankForm, sortCode: e.target.value })} />
            <TextInput label="Bank Code" placeholder="e.g. 058" value={bankForm.bankCode} onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Btn onClick={saveBank} disabled={bankSaving} className="flex-1">
              {bankSaving ? 'Saving...' : 'Save'}
            </Btn>
            <Btn variant="secondary" onClick={() => setBankEdit(false)}>Cancel</Btn>
          </div>
          {bankMsg && <Badge variant={bankMsg.tone} dot>{bankMsg.text}</Badge>}
        </div>
      </Modal>
    </div>
  )
}