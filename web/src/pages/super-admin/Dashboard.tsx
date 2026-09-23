import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client'
import { NUBAN_BANKS } from '../../lib/banks'
import {
  Gauge, RefreshCw, TrendingUp, TrendingDown, Minus, PiggyBank, User,
  ShieldCheck, ArrowDownUp, Clock, CheckCircle2, X, ShieldAlert, ScrollText,
  HeartPulse, Inbox, AlertTriangle,
} from 'lucide-react'

interface SystemOverview {
  tenants: { total: number }
  users: { total: number; active: number }
  onboarding: { thisMonth: number }
  incidents: { active: number }
  policies: { active: number }
}

interface Alert {
  id: string
  title: string
  severity: string
  source: string
  tenantId: string | null
  status: string
  detectedAt: string
}

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  performedBy: string
  performerName: string
  createdAt: string
  changes: Record<string, any> | null
}

interface TenantHealth {
  id: string
  name: string
  status: string
  bnplEnabled: boolean
  lastWebhookError: string | null
  backlogCount: number
}

interface FeePot {
  id: string
  potType: string
  entityId: string
  balance: number
  updatedAt: string
}

interface WithdrawalRequest {
  id: string
  potType: string
  amount: number
  status: string
  requestedBy: string
  approvedBy?: string
  accountNumber?: string
  bankName?: string
  note?: string
  createdAt: string
}

type Tone = 'green' | 'amber' | 'red' | 'neutral' | 'slate' | 'maroon'

const toneCls: Record<Tone, string> = {
  green: 'bg-[#176B5B]/10 text-[#176B5B]',
  amber: 'bg-[#E4A42A]/15 text-[#8A5A00]',
  red: 'bg-[#B3261E]/10 text-[#B3261E]',
  neutral: 'bg-[#EDE2D3] text-[#6B5245]',
  slate: 'bg-[#6B5245]/10 text-[#6B5245]',
  maroon: 'bg-[#9D4824]/10 text-[#9D4824]',
}

const severityTone: Record<string, Tone> = {
  critical: 'red',
  high: 'amber',
  medium: 'slate',
  low: 'green',
}

const incidentTone: Record<string, Tone> = {
  detected: 'amber',
  investigating: 'amber',
  mitigated: 'slate',
  resolved: 'green',
  closed: 'neutral',
}

const actionTone = (a: string): Tone =>
  a.includes('override') ? 'red' : a.includes('change') ? 'amber' : 'slate'

const ngn = (n: number | string | null | undefined) =>
  '₦' + Number(n ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })

const solidGreenBtn =
  'inline-flex items-center gap-2 rounded-full bg-[#176B5B] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#0F5A4B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const solidMaroonBtn =
  'inline-flex items-center gap-2 rounded-full bg-[#9D4824] px-4 py-2.5 text-sm font-semibold text-[#FFF9EF] shadow-sm transition hover:bg-[#B85A38] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const ghostBtn =
  'inline-flex items-center gap-2 rounded-full border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B5245] shadow-sm transition hover:border-[#176B5B]/40 hover:text-[#176B5B] disabled:opacity-60 disabled:pointer-events-none cursor-pointer'
const linkBtn =
  'text-xs font-semibold text-[#176B5B] hover:text-[#0F5A4B] hover:underline cursor-pointer'
const inputCls =
  'w-full rounded-xl border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-medium text-[#23150F] outline-none transition placeholder:text-[#C9B89F] focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'
const selectCls =
  'appearance-none rounded-xl border border-[#E7DCCB] bg-white px-4 py-2.5 text-sm font-medium text-[#23150F] outline-none transition focus:border-[#176B5B] focus:ring-2 focus:ring-[#176B5B]/20'

