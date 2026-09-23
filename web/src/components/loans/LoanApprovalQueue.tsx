import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { CheckCircle2, X, AlertCircle, Info, Clock, Ban, Eye, FileText, Landmark, Calendar, Wallet } from 'lucide-react'
import { naira } from '../../lib/utils'
import { Btn, Modal, StatCard, inputCls } from '../ui/warm'

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

const stageMeta: Record<ApprovalStage, { title: string; subtitle: string; queue: string; approveLabel: string; endpoint: string }> = {
  apex: { title: 'Apex Organization Approval', subtitle: 'Loans from your organizations awaiting apex sign-off', queue: 'pending', approveLabel: 'Approve at Apex', endpoint: 'apex-approve' },
  organization: { title: 'Organization Approval', subtitle: 'Apex-approved loans awaiting organization sign-off', queue: 'apex_approved', approveLabel: 'Approve at Organization', endpoint: 'org-approve' },
  admin: { title: 'Final Approval', subtitle: 'Organization-approved loans awaiting final sign-off', queue: 'org_approved', approveLabel: 'Final Approve', endpoint: 'admin-approve' },
  disbursement: { title: 'Disbursement', subtitle: 'Fully approved loans ready to disburse', queue: 'approved', approveLabel: 'Disburse', endpoint: 'disburse' },
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

const initials = (name?: string) =>
  name
    ? name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'M'

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

  const totalRequested = loans.reduce((s, l) => s + Number(l.amount), 0)
  const totalServiceFees = loans.reduce((s, l) => s + Number(l.serviceFee || 0), 0)
  const netToDisburse = loans.reduce((s, l) => s + (Number(l.amount) - Number(l.serviceFee || 0)), 0)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Loan Approvals</p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Approval Queue</h1>
        <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">{meta.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={loading ? 'Loading…' : 'Awaiting Review'} value={loans.length} sub={meta.title} icon="📋" iconCls="bg-[#E4A42A]/15 text-[#8A5A00]" />
        <StatCard label="Total Requested" value={naira(totalRequested)} sub="principal before fees" icon="💼" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
        <StatCard label="Total Service Fees" value={naira(totalServiceFees)} sub="deducted at disbursement" icon="💵" iconCls="bg-[#9D4824]/10 text-[#9D4824]" />
        <StatCard label="Net to Disburse" value={naira(netToDisburse)} sub="principal less service fees" valueCls={stage === 'disbursement' ? 'text-[#176B5B]' : undefined} icon="💰" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
      </div>

      {loans.length === 0 && !loading && (
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE2D3]">
            <FileText size={24} className="text-[#6B5245]" />
          </div>
          <p className="text-sm text-[#6B5245]">No loans awaiting this stage.</p>
        </div>
      )}

      <div className="space-y-4">
        {loans.map((loan) => {
          const net = Number(loan.amount) - Number(loan.serviceFee || 0)
          const statusConf = statusConfig[loan.status] || statusConfig.pending
          const StatusIcon = statusConf.icon
          const borrowerName = loan.borrower?.name || loan.borrower?.email || 'Member'
          return (
            <div key={loan.id} className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-4 border-b border-[#EDE2D3] bg-[#FFF9EF] px-6 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#176B5B] text-sm font-black text-[#FFF9EF]">
                  {initials(loan.borrower?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black tracking-[-0.01em] text-[#2C1B13]">{borrowerName}</p>
                  {loan.borrower?.email && <p className="truncate text-xs text-[#6B5245]">{loan.borrower.email}</p>}
                </div>
                <span className="text-xs font-semibold text-[#6B5245]">#{loan.id.slice(0, 8)}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusConf.color} ${statusConf.bg}`}>
                  <StatusIcon size={14} /> {loan.status}
                </span>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-3xl font-black tracking-[-0.03em] text-[#2C1B13]">₦{Number(loan.amount).toLocaleString()}</p>
                    {loan.purpose && <p className="mt-1 text-sm italic text-[#6B5245]">{loan.purpose}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Btn onClick={() => handleApprove(loan)} disabled={busyId === loan.id}>
                      {busyId === loan.id ? 'Processing...' : meta.approveLabel}
                    </Btn>
                    <Btn
                      variant="secondary"
                      className="border-[#C85B23] bg-[#C85B23]/10 text-[#C85B23] hover:bg-[#C85B23]/20"
                      onClick={() => { setRejecting(loan); setRejectReason('') }}
                      disabled={busyId === loan.id}
                    >
                      <X size={16} /> Reject
                    </Btn>
                    <Btn variant="secondary" onClick={() => setSelected(loan)}>
                      <Eye size={16} /> Details
                    </Btn>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#B79B6B]">Duration</p>
                    <p className="mt-0.5 text-sm font-bold text-[#2C1B13]">{loan.duration} months</p>
                  </div>
                  <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#B79B6B]">Interest</p>
                    <p className="mt-0.5 text-sm font-bold text-[#2C1B13]">{loan.interestRate}%</p>
                  </div>
                  <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#B79B6B]">Monthly</p>
                    <p className="mt-0.5 text-sm font-bold text-[#2C1B13]">₦{Number(loan.monthlyPayment).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#B79B6B]">Service Fee</p>
                    <p className="mt-0.5 text-sm font-bold text-[#E4A42A]">₦{Number(loan.serviceFee || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {stage === 'disbursement' ? (
                    <p className="text-sm font-semibold text-[#176B5B]">Net to disburse: {naira(net)}</p>
                  ) : (
                    <p className="text-sm text-[#6B5245]">
                      Disbursed amount: {loan.disbursedAmount ? <span className="font-semibold text-[#2C1B13]">{naira(Number(loan.disbursedAmount))}</span> : '—'}
                    </p>
                  )}
                  <p className="text-xs text-[#6B5245]/70">Applied {new Date(loan.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {loan.status === 'rejected' && (
                <div className="mx-6 mb-6 flex items-start gap-3 rounded-xl border border-[#C85B23]/30 bg-[#C85B23]/10 px-4 py-3">
                  <Ban size={18} className="mt-0.5 shrink-0 text-[#C85B23]" />
                  <div>
                    <p className="text-sm font-medium text-[#C85B23]">
                      Rejected{loan.rejectionReason ? `: ${loan.rejectionReason}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-[#C85B23]/70">
                      {loan.rejectedAt ? new Date(loan.rejectedAt).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject Loan">
        {rejecting && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B5245]">
              Reject loan <strong className="text-[#2C1B13]">#{rejecting.id.slice(0, 8)}</strong> of {naira(Number(rejecting.amount))}?
            </p>
            <textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className={inputCls + ' resize-none'}
            />
            <div className="flex gap-2">
              <Btn onClick={() => handleReject(rejecting)} disabled={busyId === rejecting.id} className="flex-1">
                {busyId === rejecting.id ? 'Rejecting...' : 'Confirm Reject'}
              </Btn>
              <Btn variant="secondary" onClick={() => setRejecting(null)} className="flex-1">Cancel</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Loan Details" className="max-w-2xl">
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#176B5B] text-sm font-black text-[#FFF9EF]">
                {initials(selected.borrower?.name)}
              </div>
              <div>
                <p className="text-sm font-black text-[#2C1B13]">{selected.borrower?.name || selected.borrower?.email || 'Member'}</p>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig[selected.status]?.color || ''} ${statusConfig[selected.status]?.bg || ''}`}>
                  {selected.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wallet size={16} className="text-[#6B5245]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Amount</span>
                </div>
                <p className="text-lg font-black text-[#2C1B13]">₦{Number(selected.amount).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Landmark size={16} className="text-[#6B5245]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Interest</span>
                </div>
                <p className="text-lg font-black text-[#2C1B13]">{selected.interestRate}%</p>
              </div>
              <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-[#6B5245]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Duration</span>
                </div>
                <p className="text-lg font-black text-[#2C1B13]">{selected.duration} months</p>
              </div>
              <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wallet size={16} className="text-[#6B5245]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Monthly</span>
                </div>
                <p className="text-lg font-black text-[#2C1B13]">₦{Number(selected.monthlyPayment).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wallet size={16} className="text-[#6B5245]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Total</span>
                </div>
                <p className="text-lg font-black text-[#2C1B13]">₦{Number(selected.totalRepayment).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Wallet size={16} className="text-[#6B5245]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Service Fee</span>
                </div>
                <p className="text-lg font-black text-[#E4A42A]">₦{Number(selected.serviceFee || 0).toLocaleString()}</p>
              </div>
              {selected.disbursedAmount != null && (
                <div className="col-span-2 rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Wallet size={16} className="text-[#6B5245]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Disbursed Amount</span>
                  </div>
                  <p className="text-lg font-black text-[#176B5B]">{naira(Number(selected.disbursedAmount))}</p>
                </div>
              )}
            </div>

            <div>
              <p className="mb-3 text-sm font-black text-[#2C1B13]">Repayment Schedule</p>
              <div className="space-y-2">
                {selected.repayments?.map((r) => {
                  const rStatusConf = statusConfig[r.status] || statusConfig.pending
                  const RStatusIcon = rStatusConf.icon
                  return (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EDE2D3] bg-[#FFF9EF] px-4 py-3">
                      <span className="font-bold text-[#2C1B13]">₦{Number(r.amount).toLocaleString()}</span>
                      <span className="text-sm text-[#6B5245]">due {new Date(r.dueDate).toLocaleDateString()}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${rStatusConf.color} ${rStatusConf.bg}`}>
                        <RStatusIcon size={12} /> {r.status}
                      </span>
                    </div>
                  )
                })}
                {(!selected.repayments || selected.repayments.length === 0) && (
                  <p className="text-sm text-[#6B5245]">No repayment schedule</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}