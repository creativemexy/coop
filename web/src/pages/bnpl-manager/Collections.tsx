import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client'
import {
  Badge,
  Btn,
  EmptyRow,
  Modal,
  PageHeader,
  Panel,
  Select,
  StatCard,
  TabBar,
  Table,
  TBody,
  TBodyCell,
  TBodyRow,
  THead,
  THeadCell,
  THeadRow,
  TextInput,
  inputCls,
} from '../../components/ui/warm'

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

const tabLabels: Record<Tab, string> = {
  schedule: 'Repayment Schedule',
  cohorts: 'Delinquency Cohorts',
  priorities: 'Collection Flags',
  exceptions: 'Exception Cases',
}

const fmt = (n: number) => `₦${n.toLocaleString()}`

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
      <PageHeader
        eyebrow="Collections & Recovery"
        title="Repayment Management"
        subtitle="Schedules, delinquency cohorts, collection flags and exception cases."
      />

      <TabBar
        tabs={(['schedule', 'cohorts', 'priorities', 'exceptions'] as Tab[]).map((t) => ({ key: t, label: tabLabels[t] }))}
        active={tab}
        onChange={setTab}
      />

      {/* ---- Tab: Repayment Schedule ---- */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <Panel title="Look up a schedule" subtitle="Enter an order or subscription ID to inspect its repayment plan">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1">
                <TextInput label="Order / Subscription ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g. ord_… or sub_…" />
              </div>
              <Btn onClick={loadSchedule} disabled={!orderId || schedLoading}>
                {schedLoading ? 'Loading…' : 'Load Schedule'}
              </Btn>
            </div>
            {!schedule && orderId && !schedLoading && (
              <p className="mt-3 text-xs font-semibold text-[#B3261E]">No schedule found for that ID.</p>
            )}
          </Panel>

          {schedule && (
            <Panel title={`Schedule — ${schedule.catalogItem || schedule.orderId.slice(0, 8)}`} subtitle={`Order ${schedule.orderId.slice(0, 8)}…`}>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total" value={fmt(schedule.totalAmount)} icon="🧾" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
                <StatCard label="Paid" value={fmt(schedule.amountPaid)} valueCls="text-[#176B5B]" icon="✅" iconCls="bg-[#176B5B]/10 text-[#176B5B]" />
                <StatCard label="Outstanding" value={fmt(schedule.outstanding)} valueCls="text-[#B3261E]" icon="📊" iconCls="bg-[#B3261E]/10 text-[#B3261E]" />
                <StatCard label="Status" value={<Badge variant={statusColor[schedule.status] || 'warning'} dot>{schedule.status}</Badge>} icon="🏷️" iconCls="bg-[#E4A42A]/15 text-[#8A5A00]" />
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-[#E7DCCB]">
                <div className="border-b border-[#EDE2D3] bg-[#FFF9EF] px-5 py-3">
                  <p className="text-sm font-black tracking-[-0.01em] text-[#2C1B13]">Installments</p>
                </div>
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
                        <TBodyCell className="font-semibold text-[#2C1B13]">
                          {fmt(inst.amount)}
                          {inst.lateFee > 0 && <span className="ml-1 text-xs font-medium text-[#B3261E]">+{fmt(inst.lateFee)}</span>}
                        </TBodyCell>
                        <TBodyCell>
                          <Badge variant={inst.isOverdue ? 'danger' : statusColor[inst.status] || 'warning'} dot>
                            {inst.isOverdue ? 'late' : inst.status}
                          </Badge>
                        </TBodyCell>
                        <TBodyCell>{inst.isOverdue ? `${inst.daysLate}d` : '—'}</TBodyCell>
                        <TBodyCell className="font-mono text-xs">{inst.paymentReference || '—'}</TBodyCell>
                        <TBodyCell>
                          <div className="flex flex-wrap gap-1">
                            {inst.status === 'pending' && (
                              <>
                                <Btn variant="ghost" size="sm" onClick={() => { setPartialInst(inst); setPartialAmt(String(inst.amount)); setPartialRef('') }}>Partial</Btn>
                                <Btn variant="ghost" size="sm" onClick={() => { setReconcileInst(inst); setRecStatus('paid'); setRecRef(''); setRecNote('') }}>Reconcile</Btn>
                                <Btn variant="ghost" size="sm" onClick={() => { setMetaInst(inst); setMetaFields(JSON.stringify({ lateFeeAmount: inst.lateFee, gracePeriodEnd: inst.gracePeriodEnd || '' }, null, 2)) }}>Meta</Btn>
                              </>
                            )}
                            {inst.isOverdue && (
                              <Btn size="sm" onClick={async () => {
                                try { await api.post(`/api/v1/bnpl/repayments/${inst.id}/retry`); loadSchedule() } catch (e: any) { alert(e.response?.data?.message || 'Retry failed') }
                              }}>Retry</Btn>
                            )}
                          </div>
                        </TBodyCell>
                      </TBodyRow>
                    ))}
                    {schedule.installments.length === 0 && <EmptyRow colSpan={7}>No installments</EmptyRow>}
                  </TBody>
                </Table>
              </div>

              {schedule.paymentAttempts.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-xl border border-[#E7DCCB]">
                  <div className="border-b border-[#EDE2D3] bg-[#FFF9EF] px-5 py-3">
                    <p className="text-sm font-black tracking-[-0.01em] text-[#2C1B13]">Payment Attempts</p>
                  </div>
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
                          <TBodyCell className="font-semibold text-[#2C1B13]">{fmt(p.amount)}</TBodyCell>
                          <TBodyCell>{p.provider}</TBodyCell>
                          <TBodyCell className="font-mono text-xs">{p.providerReference}</TBodyCell>
                          <TBodyCell><Badge variant={statusColor[p.status] || 'warning'} dot>{p.status}</Badge></TBodyCell>
                        </TBodyRow>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </Panel>
          )}
        </div>
      )}

      {/* ---- Tab: Delinquency Cohorts ---- */}
      {tab === 'cohorts' && (
        <div className="space-y-4">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#6B5245]">
                As of {cohorts ? new Date(cohorts.asOf).toLocaleString() : '…'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B5245]">
                <span>Delinquent: <strong className="text-[#B3261E]">{fmt(cohorts?.totalDelinquentAmount ?? 0)}</strong></span>
                <span>Rate: <strong className="text-[#2C1B13]">{cohorts ? `${(cohorts.delinquencyRate * 100).toFixed(1)}%` : '…'}</strong></span>
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cohorts?.cohorts.map((bucket, i) => (
              <StatCard
                key={bucket.label}
                label={bucket.label}
                value={bucket.count}
                sub={fmt(bucket.totalAmount)}
                icon="⏱️"
                iconCls={i >= 2 ? 'bg-[#B3261E]/10 text-[#B3261E]' : 'bg-[#E4A42A]/15 text-[#8A5A00]'}
              />
            ))}
          </div>

          {cohorts?.cohorts.filter((b) => b.count > 0).map((bucket) => (
            <Panel key={bucket.label} title={`${bucket.label} Detail`} subtitle={`${bucket.count} installments in this bucket`} padded={false}>
              {cohortDetailLoading === bucket.label ? (
                <div className="px-5 py-6 text-sm text-[#C9B89F]">Loading…</div>
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
                          <TBodyCell className="font-mono text-xs">{inst.subscriptionId.slice(0, 8)}…</TBodyCell>
                          <TBodyCell>{new Date(inst.dueDate).toLocaleDateString()}</TBodyCell>
                          <TBodyCell className="font-semibold text-[#2C1B13]">{fmt(inst.amount)}</TBodyCell>
                          <TBodyCell><Badge variant="danger" dot>{inst.daysLate}d</Badge></TBodyCell>
                        </TBodyRow>
                      ))}
                      {cohortDetail[bucket.label].items.length === 0 && <EmptyRow colSpan={4}>None</EmptyRow>}
                    </TBody>
                  </Table>
                  {cohortDetail[bucket.label].total > cohortDetail[bucket.label].page * cohortDetail[bucket.label].pageSize && (
                    <div className="px-5 py-3">
                      <Btn size="sm" variant="secondary" onClick={() => loadCohortDetail(bucket.label, cohortDetail[bucket.label].page + 1)}>
                        Load more
                      </Btn>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <span className="text-sm text-[#6B5245]">{bucket.count} installment{bucket.count === 1 ? '' : 's'}</span>
                  <Btn size="sm" variant="secondary" onClick={() => loadCohortDetail(bucket.label)}>View</Btn>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}

      {/* ---- Tab: Collection Flags ---- */}
      {tab === 'priorities' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Btn onClick={() => setPrioModal(true)}>Assign Priority</Btn>
          </div>

          <Panel padded={false}>
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
                    <TBodyCell className="font-mono text-xs">{p.entityId.slice(0, 12)}…</TBodyCell>
                    <TBodyCell><Badge variant={statusColor[p.priority] || 'warning'} dot>{p.priority}</Badge></TBodyCell>
                    <TBodyCell>{p.reason || '—'}</TBodyCell>
                    <TBodyCell className="font-mono text-xs">{p.assignedBy.slice(0, 8)}…</TBodyCell>
                    <TBodyCell>{new Date(p.createdAt).toLocaleDateString()}</TBodyCell>
                  </TBodyRow>
                ))}
                {priorities.length === 0 && <EmptyRow colSpan={6}>No priorities assigned</EmptyRow>}
              </TBody>
            </Table>
          </Panel>
        </div>
      )}

      {/* ---- Tab: Exception Cases ---- */}
      {tab === 'exceptions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {['', 'open', 'investigating', 'resolved', 'escalated'].map((s) => (
                <Btn key={s} variant={excFilter === s ? 'primary' : 'secondary'} size="sm" onClick={() => setExcFilter(s)}>
                  {s || 'All'}
                </Btn>
              ))}
            </div>
            <Btn onClick={() => setExcModal(true)}>New Exception Case</Btn>
          </div>

          <Panel padded={false}>
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
                      <TBodyCell className="font-mono text-xs">{ec.subscriptionId.slice(0, 8)}…</TBodyCell>
                      <TBodyCell className="font-semibold text-[#2C1B13]">{reason?.title || ec.reasonId.slice(0, 8)}</TBodyCell>
                      <TBodyCell><Badge variant={statusColor[ec.status] || 'warning'} dot>{ec.status}</Badge></TBodyCell>
                      <TBodyCell className="max-w-xs truncate">{ec.description || '—'}</TBodyCell>
                      <TBodyCell>{new Date(ec.createdAt).toLocaleDateString()}</TBodyCell>
                      <TBodyCell>
                        {ec.status !== 'resolved' && (
                          <Btn variant="ghost" size="sm" onClick={() => handleResolveException(ec.id)}>Resolve</Btn>
                        )}
                      </TBodyCell>
                    </TBodyRow>
                  )
                })}
                {exceptionCases.length === 0 && <EmptyRow colSpan={6}>No exception cases</EmptyRow>}
              </TBody>
            </Table>
          </Panel>
        </div>
      )}

      {/* ============ MODALS ============ */}

      {/* Modal: Reconcile */}
      <Modal open={!!reconcileInst} onClose={() => setReconcileInst(null)} title="Reconcile Installment">
        <div className="space-y-4">
          <TextInput label="New Status" value={recStatus} onChange={(e) => setRecStatus(e.target.value)} placeholder="paid / pending" />
          <TextInput label="Payment Reference" value={recRef} onChange={(e) => setRecRef(e.target.value)} />
          <TextInput label="Note (audit trail)" value={recNote} onChange={(e) => setRecNote(e.target.value)} />
          <Btn onClick={handleReconcile} className="w-full" disabled={saving}>Confirm</Btn>
        </div>
      </Modal>

      {/* Modal: Partial Payment */}
      <Modal open={!!partialInst} onClose={() => setPartialInst(null)} title="Partial Payment">
        <div className="space-y-4">
          <TextInput label="Amount (₦)" type="number" value={partialAmt} onChange={(e) => setPartialAmt(e.target.value)} />
          <TextInput label="Payment Reference" value={partialRef} onChange={(e) => setPartialRef(e.target.value)} />
          <Btn onClick={handlePartialPayment} className="w-full" disabled={saving || !partialAmt || !partialRef}>Apply</Btn>
        </div>
      </Modal>

      {/* Modal: Metadata Correction */}
      <Modal open={!!metaInst} onClose={() => setMetaInst(null)} title="Metadata Correction (safe fields only)">
        <div className="space-y-4">
          <p className="text-xs text-[#6B5245]">
            Only <code className="rounded bg-[#EDE2D3] px-1 py-0.5 text-[0.8em] font-semibold">lateFeeAmount</code> and <code className="rounded bg-[#EDE2D3] px-1 py-0.5 text-[0.8em] font-semibold">gracePeriodEnd</code> can be modified.
          </p>
          <textarea
            value={metaFields}
            onChange={(e) => setMetaFields(e.target.value)}
            rows={5}
            className={inputCls + ' resize-none font-mono'}
          />
          <Btn onClick={handleUpdateMetadata} className="w-full" disabled={saving}>Update</Btn>
        </div>
      </Modal>

      {/* Modal: Assign Priority */}
      <Modal open={prioModal} onClose={() => setPrioModal(false)} title="Assign Collection Priority">
        <div className="space-y-4">
          <Select label="Entity Type" value={prioEntityType} onChange={(e) => setPrioEntityType(e.target.value as any)}>
            <option value="subscription">Subscription</option>
            <option value="user">User</option>
          </Select>
          <TextInput label="Entity ID" value={prioEntityId} onChange={(e) => setPrioEntityId(e.target.value)} />
          <Select label="Priority" value={prioLevel} onChange={(e) => setPrioLevel(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <TextInput label="Reason" value={prioReason} onChange={(e) => setPrioReason(e.target.value)} />
          <Btn onClick={handleAssignPriority} className="w-full" disabled={saving || !prioEntityId}>Assign</Btn>
        </div>
      </Modal>

      {/* Modal: New Exception Case */}
      <Modal open={excModal} onClose={() => setExcModal(false)} title="Create Exception Case">
        <div className="space-y-4">
          <TextInput label="Subscription ID" value={excSubId} onChange={(e) => setExcSubId(e.target.value)} />
          <Select label="Exception Reason" value={excReasonId} onChange={(e) => setExcReasonId(e.target.value)}>
            <option value="">— Select —</option>
            {exceptionReasons.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </Select>
          <TextInput label="Description (optional)" value={excDesc} onChange={(e) => setExcDesc(e.target.value)} />
          <Btn onClick={handleCreateException} className="w-full" disabled={saving || !excSubId || !excReasonId}>Create</Btn>
        </div>
      </Modal>
    </div>
  )
}