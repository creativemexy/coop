import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface WebhookStatus {
  total: number
  processed: number
  failed: number
  retried: number
  backlog: number
  recentLogs: Array<{ id: string; provider: string; status: string; retryCount: number; createdAt: string }>
}

interface QueueStatus {
  overdueInstallments: number
  pendingProcessingSteps: number
  failedProcessingSteps: number
  queueLatency: string
  errorRate: string
  agingBuckets: Array<{ label: string; count: number; totalAmount: number }>
}

export function Monitoring() {
  const [webhooks, setWebhooks] = useState<WebhookStatus | null>(null)
  const [queues, setQueues] = useState<QueueStatus | null>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'webhooks' | 'queues' | 'incidents'>('webhooks')

  useEffect(() => {
    api.get('/admin/monitoring/webhooks?days=1').then((r) => setWebhooks(r.data)).catch(() => {})
    api.get('/admin/monitoring/queues').then((r) => setQueues(r.data)).catch(() => {})
    api.get('/admin/super/incidents').then((r) => setIncidents(r.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Platform Monitoring</h2>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-500">
          <CardTitle className="text-xs">Webhook Success Rate</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">
            {webhooks ? `${webhooks.total > 0 ? ((webhooks.processed / webhooks.total) * 100).toFixed(1) : 100}%` : '—'}
          </p>
        </Card>
        <Card className="border-red-500">
          <CardTitle className="text-xs">Failed Webhooks (24h)</CardTitle>
          <p className="mt-1 text-2xl font-bold text-red-600">{webhooks?.failed || 0}</p>
        </Card>
        <Card className="border-amber-500">
          <CardTitle className="text-xs">Queue Latency</CardTitle>
          <p className="mt-1 text-2xl font-bold dark:text-gray-100">{queues?.queueLatency || '—'}</p>
        </Card>
        <Card className="border-cyan-500">
          <CardTitle className="text-xs">Error Rate</CardTitle>
          <p className={`mt-1 text-2xl font-bold ${queues?.errorRate === 'elevated' ? 'text-red-600' : 'text-green-600'}`}>
            {queues?.errorRate || '—'}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b dark:border-gray-700">
        {(['webhooks', 'queues', 'incidents'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize cursor-pointer ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'webhooks' && webhooks && (
        <Card>
          <CardTitle>Webhook Delivery Status</CardTitle>
          <div className="mt-4">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div><span className="text-xs text-gray-500">Processed</span><p className="text-lg font-semibold text-green-600">{webhooks.processed}</p></div>
              <div><span className="text-xs text-gray-500">Failed</span><p className="text-lg font-semibold text-red-600">{webhooks.failed}</p></div>
              <div><span className="text-xs text-gray-500">Retried</span><p className="text-lg font-semibold text-yellow-600">{webhooks.retried}</p></div>
              <div><span className="text-xs text-gray-500">Backlog</span><p className="text-lg font-semibold text-blue-600">{webhooks.backlog}</p></div>
            </div>
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Provider</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell>Retries</THeadCell>
                  <THeadCell>Time</THeadCell>
                </THeadRow>
              </THead>
              <TBody>
                {webhooks.recentLogs.slice(0, 20).map((l) => (
                  <TBodyRow key={l.id}>
                    <TBodyCell className="font-medium">{l.provider}</TBodyCell>
                    <TBodyCell><Badge variant={l.status === 'processed' ? 'success' : 'danger'}>{l.status}</Badge></TBodyCell>
                    <TBodyCell>{l.retryCount}</TBodyCell>
                    <TBodyCell className="text-xs">{new Date(l.createdAt).toLocaleString()}</TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      )}

      {activeTab === 'queues' && queues && (
        <Card>
          <CardTitle>Queue Status</CardTitle>
          <div className="mt-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><span className="text-xs text-gray-500">Overdue Installments</span><p className="text-lg font-semibold text-red-600">{queues.overdueInstallments}</p></div>
              <div><span className="text-xs text-gray-500">Pending Steps</span><p className="text-lg font-semibold text-yellow-600">{queues.pendingProcessingSteps}</p></div>
              <div><span className="text-xs text-gray-500">Failed Steps</span><p className="text-lg font-semibold text-red-600">{queues.failedProcessingSteps}</p></div>
            </div>
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Aging Bucket</THeadCell>
                  <THeadCell>Count</THeadCell>
                  <THeadCell>Total Amount</THeadCell>
                </THeadRow>
              </THead>
              <TBody>
                {queues.agingBuckets.map((b) => (
                  <TBodyRow key={b.label}>
                    <TBodyCell className="font-medium">{b.label}</TBodyCell>
                    <TBodyCell>{b.count}</TBodyCell>
                    <TBodyCell>₦{b.totalAmount.toLocaleString()}</TBodyCell>
                  </TBodyRow>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      )}

      {activeTab === 'incidents' && (
        <Card>
          <CardTitle>Recent Incidents</CardTitle>
          <div className="mt-4">
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Title</THeadCell>
                  <THeadCell>Severity</THeadCell>
                  <THeadCell>Source</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell>Detected</THeadCell>
                </THeadRow>
              </THead>
              <TBody>
                {incidents.slice(0, 30).map((i: any) => (
                  <TBodyRow key={i.id}>
                    <TBodyCell className="font-medium">{i.title}</TBodyCell>
                    <TBodyCell><Badge variant={i.severity === 'critical' ? 'danger' : i.severity === 'high' ? 'warning' : 'info'}>{i.severity}</Badge></TBodyCell>
                    <TBodyCell>{i.source}</TBodyCell>
                    <TBodyCell>{i.status}</TBodyCell>
                    <TBodyCell className="text-xs">{new Date(i.detectedAt).toLocaleString()}</TBodyCell>
                  </TBodyRow>
                ))}
                {incidents.length === 0 && (
                  <TBodyRow><TBodyCell colSpan={5} className="text-center text-gray-400 py-6">No incidents</TBodyCell></TBodyRow>
                )}
              </TBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
