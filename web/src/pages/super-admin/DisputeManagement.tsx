import { useEffect, useState } from 'react'
import { api } from '../../api/client'

interface Dispute {
  id: string
  type: string
  referenceId: string
  userId: string
  reason: string
  status: string
  resolution: string | null
  resolvedBy: string | null
  createdAt: string
  resolvedAt: string | null
}

export function DisputeManagement() {
  const [disputes, setDisputes] = useState<{ data: Dispute[]; total: number; page: number; totalPages: number } | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [resolveModal, setResolveModal] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')
  const [resolveStatus, setResolveStatus] = useState('resolved')

  const fetch = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('type', typeFilter)
    params.set('page', String(page))
    api.get(`/admin/super/disputes?${params}`).then(r => setDisputes(r.data))
  }

  useEffect(() => { fetch() }, [page, statusFilter, typeFilter])

  const resolve = async () => {
    if (!resolveModal) return
    await api.patch(`/admin/super/disputes/${resolveModal.id}/resolve`, { status: resolveStatus, resolution })
    setResolveModal(null); setResolution(''); fetch()
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dispute Management</h1>

      <div className="flex gap-4">
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
          <option value="">All Types</option>
          <option value="bnpl">BNPL</option>
          <option value="investment">Investment</option>
          <option value="payment">Payment</option>
          <option value="other">Other</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="opened">Opened</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {disputes && (
        <>
          <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-3">Type</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.data.map(d => (
                  <tr key={d.id} className="border-b dark:border-gray-700">
                    <td className="p-3 capitalize">{d.type}</td>
                    <td className="p-3 font-mono text-xs">{d.referenceId.slice(0, 8)}...</td>
                    <td className="p-3 max-w-xs truncate">{d.reason}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        d.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        d.status === 'dismissed' ? 'bg-gray-100 text-gray-500' :
                        d.status === 'investigating' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{d.status}</span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      {d.status !== 'resolved' && d.status !== 'dismissed' && (
                        <button className="text-xs text-blue-600" onClick={() => { setResolveModal(d); setResolution(''); setResolveStatus('resolved') }}>Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Page {disputes.page} of {disputes.totalPages}</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded text-sm disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="px-3 py-1 border rounded text-sm disabled:opacity-50" disabled={page >= disputes.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </>
      )}

      {resolveModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setResolveModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Resolve Dispute</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Resolution</label>
                <textarea className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" rows={4} value={resolution} onChange={e => setResolution(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Outcome</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600" value={resolveStatus} onChange={e => setResolveStatus(e.target.value)}>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={resolve}>Submit</button>
              <button className="px-4 py-2 border rounded-lg text-sm" onClick={() => setResolveModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
