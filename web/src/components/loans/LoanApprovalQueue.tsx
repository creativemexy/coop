import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Modal } from '../ui/modal'
import { naira } from '../../lib/utils'

interface LoanRepayment {
  id: string
  dueDate: string
  amount: number
  status: string
  paidAt?: string
}

interface Loan {
  id: string
  userId: string
  amount: number
  interestRate: number
  duration: number
  monthlyPayment: number
  totalRepayment: number
  amountPaid: number
  serviceFee: number
  serviceFeePaid: boolean
  purpose?: string
  status: string
  createdAt: string
  disbursedAmount?: number
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  borrower?: { name?: string; email?: string }
  repayments: LoanRepayment[]
}

export type ApprovalStage = 'apex' | 'organization' | 'admin' | 'disbursement'

const stageMeta: Record<ApprovalStage, { title: string; queue: string; approveLabel: string; endpoint: string }> = {
  apex: { title: 'Apex Organization Approval', queue: 'pending', approveLabel: 'Approve at Apex', endpoint: 'apex-approve' },
  organization: { title: 'Organization Approval', queue: 'apex_approved', approveLabel: 'Approve at Organization', endpoint: 'org-approve' },
  admin: { title: 'Final Approval', queue: 'org_approved', approveLabel: 'Final Approve', endpoint: 'admin-approve' },
  disbursement: { title: 'Disbursement', queue: 'approved', approveLabel: 'Disburse', endpoint: 'disburse' },
}

const statusColors: Record<string, 'warning' | 'success' | 'danger' | 'info' | 'default'> = {
  pending: 'warning',
  apex_approved: 'info',
  org_approved: 'info',
  approved: 'success',
  active: 'info',
  completed: 'success',
  defaulted: 'danger',
  rejected: 'danger',
}

export function LoanApprovalQueue({ stage }: { stage: ApprovalStage }) {
  const meta = stageMeta[stage]
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<Loan | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selected, setSelected] = useState<Loan | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/loans/stage?stage=${stage}`).then(({ data }) => {
      setLoans(data)
      setLoading(false)
    })
  }, [stage])

  useEffect(() => { load() }, [load])

  const handleApprove = async (loan: Loan) => {
    setBusyId(loan.id)
    try {
      await api.post(`/loans/${loan.id}/${meta.endpoint}`)
      load()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Action failed')
    }
    setBusyId(null)
  }

  const handleReject = async (loan: Loan) => {
    setBusyId(loan.id)
    try {
      await api.post(`/loans/${loan.id}/reject`, { reason: rejectReason || undefined })
      setRejecting(null)
      setRejectReason('')
      load()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Rejection failed')
    }
    setBusyId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-100">Loan {meta.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {loans.length} loan{loans.length !== 1 ? 's' : ''} awaiting {meta.title.toLowerCase()}
          </p>
        </div>
      </div>

      {loans.length === 0 && !loading && (
        <Card><p className="text-gray-500">No loans awaiting this stage.</p></Card>
      )}

      <div className="space-y-4">
        {loans.map((loan) => {
          const net = Number(loan.amount) - Number(loan.serviceFee || 0)
          return (
            <Card key={loan.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Loan #{loan.id.slice(0, 8)}
                    </CardTitle>
                    <Badge variant={statusColors[loan.status] ?? 'default'}>{loan.status}</Badge>
                  </div>
                  <p className="text-2xl font-bold mt-1">₦{Number(loan.amount).toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {loan.borrower?.name || loan.borrower?.email || 'Member'} · {loan.duration} months @ {loan.interestRate}%
                  </p>
                  {loan.purpose && <p className="text-sm text-gray-500 mt-1">{loan.purpose}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Applied {new Date(loan.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(loan)} disabled={busyId === loan.id}>
                      {busyId === loan.id ? 'Processing...' : meta.approveLabel}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => { setRejecting(loan); setRejectReason('') }} disabled={busyId === loan.id}>
                      Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelected(loan)}>
                      Details
                    </Button>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-500">
                      Service fee: <span className="text-amber-600">₦{Number(loan.serviceFee || 0).toLocaleString()}</span>
                    </p>
                    {stage === 'disbursement' ? (
                      <p className="font-semibold text-green-600">
                        Net to disburse: {naira(net)}
                      </p>
                    ) : (
                      <p className="font-semibold">
                        Disbursed amount: {loan.disbursedAmount ? naira(Number(loan.disbursedAmount)) : '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {loan.status === 'rejected' && (
                <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm">
                  <p className="text-red-700 dark:text-red-300">
                    Rejected{loan.rejectionReason ? `: ${loan.rejectionReason}` : ''}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    {loan.rejectedAt ? new Date(loan.rejectedAt).toLocaleString() : ''}
                  </p>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject Loan">
        {rejecting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Reject loan <strong>#{rejecting.id.slice(0, 8)}</strong> of {naira(Number(rejecting.amount))}?
            </p>
            <textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => handleReject(rejecting)} disabled={busyId === rejecting.id}>
                {busyId === rejecting.id ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setRejecting(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Loan Details">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Amount</span><p className="font-bold">₦{Number(selected.amount).toLocaleString()}</p></div>
              <div><span className="text-gray-500">Interest</span><p className="font-bold">{selected.interestRate}%</p></div>
              <div><span className="text-gray-500">Duration</span><p className="font-bold">{selected.duration} months</p></div>
              <div><span className="text-gray-500">Monthly</span><p className="font-bold">₦{Number(selected.monthlyPayment).toLocaleString()}</p></div>
              <div><span className="text-gray-500">Total repayment</span><p className="font-bold">₦{Number(selected.totalRepayment).toLocaleString()}</p></div>
              <div><span className="text-gray-500">Service fee</span><p className="font-bold text-amber-600">₦{Number(selected.serviceFee || 0).toLocaleString()}</p></div>
              {selected.disbursedAmount != null && (
                <div><span className="text-gray-500">Disbursed amount</span><p className="font-bold text-green-600">{naira(Number(selected.disbursedAmount))}</p></div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold mb-2 dark:text-gray-100">Repayment Schedule</p>
              <div className="space-y-2">
                {selected.repayments?.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border dark:border-gray-700 px-4 py-2 text-sm">
                    <span className="font-medium">₦{Number(r.amount).toLocaleString()}</span>
                    <span className="text-gray-500">due {new Date(r.dueDate).toLocaleDateString()}</span>
                    <Badge variant={r.status === 'paid' ? 'success' : r.status === 'overdue' ? 'danger' : 'warning'}>{r.status}</Badge>
                  </div>
                ))}
                {(!selected.repayments || selected.repayments.length === 0) && (
                  <p className="text-gray-400 text-sm">No repayment schedule</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
