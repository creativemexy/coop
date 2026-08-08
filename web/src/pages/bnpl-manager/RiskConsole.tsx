import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'
import { Modal } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'

interface RiskFlag {
  id: string
  entityType: 'subscription' | 'user'
  entityId: string
  entityName?: string | null
  reason: string
  description?: string
  flaggedBy: string
  status: 'open' | 'investigating' | 'resolved' | 'dismissed'
  resolvedBy?: string
  resolutionNote?: string
  resolvedAt?: string
  createdAt: string
}

interface ExceptionReason {
  id: string
  title: string
  description?: string
  status: string
  createdBy: string
  createdAt: string
}

const flagStatusColors: Record<string, 'danger' | 'warning' | 'success' | 'default'> = {
  open: 'danger',
  investigating: 'warning',
  resolved: 'success',
  dismissed: 'default',
}

export function RiskConsole() {
  const [flags, setFlags] = useState<RiskFlag[]>([])
  const [reasons, setReasons] = useState<ExceptionReason[]>([])
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedFlag, setSelectedFlag] = useState<RiskFlag | null>(null)
  const [resolveStatus, setResolveStatus] = useState('resolved')
  const [resolutionNote, setResolutionNote] = useState('')
  const [reasonForm, setReasonForm] = useState({ title: '', description: '' })
  const [reasonModalOpen, setReasonModalOpen] = useState(false)
  const [flagForm, setFlagForm] = useState({ entityType: 'subscription', entityId: '', reason: '', description: '' })
  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(() => {
    const params: Record<string, string> = {}
    if (filter) params.status = filter
    if (typeFilter) params.entityType = typeFilter
    api.get('/bnpl/compliance/flags', { params }).then((r) => setFlags(r.data))
    api.get('/bnpl/compliance/exception-reasons').then((r) => setReasons(r.data))
  }, [filter, typeFilter])

  useEffect(() => { fetch() }, [fetch])

  const handleResolve = async () => {
    if (!selectedFlag) return
    setSaving(true)
    try {
      await api.patch(`/bnpl/compliance/flags/${selectedFlag.id}/resolve`, {
        status: resolveStatus,
        resolutionNote,
      })
      setSelectedFlag(null)
      setResolutionNote('')
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to resolve flag')
    }
    setSaving(false)
  }

  const handleCreateReason = async () => {
    await api.post('/bnpl/compliance/exception-reasons', reasonForm)
    setReasonModalOpen(false)
    setReasonForm({ title: '', description: '' })
    fetch()
  }

  const handleDeleteReason = async (id: string) => {
    await api.delete(`/bnpl/compliance/exception-reasons/${id}`)
    fetch()
  }

  const handleCreateFlag = async () => {
    await api.post('/bnpl/compliance/flags', flagForm)
    setFlagModalOpen(false)
    setFlagForm({ entityType: 'subscription', entityId: '', reason: '', description: '' })
    setUserSearchResults([])
    setUserSearchQuery('')
    fetch()
  }

  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<{ id: string; name: string; email: string }[]>([])
  const [searchingUser, setSearchingUser] = useState(false)

  useEffect(() => {
    if (flagForm.entityType !== 'user' || userSearchQuery.length < 2) {
      setUserSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingUser(true)
      try {
        const res = await api.get('/bnpl/subscriptions/search-users', { params: { q: userSearchQuery } })
        setUserSearchResults(res.data)
      } catch { /* ignore */ }
      setSearchingUser(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearchQuery, flagForm.entityType])

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-gray-100">Risk & Exceptions Console</h2>
          <Button onClick={() => setFlagModalOpen(true)}>Flag Order / User</Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="">All types</option>
            <option value="subscription">Order</option>
            <option value="user">User</option>
          </select>
        </div>

            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Type</THeadCell>
                  <THeadCell>Entity</THeadCell>
                  <THeadCell>Reason</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell>Flagged</THeadCell>
                  <THeadCell />
                </THeadRow>
              </THead>
              <TBody>
                {flags.map((f) => (
                  <TBodyRow key={f.id}>
                    <TBodyCell className="capitalize">{f.entityType}</TBodyCell>
                    <TBodyCell>
                      <div className="font-mono text-xs">{f.entityId.slice(0, 8)}…</div>
                      {f.entityName && <div className="text-xs text-gray-500">{f.entityName}</div>}
                    </TBodyCell>
                    <TBodyCell>{f.reason}</TBodyCell>
                <TBodyCell>
                  <Badge variant={flagStatusColors[f.status] ?? 'default'}>{f.status}</Badge>
                </TBodyCell>
                <TBodyCell>{new Date(f.createdAt).toLocaleDateString()}</TBodyCell>
                <TBodyCell>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedFlag(f); setResolveStatus('resolved'); setResolutionNote(f.resolutionNote || '') }}>
                    {f.status === 'open' || f.status === 'investigating' ? 'Resolve' : 'View'}
                  </Button>
                </TBodyCell>
              </TBodyRow>
            ))}
            {flags.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={6} className="text-center text-gray-400 py-8">No flags found</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold dark:text-gray-100">Exception Reasons (Templates)</h3>
          <Button onClick={() => setReasonModalOpen(true)}>Add Reason</Button>
        </div>
        <Table>
          <THead>
            <THeadRow>
              <THeadCell>Title</THeadCell>
              <THeadCell>Description</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell />
            </THeadRow>
          </THead>
          <TBody>
            {reasons.map((r) => (
              <TBodyRow key={r.id}>
                <TBodyCell className="font-medium">{r.title}</TBodyCell>
                <TBodyCell className="text-sm text-gray-500">{r.description || '—'}</TBodyCell>
                <TBodyCell><Badge variant={r.status === 'active' ? 'success' : 'default'}>{r.status}</Badge></TBodyCell>
                <TBodyCell>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteReason(r.id)}>Delete</Button>
                </TBodyCell>
              </TBodyRow>
            ))}
            {reasons.length === 0 && (
              <TBodyRow>
                <TBodyCell colSpan={4} className="text-center text-gray-400 py-8">No exception reasons configured</TBodyCell>
              </TBodyRow>
            )}
          </TBody>
        </Table>
      </div>

      <Modal open={!!selectedFlag} onClose={() => setSelectedFlag(null)} title="Resolve Flag">
        {selectedFlag && (
          <div className="space-y-4">
            <div className="text-sm space-y-2">
              <div><span className="text-gray-500">Type:</span> <span className="capitalize">{selectedFlag.entityType}</span></div>
              <div><span className="text-gray-500">Entity:</span> <span className="font-mono text-xs">{selectedFlag.entityId}</span></div>
              <div><span className="text-gray-500">Reason:</span> {selectedFlag.reason}</div>
              {selectedFlag.description && <div><span className="text-gray-500">Detail:</span> {selectedFlag.description}</div>}
              <div><span className="text-gray-500">Status:</span> <Badge variant={flagStatusColors[selectedFlag.status]}>{selectedFlag.status}</Badge></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resolution Status</label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value)}
                className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="investigating">Investigating</option>
              </select>
            </div>
            <Input label="Resolution Note" value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} />
            <Button onClick={handleResolve} className="w-full" disabled={saving}>Save</Button>
          </div>
        )}
      </Modal>

      <Modal open={reasonModalOpen} onClose={() => setReasonModalOpen(false)} title="Add Exception Reason">
        <div className="space-y-4">
          <Input id="reason-title" label="Title" value={reasonForm.title} onChange={(e) => setReasonForm({ ...reasonForm, title: e.target.value })} required />
          <Input id="reason-desc" label="Description" value={reasonForm.description} onChange={(e) => setReasonForm({ ...reasonForm, description: e.target.value })} />
          <Button onClick={handleCreateReason} className="w-full">Create</Button>
        </div>
      </Modal>

      <Modal open={flagModalOpen} onClose={() => setFlagModalOpen(false)} title="Flag for Review">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Entity Type</label>
            <select
              value={flagForm.entityType}
              onChange={(e) => setFlagForm({ ...flagForm, entityType: e.target.value })}
              className="block w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="subscription">Order</option>
              <option value="user">User Account</option>
            </select>
          </div>
          {flagForm.entityType === 'user' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Search User</label>
              <input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm mb-2"
                placeholder="Type name or email…"
              />
              {searchingUser && <p className="text-xs text-gray-400 mb-2">Searching…</p>}
              {userSearchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto border dark:border-gray-700 rounded-lg mb-2">
                  {userSearchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${flagForm.entityId === u.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => { setFlagForm({ ...flagForm, entityId: u.id }); setUserSearchQuery(`${u.name} (${u.email})`); setUserSearchResults([]) }}
                    >
                      <span className="font-medium">{u.name}</span>
                      <span className="text-gray-500 ml-2">{u.email}</span>
                    </button>
                  ))}
                </div>
              )}
              <input type="hidden" value={flagForm.entityId} />
            </div>
          ) : (
            <Input id="flag-eid" label="Entity ID" value={flagForm.entityId} onChange={(e) => setFlagForm({ ...flagForm, entityId: e.target.value })} required />
          )}
          <Input id="flag-reason" label="Reason" value={flagForm.reason} onChange={(e) => setFlagForm({ ...flagForm, reason: e.target.value })} required />
          <Input id="flag-desc" label="Description" value={flagForm.description} onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })} />
          <Button onClick={handleCreateFlag} className="w-full">Create Flag</Button>
        </div>
      </Modal>
    </div>
  )
}