import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Modal } from '../../components/ui/modal'

interface Plan {
  id: string
  organizationId: string
  catalogItemId: string
  catalogItem?: { id: string; name: string; price: number }
  tenorOptions?: number[]
  minPrincipal?: number
  maxPrincipal?: number
  eligibilityBands?: Array<{ minScore: number; maxScore: number; maxPrincipal: number }>
  downPaymentPercent: number
  installmentCount: number
  installmentFrequency: string
  interestType: string
  interestRate: number
  monthlyFeeRate?: number
  gracePeriodDays: number
  lateFeeRate: number
  lateFeeCapDays?: number
  isEnabled: boolean
  status: string
  version: number
  createdAt: string
}

interface CatalogItem {
  id: string
  name: string
}

interface AuditLog {
  id: string
  action: string
  changes?: Record<string, { from: any; to: any }>
  performedBy: string
  performerName?: string
  createdAt: string
}

const frequencies = ['weekly', 'biweekly', 'monthly']
const interestTypes = ['flat', 'monthly_fee', 'reducing_balance']

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [form, setForm] = useState({
    catalogItemId: '',
    tenorOptions: [3, 6, 9, 12],
    minPrincipal: 0,
    maxPrincipal: 0,
    downPaymentPercent: 0,
    installmentCount: 3,
    installmentFrequency: 'monthly',
    interestType: 'flat',
    interestRate: 0,
    monthlyFeeRate: 0,
    gracePeriodDays: 0,
    lateFeeRate: 0,
    lateFeeCapDays: 30,
    isEnabled: true,
  })

  const fetch = useCallback(() => {
    api.get('/bnpl/plans').then((r) => setPlans(r.data))
    api.get('/bnpl/catalog').then((r) => setCatalogItems(r.data))
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleCreate = async () => {
    await api.post('/bnpl/plans', form)
    setCreateOpen(false)
    setForm({
      catalogItemId: '',
      tenorOptions: [3, 6, 9, 12],
      minPrincipal: 0,
      maxPrincipal: 0,
      downPaymentPercent: 0,
      installmentCount: 3,
      installmentFrequency: 'monthly',
      interestType: 'flat',
      interestRate: 0,
      monthlyFeeRate: 0,
      gracePeriodDays: 0,
      lateFeeRate: 0,
      lateFeeCapDays: 30,
      isEnabled: true,
    })
    fetch()
  }

  const handleToggleStatus = async (plan: Plan) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active'
    await api.patch(`/bnpl/plans/${plan.id}`, { status: nextStatus })
    fetch()
  }

  const handleViewHistory = async (plan: Plan) => {
    setSelectedPlan(plan)
    const { data } = await api.get(`/bnpl/plans/${plan.id}/version-history`)
    setAuditLogs(data)
    setHistoryOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Repayment Plans</h2>
        <Button onClick={() => { setForm({
          catalogItemId: '',
          tenorOptions: [3, 6, 9, 12],
          minPrincipal: 0,
          maxPrincipal: 0,
          downPaymentPercent: 0,
          installmentCount: 3,
          installmentFrequency: 'monthly',
          interestType: 'flat',
          interestRate: 0,
          monthlyFeeRate: 0,
          gracePeriodDays: 0,
          lateFeeRate: 0,
          lateFeeCapDays: 30,
          isEnabled: true,
        }); setCreateOpen(true) }}>
          Create
        </Button>
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Item</THeadCell>
            <THeadCell>Tenor (mo)</THeadCell>
            <THeadCell>Principal Range</THeadCell>
            <THeadCell>Down %</THeadCell>
            <THeadCell>Installments</THeadCell>
            <THeadCell>Interest Type</THeadCell>
            <THeadCell>Rate</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Enabled</THeadCell>
            <THeadCell>Version</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {plans.map((p) => (
            <TBodyRow key={p.id}>
              <TBodyCell className="font-medium">{p.catalogItem?.name ?? '—'}</TBodyCell>
              <TBodyCell>{p.tenorOptions?.join(', ') ?? '—'}</TBodyCell>
              <TBodyCell>
                {p.minPrincipal && p.maxPrincipal
                  ? `₦${Number(p.minPrincipal).toLocaleString()} - ₦${Number(p.maxPrincipal).toLocaleString()}`
                  : '—'}
              </TBodyCell>
              <TBodyCell>{p.downPaymentPercent}%</TBodyCell>
              <TBodyCell>{p.installmentCount}</TBodyCell>
              <TBodyCell className="capitalize">{p.interestType}</TBodyCell>
              <TBodyCell>{p.interestRate}%</TBodyCell>
              <TBodyCell><Badge variant={p.status === 'active' ? 'success' : 'danger'}>{p.status}</Badge></TBodyCell>
              <TBodyCell><Badge variant={p.isEnabled ? 'success' : 'default'}>{p.isEnabled ? 'Yes' : 'No'}</Badge></TBodyCell>
              <TBodyCell>v{p.version}</TBodyCell>
              <TBodyCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleViewHistory(p)}>
                    History
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(p)}>
                    {p.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </TBodyCell>
            </TBodyRow>
          ))}
          {plans.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={11} className="text-center text-gray-400 py-8">No plans found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Repayment Plan">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Catalog Item</label>
            <select
              value={form.catalogItemId}
              onChange={(e) => setForm({ ...form, catalogItemId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
              required
            >
              <option value="">Select item</option>
              {catalogItems.filter((i) => i.id).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tenor Options (months)</label>
            <div className="flex gap-2 flex-wrap">
              {[3, 6, 9, 12].map((tenor) => (
                <label key={tenor} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.tenorOptions.includes(tenor)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, tenorOptions: [...form.tenorOptions, tenor] })
                      } else {
                        setForm({ ...form, tenorOptions: form.tenorOptions.filter(t => t !== tenor) })
                      }
                    }}
                  />
                  {tenor}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Principal (₦)" type="number" value={form.minPrincipal} onChange={(e) => setForm({ ...form, minPrincipal: Number(e.target.value) })} />
            <Input label="Max Principal (₦)" type="number" value={form.maxPrincipal} onChange={(e) => setForm({ ...form, maxPrincipal: Number(e.target.value) })} />
          </div>
          <Input label="Down Payment %" type="number" value={form.downPaymentPercent} onChange={(e) => setForm({ ...form, downPaymentPercent: Number(e.target.value) })} required />
          <Input label="Installment Count" type="number" value={form.installmentCount} onChange={(e) => setForm({ ...form, installmentCount: Number(e.target.value) })} required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
            <select
              value={form.installmentFrequency}
              onChange={(e) => setForm({ ...form, installmentFrequency: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
            >
              {frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interest Type</label>
            <select
              value={form.interestType}
              onChange={(e) => setForm({ ...form, interestType: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm"
            >
              {interestTypes.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Interest Rate %" type="number" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: Number(e.target.value) })} />
            <Input label="Monthly Fee Rate %" type="number" value={form.monthlyFeeRate} onChange={(e) => setForm({ ...form, monthlyFeeRate: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Grace Period (days)" type="number" value={form.gracePeriodDays} onChange={(e) => setForm({ ...form, gracePeriodDays: Number(e.target.value) })} />
            <Input label="Late Fee Rate %" type="number" value={form.lateFeeRate} onChange={(e) => setForm({ ...form, lateFeeRate: Number(e.target.value) })} />
          </div>
          <Input label="Late Fee Cap (days)" type="number" value={form.lateFeeCapDays} onChange={(e) => setForm({ ...form, lateFeeCapDays: Number(e.target.value) })} />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Plan</label>
          </div>
          <Button onClick={handleCreate} className="w-full">Create</Button>
        </div>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Version History - ${selectedPlan?.catalogItem?.name}`}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {auditLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No version history available</p>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="info">{log.action}</Badge>
                  <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  By: {log.performerName || log.performedBy}
                </p>
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(log.changes).map(([field, change]) => (
                      <div key={field} className="text-xs bg-gray-50 dark:bg-gray-800 rounded p-2">
                        <span className="font-medium capitalize">{field.replace(/_/g, ' ')}:</span>
                        <div className="flex gap-2 mt-1">
                          <span className="text-red-500 line-through">{String(change.from ?? '—')}</span>
                          <span className="text-green-500">{String(change.to ?? '—')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <Button variant="ghost" className="w-full" onClick={() => setHistoryOpen(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}
