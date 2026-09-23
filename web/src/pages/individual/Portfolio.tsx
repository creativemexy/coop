import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../api/client'
import {
  BarChart3, Wallet, TrendingUp, Coins, ArrowDownUp, Lock, Unlock, Layers, MessageSquare,
  CheckCircle2, PiggyBank,
} from 'lucide-react'

interface Holding {
  id: string
  product: { name: string; type: string; riskTier: string; expectedReturnRate: number }
  units: number
  costBasis: number
  currentValue: number
  isLocked: boolean
  lockedUntil: string | null
  maturityDate: string | null
  createdAt: string
}

interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  unrealizedReturn: number
  unrealizedReturnPct: number
  totalEarned: number
  lockedValue: number
  availableValue: number
  holdingCount: number
}

const riskMeta = (r: string) => {
  switch (r) {
    case 'low':
      return { label: 'Low risk', dot: 'bg-[#176B5B]', cls: 'bg-[#176B5B]/10 text-[#176B5B]' }
    case 'medium':
      return { label: 'Medium risk', dot: 'bg-[#E4A42A]', cls: 'bg-[#E4A42A]/15 text-[#8A5A00]' }
    case 'high':
      return { label: 'High risk', dot: 'bg-[#B3261E]', cls: 'bg-[#B3261E]/10 text-[#B3261E]' }
    default:
      return { label: r, dot: 'bg-[#C9B89F]', cls: 'bg-[#EDE2D3] text-[#6B5245]' }
  }
}

const ngn = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

const thCls = 'px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]'
const tdCls = 'px-5 py-3.5 text-sm text-[#2C1B13]'

function StatCard({ icon, title, value, sub, valueCls, iconCls }: {
  icon: ReactNode
  title: string
  value: string
  sub?: string
  valueCls?: string
  iconCls?: string
}) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls ?? 'bg-[#176B5B]/10 text-[#176B5B]'}`}>{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">{title}</p>
      </div>
      <p className={`mt-3 text-xl font-black tracking-[-0.02em] break-words ${valueCls ?? 'text-[#2C1B13]'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs font-medium text-[#6B5245]">{sub}</p>}
    </div>
  )
}

