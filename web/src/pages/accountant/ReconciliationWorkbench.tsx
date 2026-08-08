import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

type Tab = 'reconciliation' | 'adjustments' | 'statements' | 'audit'

interface ReconciliationRun {
  id: string
  rangeStart: string
  rangeEnd: string
  status: string
  totalExpected: number
  totalActual: number
  matchCount: number
  mismatchCount: number
  expectedAmount: number
  actualAmount: number
  discrepancy: number
  organizationId: string | null
  completedAt: string | null
  createdAt: string
}

interface ReconciliationResult {
  id: string
  subscriptionId: string
  installmentId: string | null
  expectedAmount: number
  actualAmount: number
  discrepancy: number
  expectedDate: string
  actualDate: string | null
  status: string
  flags: string[]
  notes: string | null
}

interface AdjustmentRequest {
  id: string
  adjustmentType: string
  description: string
  reasonCode: string
  changes: Record<string, any>
  referenceType: string | null
  referenceId: string | null
  status: string
  rejectionReason: string | null
  requestedBy: string
  reviewedBy: string | null
  createdAt: string
}

interface Tenant {
  id: string
  name: string
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  matched: 'success',
  unmatched: 'danger',
  needs_review: 'warning',
  in_progress: 'info',
  completed: 'success',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}

