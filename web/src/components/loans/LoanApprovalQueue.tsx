import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { CheckCircle2, X, AlertCircle, Info, Clock, Ban, Eye, FileText, Landmark, Calendar, Wallet } from 'lucide-react'
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

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  pending: { color: 'text-[#C85B23]', bg: 'bg-[#C85B23]/10', icon: Clock },
  apex_approved: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: Info },
  org_approved: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: Info },
  approved: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: CheckCircle2 },
  active: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: FileText },
  completed: { color: 'text-[#176B5B]', bg: 'bg-[#176B5B]/10', icon: CheckCircle2 },
  defaulted: { color: 'text-[#C85B23]', bg: 'bg-[#C85B23]/10', icon: AlertCircle },
  rejected: { color: 'text-[#C85B23]', bg: 'bg-[#C85B23]/10', icon: Ban },
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
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Loan {meta.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5245]">
            {loans.length} loan{loans.length !== 1 ? 's' : ''} awaiting {meta.title.toLowerCase()}
          </p>
        </div>
      </div>

      {loans.length === 0 && !loading && (
        <div className="rounded-2xl border border-[#D8C9A9] bg-white p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE2D3] mx-auto mb-4">
            <FileText size={24} className="text-[#6B5245]" />
          </div>
          <p className="text-[#6B5245]">No loans awaiting this stage.</p>
        </div>
      )}

      <div className="space-y-4">
        {loans.map((loan) => {
          const net = Number(loan.amount) - Number(loan.serviceFee || 0)
          const statusConf = statusConfig[loan.status] || statusConfig.pending
          const StatusIcon = statusConf.icon
          return (
            <div key={loan.id} className="rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className="text-sm font-semibold text-[#6B5245]">Loan #{loan.id.slice(0, 8)}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConf.color} ${statusConf.bg}`}>
                      <StatusIcon size={14} /> {loan.status}
                    </span>
                  </div>
                  <p className="text-3xl font-black text-[#2C1B13]">₦{Number(loan.amount).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-[#6B5245]">
                    {loan.borrower?.name || loan.borrower?.email || 'Member'} · {loan.duration} months @ {loan.interestRate}%
                  </p>
                  {loan.purpose && <p className="mt-1 text-sm text-[#6B5245] italic">{loan.purpose}</p>}
                  <p className="mt-2 text-xs text-[#6B5245]/70">
                    Applied {new Date(loan.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(loan)}
                      disabled={busyId === loan.id}
                      className="inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#1a7d6a] disabled:opacity-70 disabled:pointer-events-none"
                    >
                      {busyId === loan.id ? 'Processing...' : meta.approveLabel}
                    </button>
                    <button
                      onClick={() => { setRejecting(loan); setRejectReason('') }}
                      disabled={busyId === loan.id}
                      className="inline-flex items-center gap-2 rounded-full border border-[#C85B23] bg-[#C85B23]/10 px-4 py-2 text-sm font-semibold text-[#C85B23] transition duration-200 hover:bg-[#C85B23]/20 disabled:opacity-70 disabled:pointer-events-none"
                    >
                      <X size={16} /> Reject
                    </button>
                    <button
                      onClick={() => setSelected(loan)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#D8C9A9] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition duration-200 hover:bg-[#EDE2D3]"
                    >
                      <Eye size={16} /> Details
                    </button>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-[#6B5245]">
                      Service fee: <span className="font-semibold text-[#E4A42A]">₦{Number(loan.serviceFee || 0).toLocaleString()}</span>
                    </p>
                    {stage === 'disbursement' ? (
                      <p className="font-semibold text-[#176B5B]">
                        Net to disburse: {naira(net)}
                      </p>
                    ) : (
                      <p className="font-semibold text-[#2C1B13]">
                        Disbursed amount: {loan.disbursedAmount ? naira(Number(loan.disbursedAmount)) : '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {loan.status === 'rejected' && (
                <div className="mt-4 rounded-xl bg-[#C85B23]/10 border border-[#C85B23]/30 px-4 py-3 flex items-start gap-3">
                  <Ban size={18} className="text-[#C85B23] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#C85B23]">
                      Rejected{loan.rejectionReason ? `: ${loan.rejectionReason}` : ''}
                    </p>
                    <p className="text-xs text-[#C85B23]/70 mt-1">
                      {loan.rejectedAt ? new Date(loan.rejectedAt).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#2C1B13] mb-4">Reject Loan</h2>
            <div className="space-y-4">
              <p className="text-sm text-[#6B5245]">
                Reject loan <strong>#{rejecting.id.slice(0, 8)}</strong> of {naira(Number(rejecting.amount))}?
              </p>
              <textarea
                placeholder="Reason for rejection (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#D8C9A9] bg-[#FFF9EF] px-4 py-3 text-sm text-[#2C1B13] placeholder-[#6B5245]/50 focus:outline-none focus:ring-2 focus:ring-[#176B5B] focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(rejecting)}
                  disabled={busyId === rejecting.id}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#C85B23] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] transition duration-200 hover:bg-[#D66A2D] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {busyId === rejecting.id ? 'Rejecting...' : 'Confirm Reject'}
                </button>
                <button
                  onClick={() => setRejecting(null)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#D8C9A9] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B5245] transition duration-200 hover:bg-[#EDE2D3]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#23150F]/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#D8C9A9] bg-white p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#2C1B13]">Loan Details</h2>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl text-[#6B5245] hover:bg-[#EDE2D3] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet size={16} className="text-[#6B5245]" />
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Amount</span>
                  </div>
                  <p className="text-lg font-black text-[#2C1B13]">₦{Number(selected.amount).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark size={16} className="text-[#6B5245]" />
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Interest</span>
                  </div>
                  <p className="text-lg font-black text-[#2C1B13]">{selected.interestRate}%</p>
                </div>
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-[#6B5245]" />
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Duration</span>
                  </div>
                  <p className="text-lg font-black text-[#2C1B13]">{selected.duration} months</p>
                </div>
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet size={16} className="text-[#6B5245]" />
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Monthly</span>
                  </div>
                  <p className="text-lg font-black text-[#2C1B13]">₦{Number(selected.monthlyPayment).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet size={16} className="text-[#6B5245]" />
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Total</span>
                  </div>
                  <p className="text-lg font-black text-[#2C1B13]">₦{Number(selected.totalRepayment).toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet size={16} className="text-[#6B5245]" />
                    <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Service Fee</span>
                  </div>
                  <p className="text-lg font-black text-[#E4A42A]">₦{Number(selected.serviceFee || 0).toLocaleString()}</p>
                </div>
                {selected.disbursedAmount != null && (
                  <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4 col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet size={16} className="text-[#6B5245]" />
                      <span className="text-xs font-semibold text-[#6B5245] uppercase tracking-wider">Disbursed Amount</span>
                    </div>
                    <p className="text-lg font-black text-[#176B5B]">{naira(Number(selected.disbursedAmount))}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-[#2C1B13] mb-3">Repayment Schedule</p>
                <div className="space-y-2">
                  {selected.repayments?.map((r) => {
                    const rStatusConf = statusConfig[r.status] || statusConfig.pending
                    const RStatusIcon = rStatusConf.icon
                    return (
                      <div key={r.id} className="flex items-center justify-between rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-3">
                        <span className="font-semibold text-[#2C1B13]">₦{Number(r.amount).toLocaleString()}</span>
                        <span className="text-sm text-[#6B5245]">due {new Date(r.dueDate).toLocaleDateString()}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${rStatusConf.color} ${rStatusConf.bg}`}>
                          <RStatusIcon size={12} /> {r.status}
                        </span>
                      </div>
                    )
                  })}
                  {(!selected.repayments || selected.repayments.length === 0) && (
                    <p className="text-[#6B5245] text-sm">No repayment schedule</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
