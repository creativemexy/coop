import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useAuth } from '../../stores/auth.store'
import {
  Wallet, Layers, CalendarClock, PiggyBank, Landmark, PieChart,
  TrendingUp, TrendingDown, BadgeCheck, AlertTriangle, Clock, XCircle,
  ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, PlusCircle,
  MinusCircle, FileText, Sparkles,
} from 'lucide-react'

interface Transaction {
  date: string
  type: string
  amount: number
  description: string
  status: string
  reference: string
}

interface Portfolio {
  totalInvested: number
  currentValue: number
  totalEarned: number
  holdingCount: number
  unrealizedReturn: number
  unrealizedReturnPct: number
}

interface DashboardStats {
  activeSubscriptions: number
  nextPaymentDate?: string
  nextPaymentAmount: number
  kycStatus: string
  kycImage?: string
  savingsBalance: number
  goalBalance: number
  savingsTarget: number
  activeLoans: number
  totalOutstanding: number
  portfolio: Portfolio
  bnplEligible: boolean
  bnplAvailable: number
  bnplUsed: number
  bnplCreditLimit: number
}

const TXN_PAGE_SIZE = 10

const typeMeta: Record<string, { label: string; icon: string; tone: string }> = {
  savings_deposit: { label: 'Savings Deposit', icon: '▲', tone: 'bg-[#176B5B]/10 text-[#176B5B]' },
  savings_withdrawal: { label: 'Savings Withdrawal', icon: '▼', tone: 'bg-[#B3261E]/10 text-[#B3261E]' },
  savings_interest: { label: 'Savings Interest', icon: '✦', tone: 'bg-[#176B5B]/10 text-[#176B5B]' },
  payment: { label: 'Subscription Payment', icon: '▣', tone: 'bg-[#9D4824]/10 text-[#9D4824]' },
  installment: { label: 'Installment Due', icon: '⏱', tone: 'bg-[#E4A42A]/15 text-[#8A5A00]' },
  loan_due: { label: 'Loan Due', icon: '⏱', tone: 'bg-[#E4A42A]/15 text-[#8A5A00]' },
  loan_repayment: { label: 'Loan Repayment', icon: '▣', tone: 'bg-[#9D4824]/10 text-[#9D4824]' },
}

const statusMeta = (s: string) =>
  s === 'success' || s === 'paid' || s === 'completed'
    ? { label: s, cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
    : s === 'pending' || s === 'overdue'
      ? { label: s, cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
      : { label: s, cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }

const ngn = (n: number) => `₦${n.toLocaleString()}`

function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function StatCard({
  icon,
  iconCls,
  label,
  value,
  sub,
  href,
  cta,
  bar,
}: {
  icon: ReactNode
  iconCls: string
  label: string
  value: ReactNode
  sub?: ReactNode
  href?: string
  cta?: string
  bar?: { pct: number; start: string; end: string }
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconCls}`}>{icon}</div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">{label}</p>
      </div>
      <p className="mt-3 break-words text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{value}</p>
      {sub && <div className="mt-1 text-sm text-[#6B5245]">{sub}</div>}
      {bar && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0DDAD]/60">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${bar.pct}%`, background: `linear-gradient(90deg, ${bar.start}, ${bar.end})` }}
            />
          </div>
        </div>
      )}
      {href && (
        <Link to={href} className="mt-auto pt-3">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#176B5B] transition hover:gap-1.5">
            {cta ?? 'View details'} <ArrowRight size={12} />
          </span>
        </Link>
      )}
    </div>
  )
}