export function ReconciliationWorkbench() {
  const [tab, setTab] = useState<Tab>('reconciliation')
  const [tenants, setTenants] = useState<Tenant[]>([])

  // Reconciliation state
  const [runs, setRuns] = useState<ReconciliationRun[]>([])
  const [selectedRun, setSelectedRun] = useState<ReconciliationRun | null>(null)
  const [results, setResults] = useState<ReconciliationResult[]>([])
  const [resultFilter, setResultFilter] = useState('')
  const [recForm, setRecForm] = useState({ rangeStart: '', rangeEnd: '', orgId: '' })
  const [recRunning, setRecRunning] = useState(false)

  // Adjustments state
  const [adjustments, setAdjustments] = useState<AdjustmentRequest[]>([])
  const [adjFilter, setAdjFilter] = useState('')
  const [showNewAdj, setShowNewAdj] = useState(false)
  const [adjForm, setAdjForm] = useState({ adjustmentType: 'metadata_correction', description: '', reasonCode: '', changes: '{}', referenceType: '', referenceId: '' })

  // Statements state
  const [memberId, setMemberId] = useState('')
  const [statement, setStatement] = useState<any>(null)
  const [stmtLoading, setStmtLoading] = useState(false)

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditDays, setAuditDays] = useState('30')

  useEffect(() => {
    api.get('/accountant/tenants').then((r) => setTenants(r.data)).catch(() => {})
  }, [])

  // ── Reconciliation ──
  const fetchRuns = useCallback(async () => {
    const { data } = await api.get('/accountant/reconciliation/runs')
    setRuns(data)
  }, [])

  useEffect(() => { if (tab === 'reconciliation') fetchRuns() }, [tab, fetchRuns])

  const runReconciliation = async () => {
    setRecRunning(true)
    try {
      await api.post('/accountant/reconciliation/run', {
        rangeStart: recForm.rangeStart,
        rangeEnd: recForm.rangeEnd,
        organizationId: recForm.orgId || undefined,
      })
      await fetchRuns()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Reconciliation failed')
    } finally {
      setRecRunning(false)
    }
  }

  const selectRun = async (run: ReconciliationRun) => {
    setSelectedRun(run)
    const params = new URLSearchParams()
    params.set('runId', run.id)
    if (resultFilter) params.set('status', resultFilter)
    const { data } = await api.get(`/accountant/reconciliation/results?${params}`)
    setResults(data)
  }

  const updateResult = async (id: string, status: string) => {
    await api.patch(`/accountant/reconciliation/results/${id}`, { status })
    selectRun(selectedRun!)
  }

  // ── Adjustments ──
  const fetchAdjustments = useCallback(async () => {
    const params = new URLSearchParams()
    if (adjFilter) params.set('status', adjFilter)
    const { data } = await api.get(`/accountant/adjustments?${params}`)
    setAdjustments(data)
  }, [adjFilter])

  useEffect(() => { if (tab === 'adjustments') fetchAdjustments() }, [tab, fetchAdjustments])

  const createAdjustment = async () => {
    try {
      await api.post('/accountant/adjustments', {
        ...adjForm,
        changes: JSON.parse(adjForm.changes),
        referenceType: adjForm.referenceType || undefined,
        referenceId: adjForm.referenceId || undefined,
      })
      setShowNewAdj(false)
      setAdjForm({ adjustmentType: 'metadata_correction', description: '', reasonCode: '', changes: '{}', referenceType: '', referenceId: '' })
      fetchAdjustments()
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create adjustment')
    }
  }

  const approveAdj = async (id: string) => {
    await api.post(`/accountant/adjustments/${id}/approve`)
    fetchAdjustments()
  }
  const rejectAdj = async (id: string) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    await api.post(`/accountant/adjustments/${id}/reject`, { reason })
    fetchAdjustments()
  }

  // ── Statements ──
  const fetchStatement = async () => {
    if (!memberId) return
    setStmtLoading(true)
    try {
      const { data } = await api.get(`/accountant/statements/member/${memberId}`)
      setStatement(data)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to fetch statement')
    } finally {
      setStmtLoading(false)
    }
  }

  // ── Audit ──
  const fetchAudit = useCallback(async () => {
    const { data } = await api.get(`/accountant/audit/financial?days=${auditDays}`)
    setAuditLogs(data)
  }, [auditDays])

  useEffect(() => { if (tab === 'audit') fetchAudit() }, [tab, fetchAudit])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Reconciliation Workbench</h2>

      {/* Tabs */}
      <div className="flex gap-1 border-b dark:border-gray-700">
        {([
          { key: 'reconciliation' as Tab, label: 'Reconciliation' },
          { key: 'adjustments' as Tab, label: 'Adjustments' },
          { key: 'statements' as Tab, label: 'Statements' },
          { key: 'audit' as Tab, label: 'Audit Log' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === t.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* RECONCILIATION TAB */}
      {/* ═══════════════════════════════════════════════ */}
      {tab === 'reconciliation' && (
        <div className="space-y-4">
          <Card>
            <CardTitle>Run Reconciliation</CardTitle>
            <div className="mt-4 flex gap-4 items-end flex-wrap">
              <div className="w-44">
                <Input label="Start Date" type="date" value={recForm.rangeStart} onChange={(e) => setRecForm({ ...recForm, rangeStart: e.target.value })} />
              </div>
              <div className="w-44">
                <Input label="End Date" type="date" value={recForm.rangeEnd} onChange={(e) => setRecForm({ ...recForm, rangeEnd: e.target.value })} />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium mb-1">Tenant</label>
                <select value={recForm.orgId} onChange={(e) => setRecForm({ ...recForm, orgId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <option value="">All Tenants</option>
                  {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <Button onClick={runReconciliation} disabled={recRunning || !recForm.rangeStart || !recForm.rangeEnd}>
                {recRunning ? 'Running...' : 'Run Reconciliation'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Runs list */}
            <Card>
              <CardTitle>Reconciliation Runs</CardTitle>
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {runs.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectRun(r)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                      selectedRun?.id === r.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium dark:text-gray-100">
                        {new Date(r.rangeStart).toLocaleDateString()} - {new Date(r.rangeEnd).toLocaleDateString()}
                      </span>
                      <Badge variant={statusColors[r.status] || 'default'}>{r.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Matched: {r.matchCount} | Mismatched: {r.mismatchCount}
                    </div>
                    {r.discrepancy !== 0 && (
                      <div className="text-xs mt-1">
                        <span className={r.discrepancy > 0 ? 'text-red-600' : 'text-green-600'}>
                          Δ ₦{Math.abs(r.discrepancy).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleString()}</div>
                  </button>
                ))}
                {runs.length === 0 && <p className="text-gray-400 text-xs text-center py-4">No runs yet</p>}
              </div>
            </Card>

            {/* Results panel */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedRun ? `Results — ${new Date(selectedRun.rangeStart).toLocaleDateString()} to ${new Date(selectedRun.rangeEnd).toLocaleDateString()}` : 'Select a Run'}
                </CardTitle>
                {selectedRun && (
                  <div className="flex gap-2">
                    <select value={resultFilter} onChange={(e) => { setResultFilter(e.target.value); selectRun(selectedRun) }} className="border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600">
                      <option value="">All</option>
                      <option value="matched">Matched</option>
                      <option value="unmatched">Unmatched</option>
                      <option value="needs_review">Needs Review</option>
                    </select>
                    <Button size="sm" onClick={() => window.open(`/api/v1/accountant/reconciliation/export/${selectedRun.id}`, '_blank')}>Export CSV</Button>
                  </div>
                )}
              </div>
              <div className="mt-4 max-h-96 overflow-y-auto">
                {selectedRun && (
                  <>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="text-center p-2 border border-indigo-500 bg-gray-50 dark:bg-gray-800 rounded"><span className="text-xs text-gray-500">Expected</span><p className="font-bold">{selectedRun.totalExpected}</p></div>
                      <div className="text-center p-2 border border-cyan-500 bg-gray-50 dark:bg-gray-800 rounded"><span className="text-xs text-gray-500">Actual</span><p className="font-bold">{selectedRun.totalActual}</p></div>
                      <div className="text-center p-2 border border-emerald-500 bg-green-50 dark:bg-green-900/20 rounded"><span className="text-xs text-green-600">Matched</span><p className="font-bold text-green-600">{selectedRun.matchCount}</p></div>
                      <div className="text-center p-2 border border-red-500 bg-red-50 dark:bg-red-900/20 rounded"><span className="text-xs text-red-600">Mismatched</span><p className="font-bold text-red-600">{selectedRun.mismatchCount}</p></div>
                    </div>
                    <Table>
                      <THead>
                        <THeadRow>
                          <THeadCell>Installment</THeadCell>
                          <THeadCell>Expected</THeadCell>
                          <THeadCell>Actual</THeadCell>
                          <THeadCell>Discrepancy</THeadCell>
                          <THeadCell>Due Date</THeadCell>
                          <THeadCell>Paid Date</THeadCell>
                          <THeadCell>Status</THeadCell>
                          <THeadCell>Flags</THeadCell>
                          <THeadCell>Action</THeadCell>
                        </THeadRow>
                      </THead>
                      <TBody>
                        {results.map((r) => (
                          <TBodyRow key={r.id}>
                            <TBodyCell className="font-mono text-xs">{r.installmentId?.slice(0, 8) || '—'}</TBodyCell>
                            <TBodyCell>₦{r.expectedAmount.toLocaleString()}</TBodyCell>
                            <TBodyCell>₦{r.actualAmount.toLocaleString()}</TBodyCell>
                            <TBodyCell className={r.discrepancy !== 0 ? 'text-red-600 font-medium' : ''}>
                              {r.discrepancy !== 0 ? `₦${r.discrepancy.toLocaleString()}` : '—'}
                            </TBodyCell>
                            <TBodyCell className="text-xs">{new Date(r.expectedDate).toLocaleDateString()}</TBodyCell>
                            <TBodyCell className="text-xs">{r.actualDate ? new Date(r.actualDate).toLocaleDateString() : '—'}</TBodyCell>
                            <TBodyCell>
                              <Badge variant={statusColors[r.status] || 'default'}>{r.status.replace(/_/g, ' ')}</Badge>
                            </TBodyCell>
                            <TBodyCell className="text-xs">
                              {r.flags?.length ? r.flags.map((f) => <Badge key={f} variant="warning">{f}</Badge>) : '—'}
                            </TBodyCell>
                            <TBodyCell>
                              {r.status !== 'matched' && (
                                <select
                                  value=""
                                  onChange={(e) => { if (e.target.value) updateResult(r.id, e.target.value) }}
                                  className="border rounded px-1 py-0.5 text-xs dark:bg-gray-800 dark:border-gray-600"
                                >
                                  <option value="">Update</option>
                                  <option value="matched">Mark Matched</option>
                                  <option value="needs_review">Needs Review</option>
                                </select>
                              )}
                            </TBodyCell>
                          </TBodyRow>
                        ))}
                        {results.length === 0 && <TBodyRow><TBodyCell colSpan={9} className="text-center text-gray-400 py-4">No results</TBodyCell></TBodyRow>}
                      </TBody>
                    </Table>
                  </>
                )}
                {!selectedRun && <p className="text-gray-400 text-sm text-center py-8">Select a reconciliation run from the left panel</p>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ADJUSTMENTS TAB */}
      {/* ═══════════════════════════════════════════════ */}
      {tab === 'adjustments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <select value={adjFilter} onChange={(e) => setAdjFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <Button onClick={() => setShowNewAdj(!showNewAdj)}>{showNewAdj ? 'Cancel' : 'New Adjustment Request'}</Button>
          </div>

          {showNewAdj && (
            <Card>
              <CardTitle>Create Adjustment Request</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Only metadata corrections are permitted. All changes require approval.</p>
              <div className="mt-4 space-y-3 max-w-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={adjForm.adjustmentType} onChange={(e) => setAdjForm({ ...adjForm, adjustmentType: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600">
                    <option value="metadata_correction">Metadata Correction</option>
                    <option value="journal_entry">Journal Entry</option>
                  </select>
                </div>
                <Input label="Description" value={adjForm.description} onChange={(e) => setAdjForm({ ...adjForm, description: e.target.value })} />
                <Input label="Reason Code" value={adjForm.reasonCode} onChange={(e) => setAdjForm({ ...adjForm, reasonCode: e.target.value })} placeholder="e.g. MISSING_WEBHOOK, DATA_ENTRY_ERROR" />
                <Input label="Changes (JSON)" value={adjForm.changes} onChange={(e) => setAdjForm({ ...adjForm, changes: e.target.value })} />
                <Input label="Reference Type" value={adjForm.referenceType} onChange={(e) => setAdjForm({ ...adjForm, referenceType: e.target.value })} placeholder="e.g. installment, payment" />
                <Input label="Reference ID" value={adjForm.referenceId} onChange={(e) => setAdjForm({ ...adjForm, referenceId: e.target.value })} />
                <Button onClick={createAdjustment}>Submit for Approval</Button>
              </div>
            </Card>
          )}

          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Type</THeadCell>
                <THeadCell>Description</THeadCell>
                <THeadCell>Reason Code</THeadCell>
                <THeadCell>Status</THeadCell>
                <THeadCell>Requested</THeadCell>
                <THeadCell>Actions</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {adjustments.map((a) => (
                <TBodyRow key={a.id}>
                  <TBodyCell><Badge variant="info">{a.adjustmentType.replace(/_/g, ' ')}</Badge></TBodyCell>
                  <TBodyCell className="max-w-xs truncate">{a.description}</TBodyCell>
                  <TBodyCell><code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{a.reasonCode}</code></TBodyCell>
                  <TBodyCell><Badge variant={statusColors[a.status] || 'default'}>{a.status}</Badge></TBodyCell>
                  <TBodyCell className="text-xs">{new Date(a.createdAt).toLocaleDateString()}</TBodyCell>
                  <TBodyCell>
                    {a.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => approveAdj(a.id)} className="text-xs text-green-600 hover:underline cursor-pointer">Approve</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => rejectAdj(a.id)} className="text-xs text-red-600 hover:underline cursor-pointer">Reject</button>
                      </div>
                    )}
                    {a.rejectionReason && <span className="text-xs text-red-500">{a.rejectionReason}</span>}
                  </TBodyCell>
                </TBodyRow>
              ))}
              {adjustments.length === 0 && <TBodyRow><TBodyCell colSpan={6} className="text-center text-gray-400 py-6">No adjustment requests</TBodyCell></TBodyRow>}
            </TBody>
          </Table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* STATEMENTS TAB */}
      {/* ═══════════════════════════════════════════════ */}
      {tab === 'statements' && (
        <div className="space-y-4">
          <Card>
            <CardTitle>Member Statement</CardTitle>
            <div className="mt-4 flex gap-4 items-end">
              <div className="w-80">
                <Input label="User ID" value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="Enter member UUID" />
              </div>
              <Button onClick={fetchStatement} disabled={!memberId || stmtLoading}>{stmtLoading ? 'Loading...' : 'Generate Statement'}</Button>
              {statement && (
                <Button variant="secondary" onClick={() => window.open(`/api/v1/accountant/statements/member/${memberId}/export`, '_blank')}>Export CSV</Button>
              )}
            </div>
          </Card>

          {statement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-indigo-500"><CardTitle className="text-xs">Total Subscriptions</CardTitle><p className="text-xl font-bold">{statement.summary.totalSubscriptions}</p></Card>
                <Card className="border-emerald-500"><CardTitle className="text-xs">Active</CardTitle><p className="text-xl font-bold">{statement.summary.activeSubscriptions}</p></Card>
                <Card className="border-blue-500"><CardTitle className="text-xs">Total Billed</CardTitle><p className="text-xl font-bold">₦{statement.summary.totalBilled.toLocaleString()}</p></Card>
                <Card className="border-green-600"><CardTitle className="text-xs">Total Paid</CardTitle><p className="text-xl font-bold text-green-600">₦{statement.summary.totalPaid.toLocaleString()}</p></Card>
                <Card className="border-amber-500"><CardTitle className="text-xs">Outstanding</CardTitle><p className="text-xl font-bold text-yellow-600">₦{statement.summary.outstanding.toLocaleString()}</p></Card>
                <Card className="border-red-500"><CardTitle className="text-xs">Late Fees</CardTitle><p className="text-xl font-bold text-red-600">₦{statement.summary.totalLateFees.toLocaleString()}</p></Card>
                <Card className="border-cyan-500"><CardTitle className="text-xs">Paid MTD</CardTitle><p className="text-xl font-bold">₦{statement.summary.paidMtd.toLocaleString()}</p></Card>
              </div>

              {statement.repaymentSchedule?.length > 0 && (
                <Card>
                  <CardTitle>Repayment Schedule</CardTitle>
                  <div className="mt-4">
                    <Table>
                      <THead>
                        <THeadRow>
                          <THeadCell>Plan</THeadCell>
                          <THeadCell>Total</THeadCell>
                          <THeadCell>Paid</THeadCell>
                          <THeadCell>Outstanding</THeadCell>
                          <THeadCell>Status</THeadCell>
                        </THeadRow>
                      </THead>
                      <TBody>
                        {statement.repaymentSchedule.map((s: any) => (
                          <TBodyRow key={s.subscriptionId}>
                            <TBodyCell className="font-medium">{s.planName}</TBodyCell>
                            <TBodyCell>₦{s.totalAmount.toLocaleString()}</TBodyCell>
                            <TBodyCell>₦{s.amountPaid.toLocaleString()}</TBodyCell>
                            <TBodyCell className="font-medium">₦{s.outstanding.toLocaleString()}</TBodyCell>
                            <TBodyCell><Badge variant={statusColors[s.status] || 'default'}>{s.status.replace(/_/g, ' ')}</Badge></TBodyCell>
                          </TBodyRow>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                </Card>
              )}

              {statement.upcomingPayments?.length > 0 && (
                <Card>
                  <CardTitle>Upcoming Payments</CardTitle>
                  <div className="mt-4">
                    <Table>
                      <THead>
                        <THeadRow>
                          <THeadCell>Plan</THeadCell>
                          <THeadCell>Amount</THeadCell>
                          <THeadCell>Due Date</THeadCell>
                        </THeadRow>
                      </THead>
                      <TBody>
                        {statement.upcomingPayments.map((p: any) => (
                          <TBodyRow key={p.installmentId}>
                            <TBodyCell>{p.planName}</TBodyCell>
                            <TBodyCell>₦{p.amount.toLocaleString()}</TBodyCell>
                            <TBodyCell>{new Date(p.dueDate).toLocaleDateString()}</TBodyCell>
                          </TBodyRow>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* AUDIT LOG TAB */}
      {/* ═══════════════════════════════════════════════ */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Days</label>
            <select value={auditDays} onChange={(e) => setAuditDays(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
            <Button size="sm" onClick={fetchAudit}>Refresh</Button>
          </div>

          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Action</THeadCell>
                <THeadCell>Entity</THeadCell>
                <THeadCell>Actor</THeadCell>
                <THeadCell>Timestamp</THeadCell>
                <THeadCell>Details</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {auditLogs.map((l: any) => (
                <TBodyRow key={l.id}>
                  <TBodyCell><Badge variant={
                    l.action.includes('override') || l.action === 'adjustment_rejection' ? 'danger' :
                    l.action === 'adjustment_approval' ? 'success' : 'info'
                  }>{l.action.replace(/_/g, ' ')}</Badge></TBodyCell>
                  <TBodyCell className="text-xs">{l.entityType} <span className="font-mono">{l.entityId?.slice(0, 8)}</span></TBodyCell>
                  <TBodyCell className="text-xs">{l.performerName || l.performedBy?.slice(0, 8)}</TBodyCell>
                  <TBodyCell className="text-xs">{new Date(l.createdAt).toLocaleString()}</TBodyCell>
                  <TBodyCell className="max-w-xs">
                    {l.reason && <p className="text-xs text-gray-500">{l.reason}</p>}
                    {l.changes && <details><summary className="text-xs text-blue-600 cursor-pointer">View</summary><pre className="text-xs text-gray-400 mt-1">{JSON.stringify(l.changes, null, 2).slice(0, 200)}</pre></details>}
                  </TBodyCell>
                </TBodyRow>
              ))}
              {auditLogs.length === 0 && <TBodyRow><TBodyCell colSpan={5} className="text-center text-gray-400 py-6">No audit entries found</TBodyCell></TBodyRow>}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  )
}
