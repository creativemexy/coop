import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { useAuth } from '../../stores/auth.store'

const statusVariant: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

export function AdminApprovals() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  const load = () => {
    setLoading(true)
    const params = filter ? `?status=${filter}` : ''
    api.get(`/bnpl/approvals${params}`).then(({ data }) => {
      setRequests(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [filter])

  const isSuperAdmin = user?.role === 'super_admin'
  const isOperationalAdmin = user?.role === 'operational_admin'

  const handleApprove = async (id: string) => {
    await api.patch(`/bnpl/approvals/${id}/approve`)
    load()
  }

  const handleReject = async (id: string, reason?: string) => {
    await api.patch(`/bnpl/approvals/${id}/reject`, { rejectionReason: reason || 'Rejected' })
    load()
  }

  const handleSubmitTenantRequest = async () => {
    const tenantId = prompt('Tenant ID:')
    if (!tenantId) return
    const type = prompt('Request type (tenant_product_enablement / policy_template_change):')
    if (!type) return
    const data: any = { tenantId }
    if (type === 'tenant_product_enablement') {
      data.bnplEnabled = confirm('Enable BNPL?') === true
      const products = prompt('Supported products (comma-separated):')
      if (products) data.supportedProducts = products.split(',').map((s: string) => s.trim())
    } else if (type === 'policy_template_change') {
      data.config = {}
      const kyc = prompt('KYC level (none/basic/full):')
      if (kyc) data.config.kyc_requirement_level = kyc
    }
    await api.post('/bnpl/approvals', {
      requestType: type,
      requestData: data,
      reason: prompt('Reason:') || '',
    })
    load()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Approvals</h2>
        <div className="flex items-center gap-4">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          {isOperationalAdmin && (
            <button onClick={handleSubmitTenantRequest}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer">
              New Tenant Request
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {requests.length === 0 && !loading && (
          <Card><p className="text-gray-500">No approval requests found</p></Card>
        )}

        {requests.map((req) => {
          const tenantTypes = ['tenant_product_enablement', 'policy_template_change']
          const isTenantRequest = tenantTypes.includes(req.requestType)

          return (
            <Card key={req.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{req.requestType.replace(/_/g, ' ')}</CardTitle>
                    <Badge variant={statusVariant[req.status] || 'default'}>{req.status}</Badge>
                    {isTenantRequest && <Badge variant="info">Tenant-Level</Badge>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Requested by {req.requestedBy} · {new Date(req.createdAt).toLocaleString()}
                  </p>
                  {req.reason && <p className="text-sm mt-2 text-gray-600">{req.reason}</p>}
                </div>
              </div>

              {/* Request data preview */}
              {req.requestData && (
                <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                  <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">
                    {JSON.stringify(req.requestData, null, 2)}
                  </pre>
                </div>
              )}

              {req.status === 'pending' && isSuperAdmin && (
                <div className="flex gap-2 mt-4 pt-3 border-t dark:border-gray-700">
                  <button onClick={() => handleApprove(req.id)}
                    className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 cursor-pointer">
                    Approve
                  </button>
                  <button onClick={() => {
                    const reason = prompt('Rejection reason (optional):')
                    handleReject(req.id, reason || undefined)
                  }}
                    className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 cursor-pointer">
                    Reject
                  </button>
                </div>
              )}

              {req.status === 'pending' && isOperationalAdmin && !isSuperAdmin && (
                <div className="mt-4 pt-3 border-t dark:border-gray-700">
                  <p className="text-sm text-yellow-600">Awaiting Super Admin approval</p>
                </div>
              )}

              {req.reviewedBy && (
                <div className="mt-3 text-xs text-gray-400">
                  Reviewed by {req.reviewedBy} · {req.reviewedAt ? new Date(req.reviewedAt).toLocaleString() : ''}
                  {req.rejectionReason && ` · Reason: ${req.rejectionReason}`}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
