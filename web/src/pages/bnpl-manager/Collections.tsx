import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardTitle } from '../../components/ui/card'
import { Modal } from '../../components/ui/modal'
import { Input } from '../../components/ui/input'

type Tab = 'schedule' | 'cohorts' | 'priorities' | 'exceptions'

/* ---------- types ---------- */
interface InstallmentRow {
  id: string; dueDate: string; amount: number; lateFee: number
  status: string; paidAt?: string; paymentReference?: string
  gracePeriodEnd?: string; isOverdue: boolean; daysLate: number
}
interface PaymentAttempt {
  id: string; amount: number; provider: string
  providerReference: string; status: string; createdAt: string; metadata?: any
}
interface RepaymentSchedule {
  orderId: string; catalogItem?: string; totalAmount: number; amountPaid: number
  outstanding: number; status: string
  installments: InstallmentRow[]; paymentAttempts: PaymentAttempt[]
}

interface CohortBucket {
  label: string; count: number; totalAmount: number
}
interface CohortDrillDown {
  bucket: string; total: number; page: number; pageSize: number
  items: { id: string; subscriptionId: string; dueDate: string; amount: number; daysLate: number }[]
}
interface CohortsData {
  cohorts: CohortBucket[]; totalDelinquentAmount: number; totalActivePrincipal: number
  delinquencyRate: number; asOf: string
}

interface PriorityItem {
  id: string; entityType: string; entityId: string; priority: string
  reason?: string; assignedBy: string; createdAt: string
}

interface ExceptionReason { id: string; title: string; description?: string }
interface ExceptionCaseItem {
  id: string; subscriptionId: string; reasonId: string; description?: string
  status: string; createdBy: string; assignedTo?: string; resolution?: string
  createdAt: string
}

/* ---------- helpers ---------- */
const statusColor: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
  paid: 'success', late: 'danger', overdue: 'danger', pending: 'warning',
  success: 'success', failed: 'danger', processing: 'info',
  open: 'warning', investigating: 'info', resolved: 'success', escalated: 'danger',
  low: 'success', medium: 'warning', high: 'danger', critical: 'danger',
}

