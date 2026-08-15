import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { NUBAN_BANKS } from '../../lib/banks'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

interface FeePot {
  id: string
  potType: string
  entityId: string
  balance: number
  createdAt: string
  updatedAt: string
}

interface FeeShareLedger {
  id: string
  paymentId: string
  source: string
  totalFee: number
  superAdminShare: number
  platformShare: number
  organizationShare: number
  apexShare: number
  organizationId?: string
  apexOrgId?: string
  createdAt: string
}

interface WithdrawalRequest {
  id: string
  potType: string
  amount: number
  status: string
  requestedBy: string
  approvedBy?: string
  note?: string
  createdAt: string
}

interface BankOption {
  code: string
  name: string
}

const payoutStatusColors: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  completed: 'success',
  failed: 'danger',
}

export function FeePots() {
  const [pots, setPots] = useState<FeePot[]>([])
  const [ledger, setLedger] = useState<FeeShareLedger[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [tab, setTab] = useState<'pots' | 'ledger' | 'withdrawals'>('pots')
  const [requesting, setRequesting] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({ accountNumber: '', bankCode: '', bankName: '' })
  const [banks, setBanks] = useState<BankOption[]>([])
  const [requestMsg, setRequestMsg] = useState('')
  const [apexOrgs, setApexOrgs] = useState<{ id: string; name: string }[]>([])
  const [apexOrgId, setApexOrgId] = useState('')
  const [feePotsStats, setFeePotsStats] = useState<{
    summary: {
      organizationCount: number
      potBalance: number
      totalFees: number
      organizationShare: number
      registrationShare: number
      bnplShare: number
      platformShare: number
      apexShare: number
      superAdminShare: number
    }
    organizations: Array<{
      organizationId: string
      organizationName: string
      organizationCode: string
      apexOrgId: string
      apexName: string
      potBalance: number
      potUpdatedAt: string | null
      totalFees: number
      organizationShare: number
      registrationShare: number
      bnplShare: number
      platformShare: number
      apexShare: number
      superAdminShare: number
    }>
  } | null>(null)

  const fetch = useCallback(() => {
    api.get('/ledger/fee-pots').then((r) => setPots(r.data))
    api.get('/ledger/fee-pots/ledger').then((r) => setLedger(r.data))
    api.get('/ledger/fee-pots/withdrawals').then((r) => setWithdrawals(r.data))
    api.get('/ledger/fee-pots/banks').then((r) => setBanks(r.data || []))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    api.get('/accountant/apex-organizations').then((r) => setApexOrgs(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (apexOrgId) params.set('apexOrgId', apexOrgId)
    api.get(`/accountant/dashboard/fee-pots?${params}`)
      .then((r) => setFeePotsStats(r.data))
      .catch(() => {})
  }, [apexOrgId])

  const detectBank = (accountNumber: string): BankOption | null => {
    if (accountNumber.length !== 10) return null
    const prefix = accountNumber.slice(0, 3)
    const hint = NUBAN_BANKS[prefix]?.name || (['907', '090'].includes(prefix) ? 'Opay' : '')
    if (!hint) return null
    const lower = hint.toLowerCase()
    return (
      banks.find((b) => b.name.toLowerCase() === lower) ||
      banks.find((b) => b.name.toLowerCase().includes(lower)) ||
      null
    )
  }

  const platformPot = pots.find((p) => p.potType === 'platform')

  const handleRequestWithdrawal = async () => {
    setRequesting(true)
    setRequestMsg('')
    try {
      await api.post('/ledger/fee-pots/withdraw/platform/request', requestForm)
      setRequestMsg('Withdrawal request submitted for super admin approval')
      setShowRequestModal(false)
      setRequestForm({ accountNumber: '', bankCode: '', bankName: '' })
      fetch()
    } catch (e: any) {
      setRequestMsg(e?.response?.data?.message || 'Request failed')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Fee Pots</h2>
        <div className="flex items-center gap-3">
          <select
            value={apexOrgId}
            onChange={(e) => setApexOrgId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="">All Apex Organizations</option>
            {apexOrgs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <div className="flex gap-2">
          <button
            onClick={() => setTab('pots')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${tab === 'pots' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Pots
          </button>
          <button
            onClick={() => setTab('withdrawals')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${tab === 'withdrawals' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Withdrawals
          </button>
          <button
            onClick={() => setTab('ledger')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${tab === 'ledger' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Fee Ledger
          </button>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-500">
          <CardTitle className="text-sm font-medium text-gray-500">Organizations</CardTitle>
          <p className="mt-1 text-2xl font-bold">{feePotsStats?.summary.organizationCount ?? 0}</p>
        </Card>
        <Card className="border-amber-500">
          <CardTitle className="text-sm font-medium text-gray-500">Org Pot Balance</CardTitle>
          <p className="mt-1 text-2xl font-bold">₦{(feePotsStats?.summary.potBalance ?? 0).toLocaleString()}</p>
        </Card>
        <Card className="border-blue-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Fee Income</CardTitle>
          <p className="mt-1 text-2xl font-bold">₦{(feePotsStats?.summary.totalFees ?? 0).toLocaleString()}</p>
        </Card>
        <Card className="border-emerald-500">
          <CardTitle className="text-sm font-medium text-gray-500">Org Share Earned</CardTitle>
          <p className="mt-1 text-2xl font-bold">₦{(feePotsStats?.summary.organizationShare ?? 0).toLocaleString()}</p>
        </Card>
      </div>

      <Card>
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>Organization</THeadCell>
              <THeadCell>Apex</THeadCell>
              <THeadCell>Pot Balance</THeadCell>
              <THeadCell>Total Fees</THeadCell>
              <THeadCell>Org Share</THeadCell>
              <THeadCell>Registration</THeadCell>
              <THeadCell>BNPL</THeadCell>
              <THeadCell>Platform</THeadCell>
              <THeadCell>Apex Share</THeadCell>
              <THeadCell>Super Admin</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {(feePotsStats?.organizations ?? []).map((o) => (
              <TBodyRow key={o.organizationId}>
                <TBodyCell>
                  <div className="font-medium">{o.organizationName}</div>
                  <div className="text-xs text-gray-400">{o.organizationCode}</div>
                </TBodyCell>
                <TBodyCell><Badge variant="info">{o.apexName}</Badge></TBodyCell>
                <TBodyCell className="font-medium">₦{o.potBalance.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{o.totalFees.toLocaleString()}</TBodyCell>
                <TBodyCell className="font-medium">₦{o.organizationShare.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{o.registrationShare.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{o.bnplShare.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{o.platformShare.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{o.apexShare.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{o.superAdminShare.toLocaleString()}</TBodyCell>
              </TBodyRow>
            ))}
            {(!feePotsStats || feePotsStats.organizations.length === 0) && (
              <TBodyRow>
                <TBodyCell colSpan={10} className="text-center text-gray-400 py-8">No fee pot data found</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      </Card>

      {tab === 'pots' && (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-gray-500">Platform Pot (30%)</CardTitle>
                <p className="mt-1 text-3xl font-bold">
                  ₦{platformPot ? Number(platformPot.balance).toLocaleString() : '0'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Super admin approval required for withdrawal</p>
              </div>
              <Button
                variant="primary"
                size="lg"
                disabled={!platformPot || Number(platformPot.balance) <= 0 || requesting}
                onClick={() => { setRequestMsg(''); setShowRequestModal(true) }}
              >
                Request Withdrawal
              </Button>
            </div>
          </Card>

          {showRequestModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowRequestModal(false)}>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold dark:text-gray-100">Request Platform Withdrawal</h3>
                <p className="text-sm text-gray-500">
                  Amount: ₦{platformPot ? Number(platformPot.balance).toLocaleString() : '0'} · paid via Paystack after super admin approval
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g. 9071254060"
                      value={requestForm.accountNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        const bank = detectBank(digits)
                        setRequestForm((f) => ({
                          ...f,
                          accountNumber: digits,
                          ...(bank ? { bankName: bank.name, bankCode: bank.code } : {}),
                        }))
                      }}
                    />
                    {requestForm.accountNumber.length === 10 && !requestForm.bankCode && (
                      <p className="text-xs text-gray-400 mt-1">Bank not detected — select it below.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                      value={requestForm.bankCode}
                      onChange={(e) => {
                        const b = banks.find((x) => x.code === e.target.value)
                        setRequestForm((f) => ({ ...f, bankCode: e.target.value, bankName: b ? b.name : f.bankName }))
                      }}
                    >
                      <option value="">Select bank…</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                  {requestForm.bankName && requestForm.bankCode && (
                    <p className="text-xs text-gray-400">Destination: {requestForm.bankName} · code {requestForm.bankCode}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" className="flex-1" onClick={() => setShowRequestModal(false)}>Cancel</Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      disabled={!requestForm.accountNumber || !requestForm.bankCode || requesting}
                      onClick={handleRequestWithdrawal}
                    >
                      {requesting ? 'Requesting…' : 'Submit Request'}
                    </Button>
                  </div>
                  {requestMsg && <p className="text-sm text-green-600 dark:text-green-400">{requestMsg}</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'withdrawals' && (
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>Date</THeadCell>
              <THeadCell>Pot</THeadCell>
              <THeadCell>Amount</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Note</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {withdrawals.map((w) => (
              <TBodyRow key={w.id}>
                <TBodyCell className="text-xs">{new Date(w.createdAt).toLocaleString()}</TBodyCell>
                <TBodyCell className="capitalize">{w.potType.replace('_', ' ')}</TBodyCell>
                <TBodyCell className="font-medium">₦{Number(w.amount).toLocaleString()}</TBodyCell>
                <TBodyCell>
                  <Badge variant={payoutStatusColors[w.status] ?? 'default'}>{w.status}</Badge>
                </TBodyCell>
                <TBodyCell className="text-xs text-gray-500">{w.note || '—'}</TBodyCell>
              </TBodyRow>
            ))}
            {withdrawals.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={5} className="text-center text-gray-400 py-8">No withdrawal requests</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      )}

      {tab === 'ledger' && (
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
            {ledger.map((l) => (
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
            {ledger.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={7} className="text-center text-gray-400 py-8">No fee share records found</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      )}
    </div>
  )
}
