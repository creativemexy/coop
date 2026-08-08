import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle, CardHeader } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

const ACTION_CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Config Changes', value: 'config_update' },
  { label: 'Role Changes', value: 'role_change' },
  { label: 'Job Failures', value: 'job_failure' },
  { label: 'User Suspension', value: 'user_suspension' },
  { label: 'Product Changes', value: 'product_change' },
]

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ tenantId: '', actorId: '', action: '', days: '7' })

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.tenantId) params.set('tenantId', filters.tenantId)
    if (filters.actorId) params.set('actorId', filters.actorId)
    if (filters.action) params.set('action', filters.action)
    if (filters.days) params.set('days', filters.days)

    api.get(`/admin/audit-logs?${params.toString()}`).then(({ data }) => {
      setLogs(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    api.get('/admin/tenants').then(({ data }) => setTenants(data))
    load()
  }, [])

  useEffect(() => { load() }, [filters.days])

  const applyFilters = () => { load() }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Audit Logs</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tenant</label>
          <select value={filters.tenantId} onChange={e => setFilters({ ...filters, tenantId: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600">
            <option value="">All Tenants</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Actor ID</label>
          <input value={filters.actorId} onChange={e => setFilters({ ...filters, actorId: e.target.value })}
            placeholder="User ID..."
            className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 w-48" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Action</label>
          <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600">
            {ACTION_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Period</label>
          <select value={filters.days} onChange={e => setFilters({ ...filters, days: e.target.value })}
            className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600">
            <option value="1">24 hours</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
        <button onClick={applyFilters}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer">
          Apply
        </button>
      </div>

      {/* Logs table */}
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : logs.length === 0 ? (
        <Card><p className="text-gray-500">No audit logs found for the selected filters</p></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>{logs.length} Events</CardTitle></CardHeader>
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Action</THeadCell>
                <THeadCell>Entity</THeadCell>
                <THeadCell>Entity ID</THeadCell>
                <THeadCell>Actor</THeadCell>
                <THeadCell>Reason</THeadCell>
                <THeadCell>Date</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {logs.map((l: any) => (
                <TBodyRow key={l.id}>
                  <TBodyCell>
                    <Badge variant={
                      l.action?.includes('fail') || l.action?.includes('error') ? 'danger' :
                      l.action?.includes('suspend') || l.action?.includes('deactivate') ? 'warning' :
                      l.action?.includes('create') || l.action?.includes('activate') ? 'success' : 'info'
                    }>{l.action}</Badge>
                  </TBodyCell>
                  <TBodyCell className="text-xs">{l.entityType || '—'}</TBodyCell>
                  <TBodyCell className="text-xs font-mono">{l.entityId?.slice(0, 12) || '—'}</TBodyCell>
                  <TBodyCell className="text-xs font-mono">{l.performedBy?.slice(0, 12) || '—'}</TBodyCell>
                  <TBodyCell className="max-w-[200px] truncate text-xs">{l.reason || '—'}</TBodyCell>
                  <TBodyCell className="text-xs whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
