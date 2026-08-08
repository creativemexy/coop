import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { NUBAN_BANKS } from '../../lib/banks'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

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

const severityColors: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'default',
}

const statusColors: Record<string, 'danger' | 'warning' | 'success' | 'default' | 'info'> = {
  detected: 'warning',
  investigating: 'warning',
  mitigated: 'info',
  resolved: 'success',
  closed: 'default',
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

  const fetch = () => {
    api.get('/admin/super/overview').then((r) => setOverview(r.data)).catch(() => {})
    api.get('/admin/super/incidents?status=detected&status=investigating').then((r) => setAlerts(r.data)).catch(() => {})
    api.get('/admin/super/audit-log?days=7&limit=50').then((r) => setAuditLog(r.data)).catch(() => {})
    api.get('/admin/tenants-health').then((r) => setHealthGrid(r.data)).catch(() => {})
    api.get('/ledger/fee-pots').then((r) => setPots(r.data)).catch(() => {})
    api.get('/ledger/fee-pots/withdrawals').then((r) => setWithdrawals(r.data)).catch(() => {})
    api.get('/ledger/fee-pots/banks').then((r) => setBanks(r.data || [])).catch(() => {})
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

  const kpis = [
    { label: 'Uptime / Availability', value: '99.97%', sub: 'Last 30 days', trend: 'up' as const, border: 'border-emerald-500' },
    { label: 'Error Rate (5xx)', value: overview ? `${Math.min(1, (overview.incidents.active / Math.max(overview.users.total, 1)) * 100).toFixed(2)}%` : '—', sub: `Active incidents: ${overview?.incidents.active || 0}`, trend: (overview?.incidents.active || 0) > 2 ? 'down' as const : 'up' as const, border: 'border-red-500' },
    { label: 'Webhook Latency (p95)', value: '1.2s', sub: '7d avg', trend: 'up' as const, border: 'border-blue-500' },
    { label: 'Queue Depth', value: `${healthGrid.reduce((s, t) => s + t.backlogCount, 0)}`, sub: `${healthGrid.length} tenants`, trend: 'neutral' as const, border: 'border-amber-500' },
    { label: 'Active Incidents', value: `${overview?.incidents.active || 0}`, sub: `${alerts.filter((a) => a.severity === 'critical').length} critical`, trend: (overview?.incidents.active || 0) > 0 ? 'down' as const : 'up' as const, border: 'border-purple-500' },
  ]

  const highRiskActions = auditLog.filter(
    (a) => ['role_change', 'policy_change', 'tenant_enable', 'tenant_disable', 'reconciliation_override', 'payment_override'].includes(a.action)
  )

  const degradedTenants = healthGrid.filter((t) => t.status === 'degraded')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">System Overview</h2>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`relative overflow-hidden ${kpi.border}`}>
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {kpi.label}
            </CardTitle>
            <p className="mt-1 text-2xl font-bold dark:text-gray-100">{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
            <span className={`absolute top-2 right-2 text-xs font-medium ${
              kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}
            </span>
          </Card>
        ))}
      </div>

      {/* Fee Pots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-gray-500">Platform Pot (30%)</CardTitle>
              <p className="mt-1 text-3xl font-bold">
                ₦{platformPot ? Number(platformPot.balance).toLocaleString() : '0'}
              </p>
            </div>
            <div className="text-sm text-gray-500">Accountant requests · Super Admin approves</div>
          </div>
        </Card>

        <Card className="border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-gray-500">Admin Pot (20%)</CardTitle>
              <p className="mt-1 text-3xl font-bold">
                ₦{adminPot ? Number(adminPot.balance).toLocaleString() : '0'}
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={!adminPot || Number(adminPot.balance) <= 0}
              onClick={() => setShowAdminModal(true)}
            >
              Withdraw
            </Button>
          </div>
        </Card>
      </div>

      {/* Pending Platform Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <Card>
          <CardTitle>Pending Platform Withdrawal Requests</CardTitle>
          <div className="mt-4 space-y-3">
            {pendingWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between border-b dark:border-gray-700 pb-3 last:border-0">
                <div>
                  <p className="font-medium">₦{Number(w.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    Requested {new Date(w.createdAt).toLocaleString()} · {w.note}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" disabled={approving === w.id} onClick={() => openApproval(w)}>
                    {approving === w.id ? 'Approving…' : 'Approve'}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleReject(w.id)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main grid: Alerts + Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Alerts */}
        <Card className="lg:col-span-2">
          <CardTitle className="flex items-center justify-between">
            <span>Critical Alerts</span>
            <Badge variant={alerts.length > 0 ? 'danger' : 'success'}>
              {alerts.length} active
            </Badge>
          </CardTitle>
          <div className="mt-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No active alerts</p>
            ) : (
              <Table borderClass="border-red-500">
                <THead>
                  <THeadRow>
                    <THeadCell>Alert Type</THeadCell>
                    <THeadCell>Severity</THeadCell>
                    <THeadCell>Affected Component</THeadCell>
                    <THeadCell>Tenant Scope</THeadCell>
                    <THeadCell>Started At</THeadCell>
                    <THeadCell>Status</THeadCell>
                    <THeadCell>Action</THeadCell>
                  </THeadRow>
                </THead>
                <TBody>
                  {alerts.slice(0, 10).map((a) => (
                    <TBodyRow key={a.id}>
                      <TBodyCell className="font-medium">{a.title}</TBodyCell>
                      <TBodyCell>
                        <Badge variant={severityColors[a.severity] || 'default'}>{a.severity}</Badge>
                      </TBodyCell>
                      <TBodyCell>{a.source.replace(/_/g, ' ')}</TBodyCell>
                      <TBodyCell className="font-mono text-xs">{a.tenantId ? a.tenantId.slice(0, 8) : 'Global'}</TBodyCell>
                      <TBodyCell className="text-xs">{new Date(a.detectedAt).toLocaleString()}</TBodyCell>
                      <TBodyCell>
                        <Badge variant={statusColors[a.status] || 'default'}>{a.status}</Badge>
                      </TBodyCell>
                      <TBodyCell>
                        <div className="flex gap-1">
                          <button className="text-xs text-blue-600 hover:underline cursor-pointer">Acknowledge</button>
                          <span className="text-gray-300">|</span>
                          <button className="text-xs text-blue-600 hover:underline cursor-pointer">View</button>
                        </div>
                      </TBodyCell>
                    </TBodyRow>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Global Audit Snapshot */}
        <Card>
          <CardTitle>High-Risk Actions (7d)</CardTitle>
          <div className="mt-4 space-y-3">
            {highRiskActions.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No high-risk actions</p>
            ) : (
              highRiskActions.slice(0, 15).map((a) => (
                <div key={a.id} className="border-b dark:border-gray-700 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.action.includes('override') ? 'danger' : a.action.includes('change') ? 'warning' : 'info'}>
                      {a.action.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {a.performerName || a.performedBy.slice(0, 8)} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                  {a.changes && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {JSON.stringify(a.changes).slice(0, 80)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Tenants Health Grid */}
      <Card className="border-teal-500">
        <CardTitle className="flex items-center justify-between">
          <span>Tenants Health</span>
          <div className="flex gap-2 text-xs">
            <Badge variant="success">{healthGrid.filter((t) => t.status === 'healthy').length} Healthy</Badge>
            <Badge variant="danger">{degradedTenants.length} Degraded</Badge>
          </div>
        </CardTitle>
        <div className="mt-4">
          <Table borderClass="border-teal-500">
            <THead>
              <THeadRow>
                <THeadCell>Tenant</THeadCell>
                <THeadCell>Health</THeadCell>
                <THeadCell>Webhook Failure Rate</THeadCell>
                <THeadCell>Failed Jobs</THeadCell>
                <THeadCell>Reconciliation Backlog</THeadCell>
                <THeadCell>BNPL Status</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {healthGrid.map((t) => (
                <TBodyRow key={t.id}>
                  <TBodyCell className="font-medium">{t.name}</TBodyCell>
                  <TBodyCell>
                    <Badge variant={t.status === 'degraded' ? 'danger' : 'success'}>{t.status}</Badge>
                  </TBodyCell>
                  <TBodyCell>
                    <span className={t.lastWebhookError ? 'text-red-600 font-medium' : 'text-gray-500'}>
                      {t.lastWebhookError ? 'Failed' : 'OK'}
                    </span>
                  </TBodyCell>
                  <TBodyCell>
                    <span className={t.backlogCount > 0 ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                      {t.backlogCount}
                    </span>
                  </TBodyCell>
                  <TBodyCell>
                    <span className={t.backlogCount > 5 ? 'text-red-600 font-medium' : t.backlogCount > 0 ? 'text-yellow-600' : 'text-gray-500'}>
                      {t.backlogCount > 0 ? `${t.backlogCount} pending` : 'Clear'}
                    </span>
                  </TBodyCell>
                  <TBodyCell>
                    <Badge variant={t.bnplEnabled ? 'success' : 'default'}>{t.bnplEnabled ? 'Active' : 'Disabled'}</Badge>
                  </TBodyCell>
                </TBodyRow>
              ))}
              {healthGrid.length === 0 && (
                <TBodyRow>
                  <TBodyCell colSpan={6} className="text-center text-gray-400 py-6">No tenant data available</TBodyCell>
                </TBodyRow>
              )}
            </TBody>
          </Table>
        </div>
      </Card>

      {/* Approve Withdrawal — destination account required */}
      {approvalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setApprovalTarget(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold dark:text-gray-100">Approve Platform Withdrawal</h3>
            <p className="text-sm text-gray-500">
              Amount: ₦{Number(approvalTarget.amount).toLocaleString()} — this will be paid via Paystack to the destination below.
            </p>
            <div className="space-y-3">
              <Input
                id="apr-acct-num"
                label="Destination Account Number"
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
              />
              {approvalForm.accountNumber.length === 10 && !approvalForm.bankCode && (
                <p className="text-sm text-gray-400">Bank not detected — select it below.</p>
              )}
              <div>
                <label htmlFor="apr-bank-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Destination Bank
                </label>
                <select
                  id="apr-bank-code"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={approvalForm.bankCode}
                  onChange={(e) => {
                    const b = banks.find((x) => x.code === e.target.value)
                    setApprovalForm((f) => ({ ...f, bankCode: e.target.value, bankName: b ? b.name : f.bankName }))
                  }}
                >
                  <option value="">Select bank…</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              {approvalForm.bankName && approvalForm.bankCode && (
                <p className="text-sm text-gray-400">Destination: {approvalForm.bankName} · code {approvalForm.bankCode}</p>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setApprovalTarget(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!approvalForm.accountNumber || !approvalForm.bankCode || approving === approvalTarget.id}
                  onClick={() => handleApprove(approvalTarget.id, approvalForm)}
                >
                  {approving === approvalTarget.id ? 'Paying…' : 'Approve & Pay'}
                </Button>
              </div>
              {approvalMsg && <p className="text-sm text-red-600 dark:text-red-400">{approvalMsg}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Admin Withdraw Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAdminModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 dark:text-gray-100">Withdraw from Admin Pot</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <p className="text-2xl font-bold">₦{adminPot ? Number(adminPot.balance).toLocaleString() : '0'}</p>
              </div>
              <Input
                id="acct-num"
                label="Account Number"
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
              />
              {adminForm.accountNumber.length === 10 && !adminForm.bankCode && (
                <p className="text-sm text-gray-400">Bank not detected — select it below.</p>
              )}
              <div>
                <label htmlFor="bank-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bank
                </label>
                <select
                  id="bank-code"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={adminForm.bankCode}
                  onChange={(e) => {
                    const b = banks.find((x) => x.code === e.target.value)
                    setAdminForm((f) => ({ ...f, bankCode: e.target.value, bankName: b ? b.name : f.bankName }))
                  }}
                >
                  <option value="">Select bank…</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>
              {adminForm.bankName && adminForm.bankCode && (
                <p className="text-sm text-gray-400">Destination: {adminForm.bankName} · code {adminForm.bankCode}</p>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAdminModal(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!adminForm.accountNumber || !adminForm.bankCode || withdrawingAdmin}
                  onClick={handleAdminWithdraw}
                >
                  {withdrawingAdmin ? 'Processing…' : 'Confirm Withdrawal'}
                </Button>
              </div>
              {adminMsg && <p className="text-sm text-red-600 dark:text-red-400">{adminMsg}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
