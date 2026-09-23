import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  TrendingUp, Wallet, Coins, Layers, ReceiptText, Undo2, MessageSquare, Lock,
  CheckCircle2, Hourglass, PieChart, ArrowDownUp,
} from 'lucide-react'

interface StatementData {
  portfolio: {
    totalInvested: number
    currentValue: number
    unrealizedReturn: number
    totalEarned: number
    lockedValue: number
    availableValue: number
  }
  holdings: Array<{
    id: string
    productName: string
    units: number
    costBasis: number
    currentValue: number
    isLocked: boolean
    lockedUntil: string | null
    maturityDate: string | null
  }>
  orders: Array<{
    id: string
    productName: string
    amount: number
    units: number
    unitPrice: number
    fee: number
    status: string
    createdAt: string
  }>
  distributions: Array<{
    id: string
    type: string
    amount: number
    unitsAtRecord: number
    isPaid: boolean
    paidAt: string | null
  }>
  redemptions: Array<{
    id: string
    productName: string
    units: number
    amount: number
    status: string
    createdAt: string
  }>
}

const statusMeta = (s: string) => {
  if (s === 'paid' || s === 'allocated') return { cls: 'bg-[#176B5B]/10 text-[#176B5B]', dot: 'bg-[#176B5B]' }
  if (s === 'placed') return { cls: 'bg-[#E4A42A]/15 text-[#8A5A00]', dot: 'bg-[#E4A42A]' }
  if (s === 'payment_confirmed' || s === 'invested') return { cls: 'bg-[#9D4824]/10 text-[#9D4824]', dot: 'bg-[#9D4824]' }
  if (s === 'cancelled' || s === 'failed') return { cls: 'bg-[#B3261E]/10 text-[#B3261E]', dot: 'bg-[#B3261E]' }
  return { cls: 'bg-[#EDE2D3] text-[#6B5245]', dot: 'bg-[#C9B89F]' }
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

const ticketBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-semibold text-[#176B5B] transition hover:bg-[#176B5B]/5 cursor-pointer'

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF9EF] text-[#8A5A00]">{icon}</span>
      <div>
        <p className="font-black tracking-[-0.02em] text-[#2C1B13]">{title}</p>
        {sub && <p className="text-xs text-[#6B5245]">{sub}</p>}
      </div>
    </div>
  )
}

