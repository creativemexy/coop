import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

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
    const token = localStorage.getItem('access_token')
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

  if (loading) return <p className="text-gray-400">Loading reports…</p>

  /* ─── Card helper ─── */
  const StatCard = ({ title, value, sub, color }: { title: string; value: string; sub?: string; color?: string }) => (
    <Card>
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      <p className={`mt-2 text-3xl font-bold ${color || ''}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Reports & Exports</h2>
        <div className="flex gap-2">
          <Button variant="primary" onClick={handleExportCsv}>Export CSV</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        {([['kpis', 'Portfolio KPIs'], ['delinquency', 'Delinquency & Trends'], ['audit', 'Audit Trails']] as [Tab, string][]).map(([k, v]) => (
          <Button key={k} variant={tab === k ? 'primary' : 'ghost'} size="sm" onClick={() => setTab(k)}>{v}</Button>
        ))}
      </div>

      {/* ─── Tab: Portfolio KPIs ─── */}
      {tab === 'kpis' && kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Active Subscriptions" value={String(kpis.totalActiveSubscriptions)} />
            <StatCard title="Active Principal" value={fmt(kpis.totalActivePrincipal)} />
            <StatCard title="Outstanding Principal" value={fmt(kpis.totalOutstandingPrincipal)} color="text-red-600" />
            <StatCard title="Defaulted Amount" value={fmt(kpis.defaultedAmount)} color="text-red-700"
              sub={`${kpis.defaultedSubscriptions} subscriptions`} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 dark:text-gray-300">Installments Due</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Today" value={fmt(kpis.installmentsDue.today.amount)} sub={`${kpis.installmentsDue.today.count} installments`}
                color={kpis.installmentsDue.today.count > 0 ? 'text-orange-600' : ''} />
              <StatCard title="Next 7 Days" value={fmt(kpis.installmentsDue.next7Days.amount)} sub={`${kpis.installmentsDue.next7Days.count} installments`} />
              <StatCard title="Next 30 Days" value={fmt(kpis.installmentsDue.next30Days.amount)} sub={`${kpis.installmentsDue.next30Days.count} installments`} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Paid MTD" value={fmt(kpis.paidMtd.amount)} sub={`${kpis.paidMtd.count} installments`} color="text-green-600" />
            <StatCard title="Delinquency Rate" value={pct(kpis.delinquencyRate)}
              color={kpis.delinquencyRate > 0.1 ? 'text-red-600' : kpis.delinquencyRate > 0.05 ? 'text-orange-600' : ''} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 dark:text-gray-300">Delinquency Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['1-30days', '31-60days', '61-90days', '90plus'] as const).map((k) => (
                <DelinquencyCard key={k} label={k === '90plus' ? '90+ Days' : `${k.replace('days', '').replace('-', '–')} Days`}
                  data={kpis.delinquency[k]} variant={k === '61-90days' || k === '90plus' ? 'danger' : 'warning'} />
              ))}
            </div>
            <p className="text-sm mt-3 text-gray-500">
              Total Delinquent: <strong className="text-red-600">{fmt(kpis.totalDelinquentAmount)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* ─── Tab: Delinquency & Trends ─── */}
      {tab === 'delinquency' && (
        <div className="space-y-6">
          {portfolio && (
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Portfolio Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Active Subscriptions" value={String(portfolio.totalActiveSubscriptions)} />
                <StatCard title="Outstanding Principal" value={fmt(portfolio.totalOutstandingPrincipal)} />
                <StatCard title="Installments Due" value={`${fmt(portfolio.totalInstallmentsDue)}`}
                  sub={`${portfolio.totalInstallmentsDueCount} installments`} />
              </div>
            </div>
          )}

          {revenue && (
            <div>
              <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Revenue Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Interest / Fees Collected" value={fmt(revenue.interestFeesCollected)} color="text-green-600"
                  sub={`${revenue.totalPaidInstallments} paid installments`} />
                <StatCard title="Projected Remaining Revenue" value={fmt(revenue.projectedRemainingRevenue)}
                  sub={`${revenue.totalPendingInstallments} pending installments`} />
                <StatCard title="Completed Subscriptions" value={String(revenue.completedSubscriptions)}
                  sub={`${fmt(revenue.totalCompletedRevenue)} total revenue`} />
              </div>
            </div>
          )}

          {/* Cohorts */}
          <div className="border-t dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Delinquency Cohorts by Origination Month</h3>
            {cohorts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700 text-left text-gray-500">
                      <th className="pb-2 pr-4">Cohort</th>
                      <th className="pb-2 pr-4">Subs</th>
                      <th className="pb-2 pr-4">Principal</th>
                      <th className="pb-2 pr-4">Outstanding</th>
                      <th className="pb-2 pr-4">Delinq Count</th>
                      <th className="pb-2 pr-4">Delinq Amt</th>
                      <th className="pb-2 pr-4">Rate</th>
                      <th className="pb-2 pr-4">1–30d</th>
                      <th className="pb-2 pr-4">31–60d</th>
                      <th className="pb-2 pr-4">61–90d</th>
                      <th className="pb-2 pr-4">90+</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((c) => (
                      <tr key={c.period} className="border-b dark:border-gray-800">
                        <td className="py-2 pr-4 font-medium">{c.period}</td>
                        <td className="py-2 pr-4">{c.subscriptionCount}</td>
                        <td className="py-2 pr-4">{fmt(c.totalPrincipal)}</td>
                        <td className="py-2 pr-4">{fmt(c.outstandingPrincipal)}</td>
                        <td className="py-2 pr-4">{c.delinquentCount}</td>
                        <td className="py-2 pr-4">{fmt(c.delinquentAmount)}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={(c.delinquencyRate || 0) > 0.1 ? 'danger' : (c.delinquencyRate || 0) > 0.05 ? 'warning' : 'success'}>
                            {pct(c.delinquencyRate)}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">{c.bucketBreakdown['1-30days'].count}</td>
                        <td className="py-2 pr-4">{c.bucketBreakdown['31-60days'].count}</td>
                        <td className="py-2 pr-4">{c.bucketBreakdown['61-90days'].count}</td>
                        <td className="py-2 pr-4">{c.bucketBreakdown['90plus'].count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-gray-400">No cohort data</p>}
          </div>

          {/* Trends */}
          <div className="border-t dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-200">Delinquency Trends (12 Month Rolling)</h3>
            {trends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700 text-left text-gray-500">
                      <th className="pb-2 pr-4">Month</th>
                      <th className="pb-2 pr-4">Outstanding</th>
                      <th className="pb-2 pr-4">Delinquent Amount</th>
                      <th className="pb-2 pr-4">Rate</th>
                      <th className="pb-2 pr-4">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t, i) => {
                      const prev = i > 0 ? trends[i - 1] : null
                      const up = prev && t.delinquencyRate > prev.delinquencyRate
                      const down = prev && t.delinquencyRate < prev.delinquencyRate
                      return (
                        <tr key={t.month} className="border-b dark:border-gray-800">
                          <td className="py-2 pr-4 font-medium">{t.month}</td>
                          <td className="py-2 pr-4">{fmt(t.totalOutstanding)}</td>
                          <td className="py-2 pr-4">{fmt(t.delinquentAmount)}</td>
                          <td className="py-2 pr-4">
                            <Badge variant={t.delinquencyRate > 0.1 ? 'danger' : t.delinquencyRate > 0.05 ? 'warning' : 'success'}>
                              {pct(t.delinquencyRate)}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4">{up ? '↑' : down ? '↓' : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-gray-400">No trend data</p>}
          </div>
        </div>
      )}

      {/* ─── Tab: Audit Trails ─── */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[['', 'All'], ['product', 'Product Changes'], ['order', 'Order Transitions'], ['repayment', 'Repayment Adjustments']].map(([v, l]) => (
              <Button key={v} variant={auditCategory === v ? 'primary' : 'ghost'} size="sm" onClick={() => setAuditCategory(v)}>{l}</Button>
            ))}
          </div>

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
                  <TBodyCell className="text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TBodyCell>
                  <TBodyCell>
                    <Badge variant="info">{log.entityType}</Badge>
                    <span className="text-xs font-mono ml-1">{log.entityId.slice(0, 8)}…</span>
                  </TBodyCell>
                  <TBodyCell><code className="text-xs px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{log.action}</code></TBodyCell>
                  <TBodyCell className="max-w-[200px] truncate text-xs">
                    {log.changes ? Object.entries(log.changes).map(([k, v]) => `${k}: ${JSON.stringify(v.from)}→${JSON.stringify(v.to)}`).join('; ') : '—'}
                  </TBodyCell>
                  <TBodyCell className="max-w-[150px] truncate text-xs">{log.reason || '—'}</TBodyCell>
                  <TBodyCell className="text-xs">{log.performerName || log.performedBy.slice(0, 8)}</TBodyCell>
                  <TBodyCell>
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadEvidence(log.id)}>
                      {log.evidence ? 'View Evidence' : '—'}
                    </Button>
                  </TBodyCell>
                </TBodyRow>
              ))}
              {auditLogs.length === 0 && (
                <TBodyRow><TBodyCell colSpan={7} className="text-center py-8 text-gray-400">No audit logs found</TBodyCell></TBodyRow>
              )}
            </TBody>
          </Table>
        </div>
      )}

      {/* Evidence Modal */}
      {evidenceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEvidenceModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Evidence — {evidenceModal.id.slice(0, 8)}</h3>
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-80 overflow-y-auto">
              {evidenceModal.text}
            </pre>
            <Button variant="ghost" className="w-full mt-4" onClick={() => setEvidenceModal(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function DelinquencyCard({ label, data, variant }: { label: string; data: { count: number; amount: number }; variant: 'warning' | 'danger' }) {
  return (
    <Card>
      <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
      <p className="mt-2"><Badge variant={variant}>{data.count} installments</Badge></p>
      <p className="text-lg font-bold mt-1">₦{data.amount.toLocaleString()}</p>
    </Card>
  )
}
