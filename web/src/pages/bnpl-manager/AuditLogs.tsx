import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'

interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  changes?: Record<string, { from: any; to: any }>
  reason?: string
  performedBy: string
  performerName?: string
  ipAddress?: string
  evidence?: string
  createdAt: string
}

const actionColors: Record<string, 'info' | 'success' | 'danger' | 'warning'> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  approve: 'success',
  reject: 'danger',
  disburse: 'info',
  settle: 'success',
  flag: 'warning',
  resolve: 'success',
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [entityIdFilter, setEntityIdFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const [evidenceText, setEvidenceText] = useState<string | null>(null)

  const fetch = useCallback(() => {
    const params: Record<string, string> = {}
    if (entityTypeFilter) params.entityType = entityTypeFilter
    if (entityIdFilter) params.entityId = entityIdFilter
    if (actionFilter) params.action = actionFilter
    api.get('/bnpl/compliance/audit-logs', { params }).then((r) => setLogs(r.data))
  }, [entityTypeFilter, entityIdFilter, actionFilter])

  useEffect(() => { fetch() }, [fetch])

  const handleViewEvidence = async (id: string) => {
    try {
      const { data } = await api.get(`/bnpl/compliance/audit-logs/${id}/evidence`)
      setEvidenceText(data.evidence || 'No evidence attached')
    } catch {
      setEvidenceText('Failed to load evidence')
    }
  }

  const entityTypes = ['subscription', 'plan', 'catalog_item', 'user', 'risk_flag', 'installment']
  const actions = ['create', 'update', 'delete', 'approve', 'reject', 'disburse', 'settle', 'flag', 'resolve']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Audit Logs</h2>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All entity types</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Entity ID…"
          value={entityIdFilter}
          onChange={(e) => setEntityIdFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 w-48"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
          ))}
        </select>
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Date</THeadCell>
            <THeadCell>Entity</THeadCell>
            <THeadCell>Action</THeadCell>
            <THeadCell>Performer</THeadCell>
            <THeadCell>Reason</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {logs.map((l) => (
            <TBodyRow key={l.id}>
              <TBodyCell className="text-xs">{new Date(l.createdAt).toLocaleString()}</TBodyCell>
              <TBodyCell>
                <span className="capitalize text-xs">{l.entityType}</span>
                <span className="font-mono text-xs ml-1 text-gray-400">#{l.entityId.slice(0, 6)}</span>
              </TBodyCell>
              <TBodyCell>
                <Badge variant={actionColors[l.action] ?? 'default'}>{l.action}</Badge>
              </TBodyCell>
              <TBodyCell className="text-xs">{l.performerName || l.performedBy.slice(0, 8)}</TBodyCell>
              <TBodyCell className="text-xs text-gray-500 max-w-[200px] truncate">{l.reason || '—'}</TBodyCell>
              <TBodyCell>
                <Button variant="ghost" size="sm" onClick={() => { setSelected(l); setEvidenceText(null) }}>
                  Detail
                </Button>
              </TBodyCell>
            </TBodyRow>
          ))}
          {logs.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={6} className="text-center text-gray-400 py-8">No audit logs found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">Audit Log Detail</CardTitle>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Action</span>
                <span className="col-span-2">
                  <Badge variant={actionColors[selected.action] ?? 'default'}>{selected.action}</Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Entity</span>
                <span className="col-span-2 capitalize">{selected.entityType} #{selected.entityId}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Performed By</span>
                <span className="col-span-2">{selected.performerName || selected.performedBy}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">IP Address</span>
                <span className="col-span-2">{selected.ipAddress || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Reason</span>
                <span className="col-span-2">{selected.reason || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Date</span>
                <span className="col-span-2">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>

              {selected.changes && Object.keys(selected.changes).length > 0 && (
                <div className="border-t dark:border-gray-700 pt-3">
                  <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Changes</h4>
                  <div className="space-y-2">
                    {Object.entries(selected.changes).map(([field, change]) => (
                      <div key={field} className="rounded border dark:border-gray-700 p-2 text-xs">
                        <span className="font-medium capitalize">{field.replace(/_/g, ' ')}</span>
                        <div className="flex gap-4 mt-1">
                          <span className="text-red-500 line-through">{String(change.from ?? '—')}</span>
                          <span className="text-green-500">{String(change.to ?? '—')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t dark:border-gray-700 pt-3">
                <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Evidence</h4>
                {evidenceText === null ? (
                  <Button size="sm" variant="secondary" onClick={() => handleViewEvidence(selected.id)}>
                    Load Evidence
                  </Button>
                ) : (
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {evidenceText}
                  </pre>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}