import { useEffect, useState, useCallback } from 'react'
import { api, getAccessToken } from '../../api/client'
import {
  Badge,
  Btn,
  EmptyRow,
  Modal,
  PageHeader,
  Panel,
  StatCard,
  TabBar,
  Table,
  TBody,
  TBodyCell,
  TBodyRow,
  THead,
  THeadCell,
  THeadRow,
} from '../../components/ui/warm'

type Tab = 'kpis' | 'delinquency' | 'audit'

/* ─── Types ─── */
interface KpisData {
  totalActiveSubscriptions: number
  totalActivePrincipal: number
  totalOutstandingPrincipal: number
  defaultedAmount: number
  defaultedSubscriptions: number
  installmentsDue: {
    today: { count: number; amount: number }
    next7Days: { count: number; amount: number }
    next30Days: { count: number; amount: number }
  }
  paidMtd: { count: number; amount: number }
  delinquency: {
    '1-30days': { count: number; amount: number }
    '31-60days': { count: number; amount: number }
    '61-90days': { count: number; amount: number }
    '90plus': { count: number; amount: number }
  }
  delinquencyRate: number
  totalDelinquentAmount: number
}

interface PortfolioSummary {
  totalActiveSubscriptions: number
  totalOutstandingPrincipal: number
  totalInstallmentsDue: number
  totalInstallmentsDueCount: number
  delinquency: {
    '1-30days': { count: number; amount: number }
    '31-60days': { count: number; amount: number }
    '61-90days': { count: number; amount: number }
    '90plus': { count: number; amount: number }
  }
  delinquencyRate: number
  totalDelinquentAmount: number
}

interface RevenueSummary {
  interestFeesCollected: number
  totalPaidInstallments: number
  projectedRemainingRevenue: number
  totalPendingInstallments: number
  totalCompletedRevenue: number
  completedSubscriptions: number
}

interface CohortRow {
  period: string
  subscriptionCount: number
  totalPrincipal: number
  outstandingPrincipal: number
  delinquentCount: number
  delinquentAmount: number
  delinquencyRate: number
  bucketBreakdown: {
    '1-30days': { count: number; amount: number }
    '31-60days': { count: number; amount: number }
    '61-90days': { count: number; amount: number }
    '90plus': { count: number; amount: number }
  }
}

interface TrendRow {
  month: string
  delinquencyRate: number
  delinquentAmount: number
  totalOutstanding: number
}

interface AuditEntry {
  id: string
  entityType: string
  entityId: string
  action: string
  changes: Record<string, { from: any; to: any }> | null
  reason: string | null
  performedBy: string
  performerName: string | null
  evidence: string | null
  createdAt: string
}

/* ─── Helpers ─── */
const fmt = (n: number) => `₦${n.toLocaleString()}`
const pct = (n: number) => `${(n * 100).toFixed(1)}%`

const rateTone = (r: number): 'success' | 'warning' | 'danger' =>
  r > 0.1 ? 'danger' : r > 0.05 ? 'warning' : 'success'

