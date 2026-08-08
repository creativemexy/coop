import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'

interface ApprovalRequest {
  id: string
  requestType: 'product_change' | 'manual_override' | 'user_suspension' | 'write_off' | 'restructuring' | 'eligibility_exception'
  status: 'pending' | 'approved' | 'rejected'
  requestData: Record<string, any>
  reason?: string
  rejectionReason?: string
  requestedBy: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
}

const typeColors: Record<string, 'info' | 'warning' | 'danger' | 'default'> = {
  product_change: 'info',
  manual_override: 'warning',
  user_suspension: 'danger',
  write_off: 'default',
  restructuring: 'warning',
  eligibility_exception: 'info',
}

const statusColors: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

const typeLabels: Record<string, string> = {
  product_change: 'Product Change',
  manual_override: 'Manual Override',
  user_suspension: 'User Suspension',
  write_off: 'Write-Off / Default',
  restructuring: 'Restructuring',
  eligibility_exception: 'Eligibility Exception',
}

function RequestDataView({ type, data }: { type: string; data: Record<string, any> }) {
  switch (type) {
    case 'product_change':
      return (
        <div className="space-y-1 text-xs">
          {data.catalogItemId && <p><span className="text-gray-500">Catalog Item:</span> {data.catalogItemId}</p>}
          {data.planId && <p><span className="text-gray-500">Plan:</span> {data.planId}</p>}
          {data.planChanges?.installmentCount && <p><span className="text-gray-500">New Tenor:</span> {data.planChanges.installmentCount} months</p>}
          {data.planChanges?.interestRate && <p><span className="text-gray-500">New Interest Rate:</span> {data.planChanges.interestRate}%</p>}
          {data.planChanges?.monthlyFeeRate && <p><span className="text-gray-500">Monthly Fee Rate:</span> {data.planChanges.monthlyFeeRate}%</p>}
          {data.planChanges?.minPrincipal && <p><span className="text-gray-500">Min Principal:</span> ₦{data.planChanges.minPrincipal}</p>}
          {data.planChanges?.maxPrincipal && <p><span className="text-gray-500">Max Principal:</span> ₦{data.planChanges.maxPrincipal}</p>}
          {data.planChanges?.lateFeeRate && <p><span className="text-gray-500">Late Fee Rate:</span> {data.planChanges.lateFeeRate}%</p>}
          {data.planChanges?.gracePeriodDays && <p><span className="text-gray-500">Grace Period:</span> {data.planChanges.gracePeriodDays} days</p>}
          {data.name && <p><span className="text-gray-500">New Name:</span> {data.name}</p>}
          {data.price !== undefined && <p><span className="text-gray-500">New Price:</span> ₦{data.price}</p>}
          {data.organizationId && data.feeRules && <p><span className="text-gray-500">Fee Rules:</span> Present (see full data)</p>}
          <pre className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )

    case 'restructuring':
      return (
        <div className="space-y-1 text-xs">
          {data.subscriptionId && <p><span className="text-gray-500">Subscription:</span> {data.subscriptionId}</p>}
          {data.newDownPayment !== undefined && <p><span className="text-gray-500">New Down Payment:</span> ₦{data.newDownPayment}</p>}
          {data.rescheduledInstallments && (
            <div>
              <p className="text-gray-500 mb-1">Rescheduled Installments:</p>
              {(data.rescheduledInstallments as Array<{ installmentId: string; newDueDate?: string; newAmount?: number }>).map((inst, i) => (
                <p key={i} className="ml-2">
                  {inst.installmentId.slice(0, 8)}… → due {inst.newDueDate ? new Date(inst.newDueDate).toLocaleDateString() : 'unchanged'}
                  {inst.newAmount !== undefined ? `, ₦${inst.newAmount}` : ''}
                </p>
              ))}
            </div>
          )}
          <pre className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )

    case 'write_off':
      return (
        <div className="space-y-1 text-xs">
          {data.subscriptionId && <p><span className="text-gray-500">Subscription:</span> {data.subscriptionId}</p>}
          <p className="text-red-600 font-semibold mt-1">⚠ This will mark the subscription as DEFAULTED and classify it as a write-off.</p>
          <pre className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )

    case 'manual_override':
      return (
        <div className="space-y-1 text-xs">
          {data.installmentId && <p><span className="text-gray-500">Installment:</span> {data.installmentId}</p>}
          {data.subscriptionId && <p><span className="text-gray-500">Subscription:</span> {data.subscriptionId}</p>}
          {data.paymentReference && <p><span className="text-gray-500">Payment Ref:</span> {data.paymentReference}</p>}
          <p className="text-yellow-600 font-semibold mt-1">⚠ This will force-mark the installment as PAID.</p>
          <pre className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )

    case 'user_suspension':
      return (
        <div className="space-y-1 text-xs">
          {data.userId && <p><span className="text-gray-500">User:</span> {data.userId}</p>}
          <p><span className="text-gray-500">Action:</span> {data.isActive === false ? 'SUSPEND user' : data.isActive === true ? 'LIFT suspension' : 'Unknown'}</p>
          <pre className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )

    case 'eligibility_exception':
      return (
        <div className="space-y-1 text-xs">
          {data.userId && <p><span className="text-gray-500">User:</span> {data.userId}</p>}
          {data.subscriptionId && <p><span className="text-gray-500">Subscription:</span> {data.subscriptionId}</p>}
          {data.bypassEligibility && <p><span className="text-gray-500">Bypass Eligibility:</span> Yes — user will be allowed to transact regardless of score</p>}
          {data.bypassScoreCheck && <p><span className="text-gray-500">Bypass Score Check:</span> Yes — order will proceed without min score validation</p>}
          <p className="text-yellow-600 font-semibold mt-1">⚠ Overrides standard eligibility rules for this customer.</p>
          <pre className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )

    default:
      return <pre className="text-xs bg-gray-50 dark:bg-gray-800 rounded p-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{JSON.stringify(data, null, 2)}</pre>
  }
}

