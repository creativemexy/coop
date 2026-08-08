import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Modal } from '../../components/ui/modal'

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
  purpose?: string
  status: string
  createdAt: string
  repayments: LoanRepayment[]
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  approved: 'success',
  active: 'info',
  pending: 'warning',
  completed: 'success',
  defaulted: 'danger',
  rejected: 'danger',
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
    const t = setInterval(() => checkPayment(), 5000)
    return () => clearInterval(t)
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

  const checkPayment = async () => {
    if (!pay) return
    setChecking(true)
    try {
      const { data } = await api.post(`/virtual-accounts/loan-repayments/${pay.repaymentId}/verify`)
      setPay(data && { repaymentId: pay.repaymentId, pending: data })
      if (data && data.status === 'credited') {
        setPay(null)
        await fetch()
      }
    } catch {
      // keep modal open; re-poll
    }
    setChecking(false)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">My Loans</h2>
        <Button onClick={() => setShowApply(!showApply)} variant="primary">
          {showApply ? 'Cancel' : 'Apply for Loan'}
        </Button>
      </div>

      {showApply && (
        <Card>
          <CardTitle className="text-sm font-medium text-gray-500 mb-4">Apply for a Loan</CardTitle>

          {eligibility && !eligibility.eligible && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4">
              <p className="font-medium text-amber-800 dark:text-amber-300">Not yet eligible for a loan</p>
              <ul className="mt-2 text-sm space-y-1">
                {eligibility.reasons.map((r) => (
                  <li key={r.key} className="flex items-center gap-2">
                    <span className={r.passed ? 'text-green-600' : 'text-red-600'}>
                      {r.passed ? '✓' : '✗'}
                    </span>
                    <span className={r.passed ? 'text-gray-600' : 'text-red-600'}>{r.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-amber-700">
                Savings balance: ₦{eligibility.savingsBalance.toLocaleString()} ·
                Max loan at {eligibility.multiplier}x: ₦{eligibility.maxAmount.toLocaleString()}
              </p>
            </div>
          )}

          {eligibility?.eligible && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4">
              <p className="font-medium text-green-700 dark:text-green-300">You are eligible!</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Max loan: ₦{eligibility.maxAmount.toLocaleString()} ({eligibility.multiplier}x your ₦{eligibility.savingsBalance.toLocaleString()} savings)
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₦)</label>
              <input
                type="number"
                placeholder="e.g. 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration (months)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>{m} month{m > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Purpose (optional)</label>
              <input
                type="text"
                placeholder="What's the loan for?"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>
          {amount && duration && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
              <p>Loan amount: <strong>₦{Number(amount).toLocaleString()}</strong></p>
              <p>Interest (5%): <strong>₦{Math.round(Number(amount) * 0.05).toLocaleString()}</strong></p>
              <p>Service fee (1%): <strong>₦{Math.round(Number(amount) * 0.01).toLocaleString()}</strong></p>
              <p>Total repayment: <strong>₦{Math.round(Number(amount) * 1.05).toLocaleString()}</strong></p>
              <p>Monthly payment: <strong>₦{Math.round((Number(amount) * 1.05) / Number(duration)).toLocaleString()}</strong></p>
            </div>
          )}
          <Button onClick={handleApply} disabled={loading || !amount || (eligibility ? !eligibility.eligible : false)} className="mt-4">
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </Card>
      )}

      {activeLoans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-blue-500">
            <CardTitle className="text-sm font-medium text-gray-500">Active Loans</CardTitle>
            <p className="mt-2 text-3xl font-bold">{activeLoans.length}</p>
          </Card>
          <Card className="border-amber-500">
            <CardTitle className="text-sm font-medium text-gray-500">Outstanding Balance</CardTitle>
            <p className="mt-2 text-3xl font-bold">₦{outstandingBalance.toLocaleString()}</p>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {loans.length === 0 && (
          <p className="text-gray-400 text-center py-8">No loan applications yet</p>
        )}
        {loans.map((loan) => {
          const balance = loan.totalRepayment - loan.amountPaid
          const overdueCount = loan.repayments.filter(
            (r) => r.status === 'pending' && new Date(r.dueDate) < new Date(),
          ).length

          return (
            <Card key={loan.id}>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Loan #{loan.id.slice(0, 8)}
                  </CardTitle>
                  <p className="text-2xl font-bold mt-1">₦{Number(loan.amount).toLocaleString()}</p>
                  {loan.purpose && (
                    <p className="text-sm text-gray-500 mt-1">{loan.purpose}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant={statusColors[loan.status] ?? 'default'}>{loan.status}</Badge>
                  <p className="text-sm text-gray-500 mt-1">{loan.duration} months @ {loan.interestRate}%</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {Number(loan.serviceFee) > 0 && (
                  <div>
                    <span className="text-gray-500">Service fee</span>
                    <p className={`font-bold ${loan.serviceFeePaid ? 'text-green-600' : 'text-amber-600'}`}>
                      ₦{Number(loan.serviceFee).toLocaleString()} {loan.serviceFeePaid ? '(paid)' : '(pending)'}
                    </p>
                  </div>
                )}
              </div>

              {loan.status === 'active' && (
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Monthly</span>
                    <p className="font-bold">₦{Number(loan.monthlyPayment).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Paid</span>
                    <p className="font-bold">₦{Number(loan.amountPaid).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Balance</span>
                    <p className="font-bold text-red-600">₦{balance.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {loan.repayments.length > 0 && (
                <div className="mt-4">
                  {overdueCount > 0 && (
                    <Badge variant="danger" className="mb-2">{overdueCount} overdue</Badge>
                  )}
                  <div className="space-y-2">
                    {loan.repayments.map((r) => {
                      const isOverdue = r.status === 'pending' && new Date(r.dueDate) < new Date()
                      return (
                        <div key={r.id} className="flex items-center justify-between rounded-lg border dark:border-gray-700 px-4 py-2 text-sm">
                          <span className="font-medium">₦{Number(r.amount).toLocaleString()}</span>
                          <span className="text-gray-500">due {new Date(r.dueDate).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                r.status === 'paid' ? 'success'
                                : isOverdue ? 'danger'
                                : 'warning'
                              }
                            >
                              {isOverdue && r.status === 'pending' ? 'overdue' : r.status}
                            </Badge>
                            {r.status === 'pending' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handlePayNow(r.id)}
                                disabled={payingId === r.id}
                              >
                                {payingId === r.id ? 'Starting...' : 'Pay Now'}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Modal open={!!pay} onClose={() => setPay(null)} title="Pay Loan with Bank Transfer">
        {pay && (
          <div className="space-y-4">
            {pay.pending.status === 'credited' ? (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 p-4 text-sm">
                <p className="font-medium text-green-700 dark:text-green-300">Payment confirmed</p>
                <p className="text-green-600 dark:text-green-400 mt-1">
                  Your repayment of ₦{Number(pay.pending.amount).toLocaleString()} has been recorded.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Transfer exactly <strong>₦{Number(pay.pending.amount).toLocaleString()}</strong> to the
                  account below. Your loan repayment is recorded automatically once the transfer is confirmed.
                </p>

                <div className="rounded-lg border dark:border-gray-700 p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Account number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg">{pay.pending.accountNumber}</span>
                      <button
                        onClick={copyAccount}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account name</span>
                    <span className="font-medium">{pay.pending.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bank</span>
                    <span className="font-medium">{pay.pending.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-medium">₦{Number(pay.pending.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reference</span>
                    <span className="font-mono text-xs">{pay.pending.reference}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 text-xs">
                  <p className="font-medium mb-1">Payment status</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${pay.pending.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {pay.pending.status}
                    </span>
                    {pay.pending.expiresAt && (
                      <span className="text-gray-500">
                        expires {new Date(pay.pending.expiresAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={checkPayment} disabled={checking}>
                  {checking ? 'Checking...' : 'Check status'}
                </Button>
              </>
            )}
            <Button variant="ghost" className="w-full" onClick={() => setPay(null)}>
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