function PaginationBar({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
}) {
  if (total === 0) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const lo = Math.max(1, page - 2)
  const pages: number[] = []
  for (let p = lo; p <= lo + 4 && p <= totalPages; p++) pages.push(p)

  const btn =
    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE2D3] px-5 py-3.5">
      <p className="text-xs font-medium text-[#6B5245]">
        Showing <span className="font-bold text-[#2C1B13]">{start}–{end}</span> of{' '}
        <span className="font-bold text-[#2C1B13]">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`} aria-label="Previous page"><ChevronLeft size={16} /></button>
        {pages.map((p) => (
          <button key={p} type="button" onClick={() => onPage(p)} className={`${btn} ${p === page ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm' : 'text-[#6B5245] hover:bg-[#F0DDAD]/50'}`}>{p}</button>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={`${btn} text-[#6B5245] hover:bg-[#F0DDAD]/50`} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}

export function IndividualDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [txnPage, setTxnPage] = useState(1)
  const { user } = useAuth()

  useEffect(() => {
    api.get('/dashboard/individual').then((r) => setStats(r.data))
    api.get('/dashboard/individual/transactions').then((r) => setTxns(r.data))
  }, [])

  const txnTotalPages = Math.max(1, Math.ceil(txns.length / TXN_PAGE_SIZE))
  const pagedTxns = useMemo(() => {
    const start = (txnPage - 1) * TXN_PAGE_SIZE
    return txns.slice(start, start + TXN_PAGE_SIZE)
  }, [txns, txnPage])

  const goTxnPage = (p: number) => {
    setTxnPage(Math.min(Math.max(1, p), txnTotalPages))
  }

  const savingsProgress = stats && stats.savingsTarget > 0
    ? Math.min(100, (stats.goalBalance / stats.savingsTarget) * 100)
    : 0

  const bnplPercent = stats && stats.bnplCreditLimit > 0 ? (stats.bnplUsed / stats.bnplCreditLimit) * 100 : 0

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const kycBanner = () => {
    const kyc = stats?.kycStatus ?? user?.kycStatus
    if (kyc === 'none')
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E4A42A]/30 bg-gradient-to-br from-[#F7D674]/25 to-[#E4A42A]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4A42A]/20">
              <AlertTriangle size={18} className="text-[#8A5A00]" />
            </span>
            <div>
              <p className="font-bold text-[#2C1B13]">KYC verification required</p>
              <p className="text-sm leading-relaxed text-[#6B5245]">Complete your identity verification to access BNPL subscriptions.</p>
            </div>
          </div>
          <Link to="/individual/kyc" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#176B5B] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B]">
            Start KYC <ArrowRight size={14} />
          </Link>
        </div>
      )
    if (kyc === 'pending')
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#E4A42A]/30 bg-gradient-to-br from-[#F7D674]/20 to-[#FFF9EF] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4A42A]/15">
              <Clock size={18} className="text-[#8A5A00]" />
            </span>
            <div>
              <p className="font-bold text-[#2C1B13]">KYC verification in progress</p>
              <p className="text-sm leading-relaxed text-[#6B5245]">We are reviewing your documents. Check back soon.</p>
            </div>
          </div>
          <Link to="/individual/kyc" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-5 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF]">
            View status
          </Link>
        </div>
      )
    if (kyc === 'rejected')
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#B3261E]/30 bg-gradient-to-br from-[#B3261E]/10 to-[#FFF9EF] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B3261E]/10">
              <XCircle size={18} className="text-[#B3261E]" />
            </span>
            <div>
              <p className="font-bold text-[#2C1B13]">KYC verification rejected</p>
              <p className="text-sm leading-relaxed text-[#6B5245]">Your verification was rejected. Please resubmit with valid documents.</p>
            </div>
          </div>
          <Link to="/individual/kyc" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#9D4824] px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#B85A38]">
            Resubmit <ArrowRight size={14} />
          </Link>
        </div>
      )
    if (kyc === 'approved')
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#176B5B]/25 bg-gradient-to-br from-[#176B5B]/10 to-[#FFF9EF] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {stats?.kycImage && (
              <img src={stats.kycImage} alt="KYC identity photo" className="h-10 w-10 shrink-0 rounded-full border-2 border-[#176B5B]/40 object-cover" />
            )}
            <div>
              <p className="flex items-center gap-1.5 font-bold text-[#176B5B]"><BadgeCheck size={15} /> KYC verified</p>
              <p className="text-sm leading-relaxed text-[#6B5245]">Your identity has been verified.</p>
            </div>
          </div>
          <Link to="/individual/kyc" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-5 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF]">
            View details
          </Link>
        </div>
      )
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">{greeting}</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">
            Hi, {firstName}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Here's what's happening with your co-op accounts today.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <Sparkles size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {kycBanner()}

      {/* Core stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Layers size={16} className="text-[#176B5B]" />}
          iconCls="bg-[#176B5B]/10"
          label="Active Subscriptions"
          value={stats?.activeSubscriptions ?? '—'}
          href="/individual/subscriptions"
          cta="View all"
        />
        <StatCard
          icon={<CalendarClock size={16} className="text-[#9D4824]" />}
          iconCls="bg-[#9D4824]/10"
          label="Next Payment"
          value={stats?.nextPaymentAmount ? ngn(stats.nextPaymentAmount) : '—'}
          sub={stats?.nextPaymentDate ? `Due ${new Date(stats.nextPaymentDate).toLocaleDateString()}` : 'No upcoming payment'}
          href="/individual/repayments"
          cta="Pay now"
        />
        <StatCard
          icon={<PiggyBank size={16} className="text-[#8A5A00]" />}
          iconCls="bg-[#E4A42A]/15"
          label="Savings"
          value={ngn(stats?.savingsBalance ?? 0)}
          sub={
            stats?.goalBalance !== undefined && stats?.goalBalance > 0
              ? `Goal ${ngn(stats.goalBalance)}${stats.savingsTarget ? ` · target ${ngn(stats.savingsTarget)}` : ''}`
              : 'General savings balance'
          }
          bar={stats?.savingsTarget ? { pct: savingsProgress, start: '#E4A42A', end: '#176B5B' } : undefined}
          href="/individual/savings"
          cta="Manage savings"
        />
        <StatCard
          icon={<Landmark size={16} className="text-[#B3261E]" />}
          iconCls="bg-[#B3261E]/10"
          label="Active Loans"
          value={stats?.activeLoans ?? '—'}
          sub={stats?.totalOutstanding ? <span className="font-semibold text-[#B3261E]">{ngn(stats.totalOutstanding)} outstanding</span> : 'No outstanding balance'}
          href="/individual/loans"
          cta="Apply / view"
        />
      </div>

      {/* Portfolio */}
      {stats?.portfolio && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10">
              <PieChart size={16} className="text-[#176B5B]" />
            </div>
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Investment portfolio</h2>
            <Link to="/individual/portfolio" className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[#176B5B] transition hover:gap-1.5">
              Manage portfolio <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Wallet size={16} className="text-[#176B5B]" />}
              iconCls="bg-[#176B5B]/10"
              label="Portfolio Value"
              value={<span className="text-[#176B5B]">{ngn(stats.portfolio.currentValue)}</span>}
              sub={`${stats.portfolio.holdingCount} holding${stats.portfolio.holdingCount !== 1 ? 's' : ''}`}
            />
            <StatCard
              icon={<PieChart size={16} className="text-[#6B5245]" />}
              iconCls="bg-[#6B5245]/10"
              label="Total Invested"
              value={ngn(stats.portfolio.totalInvested)}
              sub="Cost basis"
            />
            <StatCard
              icon={<TrendingUp size={16} className="text-[#176B5B]" />}
              iconCls="bg-[#176B5B]/10"
              label="Dividends Earned"
              value={<span className="text-[#176B5B]">{ngn(stats.portfolio.totalEarned)}</span>}
              sub="All-time distributions"
            />
            <StatCard
              icon={stats.portfolio.unrealizedReturn >= 0 ? <TrendingUp size={16} className="text-[#176B5B]" /> : <TrendingDown size={16} className="text-[#B3261E]" />}
              iconCls={stats.portfolio.unrealizedReturn >= 0 ? 'bg-[#176B5B]/10' : 'bg-[#B3261E]/10'}
              label="Unrealized P&L"
              value={
                <span className={stats.portfolio.unrealizedReturn >= 0 ? 'text-[#176B5B]' : 'text-[#B3261E]'}>
                  {stats.portfolio.unrealizedReturn >= 0 ? '+' : ''}{ngn(stats.portfolio.unrealizedReturn)}
                </span>
              }
              sub={`${stats.portfolio.unrealizedReturnPct.toFixed(1)}% since purchase`}
            />
          </div>
        </div>
      )}

      {/* BNPL credit */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-[#E7DCCB] bg-gradient-to-br from-[#176B5B] to-[#0F5A4B] p-6 text-[#FFF9EF] shadow-lg lg:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF9EF]/15">
              <ShoppingBag size={16} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#F7D674]">BNPL Available Credit</p>
          </div>
          {stats && !stats.bnplEligible ? (
            <div className="mt-4">
              <p className="text-xl font-black tracking-[-0.02em]">Not yet eligible</p>
              <p className="mt-1 text-sm leading-relaxed text-[#FFF9EF]/80">Save consistently for 6+ months to unlock BNPL credit.</p>
            </div>
          ) : (
            <>
              <p className="mt-4 break-words text-3xl font-black tracking-[-0.03em]">{stats ? ngn(stats.bnplAvailable) : '—'}</p>
              {stats && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[#FFF9EF]/80">
                    <span>{ngn(stats.bnplUsed)} used</span>
                    <span>Limit: {ngn(stats.bnplCreditLimit)}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#FFF9EF]/20">
                    <div className="h-2 rounded-full" style={{ width: `${bnplPercent}%`, background: 'linear-gradient(90deg, #F7D674, #E4A42A)' }} />
                  </div>
                </div>
              )}
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/individual/catalog" className="inline-flex items-center gap-2 rounded-full bg-[#F7D674] px-5 py-2.5 text-sm font-bold text-[#2C1B13] shadow-sm transition hover:bg-[#E4A42A]">
              <ShoppingBag size={14} /> Shop now
            </Link>
            <Link to="/individual/subscriptions" className="inline-flex items-center gap-2 rounded-full border border-[#FFF9EF]/40 px-5 py-2.5 text-sm font-semibold text-[#FFF9EF] transition hover:bg-[#FFF9EF]/10">
              My subscriptions
            </Link>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B5245]">Quick actions</p>
            <p className="mt-1 text-sm text-[#6B5245]">Move money or start an application.</p>
          </div>
          <div className="space-y-2.5">
            <Link to="/individual/savings" className="flex items-center gap-3 rounded-xl border border-[#E7DCCB] px-4 py-3 text-sm font-semibold text-[#2C1B13] transition hover:border-[#176B5B]/40 hover:bg-[#FFF9EF]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B5B]/10"><PlusCircle size={15} className="text-[#176B5B]" /></span>
              Deposit
            </Link>
            <Link to="/individual/savings" className="flex items-center gap-3 rounded-xl border border-[#E7DCCB] px-4 py-3 text-sm font-semibold text-[#2C1B13] transition hover:border-[#176B5B]/40 hover:bg-[#FFF9EF]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9D4824]/10"><MinusCircle size={15} className="text-[#9D4824]" /></span>
              Withdraw
            </Link>
            <Link to="/individual/loans" className="flex items-center gap-3 rounded-xl border border-[#E7DCCB] px-4 py-3 text-sm font-semibold text-[#2C1B13] transition hover:border-[#176B5B]/40 hover:bg-[#FFF9EF]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E4A42A]/15"><FileText size={15} className="text-[#8A5A00]" /></span>
              Apply for loan
            </Link>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE2D3] px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Recent Activity</h2>
            <p className="text-xs text-[#6B5245]">Your latest account movements.</p>
          </div>
          <Link to="/individual/transactions" className="inline-flex items-center gap-1 text-xs font-bold text-[#176B5B] transition hover:gap-1.5">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-[#EDE2D3]">
          {txns.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-[#C9B89F]">No transactions yet</p>
          )}
          {pagedTxns.map((tx) => {
            const info = typeMeta[tx.type] ?? { label: tx.type, icon: '•', tone: 'bg-[#EDE2D3] text-[#6B5245]' }
            return (
              <div key={tx.reference} className="flex items-start justify-between gap-3 px-5 py-4 transition hover:bg-[#FFF9EF]/50 sm:items-center">
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${info.tone}`}>{info.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#2C1B13]">{info.label}</p>
                    <p className="max-w-[60vw] truncate text-xs text-[#6B5245] sm:max-w-xs">{tx.description}</p>
                    <p className="text-[11px] text-[#B79B6B]">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-sm font-black ${tx.amount >= 0 ? 'text-[#176B5B]' : 'text-[#B3261E]'}`}>
                    {tx.amount >= 0 ? '+' : ''}{ngn(Math.abs(tx.amount))}
                  </p>
                  <StatusPill status={tx.status} />
                </div>
              </div>
            )
          })}
        </div>
        <PaginationBar page={txnPage} pageSize={TXN_PAGE_SIZE} total={txns.length} onPage={goTxnPage} />
      </div>
    </div>
  )
}