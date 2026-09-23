import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import {
  FileText, Download, CalendarClock, ChevronLeft, ChevronRight, UserRound, ShieldCheck,
  TrendingDown, PiggyBank, HandCoins, Wallet, CheckCircle2, XCircle, Hourglass,
} from 'lucide-react'

interface AccountSummary {
  name: string
  email: string
  kycStatus: string
  memberSince: string
  bnplBalance: number
  savingsBalance: number
  loanBalance: number
}

interface Subscription {
  id: string
  itemName: string
  totalAmount: number
  amountPaid: number
  balance: number
  status: string
  createdAt: string
}

interface Payment {
  id: string
  date: string
  amount: number
  status: string
  provider: string
  reference: string
}

interface UpcomingPayment {
  id: string
  itemName: string
  amount: number
  dueDate: string
  lateFee: number
}

interface Loan {
  id: string
  amount: number
  totalRepayment: number
  amountPaid: number
  balance: number
  status: string
  monthlyPayment: number
}

interface StatementData {
  accountSummary: AccountSummary
  subscriptions: Subscription[]
  paymentHistory: Payment[]
  upcomingPayments: UpcomingPayment[]
  loans: Loan[]
}

const statusMeta = (s: string) => {
  if (s === 'success' || s === 'paid' || s === 'completed' || s === 'active_repayment') {
    return { cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
  }
  if (s === 'pending') {
    return { cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
  }
  if (s === 'failed') {
    return { cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }
  }
  return { cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' }
}

const kycMeta = (s: string) => {
  if (s === 'approved') return { label: 'Approved', Icon: CheckCircle2, cls: 'bg-[#176B5B]/10 text-[#176B5B]' }
  if (s === 'pending') return { label: 'Pending', Icon: Hourglass, cls: 'bg-[#E4A42A]/15 text-[#8A5A00]' }
  if (s === 'rejected') return { label: 'Rejected', Icon: XCircle, cls: 'bg-[#B3261E]/10 text-[#B3261E]' }
  return { label: s || '—', Icon: ShieldCheck, cls: 'bg-[#EDE2D3] text-[#6B5245]' }
}

const PAGE_SIZE = 10

const pagerCls =
  'inline-flex h-8 items-center justify-center gap-1 rounded-full border border-[#E7DCCB] bg-white px-3 text-xs font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] hover:text-[#2C1B13] disabled:opacity-40 disabled:pointer-events-none cursor-pointer'

interface PaginationBarProps {
  page: number
  totalPages: number
  total: number
  onPage: (p: number) => void
}

function PaginationBar({ page, totalPages, total, onPage }: PaginationBarProps) {
  if (totalPages <= 1) return null
  const safe = Math.min(page, totalPages)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE2D3] px-5 py-3.5">
      <span className="text-xs font-medium text-[#6B5245]">
        Showing <span className="font-bold text-[#2C1B13]">{(safe - 1) * PAGE_SIZE + 1}</span>
        –<span className="font-bold text-[#2C1B13]">{Math.min(safe * PAGE_SIZE, total)}</span> of{' '}
        <span className="font-bold text-[#2C1B13]">{total}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(safe - 1)} disabled={safe <= 1} className={pagerCls}>
          <ChevronLeft size={14} /> Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition cursor-pointer ${
              p === safe ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'border border-[#E7DCCB] bg-white text-[#6B5245] hover:bg-[#FFF9EF] hover:text-[#2C1B13]'
            }`}
          >
            {p}
          </button>
        ))}
        <button onClick={() => onPage(safe + 1)} disabled={safe >= totalPages} className={pagerCls}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

const thCls = 'px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]'
const tdCls = 'px-5 py-3.5 text-sm text-[#2C1B13]'

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {status}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#F0DDAD]/80">{label}</p>
      <p className="mt-0.5 font-semibold text-[#FFF9EF]">{value}</p>
    </div>
  )
}

export function Statements() {
  const [data, setData] = useState<StatementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [subsPage, setSubsPage] = useState(1)
  const [loansPage, setLoansPage] = useState(1)

  useEffect(() => {
    api.get('/dashboard/individual/statement').then((r) => {
      setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const slicePage = <T,>(arr: T[] | undefined, page: number): T[] =>
    (arr ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageCount = (n: number | undefined) => Math.max(1, Math.ceil((n ?? 0) / PAGE_SIZE))

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 w-full animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
      </div>
    )
  }

  const acc = data?.accountSummary
  const kyc = kycMeta(acc?.kycStatus ?? '')
  const KycIcon = kyc.Icon

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Financial</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">My Statements</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            A full snapshot of your co-op accounts, balances, and payment history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.open('/api/v1/dashboard/individual/statement/export', '_blank')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-semibold text-[#8A5A00] shadow-sm transition hover:bg-[#FFF9EF] cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <FileText size={22} className="text-[#176B5B]" />
          </div>
        </div>
      </div>

      {/* Account summary */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#176B5B] to-[#0F4A3F] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F0DDAD]">
            <UserRound size={14} /> Account Summary
          </p>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${kyc.cls}`}>
            <KycIcon size={13} /> {kyc.label}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-white/10 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoRow label="Name" value={acc?.name ?? '—'} />
          <InfoRow label="Email" value={acc?.email ?? '—'} />
          <InfoRow label="KYC" value={kyc.label} />
          <InfoRow label="Member Since" value={acc?.memberSince ? new Date(acc.memberSince).toLocaleDateString() : '—'} />
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-white/10 px-6 py-5 md:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F0DDAD]/80">
              <TrendingDown size={12} /> BNPL Balance
            </p>
            <p className={`mt-1 text-xl font-black tracking-[-0.02em] ${(acc?.bnplBalance ?? 0) > 0 ? 'text-[#F7D674]' : 'text-[#A8E6CF]'}`}>
              {formatCurrency(acc?.bnplBalance ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F0DDAD]/80">
              <PiggyBank size={12} /> Savings Balance
            </p>
            <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#A8E6CF]">
              {formatCurrency(acc?.savingsBalance ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F0DDAD]/80">
              <HandCoins size={12} /> Loan Balance
            </p>
            <p className={`mt-1 text-xl font-black tracking-[-0.02em] ${(acc?.loanBalance ?? 0) > 0 ? 'text-[#F7D674]' : 'text-[#A8E6CF]'}`}>
              {formatCurrency(acc?.loanBalance ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming payments */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
          <CalendarClock size={16} className="text-[#9D4824]" />
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Upcoming Payments</p>
        </div>
        {!data?.upcomingPayments?.length ? (
          <p className="px-6 py-8 text-center text-sm text-[#6B5245]">No upcoming payments</p>
        ) : (
          <>
            <div className="divide-y divide-[#EDE2D3]">
              {slicePage(data.upcomingPayments, upcomingPage).map((p) => {
                const isOverdue = new Date(p.dueDate) < new Date()
                return (
                  <div key={p.id} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-[#FFF9EF]/70">
                    <div>
                      <p className="font-bold text-[#2C1B13]">{p.itemName}</p>
                      <p className="mt-0.5 text-xs text-[#6B5245]">due {new Date(p.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="font-black tracking-[-0.02em] text-[#2C1B13]">{formatCurrency(p.amount)}</p>
                      {p.lateFee > 0 && (
                        <p className="text-xs font-semibold text-[#B3261E]">+{formatCurrency(p.lateFee)} late fee</p>
                      )}
                      {isOverdue && (
                        <span className="rounded-full bg-[#B3261E]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#B3261E]">Overdue</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <PaginationBar page={upcomingPage} totalPages={pageCount(data?.upcomingPayments?.length)} total={data?.upcomingPayments?.length ?? 0} onPage={setUpcomingPage} />
          </>
        )}
      </div>

      {/* Payment history */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
          <Wallet size={16} className="text-[#176B5B]" />
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Payment History</p>
        </div>
        {!data?.paymentHistory?.length ? (
          <p className="px-6 py-8 text-center text-sm text-[#6B5245]">No payments yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Amount</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Provider</th>
                    <th className={thCls}>Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE2D3]">
                  {slicePage(data.paymentHistory, historyPage).map((p) => (
                    <tr key={p.id} className="transition hover:bg-[#FFF9EF]/70">
                      <td className={tdCls}>{new Date(p.date).toLocaleDateString()}</td>
                      <td className={`${tdCls} font-semibold`}>{formatCurrency(p.amount)}</td>
                      <td className={tdCls}><StatusPill status={p.status} /></td>
                      <td className={tdCls}>{p.provider}</td>
                      <td className={`${tdCls} max-w-[140px] truncate text-xs text-[#6B5245]`}>{p.reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar page={historyPage} totalPages={pageCount(data?.paymentHistory?.length)} total={data?.paymentHistory?.length ?? 0} onPage={setHistoryPage} />
          </>
        )}
      </div>

      {/* Active subscriptions */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
          <FileText size={16} className="text-[#8A5A00]" />
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Active Subscriptions</p>
        </div>
        {!data?.subscriptions?.length ? (
          <p className="px-6 py-8 text-center text-sm text-[#6B5245]">No subscriptions</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                    <th className={thCls}>Item</th>
                    <th className={thCls}>Total</th>
                    <th className={thCls}>Paid</th>
                    <th className={thCls}>Balance</th>
                    <th className={thCls}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE2D3]">
                  {slicePage(data.subscriptions, subsPage).map((s) => (
                    <tr key={s.id} className="transition hover:bg-[#FFF9EF]/70">
                      <td className={`${tdCls} font-semibold`}>{s.itemName}</td>
                      <td className={tdCls}>{formatCurrency(s.totalAmount)}</td>
                      <td className={tdCls}>{formatCurrency(s.amountPaid)}</td>
                      <td className={`${tdCls} font-semibold ${s.balance > 0 ? 'text-[#B3261E]' : 'text-[#176B5B]'}`}>
                        {formatCurrency(s.balance)}
                      </td>
                      <td className={tdCls}><StatusPill status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar page={subsPage} totalPages={pageCount(data?.subscriptions?.length)} total={data?.subscriptions?.length ?? 0} onPage={setSubsPage} />
          </>
        )}
      </div>

      {/* Loans */}
      {data?.loans?.length ? (
        <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
            <HandCoins size={16} className="text-[#9D4824]" />
            <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Loans</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Total Repayment</th>
                  <th className={thCls}>Paid</th>
                  <th className={thCls}>Balance</th>
                  <th className={thCls}>Monthly</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {slicePage(data.loans, loansPage).map((l) => (
                  <tr key={l.id} className="transition hover:bg-[#FFF9EF]/70">
                    <td className={`${tdCls} font-semibold`}>{formatCurrency(l.amount)}</td>
                    <td className={tdCls}>{formatCurrency(l.totalRepayment)}</td>
                    <td className={tdCls}>{formatCurrency(l.amountPaid)}</td>
                    <td className={`${tdCls} font-semibold ${l.balance > 0 ? 'text-[#B3261E]' : 'text-[#176B5B]'}`}>
                      {formatCurrency(l.balance)}
                    </td>
                    <td className={tdCls}>{formatCurrency(l.monthlyPayment)}</td>
                    <td className={tdCls}><StatusPill status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar page={loansPage} totalPages={pageCount(data.loans?.length)} total={data.loans?.length ?? 0} onPage={setLoansPage} />
        </div>
      ) : null}
    </div>
  )
}
