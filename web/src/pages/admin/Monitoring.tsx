import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle, CardHeader } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

export function AdminMonitoring() {
  const [webhookData, setWebhookData] = useState<any>(null)
  const [failedJobs, setFailedJobs] = useState<any>(null)
  const [queueData, setQueueData] = useState<any>(null)
  const [logsData, setLogsData] = useState<any>(null)
  const [tab, setTab] = useState<'webhooks' | 'jobs' | 'queues' | 'logs'>('webhooks')
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/admin/monitoring/webhooks?days=${days}`),
      api.get(`/admin/monitoring/failed-jobs?days=${days}`),
      api.get('/admin/monitoring/queues'),
      api.get(`/admin/monitoring/logs?days=${days}`),
    ]).then(([wh, fj, qu, lg]) => {
      setWebhookData(wh.data)
      setFailedJobs(fj.data)
      setQueueData(qu.data)
      setLogsData(lg.data)
      setLoading(false)
    })
  }, [days])

  const tabs = [
    { key: 'webhooks' as const, label: 'Webhook Delivery' },
    { key: 'jobs' as const, label: 'Failed Jobs' },
    { key: 'queues' as const, label: 'Queues & Latency' },
    { key: 'logs' as const, label: 'System Logs' },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Operational Monitoring</h2>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600">
          <option value={1}>Last 24h</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="flex gap-2 border-b dark:border-gray-700">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500">Loading monitoring data...</div>
      ) : (
        <>
          {tab === 'webhooks' && webhookData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Events', value: webhookData.total, color: '', border: 'border-indigo-500' },
                  { label: 'Processed', value: webhookData.processed, color: 'text-green-600', border: 'border-emerald-500' },
                  { label: 'Failed', value: webhookData.failed, color: 'text-red-600', border: 'border-red-500' },
                  { label: 'Retried', value: webhookData.retried, color: 'text-yellow-600', border: 'border-amber-500' },
                  { label: 'Backlog', value: webhookData.backlog, color: 'text-orange-600', border: 'border-orange-500' },
                ].map(s => (
                  <Card key={s.label} className={s.border}>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </Card>
                ))}
              </div>
              {webhookData.recentLogs?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Recent Webhook Events</CardTitle></CardHeader>
                  <Table>
                    <THead>
                      <THeadRow>
                        <THeadCell>Provider</THeadCell>
                        <THeadCell>Event</THeadCell>
                        <THeadCell>Status</THeadCell>
                        <THeadCell>Retries</THeadCell>
                        <THeadCell>Date</THeadCell>
                      </THeadRow>
                    </THead>
                    <TBody>
                      {webhookData.recentLogs.slice(0, 20).map((l: any) => (
                        <TBodyRow key={l.id}>
                          <TBodyCell>{l.provider}</TBodyCell>
                          <TBodyCell>{l.eventType}</TBodyCell>
                          <TBodyCell>
                            <Badge variant={l.status === 'processed' ? 'success' : 'danger'}>{l.status}</Badge>
                          </TBodyCell>
                          <TBodyCell>{l.retryCount}</TBodyCell>
                          <TBodyCell>{new Date(l.createdAt).toLocaleString()}</TBodyCell>
                        </TBodyRow>
                      ))}
                    </TBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {tab === 'jobs' && failedJobs && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-red-500">
                  <p className="text-sm text-gray-500">Total Failed Jobs</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{failedJobs.total}</p>
                </Card>
                <Card className="border-amber-500">
                  <p className="text-sm text-gray-500 mb-2">By Type</p>
                  <div className="space-y-1">
                    {Object.entries(failedJobs.byType || {}).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600">{type.replace(/_/g, ' ')}</span>
                        <Badge variant="danger">{String(count)}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              {failedJobs.steps?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Failed Processing Steps</CardTitle></CardHeader>
                  <Table>
                    <THead>
                      <THeadRow>
                        <THeadCell>Type</THeadCell>
                        <THeadCell>Status</THeadCell>
                        <THeadCell>Retries</THeadCell>
                        <THeadCell>Error</THeadCell>
                        <THeadCell>Date</THeadCell>
                      </THeadRow>
                    </THead>
                    <TBody>
                      {failedJobs.steps.slice(0, 20).map((s: any) => (
                        <TBodyRow key={s.id}>
                          <TBodyCell>{s.stepType?.replace(/_/g, ' ')}</TBodyCell>
                          <TBodyCell><Badge variant="danger">{s.status}</Badge></TBodyCell>
                          <TBodyCell>{s.retryCount}</TBodyCell>
                          <TBodyCell className="max-w-xs truncate">{s.errorMessage || '—'}</TBodyCell>
                          <TBodyCell>{new Date(s.createdAt).toLocaleString()}</TBodyCell>
                        </TBodyRow>
                      ))}
                    </TBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {tab === 'queues' && queueData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overdue Installments', value: queueData.overdueInstallments, color: 'text-red-600', border: 'border-red-500' },
                  { label: 'Pending Processing', value: queueData.pendingProcessingSteps, color: 'text-yellow-600', border: 'border-amber-500' },
                  { label: 'Failed Steps', value: queueData.failedProcessingSteps, color: 'text-red-600', border: 'border-rose-500' },
                ].map(s => (
                  <Card key={s.label} className={s.border}>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </Card>
                ))}
                <Card className="border-cyan-500">
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1 space-y-1">
                    <div className="text-sm">Latency: <Badge variant={queueData.queueLatency === 'normal' ? 'success' : 'warning'}>{queueData.queueLatency}</Badge></div>
                    <div className="text-sm">Error Rate: <Badge variant={queueData.errorRate === 'normal' ? 'success' : 'danger'}>{queueData.errorRate}</Badge></div>
                  </div>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Aging Buckets (Overdue Installments)</CardTitle></CardHeader>
                <Table>
                  <THead>
                    <THeadRow>
                      <THeadCell>Bucket</THeadCell>
                      <THeadCell>Count</THeadCell>
                      <THeadCell>Total Amount</THeadCell>
                    </THeadRow>
                  </THead>
                  <TBody>
                    {(queueData.agingBuckets || []).map((b: any) => (
                      <TBodyRow key={b.label}>
                        <TBodyCell>{b.label}</TBodyCell>
                        <TBodyCell>{b.count}</TBodyCell>
                        <TBodyCell>₦{Number(b.totalAmount).toLocaleString()}</TBodyCell>
                      </TBodyRow>
                    ))}
                  </TBody>
                </Table>
              </Card>
            </div>
          )}

          {tab === 'logs' && logsData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-indigo-500">
                  <p className="text-sm text-gray-500">Total Events</p>
                  <p className="text-2xl font-bold mt-1">{logsData.total}</p>
                </Card>
                <Card className="border-emerald-500">
                  <p className="text-sm text-gray-500 mb-2">By Action</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Object.entries(logsData.byAction || {}).sort(([,a], [,b]) => Number(b) - Number(a)).slice(0, 10).map(([action, count]) => (
                      <div key={action} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{action}</span>
                        <Badge>{String(count)}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="border-blue-500">
                  <p className="text-sm text-gray-500 mb-2">By Entity</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {Object.entries(logsData.byEntity || {}).sort(([,a], [,b]) => Number(b) - Number(a)).slice(0, 10).map(([entity, count]) => (
                      <div key={entity} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{entity}</span>
                        <Badge>{String(count)}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              {logsData.logs?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Recent Audit Logs</CardTitle></CardHeader>
                  <Table>
                    <THead>
                      <THeadRow>
                        <THeadCell>Action</THeadCell>
                        <THeadCell>Entity</THeadCell>
                        <THeadCell>Performed By</THeadCell>
                        <THeadCell>Date</THeadCell>
                      </THeadRow>
                    </THead>
                    <TBody>
                      {logsData.logs.slice(0, 30).map((l: any) => (
                        <TBodyRow key={l.id}>
                          <TBodyCell>{l.action}</TBodyCell>
                          <TBodyCell>{l.entityType || '—'}</TBodyCell>
                          <TBodyCell>{l.performedBy || '—'}</TBodyCell>
                          <TBodyCell>{new Date(l.createdAt).toLocaleString()}</TBodyCell>
                        </TBodyRow>
                      ))}
                    </TBody>
                  </Table>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