function Pill({
  tone,
  children,
  dot = false,
}: {
  tone: Tone
  children: React.ReactNode
  dot?: boolean
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${toneCls[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
}

export function SuperAdminDashboard() {
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [healthGrid, setHealthGrid] = useState<TenantHealth[]>([])
  const [pots, setPots] = useState<FeePot[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([])
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminForm, setAdminForm] = useState({ accountNumber: '', bankCode: '', bankName: '' })
  const [withdrawingAdmin, setWithdrawingAdmin] = useState(false)
  const [adminMsg, setAdminMsg] = useState('')
  const [approving, setApproving] = useState<string | null>(null)
  const [approvalTarget, setApprovalTarget] = useState<WithdrawalRequest | null>(null)
  const [approvalForm, setApprovalForm] = useState({ accountNumber: '', bankCode: '', bankName: '' })
  const [approvalMsg, setApprovalMsg] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const requestsRef = useRef<HTMLDivElement>(null)

  const fetch = () => {
    api.get('/admin/super/overview').then((r) => setOverview(r.data)).catch(() => {})
    api.get('/admin/super/incidents?status=detected&status=investigating').then((r) => setAlerts(r.data)).catch(() => {})
    api.get('/admin/super/audit-log?days=7&limit=50').then((r) => setAuditLog(r.data)).catch(() => {})
    api.get('/admin/tenants-health').then((r) => setHealthGrid(r.data)).catch(() => {})
    api.get('/ledger/fee-pots').then((r) => setPots(r.data)).catch(() => {})
    api.get('/ledger/fee-pots/withdrawals').then((r) => setWithdrawals(r.data)).catch(() => {})
    api.get('/ledger/fee-pots/banks').then((r) => setBanks(r.data || [])).catch(() => {})
  }

  const refresh = async () => {
    setRefreshing(true)
    await Promise.allSettled([api.get('/admin/super/overview'), api.get('/ledger/fee-pots')])
    fetch()
    setRefreshing(false)
  }

  useEffect(() => { fetch() }, [])

  const detectBank = (accountNumber: string): { code: string; name: string } | null => {
    if (accountNumber.length !== 10) return null
    const prefix = accountNumber.slice(0, 3)
    const hint = NUBAN_BANKS[prefix]?.name || (['907', '090'].includes(prefix) ? 'Opay' : '')
    if (!hint) return null
    const lower = hint.toLowerCase()
    return (
      banks.find((b) => b.name.toLowerCase() === lower) ||
      banks.find((b) => b.name.toLowerCase().includes(lower)) ||
      null
    )
  }

  const platformPot = pots.find((p) => p.potType === 'platform')
  const adminPot = pots.find((p) => p.potType === 'admin')
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending')
  const latestPlatformRequest = withdrawals
    .filter((w) => w.potType === 'platform')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const handleAdminWithdraw = async () => {
    setWithdrawingAdmin(true)
    setAdminMsg('')
    try {
      await api.post('/ledger/fee-pots/withdraw/admin', adminForm)
      setShowAdminModal(false)
      setAdminForm({ accountNumber: '', bankCode: '', bankName: '' })
      fetch()
    } catch (e: any) {
      setAdminMsg(e?.response?.data?.message || 'Withdrawal failed')
    } finally {
      setWithdrawingAdmin(false)
    }
  }

  const handleApprove = async (id: string, body?: Record<string, string>) => {
    setApproving(id)
    setApprovalMsg('')
    try {
      await api.patch(`/ledger/fee-pots/withdrawals/${id}/approve`, body ?? {})
      setApprovalTarget(null)
      fetch()
    } catch (e: any) {
      setApprovalMsg(e?.response?.data?.message || 'Approval failed')
    } finally {
      setApproving(null)
    }
  }

  const openApproval = (w: WithdrawalRequest) => {
    setApprovalMsg('')
    if (w.accountNumber) {
      handleApprove(w.id)
      return
    }
    setApprovalTarget(w)
    setApprovalForm({ accountNumber: '', bankCode: '', bankName: '' })
  }

  const handleReject = async (id: string) => {
    await api.patch(`/ledger/fee-pots/withdrawals/${id}/reject`)
    fetch()
  }

  const errorRate = overview
    ? Math.min(1, (overview.incidents.active / Math.max(overview.users.total, 1)) * 100).toFixed(2)
    : '—'
  const queueDepth = healthGrid.reduce((s, t) => s + t.backlogCount, 0)
  const activeIncidents = overview?.incidents.active || 0
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const highRiskToday = auditLog.filter(
    (a) => ['role_change', 'policy_change', 'tenant_enable', 'tenant_disable', 'reconciliation_override', 'payment_override'].includes(a.action)
  )
  const degradedTenants = healthGrid.filter((t) => t.status === 'degraded')

  const kpis = [
    {
      label: 'Uptime / availability',
      value: '99.97%',
      sub: 'Last 30 days',
      trend: 'up' as const,
      tone: 'green' as Tone,
    },
    {
      label: 'Tenant volume',
      value: overview ? overview.tenants.total.toLocaleString() : '—',
      sub: `${overview?.users.active ?? 0} / ${overview?.users.total ?? 0} users active · ${overview?.onboarding.thisMonth ?? 0} onboarded this month`,
      trend: 'up' as const,
      tone: 'green' as Tone,
    },
    {
      label: 'Queue depth',
      value: `${queueDepth}`,
      sub: `${healthGrid.length} tenants`,
      trend: 'neutral' as const,
      tone: 'amber' as Tone,
    },
    {
      label: 'Error rate (5xx)',
      value: `${errorRate}%`,
      sub: `Active incidents: ${activeIncidents}`,
      trend: (activeIncidents || 0) > 2 ? ('down' as const) : ('up' as const),
      tone: (activeIncidents || 0) > 2 ? ('red' as Tone) : ('green' as Tone),
    },
    {
      label: 'Webhook latency (p95)',
      value: '1.2s',
      sub: '7d average',
      trend: 'up' as const,
      tone: 'slate' as Tone,
    },
    {
      label: 'Active incidents',
      value: `${activeIncidents}`,
      sub: `${criticalCount} critical`,
      trend: (activeIncidents || 0) > 0 ? ('down' as const) : ('up' as const),
      tone: (activeIncidents || 0) > 0 ? ('maroon' as Tone) : ('green' as Tone),
    },
  ]

  const trendIcon = (t: 'up' | 'down' | 'neutral') =>
    t === 'up' ? <TrendingUp size={15} className="text-[#176B5B]" />
      : t === 'down' ? <TrendingDown size={15} className="text-[#B3261E]" />
      : <Minus size={15} className="text-[#C9B89F]" />

  const scrollToRequests = () => requestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
              <Gauge size={22} className="text-[#176B5B]" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">System Overview</h1>
              <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
                Platform health, financial position, approvals, and governance across {overview?.tenants.total ?? 0} tenants.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className={ghostBtn}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl border border-[#E7DCCB] border-t-[3px] bg-white p-5 shadow-sm ${
              kpi.tone === 'green' ? 'border-t-[#176B5B]'
                : kpi.tone === 'red' ? 'border-t-[#B3261E]'
                : kpi.tone === 'amber' ? 'border-t-[#E4A42A]'
                : kpi.tone === 'maroon' ? 'border-t-[#9D4824]'
                : 'border-t-[#6B5245]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B5245]">{kpi.label}</p>
              {trendIcon(kpi.trend)}
            </div>
            <p className="mt-2 text-2xl font-black tracking-[-0.02em] text-[#2C1B13]">{kpi.value}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B5245]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Fee pots */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E4A42A]/40 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4A42A]/10">
                  <PiggyBank size={20} className="text-[#E4A42A]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2C1B13]">Platform Pot</p>
                  <p className="text-xs text-[#6B5245]">30% of registration fees</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#2C1B13]">
                {platformPot ? ngn(platformPot.balance) : ngn(0)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-xs text-[#6B5245]">Accountant requests payouts · super admin approves.</p>
                {latestPlatformRequest && (
                  <Pill tone={latestPlatformRequest.status === 'pending' ? 'amber' : 'green'} dot>
                    Latest request: {latestPlatformRequest.status.toLowerCase()} · {ngn(latestPlatformRequest.amount)}
                  </Pill>
                )}
              </div>
            </div>
            <button onClick={scrollToRequests} className={ghostBtn}>
              <ShieldCheck size={15} /> Review payouts
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#9D4824]/40 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9D4824]/10">
                  <User size={20} className="text-[#9D4824]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#2C1B13]">Admin Pot</p>
                  <p className="text-xs text-[#6B5245]">20% of registration fees</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#2C1B13]">
                {adminPot ? ngn(adminPot.balance) : ngn(0)}
              </p>
              <p className="mt-2 text-xs text-[#6B5245]">Payouts settle to a bank account you specify.</p>
            </div>
            <button
              disabled={!adminPot || Number(adminPot.balance) <= 0 || withdrawingAdmin}
              onClick={() => { setAdminMsg(''); setShowAdminModal(true) }}
              className={solidMaroonBtn}
            >
              <ArrowDownUp size={15} /> {withdrawingAdmin ? 'Processing…' : 'Withdraw all'}
            </button>
          </div>
        </div>
      </div>

      {/* Pending platform withdrawals */}
      <div ref={requestsRef} className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EDE2D3] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E4A42A]/10">
              <Clock size={18} className="text-[#E4A42A]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Pending platform withdrawals</h2>
              <p className="text-xs text-[#6B5245]">Requests raised by accountants, awaiting your approval.</p>
            </div>
          </div>
          <Pill tone="amber" dot>{pendingWithdrawals.length} pending</Pill>
        </div>
        <div className="px-5">
          {pendingWithdrawals.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-[#6B5245]">
              <Inbox size={22} className="text-[#C9B89F]" />
              <p className="text-sm font-semibold text-[#2C1B13]">All caught up</p>
              <p className="text-xs">No pending withdrawal requests right now.</p>
            </div>
          ) : (
            pendingWithdrawals.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center gap-4 border-b border-[#EDE2D3] py-4 last:border-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4A42A]/10">
                  <ArrowDownUp size={18} className="text-[#8A5A00]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black text-[#2C1B13]">{ngn(w.amount)}</p>
                  <p className="mt-0.5 truncate text-xs text-[#6B5245]">
                    Requested {new Date(w.createdAt).toLocaleString()}
                    {w.note ? ` · ${w.note}` : ''}
                    {w.potType !== 'platform' ? ` · ${w.potType} pot` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={approving === w.id}
                    onClick={() => openApproval(w)}
                    className={solidGreenBtn.replace('px-4 py-2.5', 'px-4 py-2')}
                  >
                    {approving === w.id ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {approving === w.id ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    disabled={approving === w.id}
                    onClick={() => handleReject(w.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#B3261E]/30 bg-white px-4 py-2 text-sm font-semibold text-[#B3261E] transition hover:bg-[#B3261E]/5 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                  >
                    <X size={15} /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Alerts + high-risk */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#EDE2D3] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B3261E]/10">
                <ShieldAlert size={18} className="text-[#B3261E]" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Active incidents & alerts</h2>
                <p className="text-xs text-[#6B5245]">Detected and under investigation.</p>
              </div>
            </div>
            <Pill tone={alerts.length > 0 ? 'red' : 'green'} dot>{alerts.length} active</Pill>
          </div>
          <div className="overflow-x-auto">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-[#6B5245]">
                <CheckCircle2 size={22} className="text-[#176B5B]" />
                <p className="text-sm font-semibold text-[#2C1B13]">No active alerts</p>
                <p className="text-xs">All systems reporting normally.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#FFF9EF]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Alert type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Severity</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Component</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Scope</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Started</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE2D3]">
                  {alerts.slice(0, 10).map((a) => (
                    <tr key={a.id} className="transition hover:bg-[#FFF9EF]">
                      <td className="px-5 py-3 text-sm font-semibold text-[#2C1B13]">{a.title}</td>
                      <td className="px-5 py-3"><Pill tone={severityTone[a.severity] || 'neutral'}>{a.severity}</Pill></td>
                      <td className="whitespace-nowrap px-5 py-3 text-sm text-[#6B5245]">{a.source.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3 font-mono text-xs text-[#6B5245]">{a.tenantId ? a.tenantId.slice(0, 8) : 'Global'}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-[#6B5245]">{new Date(a.detectedAt).toLocaleString()}</td>
                      <td className="px-5 py-3"><Pill tone={incidentTone[a.status] || 'neutral'} dot>{a.status}</Pill></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <button className={linkBtn}>Acknowledge</button>
                          <span className="text-[#F0DDAD]">|</span>
                          <button className={linkBtn}>View</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#EDE2D3] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9D4824]/10">
                <ScrollText size={18} className="text-[#9D4824]" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">High-risk actions</h2>
                <p className="text-xs text-[#6B5245]">
                  Last 7 days · {overview?.policies.active ?? 0} active policies
                </p>
              </div>
            </div>
            <Pill tone="maroon">{highRiskToday.length}</Pill>
          </div>
          <div className="space-y-3 px-5 py-4">
            {highRiskToday.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-[#6B5245]">
                <ShieldCheck size={22} className="text-[#176B5B]" />
                <p className="text-sm font-semibold text-[#2C1B13]">No high-risk actions</p>
                <p className="text-xs">Nothing sensitive has changed in the last 7 days.</p>
              </div>
            ) : (
              highRiskToday.slice(0, 15).map((a) => (
                <div key={a.id} className="rounded-xl bg-[#FFF9EF]/70 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={actionTone(a.action)}>{a.action.replace(/_/g, ' ')}</Pill>
                    <span className="text-xs text-[#C9B89F]">{a.entityType}.{a.entityId.slice(0, 8) || '—'}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#6B5245]">
                    {a.performerName || a.performedBy.slice(0, 8)} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                  {a.changes && (
                    <p className="mt-0.5 truncate text-xs text-[#C9B89F]">{JSON.stringify(a.changes).slice(0, 80)}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tenant health grid */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EDE2D3] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#176B5B]/10">
              <HeartPulse size={18} className="text-[#176B5B]" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em] text-[#2C1B13]">Tenant health</h2>
              <p className="text-xs text-[#6B5245]">Webhook reliability, job backlogs, and reconciliation status.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="green" dot>{healthGrid.filter((t) => t.status === 'healthy').length} healthy</Pill>
            <Pill tone="red" dot>{degradedTenants.length} degraded</Pill>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FFF9EF]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Tenant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Health</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Webhook failure rate</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Failed jobs</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">Reconciliation backlog</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B5245]">BNPL status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE2D3]">
              {healthGrid.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2 text-[#6B5245]">
                      <HeartPulse size={22} className="text-[#C9B89F]" />
                      <p className="text-sm font-semibold text-[#2C1B13]">No tenant data available</p>
                      <p className="text-xs">Tenant health will appear here once tenants are onboarded.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                healthGrid.map((t) => (
                  <tr key={t.id} className="transition hover:bg-[#FFF9EF]">
                    <td className="px-5 py-3 text-sm font-semibold text-[#2C1B13]">{t.name}</td>
                    <td className="px-5 py-3">
                      <Pill tone={t.status === 'degraded' ? 'red' : 'green'} dot>
                        {t.status === 'degraded' ? <span className="inline-flex items-center gap-1"><AlertTriangle size={12} />Degraded</span> : 'Healthy'}
                      </Pill>
                    </td>
                    <td className="px-5 py-3">
                      <span className={t.lastWebhookError ? 'inline-flex items-center gap-1 text-sm font-semibold text-[#B3261E]' : 'text-sm text-[#6B5245]'}>
                        {t.lastWebhookError ? (<><AlertTriangle size={13} /> Failed</>) : 'OK'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={t.backlogCount > 0 ? 'text-sm font-semibold text-[#8A5A00]' : 'text-sm text-[#6B5245]'}>
                        {t.backlogCount}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          t.backlogCount > 5 ? 'text-sm font-semibold text-[#B3261E]'
                            : t.backlogCount > 0 ? 'text-sm font-semibold text-[#8A5A00]'
                            : 'text-sm text-[#6B5245]'
                        }
                      >
                        {t.backlogCount > 0 ? `${t.backlogCount} pending` : 'Clear'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Pill tone={t.bnplEnabled ? 'green' : 'neutral'}>{t.bnplEnabled ? 'Active' : 'Disabled'}</Pill>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve withdrawal — destination account required */}
      {approvalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#23150F]/50 backdrop-blur-[2px]" onClick={() => setApprovalTarget(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#176B5B]/10">
                  <ShieldCheck size={20} className="text-[#176B5B]" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">Approve platform withdrawal</h2>
                  <p className="text-xs text-[#6B5245]">
                    Amount: <span className="font-bold text-[#2C1B13]">{ngn(approvalTarget.amount)}</span> — paid via Paystack to the destination below.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
                  Destination account number
                </label>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10-digit NUBAN account"
                  value={approvalForm.accountNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                    const bank = detectBank(digits)
                    setApprovalForm((f) => ({
                      ...f,
                      accountNumber: digits,
                      ...(bank ? { bankName: bank.name, bankCode: bank.code } : {}),
                    }))
                  }}
                  className={inputCls}
                />
                {approvalForm.accountNumber.length === 10 && approvalForm.bankName && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#176B5B]">
                    <CheckCircle2 size={13} /> {approvalForm.bankName} detected
                  </p>
                )}
                {approvalForm.accountNumber.length === 10 && !approvalForm.bankCode && (
                  <p className="mt-1.5 text-xs text-[#6B5245]">Bank not detected — select it below.</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
                  Destination bank
                </label>
                <select
                  value={approvalForm.bankCode}
                  onChange={(e) => {
                    const b = banks.find((x) => x.code === e.target.value)
                    setApprovalForm((f) => ({ ...f, bankCode: e.target.value, bankName: b ? b.name : f.bankName }))
                  }}
                  className={`${selectCls} w-full`}
                >
                  <option value="">Select bank…</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              {approvalForm.bankName && approvalForm.bankCode && (
                <p className="text-xs text-[#6B5245]">Destination: {approvalForm.bankName} · code {approvalForm.bankCode}</p>
              )}
              {approvalMsg && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-[#B3261E]">
                  <AlertTriangle size={14} /> {approvalMsg}
                </p>
              )}
              <div className="flex items-center gap-2 pt-2">
                <button
                  className="flex-1 rounded-full border border-[#E7DCCB] px-4 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] cursor-pointer"
                  onClick={() => setApprovalTarget(null)}
                >
                  Cancel
                </button>
                <button
                  disabled={!approvalForm.accountNumber || !approvalForm.bankCode || approving === approvalTarget.id}
                  onClick={() => handleApprove(approvalTarget.id, approvalForm)}
                  className={`${solidGreenBtn} flex-1`}
                >
                  {approving === approvalTarget.id ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {approving === approvalTarget.id ? 'Paying…' : 'Approve & pay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin withdraw modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#23150F]/50 backdrop-blur-[2px]" onClick={() => setShowAdminModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#E7DCCB] bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9D4824]/10">
                  <User size={20} className="text-[#9D4824]" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-[-0.02em] text-[#2C1B13]">Withdraw from admin pot</h2>
                  <p className="text-xs text-[#6B5245]">
                    Balance: <span className="font-bold text-[#2C1B13]">{adminPot ? ngn(adminPot.balance) : ngn(0)}</span> — the full admin pot settles to the destination below.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
                  Account number
                </label>
                <input
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="10-digit NUBAN account"
                  value={adminForm.accountNumber}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                    const bank = detectBank(digits)
                    setAdminForm((f) => ({
                      ...f,
                      accountNumber: digits,
                      ...(bank ? { bankName: bank.name, bankCode: bank.code } : {}),
                    }))
                  }}
                  className={inputCls}
                />
                {adminForm.accountNumber.length === 10 && adminForm.bankName && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#176B5B]">
                    <CheckCircle2 size={13} /> {adminForm.bankName} detected
                  </p>
                )}
                {adminForm.accountNumber.length === 10 && !adminForm.bankCode && (
                  <p className="mt-1.5 text-xs text-[#6B5245]">Bank not detected — select it below.</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6B5245]">
                  Bank
                </label>
                <select
                  value={adminForm.bankCode}
                  onChange={(e) => {
                    const b = banks.find((x) => x.code === e.target.value)
                    setAdminForm((f) => ({ ...f, bankCode: e.target.value, bankName: b ? b.name : f.bankName }))
                  }}
                  className={`${selectCls} w-full`}
                >
                  <option value="">Select bank…</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              {adminForm.bankName && adminForm.bankCode && (
                <p className="text-xs text-[#6B5245]">Destination: {adminForm.bankName} · code {adminForm.bankCode}</p>
              )}
              {adminMsg && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-[#B3261E]">
                  <AlertTriangle size={14} /> {adminMsg}
                </p>
              )}
              <div className="flex items-center gap-2 pt-2">
                <button
                  className="flex-1 rounded-full border border-[#E7DCCB] px-4 py-2.5 text-sm font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] cursor-pointer"
                  onClick={() => setShowAdminModal(false)}
                >
                  Cancel
                </button>
                <button
                  disabled={!adminForm.accountNumber || !adminForm.bankCode || withdrawingAdmin}
                  onClick={handleAdminWithdraw}
                  className={`${solidMaroonBtn} flex-1`}
                >
                  {withdrawingAdmin ? <RefreshCw size={15} className="animate-spin" /> : <ArrowDownUp size={15} />}
                  {withdrawingAdmin ? 'Processing…' : 'Confirm withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}