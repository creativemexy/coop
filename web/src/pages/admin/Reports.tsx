import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle, CardHeader } from '../../components/ui/card'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface Tenant {
  id: string
  name: string
  code: string
}

export function AdminReports() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [orderVolume, setOrderVolume] = useState<any>(null)
  const [repaymentKpis, setRepaymentKpis] = useState<any>(null)
  const [delinquency, setDelinquency] = useState<any>(null)
  const [tab, setTab] = useState<'volume' | 'repayment' | 'delinquency'>('volume')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/tenants').then(({ data }) => setTenants(data))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    Promise.all([
      api.get(`/admin/tenants/${selectedId}/reports/order-volume`),
      api.get(`/admin/tenants/${selectedId}/reports/repayment-kpis`),
      api.get(`/admin/tenants/${selectedId}/reports/delinquency`),
    ]).then(([ov, rk, dq]) => {
      setOrderVolume(ov.data)
      setRepaymentKpis(rk.data)
      setDelinquency(dq.data)
      setLoading(false)
    })
  }, [selectedId])

  const exportCsv = () => {
    if (!selectedId) return
    const token = localStorage.getItem('access_token')
    fetch(`${api.defaults.baseURL || ''}/admin/tenants/${selectedId}/reports/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `tenant-${selectedId}-report.csv`; a.click()
        URL.revokeObjectURL(url)
      })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tenant Reports</h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="">Select tenant...</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
            ))}
          </select>
          {selectedId && (
            <button onClick={exportCsv}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 cursor-pointer">
              Export CSV
            </button>
          )}
        </div>
      </div>

      {!selectedId && (
        <Card><p className="text-gray-500">Select a tenant to view reports</p></Card>
      )}

      {selectedId && (
        <>
          <div className="flex gap-2 border-b dark:border-gray-700">
            {[
              { key: 'volume' as const, label: 'Order Volume' },
              { key: 'repayment' as const, label: 'Repayment KPIs' },
              { key: 'delinquency' as const, label: 'Delinquency Snapshot' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  tab === t.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            <>
              {tab === 'volume' && orderVolume && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border-indigo-500">
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="text-2xl font-bold mt-1">{orderVolume.totalOrders}</p>
                    </Card>
                    <Card className="border-emerald-500">
                      <p className="text-sm text-gray-500">Active Subscriptions</p>
                      <p className="text-2xl font-bold mt-1">{orderVolume.activeSubscriptions}</p>
                    </Card>
                    <Card className="border-blue-500">
                      <p className="text-sm text-gray-500">Total Volume (₦)</p>
                      <p className="text-2xl font-bold mt-1">₦{Number(orderVolume.totalVolume).toLocaleString()}</p>
                    </Card>
                  </div>
                  {orderVolume.byPlan?.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>By Plan</CardTitle></CardHeader>
                      <Table>
                        <THead>
                          <THeadRow>
                            <THeadCell>Plan</THeadCell>
                            <THeadCell>Orders</THeadCell>
                            <THeadCell>Volume</THeadCell>
                          </THeadRow>
                        </THead>
                        <TBody>
                          {orderVolume.byPlan.map((p: any) => (
                            <TBodyRow key={p.planId}>
                              <TBodyCell>{p.planName}</TBodyCell>
                              <TBodyCell>{p.orderCount}</TBodyCell>
                              <TBodyCell>₦{Number(p.totalVolume).toLocaleString()}</TBodyCell>
                            </TBodyRow>
                          ))}
                        </TBody>
                      </Table>
                    </Card>
                  )}
                </div>
              )}

              {tab === 'repayment' && repaymentKpis && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-indigo-500">
                    <p className="text-sm text-gray-500">Total Installments</p>
                    <p className="text-2xl font-bold mt-1">{repaymentKpis.totalInstallments}</p>
                  </Card>
                  <Card className="border-emerald-500">
                    <p className="text-sm text-gray-500">Payment Rate</p>
                    <p className="text-2xl font-bold mt-1">{(repaymentKpis.paidRate * 100).toFixed(1)}%</p>
                  </Card>
                  <Card className="border-red-500">
                    <p className="text-sm text-gray-500">Overdue</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">{repaymentKpis.overdueCount}</p>
                    <p className="text-xs text-gray-400">₦{Number(repaymentKpis.overdueAmount).toLocaleString()}</p>
                  </Card>
                  <Card className="border-green-600">
                    <p className="text-sm text-gray-500">Paid MTD</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">{repaymentKpis.paidMtdCount}</p>
                    <p className="text-xs text-gray-400">₦{Number(repaymentKpis.paidMtdAmount).toLocaleString()}</p>
                  </Card>
                </div>
              )}

              {tab === 'delinquency' && delinquency && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-red-500">
                      <p className="text-sm text-gray-500">Delinquent Installments</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{delinquency.totalDelinquent}</p>
                    </Card>
                    <Card className="border-amber-500">
                      <p className="text-sm text-gray-500">Delinquent Amount</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">₦{Number(delinquency.totalDelinquentAmount).toLocaleString()}</p>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader><CardTitle>Aging Buckets</CardTitle></CardHeader>
                    <Table>
                      <THead>
                        <THeadRow>
                          <THeadCell>Bucket</THeadCell>
                          <THeadCell>Count</THeadCell>
                          <THeadCell>Amount</THeadCell>
                        </THeadRow>
                      </THead>
                      <TBody>
                        {(delinquency.buckets || []).map((b: any) => (
                          <TBodyRow key={b.label}>
                            <TBodyCell>{b.label}</TBodyCell>
                            <TBodyCell>{b.count}</TBodyCell>
                            <TBodyCell>₦{Number(b.amount).toLocaleString()}</TBodyCell>
                          </TBodyRow>
                        ))}
                      </TBody>
                    </Table>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
