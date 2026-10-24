import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../../api/client'
import {
  Landmark, ClipboardList, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight,
  ArrowDownLeft, Copy, Check, Banknote, Hash, Loader2, CalendarDays, Wallet, X, Plus, ShieldCheck,
} from 'lucide-react'

interface LoanRepayment {
  id: string
  dueDate: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  paidAt?: string
}

interface PaymentInstruction {
  id: string
  amount: number
  type: string
  reference: string
  accountNumber: string
  accountName: string
  bankName: string
  status: string
  expiresAt?: string
  creditedAt?: string
}

interface Loan {
  id: string
  amount: number
  interestRate: number
  duration: number
  monthlyPayment: number
  totalRepayment: number
  amountPaid: number
  serviceFee: number
  serviceFeePaid: boolean
  disbursedAmount?: number
  purpose?: string
  status: string
  createdAt: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  repayments: LoanRepayment[]
}

const statusMeta = (s: string) => {
  switch (s) {
    case 'pending':
      return { cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
    case 'apex_approved':
      return { cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' }
    case 'org_approved':
      return { cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' }
    case 'approved':
      return { cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
    case 'active':
      return { cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    case 'completed':
      return { cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    case 'defaulted':
      return { cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }
    case 'rejected':
      return { cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }
    default:
      return { cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
  }
}

const statusLabels: Record<string, string> = {
  pending: 'Awaiting apex approval',
  apex_approved: 'Awaiting organization approval',
  org_approved: 'Awaiting admin approval',
  approved: 'Awaiting disbursement',
  active: 'Active',
  completed: 'Completed',
  defaulted: 'Defaulted',
  rejected: 'Rejected',
}

interface LoanEligibility {
  eligible: boolean
  vested: boolean
  savingsBalance: number
  vestingMonths: number
  multiplier: number
  maxAmount: number
  activeLoans: number
  reasons: Array<{ key: string; label: string; passed: boolean }>
}

const ngn = (n: number) => `₦${n.toLocaleString()}`

const solidGreen =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#176B5B] px-4 py-2 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidGold =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghost =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const tinyGold =
  'inline-flex items-center gap-1.5 rounded-full bg-[#E4A42A] px-3 py-1.5 text-xs font-bold text-[#2C1B13] transition hover:bg-[#B9891F] cursor-pointer disabled:opacity-60 disabled:pointer-events-none'
const fieldCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] hover:border-[#D8C9A9] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

function Label({ children, optional }: { children: ReactNode; optional?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
      {children}
      {optional && <span className="ml-1 font-medium normal-case text-[#B79B6B]">(optional)</span>}
    </label>
  )
}

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {statusLabels[status] ?? status}
    </span>
  )
}

function BrandModal({
  open,
  onClose,
  icon,
  iconCls,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  icon: ReactNode
  iconCls: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#23150F]/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#EDE2D3] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>{icon}</div>
            <div>
              <h2 className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">{title}</h2>
              {subtitle && <p className="text-xs text-[#6B5245]">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6B5245] transition hover:bg-[#FFF9EF] hover:text-[#2C1B13] cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-76px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function Loans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null)
  const [showApply, setShowApply] = useState(false)
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState('3')
  const [purpose, setPurpose] = useState('')
  const [loading, setLoading] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [pay, setPay] = useState<{ repaymentId: string; pending: PaymentInstruction } | null>(null)
  const [checking, setChecking] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetch = () => Promise.all([
    api.get('/loans').then((r) => setLoans(r.data)),
    api.get('/loans/eligibility').then((r) => setEligibility(r.data)).catch(() => {}),
  ])

  useEffect(() => { fetch() }, [])

  useEffect(() => {
    if (!pay || pay.pending.status !== 'pending') return
    const MAX_ATTEMPTS = 30
    const MAX_CONSECUTIVE_ERRORS = 3
    const BASE_DELAY = 5000
    const MAX_DELAY = 30000

    let cancelled = false
    let attempts = 0
    let consecutiveErrors = 0
    let delay = BASE_DELAY
    let timer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      if (cancelled) return
      attempts += 1
      const status = await checkPayment()
      if (cancelled) return
      if (status === 'credited') return
      if (status === 'error') {
        consecutiveErrors += 1
      } else if (status !== 'pending') {
        return
      } else {
        consecutiveErrors = 0
      }
      if (attempts >= MAX_ATTEMPTS || consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        setPay(null)
        alert('Payment confirmation timed out. Check your account and try again.')
        return
      }
      delay = Math.min(delay * 1.5, MAX_DELAY)
      timer = setTimeout(poll, delay)
    }

    timer = setTimeout(poll, BASE_DELAY)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay?.pending.status, pay?.pending.id])

  const handleApply = async () => {
    setLoading(true)
    try {
      await api.post('/loans/apply', { amount: Number(amount), duration: Number(duration), purpose })
      setAmount('')
      setPurpose('')
      setShowApply(false)
      await fetch()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Application failed')
    }
    setLoading(false)
  }

  const handlePayNow = async (repaymentId: string) => {
    setPayingId(repaymentId)
    try {
      const { data } = await api.post(`/virtual-accounts/loan-repayments/${repaymentId}/initiate`)
      setPay({ repaymentId, pending: data })
    } catch (e: any) {
      alert(e.response?.data?.message || 'Could not start payment')
    }
    setPayingId(null)
  }

  const checkPayment = async (confirm = false): Promise<string | 'error'> => {
    if (!pay) return 'error'
    setChecking(true)
    try {
      const { data } = await api.post(`/virtual-accounts/loan-repayments/${pay.repaymentId}/verify`, confirm ? { confirm: true } : undefined)
      setPay(data && { repaymentId: pay.repaymentId, pending: data })
      if (data && data.status === 'credited') {
        setPay(null)
        await fetch()
      }
      return data?.status ?? 'pending'
    } catch {
      // keep modal open; re-poll
      return 'error'
    } finally {
      setChecking(false)
    }
  }

  const copyAccount = async () => {
    if (!pay) return
    try {
      await navigator.clipboard.writeText(pay.pending.accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const activeLoans = loans.filter((l) => l.status === 'active')
  const outstandingBalance = activeLoans.reduce((s, l) => s + (l.totalRepayment - l.amountPaid), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Loan Services</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">My Loans</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Apply for credit against your savings and track repayments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowApply(!showApply)}
          className={showApply ? ghost : solidGreen}
        >
          {showApply ? (<><X size={15} /> Cancel</>) : (<><Plus size={15} /> Apply for Loan</>)}
        </button>
      </div>

      {/* Apply card */}
      {showApply && (
        <div className="rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <ClipboardList size={16} className="text-[#176B5B]" />
            </div>
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Apply for a Loan</h2>
          </div>

          {eligibility && !eligibility.eligible && (
            <div className="mt-4 rounded-2xl border border-[#B3261E]/25 bg-[#B3261E]/5 p-4">
              <p className="flex items-center gap-2 font-bold text-[#2C1B13]">
                <AlertTriangle size={16} className="text-[#B3261E]" /> Not yet eligible for a loan
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {eligibility.reasons.map((r) => (
                  <li key={r.key} className="flex items-center gap-2">
                    {r.passed
                      ? <CheckCircle2 size={14} className="shrink-0 text-[#176B5B]" />
                      : <XCircle size={14} className="shrink-0 text-[#B3261E]" />}
                    <span className={r.passed ? 'text-[#6B5245]' : 'font-medium text-[#B3261E]'}>{r.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs font-medium text-[#6B5245]">
                Savings balance: {ngn(eligibility.savingsBalance)} · Max loan at {eligibility.multiplier}x: {ngn(eligibility.maxAmount)}
              </p>
            </div>
          )}

          {eligibility?.eligible && (
            <div className="mt-4 rounded-2xl border border-[#176B5B]/25 bg-[#176B5B]/10 p-4">
              <p className="flex items-center gap-2 font-bold text-[#176B5B]">
                <ShieldCheck size={16} /> You are eligible!
              </p>
              <p className="mt-1 text-sm text-[#6B5245]">
                Max loan: <strong className="text-[#176B5B]">{ngn(eligibility.maxAmount)}</strong>{' '}
                ({eligibility.multiplier}x your {ngn(eligibility.savingsBalance)} savings)
              </p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Amount (₦)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#B79B6B]">₦</span>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`${fieldCls} pl-9`}
                />
              </div>
            </div>
            <div>
              <Label>Duration (months)</Label>
              <select value={duration} onChange={(e) => setDuration(e.target.value)} className={`${fieldCls} appearance-none`}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label optional>Purpose</Label>
              <input
                type="text"
                placeholder="What's the loan for?"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          {amount && duration && (
            <div className="mt-4 space-y-2 rounded-2xl border border-[#E4A42A]/30 bg-gradient-to-br from-[#E4A42A]/10 to-[#FFF9EF] p-4 text-sm">
              <div className="flex justify-between"><span className="text-[#6B5245]">Loan amount</span><strong className="text-[#2C1B13]">{ngn(Number(amount))}</strong></div>
              <div className="flex justify-between"><span className="text-[#6B5245]">Interest (5%)</span><strong className="text-[#2C1B13]">{ngn(Math.round(Number(amount) * 0.05))}</strong></div>
              <div className="flex justify-between"><span className="text-[#6B5245]">Service fee (1%)</span><strong className="text-[#2C1B13]">{ngn(Math.round(Number(amount) * 0.01))}</strong></div>
              <div className="flex justify-between"><span className="text-[#6B5245]">Total repayment</span><strong className="text-[#2C1B13]">{ngn(Math.round(Number(amount) * 1.05))}</strong></div>
              <div className="flex justify-between"><span className="text-[#6B5245]">Monthly payment</span><strong className="text-[#2C1B13]">{ngn(Math.round((Number(amount) * 1.05) / Number(duration)))}</strong></div>
              <div className="flex justify-between border-t border-[#E4A42A]/30 pt-2">
                <span className="text-[#6B5245]">Net amount disbursed</span>
                <strong className="text-[#176B5B]">{ngn(Math.round(Number(amount) * 0.99))}</strong>
              </div>
              <p className="text-xs text-[#6B5245]">(service fee deducted from the loan)</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleApply}
            disabled={loading || !amount || (eligibility ? !eligibility.eligible : false)}
            className={`${solidGreen} mt-4`}
          >
            {loading ? (<><Loader2 size={15} className="animate-spin" /> Submitting...</>) : 'Submit Application'}
          </button>
        </div>
      )}

      {/* Stats */}
      {activeLoans.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
                <Landmark size={16} className="text-[#176B5B]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Active Loans</p>
            </div>
            <p className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#2C1B13]">{activeLoans.length}</p>
          </div>
          <div className="rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9D4824]/10">
                <Wallet size={16} className="text-[#9D4824]" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Outstanding Balance</p>
            </div>
            <p className="mt-4 break-words text-3xl font-black tracking-[-0.03em] text-[#9D4824]">{ngn(outstandingBalance)}</p>
          </div>
        </div>
      )}

      {/* Loan cards */}
      <div className="space-y-5">
        {loans.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E7DCCB] bg-white/60 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4A42A]/15">
              <Landmark size={26} className="text-[#8A5A00]" />
            </div>
            <p className="font-bold text-[#2C1B13]">No loan applications yet</p>
            <p className="max-w-sm text-sm text-[#6B5245]">When you apply, your loans and repayment schedules will appear here.</p>
            <button type="button" onClick={() => setShowApply(true)} className={solidGold}>
              <Plus size={15} /> Apply for a loan
            </button>
          </div>
        )}
        {loans.map((loan) => {
          const balance = loan.totalRepayment - loan.amountPaid
          const overdueCount = loan.repayments.filter(
            (r) => r.status === 'pending' && new Date(r.dueDate) < new Date(),
          ).length
          const paidPct = loan.totalRepayment > 0 ? Math.round((loan.amountPaid / loan.totalRepayment) * 100) : 0

          return (
            <div key={loan.id} className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EDE2D3] px-6 py-5">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#B79B6B]">Loan #{loan.id.slice(0, 8)}</p>
                  <p className="mt-0.5 break-words text-2xl font-black tracking-[-0.03em] text-[#2C1B13]">{ngn(Number(loan.amount))}</p>
                  {loan.purpose && <p className="mt-0.5 text-sm text-[#6B5245]">{loan.purpose}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <StatusPill status={loan.status} />
                  <p className="mt-1 text-xs font-medium text-[#6B5245]">{loan.duration} months @ {loan.interestRate}%</p>
                  <p className="text-[11px] text-[#B79B6B]">{new Date(loan.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-4 px-6 py-4 text-sm">
                {Number(loan.serviceFee) > 0 && (
                  <div>
                    <p className="text-xs text-[#6B5245]">Service fee (deducted from loan)</p>
                    <p className="mt-0.5 font-bold text-[#8A5A00]">{ngn(Number(loan.serviceFee))}</p>
                  </div>
                )}
                {loan.disbursedAmount != null && (
                  <div>
                    <p className="text-xs text-[#6B5245]">Disbursed amount</p>
                    <p className="mt-0.5 font-bold text-[#176B5B]">{ngn(Number(loan.disbursedAmount))}</p>
                  </div>
                )}
                {loan.status === 'rejected' && (
                  <div className="w-full">
                    <p className="text-xs flex items-center gap-1 text-[#B3261E]"><AlertTriangle size={12} /> Rejection reason</p>
                    <p className="mt-0.5 font-medium text-[#B3261E]">{loan.rejectionReason || 'Not provided'}</p>
                  </div>
                )}
              </div>

              {loan.status === 'active' && (
                <div className="border-t border-[#EDE2D3] px-6 py-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-[#6B5245]">Monthly</p>
                      <p className="mt-0.5 font-bold text-[#2C1B13]">{ngn(Number(loan.monthlyPayment))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B5245]">Paid</p>
                      <p className="mt-0.5 font-bold text-[#176B5B]">{ngn(Number(loan.amountPaid))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B5245]">Balance</p>
                      <p className="mt-0.5 font-bold text-[#B3261E]">{ngn(balance)}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs font-medium text-[#6B5245]">
                      <span>Repayment progress</span>
                      <span>{paidPct}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#F0DDAD]/60">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${paidPct}%`, background: paidPct >= 100 ? 'linear-gradient(90deg, #176B5B, #E4A42A)' : 'linear-gradient(90deg, #176B5B, #2A8A75)' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {loan.repayments.length > 0 && (
                <div className="border-t border-[#EDE2D3] px-6 py-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#6B5245]">Repayment schedule</p>
                    {overdueCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B3261E]/10 px-2.5 py-1 text-xs font-semibold text-[#B3261E]">
                        <AlertTriangle size={12} /> {overdueCount} overdue
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {loan.repayments.map((r) => {
                      const isOverdue = r.status === 'pending' && new Date(r.dueDate) < new Date()
                      const paid = r.status === 'paid'
                      return (
                        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E7DCCB] bg-white px-4 py-3 text-sm">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${paid ? 'bg-[#176B5B]/10 text-[#176B5B]' : isOverdue ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#E4A42A]/15 text-[#8A5A00]'}`}>
                              {paid ? <ArrowDownLeft size={14} /> : isOverdue ? <XCircle size={14} /> : <CalendarDays size={14} />}
                            </span>
                            <div>
                              <p className="font-bold text-[#2C1B13]">{ngn(Number(r.amount))}</p>
                              <p className="text-xs text-[#6B5245]">due {new Date(r.dueDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${paid ? 'bg-[#176B5B]/10 text-[#176B5B]' : isOverdue ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#E4A42A]/15 text-[#8A5A00]'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${paid ? 'bg-[#176B5B]' : isOverdue ? 'bg-[#B3261E]' : 'bg-[#E4A42A]'}`} />
                              {isOverdue && r.status === 'pending' ? 'overdue' : r.status}
                            </span>
                            {r.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handlePayNow(r.id)}
                                disabled={payingId === r.id}
                                className={tinyGold}
                              >
                                {payingId === r.id ? (<><Loader2 size={12} className="animate-spin" /> Starting...</>) : (<><ArrowUpRight size={12} /> Pay Now</>)}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pay modal */}
      <BrandModal
        open={!!pay}
        onClose={() => setPay(null)}
        icon={<Banknote size={18} className="text-[#176B5B]" />}
        iconCls="bg-[#176B5B]/10"
        title="Pay Loan with Bank Transfer"
        subtitle="Repay via your bank"
      >
        {pay && (
          <div className="space-y-5">
            {pay.pending.status === 'credited' ? (
              <div className="flex items-start gap-3 rounded-2xl border border-[#176B5B]/25 bg-[#176B5B]/10 p-4 text-sm">
                <CheckCircle2 size={18} className="mt-px shrink-0 text-[#176B5B]" />
                <div>
                  <p className="font-bold text-[#176B5B]">Payment confirmed</p>
                  <p className="mt-1 text-[#6B5245]">
                    Your repayment of {ngn(Number(pay.pending.amount))} has been recorded.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-[#6B5245]">
                  Transfer exactly <strong className="font-black text-[#176B5B]">{ngn(Number(pay.pending.amount))}</strong> to the
                  account below. Your loan repayment is recorded automatically once the transfer is confirmed.
                </p>

                <div className="rounded-2xl border border-[#E7DCCB] bg-[#FFF9EF] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B5245]">Account number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-black tracking-wider text-[#2C1B13]">{pay.pending.accountNumber}</span>
                      <button
                        onClick={copyAccount}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#E7DCCB] bg-white text-[#6B5245] transition hover:bg-[#176B5B] hover:text-[#FFF9EF]"
                        aria-label="Copy account number"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  {copied && <p className="mt-1 text-right text-xs font-semibold text-[#176B5B]">Copied!</p>}
                  <div className="mt-3 space-y-2 border-t border-[#E7DCCB] pt-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#6B5245]">Account name</span>
                      <span className="font-semibold text-[#2C1B13]">{pay.pending.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B5245]">Bank</span>
                      <span className="font-semibold text-[#2C1B13]">{pay.pending.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B5245]">Amount</span>
                      <span className="font-semibold text-[#176B5B]">{ngn(Number(pay.pending.amount))}</span>
                    </div>
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-[#6B5245]">Reference</span>
                      <span className="flex items-center gap-1 font-mono text-xs text-[#9D4824]"><Hash size={12} /> {pay.pending.reference}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F0DDAD]/40 px-4 py-3 text-xs">
                  <p className="mb-1.5 font-bold uppercase tracking-wider text-[#6B5245]">Payment status</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
                      pay.pending.status === 'pending' ? 'bg-[#E4A42A]/15 text-[#8A5A00]' : 'bg-[#176B5B]/10 text-[#176B5B]'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${pay.pending.status === 'pending' ? 'bg-[#E4A42A]' : 'bg-[#176B5B]'}`} />
                      {pay.pending.status}
                    </span>
                    {pay.pending.expiresAt && (
                      <span className="text-[#6B5245]">expires {new Date(pay.pending.expiresAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <button type="button" onClick={() => checkPayment(true)} disabled={checking} className={`${solidGreen} w-full`}>
                  {checking ? (<><Loader2 size={15} className="animate-spin" /> Checking...</>) : 'I have transferred the money'}
                </button>
              </>
            )}
            <button type="button" onClick={() => setPay(null)} className={`${ghost} w-full`}>Close</button>
          </div>
        )}
      </BrandModal>
    </div>
  )
}