/* ─── Component ─── */
export function Reports() {
  const [tab, setTab] = useState<Tab>('kpis')

  // KPIs
  const [kpis, setKpis] = useState<KpisData | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null)

  // Delinquency
  const [cohorts, setCohorts] = useState<CohortRow[]>([])
  const [trends, setTrends] = useState<TrendRow[]>([])

  // Audit
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [auditCategory, setAuditCategory] = useState<string>('')
  const [evidenceModal, setEvidenceModal] = useState<{ id: string; text: string } | null>(null)

  const [loading, setLoading] = useState(true)

  /* ─── Data loading ─── */
  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/v1/bnpl/compliance/portfolio-kpis').then((r) => setKpis(r.data)),
      api.get('/api/v1/bnpl/compliance/portfolio-summary').then((r) => setPortfolio(r.data)),
      api.get('/api/v1/bnpl/compliance/revenue-summary').then((r) => setRevenue(r.data)),
      api.get('/api/v1/bnpl/compliance/delinquency-cohorts').then((r) => setCohorts(r.data)),
      api.get('/api/v1/bnpl/compliance/delinquency-trends').then((r) => setTrends(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const loadAuditLogs = useCallback(async (category: string) => {
    const params: Record<string, string> = {}
    if (category) params.category = category
    const { data } = await api.get('/api/v1/bnpl/compliance/audit-logs', { params })
    setAuditLogs(data)
  }, [])

  useEffect(() => {
    if (tab === 'audit') loadAuditLogs(auditCategory)
  }, [tab, auditCategory, loadAuditLogs])

  /* ─── Export handlers ─── */
  const handleExportCsv = async () => {
    const token = getAccessToken()
    const res = await fetch('/api/v1/bnpl/compliance/export', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bnpl-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadEvidence = async (id: string) => {
    try {
      const { data } = await api.get(`/api/v1/bnpl/compliance/audit-logs/${id}/evidence`)
      if (data.evidence) {
        setEvidenceModal({ id, text: data.evidence })
      } else {
        alert('No evidence attached to this entry')
      }
    } catch { alert('Failed to load evidence') }
  }

  if (loading) return <p className="text-sm text-[#C9B89F]">Loading reports…</p>

  /* ─── Card helper ─── */
  const Metric = ({ icon, iconCls, title, value, sub, color }: { icon?: string; iconCls?: string; title: string; value: string; sub?: string; color?: string }) => (
    <StatCard
      label={title}
      value={value}
      sub={sub}
      valueCls={color}
      icon={icon}
      iconCls={iconCls}
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance & Portfolio"
        title="Reports & Exports"
        subtitle="BNPL portfolio health, delinquency cohorts and audit trails."
        actions={<Btn onClick={handleExportCsv}>Export CSV</Btn>}
      />

      <TabBar
        tabs={[
          { key: 'kpis', label: 'Portfolio KPIs' },
          { key: 'delinquency', label: 'Delinquency & Trends' },
          { key: 'audit', label: 'Audit Trails' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ─── Tab: Portfolio KPIs ─── */}
      {tab === 'kpis' && kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon="🧾" iconCls="bg-[#176B5B]/10 text-[#176B5B]" title="Active Subscriptions" value={String(kpis.totalActiveSubscriptions)} />
            <Metric icon="💼" iconCls="bg-[#176B5B]/10 text-[#176B5B]" title="Active Principal" value={fmt(kpis.totalActivePrincipal)} />
            <Metric icon="📊" iconCls="bg-[#E4A42A]/15 text-[#8A5A00]" title="Outstanding Principal" value={fmt(kpis.totalOutstandingPrincipal)} color="text-[#B3261E]" />
            <Metric icon="⚠️" iconCls="bg-[#B3261E]/10 text-[#B3261E]" title="Defaulted Amount" value={fmt(kpis.defaultedAmount)} sub={`${kpis.defaultedSubscriptions} subscriptions`} color="text-[#B3261E]" />
          </div>

          <Panel title="Installments Due" subtitle="Expected incoming payments over the next horizons">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Metric
                icon="🗓️"
                iconCls={kpis.installmentsDue.today.count > 0 ? 'bg-[#E4A42A]/15 text-[#8A5A00]' : 'bg-[#176B5B]/10 text-[#176B5B]'}
                title="Today"
                value={fmt(kpis.installmentsDue.today.amount)}
                sub={`${kpis.installmentsDue.today.count} installments`}
                color={kpis.installmentsDue.today.count > 0 ? 'text-orange-600' : ''}
              />
              <Metric title="Next 7 Days" value={fmt(kpis.installmentsDue.next7Days.amount)} sub={`${kpis.installmentsDue.next7Days.count} installments`} icon="📅" iconCls="bg-[#9D4824]/10 text-[#9D4824]" />
              <Metric title="Next 30 Days" value={fmt(kpis.installmentsDue.next30Days.amount)} sub={`${kpis.installmentsDue.next30Days.count} installments`} icon="🧮" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Metric icon="✅" iconCls="bg-[#176B5B]/10 text-[#176B5B]" title="Paid MTD" value={fmt(kpis.paidMtd.amount)} sub={`${kpis.paidMtd.count} installments`} color="text-[#176B5B]" />
            <Metric
              icon="📉"
              iconCls={kpis.delinquencyRate > 0.1 ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#E4A42A]/15 text-[#8A5A00]'}
              title="Delinquency Rate"
              value={pct(kpis.delinquencyRate)}
              color={kpis.delinquencyRate > 0.1 ? 'text-[#B3261E]' : kpis.delinquencyRate > 0.05 ? 'text-orange-600' : undefined}
            />
          </div>

          <Panel title="Delinquency Breakdown" subtitle="Delinquent installments by age bucket">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {(['1-30days', '31-60days', '61-90days', '90plus'] as const).map((k) => (
                <Metric
                  key={k}
                  title={k === '90plus' ? '90+ Days' : `${k.replace('days', '').replace('-', '–')} Days`}
                  value={fmt(kpis.delinquency[k].amount)}
                  sub={`${kpis.delinquency[k].count} installments`}
                  color={k === '61-90days' || k === '90plus' ? 'text-[#B3261E]' : 'text-[#8A5A00]'}
                />
              ))}
            </div>
            <p className="mt-4 text-sm text-[#6B5245]">
              Total Delinquent: <strong className="text-[#B3261E]">{fmt(kpis.totalDelinquentAmount)}</strong>
            </p>
          </Panel>
        </div>
      )}

      {/* ─── Tab: Delinquency & Trends ─── */}
      {tab === 'delinquency' && (
        <div className="space-y-6">
          {portfolio && (
            <Panel title="Portfolio Summary" subtitle="At-a-glance portfolio exposure">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Metric icon="🧾" iconCls="bg-[#176B5B]/10 text-[#176B5B]" title="Active Subscriptions" value={String(portfolio.totalActiveSubscriptions)} />
                <Metric title="Outstanding Principal" value={fmt(portfolio.totalOutstandingPrincipal)} icon="💼" iconCls="bg-[#E4A42A]/15 text-[#8A5A00]" />
                <Metric title="Installments Due" value={fmt(portfolio.totalInstallmentsDue)} sub={`${portfolio.totalInstallmentsDueCount} installments`} icon="🗓️" iconCls="bg-[#9D4824]/10 text-[#9D4824]" />
              </div>
            </Panel>
          )}

          {revenue && (
            <Panel title="Revenue Summary" subtitle="Collected and projected interest on the portfolio">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Metric icon="💵" iconCls="bg-[#176B5B]/10 text-[#176B5B]" title="Interest / Fees Collected" value={fmt(revenue.interestFeesCollected)} sub={`${revenue.totalPaidInstallments} paid installments`} color="text-[#176B5B]" />
                <Metric icon="🔮" iconCls="bg-[#9D4824]/10 text-[#9D4824]" title="Projected Remaining Revenue" value={fmt(revenue.projectedRemainingRevenue)} sub={`${revenue.totalPendingInstallments} pending installments`} />
                <Metric icon="🏁" iconCls="bg-[#176B5B]/10 text-[#176B5B]" title="Completed Subscriptions" value={String(revenue.completedSubscriptions)} sub={`${fmt(revenue.totalCompletedRevenue)} total revenue`} />
              </div>
            </Panel>
          )}

          <Panel title="Delinquency Cohorts by Origination Month" subtitle="How each origination month is aging" padded={false}>
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Cohort</THeadCell>
                  <THeadCell>Subs</THeadCell>
                  <THeadCell>Principal</THeadCell>
                  <THeadCell>Outstanding</THeadCell>
                  <THeadCell>Delinq Count</THeadCell>
                  <THeadCell>Delinq Amt</THeadCell>
                  <THeadCell>Rate</THeadCell>
                  <THeadCell>1–30d</THeadCell>
                  <THeadCell>31–60d</THeadCell>
                  <THeadCell>61–90d</THeadCell>
                  <THeadCell>90+</THeadCell>
                </THeadRow>
              </THead>
              <TBody>
                {cohorts.map((c) => (
                  <TBodyRow key={c.period}>
                    <TBodyCell className="font-semibold text-[#2C1B13]">{c.period}</TBodyCell>
                    <TBodyCell>{c.subscriptionCount}</TBodyCell>
                    <TBodyCell>{fmt(c.totalPrincipal)}</TBodyCell>
                    <TBodyCell>{fmt(c.outstandingPrincipal)}</TBodyCell>
                    <TBodyCell>{c.delinquentCount}</TBodyCell>
                    <TBodyCell>{fmt(c.delinquentAmount)}</TBodyCell>
                    <TBodyCell>
                      <Badge variant={rateTone(c.delinquencyRate || 0)} dot>{pct(c.delinquencyRate)}</Badge>
                    </TBodyCell>
                    <TBodyCell>{c.bucketBreakdown['1-30days'].count}</TBodyCell>
                    <TBodyCell>{c.bucketBreakdown['31-60days'].count}</TBodyCell>
                    <TBodyCell>{c.bucketBreakdown['61-90days'].count}</TBodyCell>
                    <TBodyCell>{c.bucketBreakdown['90plus'].count}</TBodyCell>
                  </TBodyRow>
                ))}
                {cohorts.length === 0 && <EmptyRow colSpan={11}>No cohort data</EmptyRow>}
              </TBody>
            </Table>
          </Panel>

          <Panel title="Delinquency Trends (12 Month Rolling)" subtitle="Rate and exposure month over month" padded={false}>
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Month</THeadCell>
                  <THeadCell>Outstanding</THeadCell>
                  <THeadCell>Delinquent Amount</THeadCell>
                  <THeadCell>Rate</THeadCell>
                  <THeadCell>Trend</THeadCell>
                </THeadRow>
              </THead>
              <TBody>
                {trends.map((t, i) => {
                  const prev = i > 0 ? trends[i - 1] : null
                  const up = prev && t.delinquencyRate > prev.delinquencyRate
                  const down = prev && t.delinquencyRate < prev.delinquencyRate
                  return (
                    <TBodyRow key={t.month}>
                      <TBodyCell className="font-semibold text-[#2C1B13]">{t.month}</TBodyCell>
                      <TBodyCell>{fmt(t.totalOutstanding)}</TBodyCell>
                      <TBodyCell>{fmt(t.delinquentAmount)}</TBodyCell>
                      <TBodyCell>
                        <Badge variant={rateTone(t.delinquencyRate)} dot>{pct(t.delinquencyRate)}</Badge>
                      </TBodyCell>
                      <TBodyCell>
                        {up ? <span className="font-bold text-[#B3261E]">↑</span> : down ? <span className="font-bold text-[#176B5B]">↓</span> : <span className="text-[#C9B89F]">—</span>}
                      </TBodyCell>
                    </TBodyRow>
                  )
                })}
                {trends.length === 0 && <EmptyRow colSpan={5}>No trend data</EmptyRow>}
              </TBody>
            </Table>
          </Panel>
        </div>
      )}

      {/* ─── Tab: Audit Trails ─── */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[['', 'All'], ['product', 'Product Changes'], ['order', 'Order Transitions'], ['repayment', 'Repayment Adjustments']].map(([v, l]) => (
              <Btn key={v} variant={auditCategory === v ? 'primary' : 'secondary'} size="sm" onClick={() => setAuditCategory(v)}>{l}</Btn>
            ))}
          </div>

          <Panel padded={false}>
            <Table>
              <THead>
                <THeadRow>
                  <THeadCell>Date</THeadCell>
                  <THeadCell>Entity</THeadCell>
                  <THeadCell>Action</THeadCell>
                  <THeadCell>Changes</THeadCell>
                  <THeadCell>Reason</THeadCell>
                  <THeadCell>Performer</THeadCell>
                  <THeadCell />
                </THeadRow>
              </THead>
              <TBody>
                {auditLogs.map((log) => (
                  <TBodyRow key={log.id}>
                    <TBodyCell className="whitespace-nowrap text-xs">{new Date(log.createdAt).toLocaleString()}</TBodyCell>
                    <TBodyCell>
                      <Badge variant="info">{log.entityType}</Badge>
                      <span className="ml-1 font-mono text-xs text-[#6B5245]">{log.entityId.slice(0, 8)}…</span>
                    </TBodyCell>
                    <TBodyCell>
                      <code className="rounded-md bg-[#FFF9EF] px-1.5 py-0.5 text-xs font-semibold text-[#6B5245]">{log.action}</code>
                    </TBodyCell>
                    <TBodyCell className="max-w-[200px] truncate text-xs">
                      {log.changes ? Object.entries(log.changes).map(([k, v]) => `${k}: ${JSON.stringify(v.from)}→${JSON.stringify(v.to)}`).join('; ') : '—'}
                    </TBodyCell>
                    <TBodyCell className="max-w-[150px] truncate text-xs">{log.reason || '—'}</TBodyCell>
                    <TBodyCell className="text-xs">{log.performerName || log.performedBy.slice(0, 8)}</TBodyCell>
                    <TBodyCell>
                      <Btn variant="ghost" size="sm" onClick={() => handleDownloadEvidence(log.id)}>
                        {log.evidence ? 'View Evidence' : '—'}
                      </Btn>
                    </TBodyCell>
                  </TBodyRow>
                ))}
                {auditLogs.length === 0 && <EmptyRow colSpan={7}>No audit logs found</EmptyRow>}
              </TBody>
            </Table>
          </Panel>
        </div>
      )}

      {/* Evidence Modal */}
      <Modal open={!!evidenceModal} onClose={() => setEvidenceModal(null)} title={evidenceModal ? `Evidence — ${evidenceModal.id.slice(0, 8)}` : 'Evidence'}>
        {evidenceModal && (
          <div className="space-y-4">
            <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#FFF9EF] border border-[#EDE2D3] p-4 text-sm text-[#2C1B13]">
              {evidenceModal.text}
            </pre>
            <Btn variant="secondary" className="w-full" onClick={() => setEvidenceModal(null)}>Close</Btn>
          </div>
        )}
      </Modal>
    </div>
  )
}