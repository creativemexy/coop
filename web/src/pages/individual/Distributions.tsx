import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Send, Coins, Hourglass, CheckCircle2, CalendarClock } from 'lucide-react'

interface DistPayment {
  id: string
  distribution: { type: string; description: string | null; recordDate: string; payDate: string }
  amount: number
  unitsAtRecord: number
  isPaid: boolean
  paidAt: string | null
  createdAt: string
}

const thCls = 'px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]'
const tdCls = 'px-5 py-3.5 text-sm text-[#2C1B13]'

function StatCard({ icon, iconCls, title, value, valueCls }: {
  icon: React.ReactNode
  iconCls: string
  title: string
  value: string
  valueCls?: string
}) {
  return (
    <div className="rounded-2xl border border-[#E7DCCB] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>{icon}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6B5245]">{title}</p>
      </div>
      <p className={`mt-3 text-3xl font-black tracking-[-0.03em] break-words ${valueCls ?? 'text-[#2C1B13]'}`}>{value}</p>
    </div>
  )
}

function PendingPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4A42A]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#8A5A00]">
      <Hourglass size={11} /> Pending
    </span>
  )
}

function PaidPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#176B5B]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#176B5B]">
      <CheckCircle2 size={11} /> Paid
    </span>
  )
}

export function Distributions() {
  const [history, setHistory] = useState<DistPayment[]>([])
  const [pending, setPending] = useState<DistPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/investments/distributions/mine').then((r) => setHistory(r.data)),
      api.get('/investments/distributions/pending').then((r) => setPending(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
          <div className="h-28 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-[#F0DDAD]/30" />
      </div>
    )
  }

  const totalEarned = history.filter((d) => d.isPaid).reduce((s, d) => s + Number(d.amount), 0)
  const pendingTotal = pending.reduce((s, d) => s + Number(d.amount), 0)

  const typeLabel = (t: string | undefined) => t?.replace('_', ' ') || 'Distribution'

  const pendingSection = (dist: DistPayment, extraCol: [string, string]) => (
    <tr key={dist.id} className="transition hover:bg-[#FFF9EF]/70">
      <td className={`${tdCls} font-semibold capitalize`}>{typeLabel(dist.distribution?.type)}</td>
      <td className={`${tdCls} font-semibold`}>{formatCurrency(Number(dist.amount))}</td>
      <td className={tdCls}>{dist.unitsAtRecord}</td>
      <td className={tdCls}>{extraCol[0]}</td>
      <td className={tdCls}>{extraCol[1]}</td>
      <td className={tdCls}><PendingPill /></td>
    </tr>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Investments</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Earnings & Distributions</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Payouts earned across your co-op investment positions.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <Send size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard
          icon={<Coins size={20} />}
          iconCls="bg-[#176B5B]/10 text-[#176B5B]"
          title="Total Distributed"
          value={formatCurrency(totalEarned)}
          valueCls="text-[#176B5B]"
        />
        <StatCard
          icon={<Hourglass size={20} />}
          iconCls="bg-[#E4A42A]/15 text-[#8A5A00]"
          title="Pending Distributions"
          value={formatCurrency(pendingTotal)}
          valueCls={pendingTotal > 0 ? 'text-[#8A5A00]' : undefined}
        />
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E4A42A]/40 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#EDE2D3] bg-gradient-to-br from-[#F7D674]/20 to-white px-6 py-4">
            <Hourglass size={16} className="text-[#8A5A00]" />
            <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Pending Distributions</p>
            <span className="rounded-full bg-[#E4A42A]/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#8A5A00]">
              {pending.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Units</th>
                  <th className={thCls}>Record Date</th>
                  <th className={thCls}>Pay Date</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {pending.map((d) =>
                  pendingSection(d, [
                    d.distribution?.recordDate ? new Date(d.distribution.recordDate).toLocaleDateString() : '—',
                    d.distribution?.payDate ? new Date(d.distribution.payDate).toLocaleDateString() : '—',
                  ]),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#EDE2D3] px-6 py-4">
          <CalendarClock size={16} className="text-[#9D4824]" />
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">Distribution History</p>
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE2D3]/60">
              <Coins size={26} className="text-[#6B5245]" />
            </div>
            <p className="font-bold text-[#2C1B13]">No distributions yet</p>
            <p className="max-w-sm text-sm text-[#6B5245]">Payouts you receive from your investments will show up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[#EDE2D3] bg-[#FFF9EF]">
                  <th className={thCls}>Type</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Units</th>
                  <th className={thCls}>Paid Date</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE2D3]">
                {history.map((d) => (
                  <tr key={d.id} className="transition hover:bg-[#FFF9EF]/70">
                    <td className={`${tdCls} font-semibold capitalize`}>{typeLabel(d.distribution?.type)}</td>
                    <td className={`${tdCls} font-semibold`}>{formatCurrency(Number(d.amount))}</td>
                    <td className={tdCls}>{d.unitsAtRecord}</td>
                    <td className={tdCls}>{d.paidAt ? new Date(d.paidAt).toLocaleDateString() : '—'}</td>
                    <td className={tdCls}>{d.isPaid ? <PaidPill /> : <PendingPill />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