function BalanceCard({ icon, iconCls, title, value, valueCls, gradient }: {
  icon: ReactNode
  iconCls: string
  title: string
  value: string
  valueCls: string
  gradient: string
}) {
  return (
    <div className={`rounded-2xl border border-[#E7DCCB] ${gradient} p-5 shadow-sm`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">{title}</p>
      </div>
      <p className={`mt-3 text-2xl font-black tracking-[-0.02em] ${valueCls}`}>{value}</p>
    </div>
  )
}

const ticketBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-semibold text-[#176B5B] transition hover:bg-[#176B5B]/5 cursor-pointer'

export function Portfolio() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  const raiseTicket = (holding: Holding) => {
    navigate(`/individual/support?subject=${encodeURIComponent('Issue with investment holding: ' + (holding.product?.name || ''))}&orderId=${holding.id}`)
  }

  useEffect(() => {
    Promise.all([
      api.get('/investments/portfolio').then((r) => setSummary(r.data)),
      api.get('/investments/holdings').then((r) => setHoldings(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const unreal = summary?.unrealizedReturn ?? 0
  const unrealUp = unreal >= 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Investments</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">My Portfolio</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Track the value of everything you hold across investment products.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <BarChart3 size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Wallet size={18} />}
          title="Total Invested"
          value={ngn(summary?.totalInvested ?? 0)}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          title="Current Value"
          value={ngn(summary?.currentValue ?? 0)}
          valueCls="text-[#176B5B]"
        />
        <StatCard
          icon={<ArrowDownUp size={18} />}
          iconCls={unrealUp ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'}
          title="Unrealized Return"
          value={summary ? `${unrealUp ? '+' : ''}${summary.unrealizedReturnPct.toFixed(1)}%` : '—'}
          valueCls={unrealUp ? 'text-[#176B5B]' : 'text-[#B3261E]'}
          sub={unreal !== 0 ? `${unrealUp ? '+' : ''}${ngn(unreal)}` : undefined}
        />
        <StatCard
          icon={<Coins size={18} />}
          iconCls="bg-[#9D4824]/10 text-[#9D4824]"
          title="Total Earned"
          value={ngn(summary?.totalEarned ?? 0)}
          valueCls="text-[#176B5B]"
        />
      </div>

      {/* Locked / Available */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BalanceCard
          icon={<Lock size={20} />}
          iconCls="bg-[#E4A42A]/15 text-[#8A5A00]"
          gradient="bg-gradient-to-br from-[#FFF9EF] to-[#F0DDAD]/40"
          title="Locked Value"
          value={ngn(summary?.lockedValue ?? 0)}
          valueCls="text-[#8A5A00]"
        />
        <BalanceCard
          icon={<Unlock size={20} />}
          iconCls="bg-[#176B5B]/10 text-[#176B5B]"
          gradient="bg-gradient-to-br from-[#FFF9EF] to-[#D8EADF]"
          title="Available / Unlocked"
          value={ngn(summary?.availableValue ?? 0)}
          valueCls="text-[#176B5B]"
        />
      </div>

      {/* Holdings */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EDE2D3] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF9EF] text-[#8A5A00]">
              <Layers size={16} />
            </span>
            <div>
              <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Holdings</p>
              <p className="text-xs text-[#6B5245]">{summary?.holdingCount ?? 0} position{(summary?.holdingCount ?? 0) !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Link
            to="/individual/investments"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B] px-3.5 py-1.5 text-xs font-bold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B]"
          >
            <PiggyBank size={13} /> Browse investments
          </Link>
        </div>

        {holdings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE2D3]/60">
              <BarChart3 size={26} className="text-[#6B5245]" />
            </div>
            <p className="font-bold text-[#2C1B13]">No holdings yet</p>
            <p className="text-sm text-[#6B5245]">Start building your portfolio with a co-op investment product.</p>
            <Link
              to="/individual/investments"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#E4A42A] px-4 py-2.5 text-sm font-semibold text-[#2C1B13] shadow-sm transition hover:bg-[#B9891F]"
            >
              <PiggyBank size={15} /> Browse investments
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Product</th>
                  <th className={thCls}>Units</th>
                  <th className={thCls}>Cost Basis</th>
                  <th className={thCls}>Current Value</th>
                  <th className={thCls}>Return</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Maturity</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {holdings.map((h) => {
                  const returnAmt = Number(h.currentValue) - Number(h.costBasis)
                  const returnPct = Number(h.costBasis) > 0 ? (returnAmt / Number(h.costBasis)) * 100 : 0
                  const risk = riskMeta(h.product?.riskTier)
                  return (
                    <tr key={h.id} className="transition hover:bg-[#FFF9EF]/70">
                      <td className={`${tdCls} font-semibold`}>
                        <p>{h.product?.name || 'Unknown'}</p>
                        <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${risk.cls}`}>
                          <span className={`h-1 w-1 rounded-full ${risk.dot}`} /> {risk.label}
                        </span>
                      </td>
                      <td className={tdCls}>{h.units}</td>
                      <td className={tdCls}>{ngn(Number(h.costBasis))}</td>
                      <td className={`${tdCls} font-semibold`}>{ngn(Number(h.currentValue))}</td>
                      <td className={tdCls}>
                        <span className={`font-bold ${returnAmt >= 0 ? 'text-[#176B5B]' : 'text-[#B3261E]'}`}>
                          {returnAmt >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className={tdCls}>
                        {h.isLocked ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4A42A]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8A5A00]">
                            <Lock size={11} /> Locked {h.lockedUntil ? `until ${new Date(h.lockedUntil).toLocaleDateString()}` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#176B5B]">
                            <CheckCircle2 size={11} /> Available
                          </span>
                        )}
                      </td>
                      <td className={tdCls}>{h.maturityDate ? new Date(h.maturityDate).toLocaleDateString() : '—'}</td>
                      <td className={tdCls}>
                        <button type="button" onClick={() => raiseTicket(h)} className={ticketBtn}>
                          <MessageSquare size={13} /> Raise Ticket
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