export function Approvals() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState<ApprovalRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (typeFilter) params.requestType = typeFilter
    api.get('/bnpl/approvals', { params }).then((r) => setRequests(r.data))
  }, [statusFilter, typeFilter])

  useEffect(() => { fetch() }, [fetch])

  const handleApprove = async (id: string) => {
    setSaving(true)
    try {
      await api.patch(`/bnpl/approvals/${id}/approve`, {})
      setSelected(null)
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to approve')
    }
    setSaving(false)
  }

  const handleReject = async (id: string) => {
    setSaving(true)
    try {
      await api.patch(`/bnpl/approvals/${id}/reject`, { rejectionReason })
      setSelected(null)
      setRejectionReason('')
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to reject')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Approvals</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="">All types</option>
          <option value="product_change">Product Change</option>
          <option value="restructuring">Restructuring</option>
          <option value="write_off">Write-Off / Default</option>
          <option value="manual_override">Manual Override</option>
          <option value="user_suspension">User Suspension</option>
          <option value="eligibility_exception">Eligibility Exception</option>
        </select>
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Type</THeadCell>
            <THeadCell>Reason</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Requested</THeadCell>
            <THeadCell>Reviewed</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {requests.map((r) => (
            <TBodyRow key={r.id}>
              <TBodyCell>
                <Badge variant={typeColors[r.requestType] ?? 'default'}>{typeLabels[r.requestType]}</Badge>
              </TBodyCell>
              <TBodyCell className="max-w-[200px] truncate text-sm">{r.reason || '—'}</TBodyCell>
              <TBodyCell>
                <Badge variant={statusColors[r.status]}>{r.status}</Badge>
              </TBodyCell>
              <TBodyCell className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</TBodyCell>
              <TBodyCell className="text-xs">{r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : '—'}</TBodyCell>
              <TBodyCell>
                <Button variant="ghost" size="sm" onClick={() => { setSelected(r); setRejectionReason('') }}>
                  {r.status === 'pending' ? 'Review' : 'View'}
                </Button>
              </TBodyCell>
            </TBodyRow>
          ))}
          {requests.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={6} className="text-center text-gray-400 py-8">No approval requests found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardTitle className="text-lg font-bold mb-4 dark:text-gray-100">
              {typeLabels[selected.requestType]}
            </CardTitle>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Status</span>
                <span className="col-span-2"><Badge variant={statusColors[selected.status]}>{selected.status}</Badge></span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Reason</span>
                <span className="col-span-2">{selected.reason || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">Requested</span>
                <span className="col-span-2">{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              {selected.reviewedAt && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Reviewed</span>
                  <span className="col-span-2">{new Date(selected.reviewedAt).toLocaleString()}</span>
                </div>
              )}
              {selected.rejectionReason && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Rejection</span>
                  <span className="col-span-2 text-red-600">{selected.rejectionReason}</span>
                </div>
              )}

              <div className="border-t dark:border-gray-700 pt-3">
                <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Request Data</h4>
                <RequestDataView type={selected.requestType} data={selected.requestData} />
              </div>
            </div>

            {selected.status === 'pending' && (
              <div className="mt-6 space-y-4">
                <Input
                  label="Rejection Reason (optional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => handleApprove(selected.id)} disabled={saving} className="flex-1">Approve</Button>
                  <Button variant="secondary" onClick={() => handleReject(selected.id)} disabled={saving} className="flex-1">Reject</Button>
                </div>
                <Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>Cancel</Button>
              </div>
            )}

            {selected.status !== 'pending' && (
              <div className="mt-6">
                <Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>Close</Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
