import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../api/client'
import { Card, CardTitle, CardHeader } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

interface Overview {
  kpis: {
    activeTenants: number
    activeUsers: number
    webhookSuccessRate: number
    webhookTotal7d: number
    webhookProcessed7d: number
    jobsFailed24h: number
    jobsFailed7d: number
    reconciliationBacklog: number
  }
  queues: {
    webhooksNeedingAttention: Array<any>
    failedJobs: Array<any>
    retryingJobs: Array<any>
  }
}

interface TenantHealth {
  id: string
  name: string
  code: string
  status: string
  bnplEnabled: boolean
  lastWebhookError: string | null
  backlogCount: number
}

type SortKey = 'name' | 'status' | 'bnplEnabled' | 'backlogCount'

export function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState<Overview | null>(null)
  const [healthRows, setHealthRows] = useState<TenantHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/tenants-health'),
    ]).then(([ov, th]) => {
      setData(ov.data)
      setHealthRows(th.data)
      setLoading(false)
    })
  }, [])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortedHealth = [...healthRows].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    const cmp = typeof aVal === 'string' ? (aVal as string).localeCompare(bVal as string) : Number(aVal) - Number(bVal)
    return sortDir === 'asc' ? cmp : -cmp
  })

  if (loading) return <div className="p-6 text-gray-500">Loading admin overview...</div>
  if (!data) return <div className="p-6 text-gray-500">No data available</div>

  const { kpis, queues } = data

  const navItems = [
    { key: 'operational_admin', label: 'Overview', path: '/operational-admin' },
    { key: 'op-admin-users', label: 'Users & Roles', path: '/operational-admin/users' },
    { key: 'op-admin-reports', label: 'Reports', path: '/operational-admin/reports' },
    { key: 'op-admin-audit-logs', label: 'Audit Logs', path: '/operational-admin/audit-logs' },
  ]

  const currentBase = location.pathname.replace(/\/+$/, '')
  const activeNav = navItems.find(n => currentBase === n.path || currentBase.startsWith(n.path + '/'))?.key || 'operational_admin'

  const SortHeader = ({ label, sortKey: sk }: { label: string; sortKey: SortKey }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500 cursor-pointer hover:text-gray-700 select-none"
      onClick={() => toggleSort(sk)}>
      {label} {sortKey === sk ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  )

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Admin Overview</h2>

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b dark:border-gray-700">
        {navItems.map((item) => (
          <button key={item.key} onClick={() => navigate(item.path)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeNav === item.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {item.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-blue-500"><p className="text-sm text-gray-500">Active Tenants</p><p className="text-3xl font-bold mt-1">{kpis.activeTenants}</p></Card>
        <Card className="border-emerald-500"><p className="text-sm text-gray-500">Active Users</p><p className="text-3xl font-bold mt-1">{kpis.activeUsers}</p></Card>
        <Card className="border-amber-500">
          <p className="text-sm text-gray-500">Webhook Success (7d)</p>
          <p className="text-3xl font-bold mt-1">{kpis.webhookSuccessRate}%</p>
          <p className="text-xs text-gray-400 mt-1">{kpis.webhookProcessed7d}/{kpis.webhookTotal7d} events</p>
        </Card>
        <Card className="border-red-500">
          <p className="text-sm text-gray-500">Failed Jobs</p>
          <p className="text-3xl font-bold mt-1 text-red-600">{kpis.jobsFailed7d}</p>
          <p className="text-xs text-gray-400 mt-1">{kpis.jobsFailed24h} in 24h</p>
        </Card>
        <Card className="border-amber-500">
          <p className="text-sm text-gray-500">Recon Backlog</p>
          <p className="text-3xl font-bold mt-1 text-yellow-600">{kpis.reconciliationBacklog}</p>
        </Card>
      </div>

      {/* Queue Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-indigo-500">
          <CardHeader>
            <CardTitle>Webhooks Needing Attention</CardTitle>
            <p className="text-xs text-gray-400 mt-1">{queues.webhooksNeedingAttention.length} items</p>
          </CardHeader>
          {queues.webhooksNeedingAttention.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">All clear</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Provider</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Event</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Retries</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Last Attempt</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {queues.webhooksNeedingAttention.slice(0, 15).map((wh: any) => (
                    <tr key={wh.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-2 whitespace-nowrap">{wh.provider}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{wh.eventType}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{wh.retryCount}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{new Date(wh.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><Badge variant={wh.status === 'processed' ? 'success' : 'danger'}>{wh.status}</Badge></td>
                      <td className="px-3 py-2 whitespace-nowrap"><button onClick={() => setSelectedWebhook(wh)} className="text-blue-600 hover:text-blue-700 text-xs cursor-pointer">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle>Jobs Failed / Retrying</CardTitle>
            <p className="text-xs text-gray-400 mt-1">{queues.failedJobs.length} failed · {queues.retryingJobs.length} retrying</p>
          </CardHeader>
          {queues.failedJobs.length === 0 && queues.retryingJobs.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">All clear</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Type</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Ref ID</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Error</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Age</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th><th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {queues.failedJobs.slice(0, 15).map((job: any) => (
                    <tr key={job.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-2 whitespace-nowrap">{job.stepType?.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-mono">{job.subscriptionId?.slice(0, 8)}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate text-xs text-red-600">{job.errorMessage || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{job.age}h</td>
                      <td className="px-3 py-2 whitespace-nowrap"><Badge variant="danger">failed</Badge></td>
                      <td className="px-3 py-2 whitespace-nowrap"><button className="text-blue-600 hover:text-blue-700 text-xs cursor-pointer">Retry</button></td>
                    </tr>
                  ))}
                  {queues.retryingJobs.slice(0, 10).map((job: any) => (
                    <tr key={job.id} className="bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                      <td className="px-3 py-2 whitespace-nowrap">{job.stepType?.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-mono">{job.subscriptionId?.slice(0, 8)}</td>
                      <td className="px-3 py-2 max-w-[200px] truncate text-xs text-yellow-600">{job.errorMessage || 'retrying...'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{job.age}h</td>
                      <td className="px-3 py-2 whitespace-nowrap"><Badge variant="warning">retrying</Badge></td>
                      <td className="px-3 py-2 whitespace-nowrap"><button className="text-blue-600 hover:text-blue-700 text-xs cursor-pointer">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Tenant Health Table */}
      <Card className="border-teal-500">
        <CardHeader><CardTitle>Tenant Health</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <SortHeader label="Tenant Name" sortKey="name" />
                <SortHeader label="Status" sortKey="status" />
                <SortHeader label="BNPL" sortKey="bnplEnabled" />
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Last Webhook Error</th>
                <SortHeader label="Backlog" sortKey="backlogCount" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedHealth.map((t, i) => (
                <tr key={t.id} className={`bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                  [
                    'bg-sky-50 dark:bg-sky-950/20',
                    'bg-emerald-50 dark:bg-emerald-950/20',
                    'bg-amber-50 dark:bg-amber-950/20',
                    'bg-fuchsia-50 dark:bg-fuchsia-950/20',
                    'bg-violet-50 dark:bg-violet-950/20',
                  ][i % 5]
                }`}>
                  <td className="px-3 py-2 whitespace-nowrap font-medium">{t.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge variant={t.status === 'healthy' ? 'success' : 'warning'}>{t.status}</Badge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge variant={t.bnplEnabled ? 'success' : 'default'}>{t.bnplEnabled ? 'Y' : 'N'}</Badge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {t.lastWebhookError ? new Date(t.lastWebhookError).toLocaleString() : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {t.backlogCount > 0 ? <Badge variant="warning">{t.backlogCount}</Badge> : <span className="text-gray-400">0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Webhook detail modal */}
      {selectedWebhook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedWebhook(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Webhook Detail</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Provider</span><span>{selectedWebhook.provider}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Event</span><span>{selectedWebhook.eventType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Event ID</span><span className="text-xs font-mono">{selectedWebhook.id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><Badge variant={selectedWebhook.status === 'processed' ? 'success' : 'danger'}>{selectedWebhook.status}</Badge></div>
              <div className="flex justify-between"><span className="text-gray-500">Retries</span><span>{selectedWebhook.retryCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment ID</span><span className="text-xs font-mono">{selectedWebhook.paymentId || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Last Attempt</span><span>{new Date(selectedWebhook.createdAt).toLocaleString()}</span></div>
            </dl>
            <button onClick={() => setSelectedWebhook(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
