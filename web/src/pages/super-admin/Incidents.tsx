import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

interface Incident {
  id: string
  title: string
  description: string | null
  severity: string
  status: string
  source: string
  tenantId: string | null
  affectedSystems: string[] | null
  assignedTo: string | null
  reportedBy: string
  detectedAt: string
  resolvedAt: string | null
  rootCause: string | null
}

export function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium', source: 'monitoring', tenantId: '', affectedSystems: '[]' })

  const load = () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterSeverity) params.set('severity', filterSeverity)
    api.get(`/admin/super/incidents?${params}`).then((r) => setIncidents(r.data))
    api.get('/admin/super/incidents/stats').then((r) => setStats(r.data)).catch(() => {})
  }

  useEffect(() => { load() }, [filterStatus, filterSeverity])

  const create = async () => {
    try {
      await api.post('/admin/super/incidents', {
        ...form,
        affectedSystems: JSON.parse(form.affectedSystems),
      })
      setShowNew(false)
      setForm({ title: '', description: '', severity: 'medium', source: 'monitoring', tenantId: '', affectedSystems: '[]' })
      load()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create')
    }
  }

  const assign = async (id: string) => {
    const userId = prompt('User ID to assign:')
    if (!userId) return
    await api.post(`/admin/super/incidents/${id}/assign`, { assignedTo: userId })
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/admin/super/incidents/${id}`, { status })
    load()
  }

  const severityBadge = (s: string) => {
    const colors: Record<string, string> = { critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-blue-100 text-blue-800' }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || 'bg-gray-100'}`}>{s}</span>
  }

  const severityBorder: Record<string, string> = {
    critical: 'border-red-500',
    high: 'border-orange-500',
    medium: 'border-yellow-500',
    low: 'border-blue-500',
  }

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { detected: 'bg-gray-200 text-gray-700', investigating: 'bg-blue-100 text-blue-800', mitigated: 'bg-yellow-100 text-yellow-800', resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-500' }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || 'bg-gray-100'}`}>{s}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Incidents</h2>
        <Button onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancel' : 'Report Incident'}</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-indigo-500"><CardTitle className="text-sm">Total</CardTitle><p className="text-2xl font-bold">{stats.total}</p></Card>
          <Card className="border-amber-500"><CardTitle className="text-sm">Open</CardTitle><p className="text-2xl font-bold text-yellow-600">{stats.open}</p></Card>
          <Card className="border-red-500"><CardTitle className="text-sm">Critical</CardTitle><p className="text-2xl font-bold text-red-600">{stats.critical}</p></Card>
        </div>
      )}

      {showNew && (
        <Card>
          <CardTitle>Report Incident</CardTitle>
          <div className="mt-4 space-y-3 max-w-lg">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Severity</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Source</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="monitoring">Monitoring</option>
                  <option value="user_reported">User Reported</option>
                  <option value="system_alert">System Alert</option>
                  <option value="payment_failure">Payment Failure</option>
                  <option value="security">Security</option>
                  <option value="performance">Performance</option>
                </select>
              </div>
            </div>
            <Input label="Tenant ID (optional)" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} />
            <Input label="Affected Systems (JSON array)" value={form.affectedSystems} onChange={(e) => setForm({ ...form, affectedSystems: e.target.value })} />
            <Button onClick={create}>Create Incident</Button>
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="detected">Detected</option>
          <option value="investigating">Investigating</option>
          <option value="mitigated">Mitigated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="space-y-3">
        {incidents.map((inc) => (
          <Card key={inc.id} className={severityBorder[inc.severity] ?? 'border-gray-300'}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold dark:text-gray-100">{inc.title}</span>
                  {severityBadge(inc.severity)}
                  {statusBadge(inc.status)}
                </div>
                {inc.description && <p className="text-sm text-gray-500 mt-1">{inc.description}</p>}
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>Source: {inc.source}</span>
                  {inc.tenantId && <span>Tenant: {inc.tenantId.slice(0, 8)}</span>}
                  {inc.assignedTo && <span>Assigned: {inc.assignedTo.slice(0, 8)}</span>}
                  <span>Detected: {new Date(inc.detectedAt).toLocaleString()}</span>
                </div>
                {inc.rootCause && <p className="text-xs text-gray-500 mt-1">Root Cause: {inc.rootCause}</p>}
              </div>
              <div className="flex gap-2">
                {!inc.assignedTo && <Button onClick={() => assign(inc.id)}>Assign</Button>}
                {inc.status === 'detected' && <Button onClick={() => updateStatus(inc.id, 'investigating')}>Investigate</Button>}
                {inc.status === 'investigating' && <Button onClick={() => updateStatus(inc.id, 'mitigated')}>Mitigate</Button>}
                {inc.status === 'mitigated' && <Button onClick={() => updateStatus(inc.id, 'resolved')}>Resolve</Button>}
                {inc.status === 'resolved' && <Button variant="secondary" onClick={() => updateStatus(inc.id, 'closed')}>Close</Button>}
              </div>
            </div>
          </Card>
        ))}
        {incidents.length === 0 && <p className="text-gray-500 text-sm">No incidents found.</p>}
      </div>
    </div>
  )
}