export function InvestmentStatements() {
  const navigate = useNavigate()
  const [data, setData] = useState<StatementData | null>(null)
  const [loading, setLoading] = useState(true)

  const raiseTicket = (subject: string, orderId: string) => {
    navigate(`/individual/support?subject=${encodeURIComponent(subject)}&orderId=${orderId}`)
  }

  useEffect(() => {
    api.get('/investments/statement').then((r) => {
      setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 w-full animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
        <div className="h-40 w-full animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
      </div>
    )
  }

  const pf = data?.portfolio
  const unreal = pf?.unrealizedReturn ?? 0

  const empty = (icon: React.ReactNode, text: string) => (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDE2D3]/60 text-[#6B5245]">{icon}</span>
      <p className="text-sm font-semibold text-[#6B5245]">{text}</p>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Investments</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Investment Statement</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Track your portfolio value, holdings, and distribution history.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <TrendingUp size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Portfolio summary */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#176B5B] to-[#0F4A3F] shadow-xl">
        <div className="flex items-center gap-2 px-6 py-5">
          <PieChart size={16} className="text-[#F0DDAD]" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F0DDAD]">Portfolio Summary</p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-white/10 px-6 py-5 lg:grid-cols-4">
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F0DDAD]/80">
              <Wallet size={12} /> Total Invested
            </p>
            <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#FFF9EF]">{formatCurrency(pf?.totalInvested ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F0DDAD]/80">
              <TrendingUp size={12} /> Current Value
            </p>
            <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#FFF9EF]">{formatCurrency(pf?.currentValue ?? 0)}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F0DDAD]/80">
              <ArrowDownUp size={12} /> Unrealized Return
            </p>
            <p className={`mt-1 text-xl font-black tracking-[-0.02em] ${unreal >= 0 ? 'text-[#A8E6CF]' : 'text-[#F7D674]'}`}>
              {formatCurrency(unreal)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#F0DDAD]/80">
              <Coins size={12} /> Total Distributions
            </p>
            <p className="mt-1 text-xl font-black tracking-[-0.02em] text-[#A8E6CF]">{formatCurrency(pf?.totalEarned ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <SectionHeader icon={<Layers size={16} />} title="Holdings" sub="Units and value of your active positions" />
        {!data?.holdings?.length ? empty(<Layers size={20} />, 'No holdings yet') : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Product</th>
                  <th className={thCls}>Units</th>
                  <th className={thCls}>Cost Basis</th>
                  <th className={thCls}>Current Value</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Maturity</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {data.holdings.map((h) => (
                  <tr key={h.id} className="transition hover:bg-[#FFF9EF]/70">
                    <td className={`${tdCls} font-semibold`}>{h.productName}</td>
                    <td className={tdCls}>{h.units}</td>
                    <td className={tdCls}>{formatCurrency(h.costBasis)}</td>
                    <td className={`${tdCls} font-semibold`}>{formatCurrency(h.currentValue)}</td>
                    <td className={tdCls}>
                      {h.isLocked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4A42A]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8A5A00]">
                          <Lock size={11} /> Locked until {h.lockedUntil ? new Date(h.lockedUntil).toLocaleDateString() : '?'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#176B5B]">
                          <CheckCircle2 size={11} /> Available
                        </span>
                      )}
                    </td>
                    <td className={tdCls}>{h.maturityDate ? new Date(h.maturityDate).toLocaleDateString() : '—'}</td>
                    <td className={tdCls}>
                      <button type="button" onClick={() => raiseTicket('Issue with holding: ' + h.productName, h.id)} className={ticketBtn}>
                        <MessageSquare size={13} /> Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <SectionHeader icon={<ReceiptText size={16} />} title="Orders" sub="Your investment order history" />
        {!data?.orders?.length ? empty(<ReceiptText size={20} />, 'No orders yet') : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Product</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Units</th>
                  <th className={thCls}>Fee</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {data.orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-[#FFF9EF]/70">
                    <td className={`${tdCls} font-semibold`}>{o.productName}</td>
                    <td className={`${tdCls} font-semibold`}>{formatCurrency(o.amount)}</td>
                    <td className={tdCls}>{o.units || '—'}</td>
                    <td className={tdCls}>{formatCurrency(o.fee)}</td>
                    <td className={tdCls}><StatusPill status={o.status} /></td>
                    <td className={tdCls}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className={tdCls}>
                      <button type="button" onClick={() => raiseTicket('Issue with order: ' + o.productName, o.id)} className={ticketBtn}>
                        <MessageSquare size={13} /> Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distributions */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <SectionHeader icon={<Coins size={16} />} title="Distribution History" sub="Pay-outs earned on your positions" />
        {!data?.distributions?.length ? empty(<Coins size={20} />, 'No distributions yet') : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Units</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Paid Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {data.distributions.map((d) => (
                  <tr key={d.id} className="transition hover:bg-[#FFF9EF]/70">
                    <td className={`${tdCls} font-semibold capitalize`}>{d.type.replace('_', ' ')}</td>
                    <td className={`${tdCls} font-semibold`}>{formatCurrency(d.amount)}</td>
                    <td className={tdCls}>{d.unitsAtRecord}</td>
                    <td className={tdCls}>
                      {d.isPaid ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#176B5B]">
                          <CheckCircle2 size={11} /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4A42A]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8A5A00]">
                          <Hourglass size={11} /> Pending
                        </span>
                      )}
                    </td>
                    <td className={tdCls}>{d.paidAt ? new Date(d.paidAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Redemptions */}
      {data?.redemptions?.length ? (
        <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
          <SectionHeader icon={<Undo2 size={16} />} title="Redemptions" sub="When you redeemed units back to cash" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Product</th>
                  <th className={thCls}>Units</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {data.redemptions.map((r) => (
                  <tr key={r.id} className="transition hover:bg-[#FFF9EF]/70">
                    <td className={`${tdCls} font-semibold`}>{r.productName}</td>
                    <td className={tdCls}>{r.units}</td>
                    <td className={`${tdCls} font-semibold`}>{formatCurrency(r.amount)}</td>
                    <td className={tdCls}><StatusPill status={r.status} /></td>
                    <td className={tdCls}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