/* ---------- component ---------- */
export function Collections() {
  const [tab, setTab] = useState<Tab>('schedule')

  /* schedule */
  const [orderId, setOrderId] = useState('')
  const [schedule, setSchedule] = useState<RepaymentSchedule | null>(null)
  const [schedLoading, setSchedLoading] = useState(false)

  /* cohorts */
  const [cohorts, setCohorts] = useState<CohortsData | null>(null)
  const [cohortDetail, setCohortDetail] = useState<Record<string, CohortDrillDown>>({})
  const [cohortDetailLoading, setCohortDetailLoading] = useState<string | null>(null)

  /* priorities */
  const [priorities, setPriorities] = useState<PriorityItem[]>([])

  /* exceptions */
  const [exceptionReasons, setExceptionReasons] = useState<ExceptionReason[]>([])
  const [exceptionCases, setExceptionCases] = useState<ExceptionCaseItem[]>([])
  const [excFilter, setExcFilter] = useState<string>('')

  /* modals */
  const [reconcileInst, setReconcileInst] = useState<InstallmentRow | null>(null)
  const [partialInst, setPartialInst] = useState<InstallmentRow | null>(null)
  const [metaInst, setMetaInst] = useState<InstallmentRow | null>(null)
  const [prioModal, setPrioModal] = useState(false)
  const [excModal, setExcModal] = useState(false)

  /* form fields */
  const [recStatus, setRecStatus] = useState('')
  const [recRef, setRecRef] = useState('')
  const [recNote, setRecNote] = useState('')
  const [partialAmt, setPartialAmt] = useState('')
  const [partialRef, setPartialRef] = useState('')
  const [metaFields, setMetaFields] = useState('{}')
  const [prioEntityType, setPrioEntityType] = useState<'subscription' | 'user'>('subscription')
  const [prioEntityId, setPrioEntityId] = useState('')
  const [prioLevel, setPrioLevel] = useState('medium')
  const [prioReason, setPrioReason] = useState('')
  const [excSubId, setExcSubId] = useState('')
  const [excReasonId, setExcReasonId] = useState('')
  const [excDesc, setExcDesc] = useState('')
  const [saving, setSaving] = useState(false)

  /* ---------- data fetching ---------- */
  const loadSchedule = useCallback(async () => {
    if (!orderId) return
    setSchedLoading(true)
    try {
      const { data } = await api.get(`/api/v1/bnpl/repayments/schedule/${orderId}`)
      setSchedule(data)
    } catch { setSchedule(null) }
    setSchedLoading(false)
  }, [orderId])

  const loadCohorts = useCallback(async () => {
    try { const { data } = await api.get('/api/v1/bnpl/collections/cohorts'); setCohorts(data); setCohortDetail({}) } catch {}
  }, [])

  const loadCohortDetail = useCallback(async (bucket: string, page = 1) => {
    setCohortDetailLoading(bucket)
    try {
      const params: Record<string, string> = {}
      if (page > 1) params.page = String(page)
      const { data } = await api.get(
        `/api/v1/bnpl/collections/cohorts/${encodeURIComponent(bucket)}/installments`,
        { params },
      )
      setCohortDetail((prev) => ({ ...prev, [bucket]: data }))
    } catch { /* ignore */ }
    setCohortDetailLoading(null)
  }, [])

  const loadPriorities = useCallback(async () => {
    try { const { data } = await api.get('/api/v1/bnpl/collections/priorities'); setPriorities(data) } catch {}
  }, [])

  const loadExceptions = useCallback(async () => {
    const params: Record<string, string> = {}
    if (excFilter) params.status = excFilter
    try { const { data } = await api.get('/api/v1/bnpl/collections/exception-cases', { params }); setExceptionCases(data) } catch {}
  }, [excFilter])

  const loadExceptionReasons = useCallback(async () => {
    try { const { data } = await api.get('/api/v1/bnpl/collections/exception-reasons'); setExceptionReasons(data) } catch {}
  }, [])

  useEffect(() => { if (tab === 'cohorts') loadCohorts() }, [tab, loadCohorts])
  useEffect(() => { if (tab === 'priorities') loadPriorities() }, [tab, loadPriorities])
  useEffect(() => { if (tab === 'exceptions') { loadExceptions(); loadExceptionReasons() } }, [tab, loadExceptions, loadExceptionReasons])

  /* ---------- actions ---------- */
  const handleReconcile = async () => {
    if (!reconcileInst) return; setSaving(true)
    try {
      await api.post(`/api/v1/bnpl/repayments/${reconcileInst.id}/reconcile`, {
        status: recStatus || undefined, paymentReference: recRef || undefined, note: recNote || undefined,
      })
      setReconcileInst(null); setRecStatus(''); setRecRef(''); setRecNote(''); loadSchedule()
    } catch (e: any) { alert(e.response?.data?.message || 'Reconcile failed') }
    setSaving(false)
  }

  const handlePartialPayment = async () => {
    if (!partialInst || !partialAmt || !partialRef) return; setSaving(true)
    try {
      await api.post(`/api/v1/bnpl/repayments/${partialInst.id}/partial-payment`, {
        amount: Number(partialAmt), paymentReference: partialRef,
      })
      setPartialInst(null); setPartialAmt(''); setPartialRef(''); loadSchedule()
    } catch (e: any) { alert(e.response?.data?.message || 'Partial payment failed') }
    setSaving(false)
  }

  const handleUpdateMetadata = async () => {
    if (!metaInst) return; setSaving(true)
    try {
      await api.patch(`/api/v1/bnpl/repayments/${metaInst.id}/metadata`, JSON.parse(metaFields))
      setMetaInst(null); setMetaFields('{}'); loadSchedule()
    } catch (e: any) { alert(e.response?.data?.message || 'Metadata update failed') }
    setSaving(false)
  }

  const handleAssignPriority = async () => {
    if (!prioEntityId) return; setSaving(true)
    try {
      await api.post('/api/v1/bnpl/collections/priority', {
        entityType: prioEntityType, entityId: prioEntityId, priority: prioLevel, reason: prioReason,
      })
      setPrioModal(false); setPrioEntityId(''); setPrioReason(''); loadPriorities()
    } catch (e: any) { alert(e.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const handleCreateException = async () => {
    if (!excSubId || !excReasonId) return; setSaving(true)
    try {
      await api.post('/api/v1/bnpl/collections/exception-cases', {
        subscriptionId: excSubId, reasonId: excReasonId, description: excDesc || undefined,
      })
      setExcModal(false); setExcSubId(''); setExcReasonId(''); setExcDesc(''); loadExceptions()
    } catch (e: any) { alert(e.response?.data?.message || 'Failed') }
    setSaving(false)
  }

  const handleResolveException = async (id: string) => {
    const resolution = prompt('Resolution note:')
    if (!resolution) return
    try {
      await api.patch(`/api/v1/bnpl/collections/exception-cases/${id}/resolve`, { resolution })
      loadExceptions()
    } catch (e: any) { alert(e.response?.data?.message || 'Failed') }
  }

  /* ---------- render ---------- */
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Repayment Management & Collections</h2>

      {/* tabs */}
      <div className="flex gap-2 border-b dark:border-gray-700 pb-2">
        {(['schedule', 'cohorts', 'priorities', 'exceptions'] as Tab[]).map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'ghost'} size="sm" onClick={() => setTab(t)}>
            {t === 'schedule' ? 'Repayment Schedule'
             : t === 'cohorts' ? 'Delinquency Cohorts'
             : t === 'priorities' ? 'Collection Flags'
             : 'Exception Cases'}
          </Button>
        ))}
      </div>

      {/* ---- Tab: Repayment Schedule ---- */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <Input id="order-search" label="Order / Subscription ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <Button onClick={loadSchedule} disabled={!orderId || schedLoading}>Load Schedule</Button>
          </div>

          {schedule && (
            <Card>
              <CardTitle>Schedule — {schedule.catalogItem || schedule.orderId.slice(0, 8)}</CardTitle>
              <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Total</span><p className="font-semibold">₦{schedule.totalAmount.toLocaleString()}</p></div>
                <div><span className="text-gray-500">Paid</span><p className="font-semibold text-green-600">₦{schedule.amountPaid.toLocaleString()}</p></div>
                <div><span className="text-gray-500">Outstanding</span><p className="font-semibold text-red-600">₦{schedule.outstanding.toLocaleString()}</p></div>
                <div><span className="text-gray-500">Status</span><Badge variant={statusColor[schedule.status] || 'warning'}>{schedule.status}</Badge></div>
              </div>

              <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Installments</h4>
              <Table>
                <THead><THeadRow>
                  <THeadCell>#</THeadCell>
                  <THeadCell>Due Date</THeadCell>
                  <THeadCell>Amount</THeadCell>
                  <THeadCell>Status</THeadCell>
                  <THeadCell>Days Late</THeadCell>
                  <THeadCell>Reference</THeadCell>
                  <THeadCell />
                </THeadRow></THead>
                <TBody>
                  {schedule.installments.map((inst, idx) => (
                    <TBodyRow key={inst.id}>
                      <TBodyCell>{idx + 1}</TBodyCell>
                      <TBodyCell>{new Date(inst.dueDate).toLocaleDateString()}</TBodyCell>
                      <TBodyCell className="font-medium">₦{inst.amount.toLocaleString()}{inst.lateFee > 0 && <span className="text-red-500 text-xs ml-1">+₦{inst.lateFee}</span>}</TBodyCell>
                      <TBodyCell>
                        <Badge variant={inst.isOverdue ? 'danger' : statusColor[inst.status] || 'warning'}>
                          {inst.isOverdue ? 'late' : inst.status}
                        </Badge>
                      </TBodyCell>
                      <TBodyCell>{inst.isOverdue ? `${inst.daysLate}d` : '—'}</TBodyCell>
                      <TBodyCell className="text-xs font-mono">{inst.paymentReference || '—'}</TBodyCell>
                      <TBodyCell>
                        <div className="flex gap-1">
                          {inst.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => { setPartialInst(inst); setPartialAmt(String(inst.amount)); setPartialRef('') }}>Partial</Button>
                              <Button variant="ghost" size="sm" onClick={() => { setReconcileInst(inst); setRecStatus('paid'); setRecRef(''); setRecNote('') }}>Reconcile</Button>
                              <Button variant="ghost" size="sm" onClick={() => { setMetaInst(inst); setMetaFields(JSON.stringify({ lateFeeAmount: inst.lateFee, gracePeriodEnd: inst.gracePeriodEnd || '' }, null, 2)) }}>Meta</Button>
                            </>
                          )}
                          {inst.isOverdue && (
                            <Button variant="primary" size="sm" onClick={async () => {
                              try { await api.post(`/api/v1/bnpl/repayments/${inst.id}/retry`); loadSchedule() } catch (e: any) { alert(e.response?.data?.message || 'Retry failed') }
                            }}>Retry</Button>
                          )}
                        </div>
                      </TBodyCell>
                    </TBodyRow>
                  ))}
                  {schedule.installments.length === 0 && <TBodyRow><TBodyCell colSpan={7} className="text-center py-4 text-gray-400">No installments</TBodyCell></TBodyRow>}
                </TBody>
              </Table>

              {schedule.paymentAttempts.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold mt-4 mb-2 dark:text-gray-200">Payment Attempts</h4>
                  <Table>
                    <THead><THeadRow>
                      <THeadCell>Date</THeadCell>
                      <THeadCell>Amount</THeadCell>
                      <THeadCell>Provider</THeadCell>
                      <THeadCell>Reference</THeadCell>
                      <THeadCell>Status</THeadCell>
                    </THeadRow></THead>
                    <TBody>
                      {schedule.paymentAttempts.map((p) => (
                        <TBodyRow key={p.id}>
                          <TBodyCell>{new Date(p.createdAt).toLocaleString()}</TBodyCell>
                          <TBodyCell>₦{p.amount.toLocaleString()}</TBodyCell>
                          <TBodyCell>{p.provider}</TBodyCell>
                          <TBodyCell className="text-xs font-mono">{p.providerReference}</TBodyCell>
                          <TBodyCell><Badge variant={statusColor[p.status] || 'warning'}>{p.status}</Badge></TBodyCell>
                        </TBodyRow>
                      ))}
                    </TBody>
                  </Table>
                </>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ---- Tab: Delinquency Cohorts ---- */}
      {tab === 'cohorts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              As of {cohorts ? new Date(cohorts.asOf).toLocaleString() : '…'}
            </p>
            <div className="flex gap-4 text-sm">
              <span>Delinquent: <strong className="text-red-600">₦{cohorts?.totalDelinquentAmount.toLocaleString() || '…'}</strong></span>
              <span>Rate: <strong>{cohorts ? (cohorts.delinquencyRate * 100).toFixed(1) : '…'}%</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {cohorts?.cohorts.map((bucket) => (
              <Card key={bucket.label}>
                <CardTitle className="text-sm">{bucket.label}</CardTitle>
                <p className="text-2xl font-bold">{bucket.count}</p>
                <p className="text-xs text-gray-500">₦{bucket.totalAmount.toLocaleString()}</p>
              </Card>
            ))}
          </div>

          {cohorts?.cohorts.filter((b) => b.count > 0).map((bucket) => (
            <Card key={bucket.label}>
              <CardTitle className="text-sm">{bucket.label} Detail</CardTitle>
              {cohortDetailLoading === bucket.label ? (
                <div className="flex items-center justify-between px-4 py-6 text-sm text-gray-400">
                  <span>Loading…</span>
                </div>
              ) : cohortDetail[bucket.label] ? (
                <>
                  <Table>
                    <THead><THeadRow>
                      <THeadCell>Subscription</THeadCell>
                      <THeadCell>Due Date</THeadCell>
                      <THeadCell>Amount</THeadCell>
                      <THeadCell>Days Late</THeadCell>
                    </THeadRow></THead>
                    <TBody>
                      {cohortDetail[bucket.label].items.map((inst) => (
                        <TBodyRow key={inst.id}>
                          <TBodyCell className="text-xs font-mono">{inst.subscriptionId.slice(0, 8)}…</TBodyCell>
                          <TBodyCell>{new Date(inst.dueDate).toLocaleDateString()}</TBodyCell>
                          <TBodyCell>₦{inst.amount.toLocaleString()}</TBodyCell>
                          <TBodyCell><Badge variant="danger">{inst.daysLate}d</Badge></TBodyCell>
                        </TBodyRow>
                      ))}
                      {cohortDetail[bucket.label].items.length === 0 && (
                        <TBodyRow><TBodyCell colSpan={4} className="text-center py-4 text-gray-400">None</TBodyCell></TBodyRow>
                      )}
                    </TBody>
                  </Table>
                  {cohortDetail[bucket.label].total > cohortDetail[bucket.label].page * cohortDetail[bucket.label].pageSize && (
                    <div className="p-3">
                      <Button size="sm" variant="secondary" onClick={() => loadCohortDetail(bucket.label, cohortDetail[bucket.label].page + 1)}>
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between px-4 py-4 text-sm text-gray-500">
                  <span>{bucket.count} installment{bucket.count === 1 ? '' : 's'}</span>
                  <Button size="sm" variant="secondary" onClick={() => loadCohortDetail(bucket.label)}>View</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ---- Tab: Collection Flags ---- */}
      {tab === 'priorities' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setPrioModal(true)}>Assign Priority</Button>
          </div>

          <Table>
            <THead><THeadRow>
              <THeadCell>Type</THeadCell>
              <THeadCell>Entity ID</THeadCell>
              <THeadCell>Priority</THeadCell>
              <THeadCell>Reason</THeadCell>
              <THeadCell>Assigned</THeadCell>
              <THeadCell>Date</THeadCell>
            </THeadRow></THead>
            <TBody>
              {priorities.map((p) => (
                <TBodyRow key={p.id}>
                  <TBodyCell><Badge variant="info">{p.entityType}</Badge></TBodyCell>
                  <TBodyCell className="text-xs font-mono">{p.entityId.slice(0, 12)}…</TBodyCell>
                  <TBodyCell><Badge variant={statusColor[p.priority] || 'warning'}>{p.priority}</Badge></TBodyCell>
                  <TBodyCell>{p.reason || '—'}</TBodyCell>
                  <TBodyCell className="text-xs font-mono">{p.assignedBy.slice(0, 8)}…</TBodyCell>
                  <TBodyCell>{new Date(p.createdAt).toLocaleDateString()}</TBodyCell>
                </TBodyRow>
              ))}
              {priorities.length === 0 && <TBodyRow><TBodyCell colSpan={6} className="text-center py-4 text-gray-400">No priorities assigned</TBodyCell></TBodyRow>}
            </TBody>
          </Table>
        </div>
      )}

      {/* ---- Tab: Exception Cases ---- */}
      {tab === 'exceptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {['', 'open', 'investigating', 'resolved', 'escalated'].map((s) => (
                <Button key={s} variant={excFilter === s ? 'primary' : 'ghost'} size="sm" onClick={() => setExcFilter(s)}>
                  {s || 'All'}
                </Button>
              ))}
            </div>
            <Button onClick={() => setExcModal(true)}>New Exception Case</Button>
          </div>

          <Table>
            <THead><THeadRow>
              <THeadCell>Subscription</THeadCell>
              <THeadCell>Reason</THeadCell>
              <THeadCell>Status</THeadCell>
              <THeadCell>Description</THeadCell>
              <THeadCell>Created</THeadCell>
              <THeadCell />
            </THeadRow></THead>
            <TBody>
              {exceptionCases.map((ec) => {
                const reason = exceptionReasons.find((r) => r.id === ec.reasonId)
                return (
                  <TBodyRow key={ec.id}>
                    <TBodyCell className="text-xs font-mono">{ec.subscriptionId.slice(0, 8)}…</TBodyCell>
                    <TBodyCell>{reason?.title || ec.reasonId.slice(0, 8)}</TBodyCell>
                    <TBodyCell><Badge variant={statusColor[ec.status] || 'warning'}>{ec.status}</Badge></TBodyCell>
                    <TBodyCell className="max-w-xs truncate">{ec.description || '—'}</TBodyCell>
                    <TBodyCell>{new Date(ec.createdAt).toLocaleDateString()}</TBodyCell>
                    <TBodyCell>
                      {ec.status !== 'resolved' && (
                        <Button variant="ghost" size="sm" onClick={() => handleResolveException(ec.id)}>Resolve</Button>
                      )}
                    </TBodyCell>
                  </TBodyRow>
                )
              })}
              {exceptionCases.length === 0 && <TBodyRow><TBodyCell colSpan={6} className="text-center py-4 text-gray-400">No exception cases</TBodyCell></TBodyRow>}
            </TBody>
          </Table>
        </div>
      )}

      {/* ============ MODALS ============ */}

      {/* Modal: Reconcile */}
      <Modal open={!!reconcileInst} onClose={() => setReconcileInst(null)} title="Reconcile Installment">
        <div className="space-y-4">
          <Input id="rec-status" label="New Status" value={recStatus} onChange={(e) => setRecStatus(e.target.value)} placeholder="paid / pending" />
          <Input id="rec-ref" label="Payment Reference" value={recRef} onChange={(e) => setRecRef(e.target.value)} />
          <Input id="rec-note" label="Note (audit trail)" value={recNote} onChange={(e) => setRecNote(e.target.value)} />
          <Button onClick={handleReconcile} className="w-full" disabled={saving}>Confirm</Button>
        </div>
      </Modal>

      {/* Modal: Partial Payment */}
      <Modal open={!!partialInst} onClose={() => setPartialInst(null)} title="Partial Payment">
        <div className="space-y-4">
          <Input id="pp-amt" label="Amount (₦)" type="number" value={partialAmt} onChange={(e) => setPartialAmt(e.target.value)} />
          <Input id="pp-ref" label="Payment Reference" value={partialRef} onChange={(e) => setPartialRef(e.target.value)} />
          <Button onClick={handlePartialPayment} className="w-full" disabled={saving || !partialAmt || !partialRef}>Apply</Button>
        </div>
      </Modal>

      {/* Modal: Metadata Correction */}
      <Modal open={!!metaInst} onClose={() => setMetaInst(null)} title="Metadata Correction (safe fields only)">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Only <code>lateFeeAmount</code> and <code>gracePeriodEnd</code> can be modified.</p>
          <textarea
            value={metaFields}
            onChange={(e) => setMetaFields(e.target.value)}
            rows={5}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm font-mono"
          />
          <Button onClick={handleUpdateMetadata} className="w-full" disabled={saving}>Update</Button>
        </div>
      </Modal>

      {/* Modal: Assign Priority */}
      <Modal open={prioModal} onClose={() => setPrioModal(false)} title="Assign Collection Priority">
        <div className="space-y-4">
          <label className="block text-xs font-medium text-gray-500">Entity Type</label>
          <select value={prioEntityType} onChange={(e) => setPrioEntityType(e.target.value as any)}
            className="block w-full rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm">
            <option value="subscription">Subscription</option>
            <option value="user">User</option>
          </select>
          <Input id="prio-eid" label="Entity ID" value={prioEntityId} onChange={(e) => setPrioEntityId(e.target.value)} />
          <label className="block text-xs font-medium text-gray-500">Priority</label>
          <select value={prioLevel} onChange={(e) => setPrioLevel(e.target.value)}
            className="block w-full rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <Input id="prio-reason" label="Reason" value={prioReason} onChange={(e) => setPrioReason(e.target.value)} />
          <Button onClick={handleAssignPriority} className="w-full" disabled={saving || !prioEntityId}>Assign</Button>
        </div>
      </Modal>

      {/* Modal: New Exception Case */}
      <Modal open={excModal} onClose={() => setExcModal(false)} title="Create Exception Case">
        <div className="space-y-4">
          <Input id="exc-sub" label="Subscription ID" value={excSubId} onChange={(e) => setExcSubId(e.target.value)} />
          <label className="block text-xs font-medium text-gray-500">Exception Reason</label>
          <select value={excReasonId} onChange={(e) => setExcReasonId(e.target.value)}
            className="block w-full rounded-lg border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm">
            <option value="">— Select —</option>
            {exceptionReasons.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <Input id="exc-desc" label="Description (optional)" value={excDesc} onChange={(e) => setExcDesc(e.target.value)} />
          <Button onClick={handleCreateException} className="w-full" disabled={saving || !excSubId || !excReasonId}>Create</Button>
        </div>
      </Modal>
    </div>
  )
}
