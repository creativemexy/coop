import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  performedBy: string
  performerName: string
  createdAt: string
  changes: Record<string, { from: any; to: any }> | null
  ipAddress: string | null
}

const actionColors: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'default'> = {
  role_change: 'danger',
  policy_change: 'warning',
  tenant_enable: 'success',
  tenant_disable: 'danger',
  reconciliation_override: 'danger',
  payment_override: 'danger',
  user_suspension: 'danger',
  approval: 'info',
  configuration: 'info',
}

export function GlobalAuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', actorId: '', days: '7' })

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.days) params.set('days', filters.days)
      if (filters.action) params.set('action', filters.action)
      if (filters.actorId) params.set('actorId', filters.actorId)
      const { data } = await api.get(`/admin/super/audit-log?${params}`)
      setLogs(data)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetch() }, [fetch])

  const exportCsv = () => {
    const header = 'Action,Entity Type,Entity ID,Actor,Timestamp,Changes\n'
    const rows = logs.map((l) => {
      const changes = l.changes ? JSON.stringify(l.changes).replace(/"/g, '""') : ''
      return `"${l.action}","${l.entityType}","${l.entityId}","${l.performerName || l.performedBy}","${new Date(l.createdAt).toISOString()}","${changes}"`
    }).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Global Audit Logs</h2>
        <Button onClick={exportCsv} variant="secondary" size="sm">Export CSV</Button>
      </div>

      <Card>
        <CardTitle>Filters</CardTitle>
        <div className="mt-4 flex gap-4 items-end flex-wrap">
          <div className="w-48">
            <Input
              label="Action"
              placeholder="e.g. role_change"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            />
          </div>
          <div className="w-48">
            <Input
              label="Actor ID"
              placeholder="User UUID"
              value={filters.actorId}
              onChange={(e) => setFilters({ ...filters, actorId: e.target.value })}
            />
          </div>
          <div className="w-32">
            <Input
              label="Days"
              type="number"
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: e.target.value })}
              min="1"
              max="90"
            />
          </div>
          <Button onClick={fetch} size="sm">Search</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>
          {logs.length > 0 ? `${logs.length} entries` : 'Audit Log'}
        </CardTitle>
        <div className="mt-4 max-h-[600px] overflow-y-auto">
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Action</THeadCell>
                <THeadCell>Entity</THeadCell>
                <THeadCell>Actor</THeadCell>
                <THeadCell>Timestamp</THeadCell>
                <THeadCell>Changes</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {loading ? (
                <TBodyRow><TBodyCell colSpan={5} className="text-center py-6 text-gray-400">Loading...</TBodyCell></TBodyRow>
              ) : logs.length === 0 ? (
                <TBodyRow><TBodyCell colSpan={5} className="text-center py-6 text-gray-400">No audit entries found</TBodyCell></TBodyRow>
              ) : (
                logs.map((l) => (
                  <TBodyRow key={l.id}>
                    <TBodyCell>
                      <Badge variant={actionColors[l.action] || 'default'}>{l.action.replace(/_/g, ' ')}</Badge>
                    </TBodyCell>
                    <TBodyCell>
                      <div className="text-xs">
                        <span className="font-medium">{l.entityType}</span>
                        <span className="text-gray-400 ml-1 font-mono">{l.entityId.slice(0, 8)}</span>
                      </div>
                    </TBodyCell>
                    <TBodyCell className="text-xs">
                      {l.performerName || l.performedBy.slice(0, 8)}
                    </TBodyCell>
                    <TBodyCell className="text-xs whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </TBodyCell>
                    <TBodyCell className="max-w-xs">
                      {l.changes ? (
                        <details>
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">View changes</summary>
                          <pre className="text-xs text-gray-500 mt-1 overflow-x-auto max-h-32">
                            {JSON.stringify(l.changes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TBodyCell>
                  </TBodyRow>
                ))
              )}
            </TBody>
          </Table>
        </div>
        {logs.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {logs.length} of {logs.length} entries
          </p>
        )}
      </Card>
    </div>
  )
}
