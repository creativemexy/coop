import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
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

const potTypeColors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  business_manager: 'success',
  platform: 'info',
  admin: 'info',
  organization: 'warning',
  apex: 'danger',
}

const potTypeBorder: Record<string, string> = {
  total: 'border-indigo-500',
  platform: 'border-blue-500',
  admin: 'border-purple-500',
  business_manager: 'border-emerald-500',
  organization: 'border-amber-500',
  apex: 'border-fuchsia-500',
}

export function SuperAdminFeePots() {
  const [pots, setPots] = useState<FeePot[]>([])
  const [ledger, setLedger] = useState<FeeShareLedger[]>([])
  const [tab, setTab] = useState<'pots' | 'ledger'>('pots')
  const [withdrawingPlatform, setWithdrawingPlatform] = useState(false)
  const [withdrawingAdmin, setWithdrawingAdmin] = useState(false)

  const fetch = useCallback(() => {
    api.get('/ledger/fee-pots').then((r) => setPots(r.data))
    api.get('/ledger/fee-pots/ledger').then((r) => setLedger(r.data))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const totalBalance = pots.reduce((s, p) => s + Number(p.balance), 0)
  const platformPot = pots.find((p) => p.potType === 'platform')
  const adminPot = pots.find((p) => p.potType === 'admin')

  const handleWithdraw = async (type: 'platform' | 'admin') => {
    const setter = type === 'platform' ? setWithdrawingPlatform : setWithdrawingAdmin
    setter(true)
    try {
      await api.post(`/ledger/fee-pots/withdraw/${type}`)
      fetch()
    } finally {
      setter(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Fee Pots</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('pots')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${tab === 'pots' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Pots
          </button>
          <button
            onClick={() => setTab('ledger')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${tab === 'ledger' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Fee Ledger
          </button>
        </div>
      </div>

      {tab === 'pots' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className={potTypeBorder.total}>
              <CardTitle className="text-sm font-medium text-gray-500">Total Balance</CardTitle>
              <p className="mt-1 text-2xl font-bold">₦{totalBalance.toLocaleString()}</p>
            </Card>
            {pots.map((pot) => (
              <Card key={pot.id} className={potTypeBorder[pot.potType] ?? 'border-gray-300'}>
                <CardTitle className="text-sm font-medium text-gray-500 capitalize">{pot.potType.replace('_', ' ')}</CardTitle>
                <p className="mt-1 text-2xl font-bold">₦{Number(pot.balance).toLocaleString()}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-gray-500">Platform Pot (30%)</CardTitle>
                  <p className="mt-1 text-3xl font-bold">
                    ₦{platformPot ? Number(platformPot.balance).toLocaleString() : '0'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!platformPot || Number(platformPot.balance) <= 0 || withdrawingPlatform}
                  onClick={() => handleWithdraw('platform')}
                >
                  {withdrawingPlatform ? 'Processing…' : 'Withdraw All'}
                </Button>
              </div>
            </Card>

            <Card className="border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-gray-500">Admin Pot (20%)</CardTitle>
                  <p className="mt-1 text-3xl font-bold">
                    ₦{adminPot ? Number(adminPot.balance).toLocaleString() : '0'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!adminPot || Number(adminPot.balance) <= 0 || withdrawingAdmin}
                  onClick={() => handleWithdraw('admin')}
                >
                  {withdrawingAdmin ? 'Processing…' : 'Withdraw All'}
                </Button>
              </div>
            </Card>
          </div>

          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Type</THeadCell>
                <THeadCell>Entity ID</THeadCell>
                <THeadCell>Balance</THeadCell>
                <THeadCell>Updated</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {pots.map((pot) => (
                <TBodyRow key={pot.id}>
                  <TBodyCell>
                    <Badge variant={potTypeColors[pot.potType] ?? 'default'}>
                      {pot.potType.replace('_', ' ')}
                    </Badge>
                  </TBodyCell>
                  <TBodyCell className="text-xs font-mono">{pot.entityId.slice(0, 12)}...</TBodyCell>
                  <TBodyCell className="font-medium">₦{Number(pot.balance).toLocaleString()}</TBodyCell>
                  <TBodyCell>{new Date(pot.updatedAt).toLocaleString()}</TBodyCell>
                </TBodyRow>
              ))}
              {pots.length === 0 && (
                <TBodyRow>
                  <TBodyCell colSpan={4} className="text-center text-gray-400 py-8">No fee pots found</TBodyCell>
                </TBodyRow>
              )}
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
              <THeadCell>Platform (30%)</THeadCell>
              <THeadCell>Admin (20%)</THeadCell>
              <THeadCell>Org (35%)</THeadCell>
              <THeadCell>Apex (15%)</THeadCell>
            </THeadRow>
          </THead>
          <TBody>
            {ledger.map((l) => (
              <TBodyRow key={l.id}>
                <TBodyCell>{new Date(l.createdAt).toLocaleDateString()}</TBodyCell>
                <TBodyCell><Badge variant="info">{l.source}</Badge></TBodyCell>
                <TBodyCell className="font-medium">₦{Number(l.totalFee).toLocaleString()}</TBodyCell>
                <TBodyCell>₦{Number(l.platformShare).toLocaleString()}</TBodyCell>
                <TBodyCell>₦{Number(l.superAdminShare).toLocaleString()}</TBodyCell>
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
