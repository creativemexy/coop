import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/modal'

interface Installment {
  id: string
  subscriptionId: string
  dueDate: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  paidAt?: string
  paymentReference?: string
  createdAt: string
}

interface Subscription {
  id: string
  plan?: { catalogItem?: { name: string } }
  userId: string
}

export function Installments() {
  const [installments, setInstallments] = useState<Installment[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')
  const [payModal, setPayModal] = useState<Installment | null>(null)
  const [paymentRef, setPaymentRef] = useState('')

  const fetch = useCallback(async () => {
    const { data: subs } = await api.get('/bnpl/subscriptions')
    const all: Installment[] = []
    for (const sub of subs as Subscription[]) {
      const { data: insts } = await api.get(`/bnpl/installments/subscription/${sub.id}`)
      all.push(...insts)
    }
    all.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    setInstallments(all)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = installments.filter((i) => {
    if (filter === 'all') return true
    if (filter === 'overdue') return i.status === 'pending' && new Date(i.dueDate) < new Date()
    return i.status === filter
  })

  const handleMarkPaid = async () => {
    if (!payModal || !paymentRef) return
    await api.post(`/bnpl/installments/${payModal.id}/pay`, { paymentReference: paymentRef })
    setPayModal(null)
    setPaymentRef('')
    fetch()
  }

  const overdueCount = installments.filter((i) => i.status === 'pending' && new Date(i.dueDate) < new Date()).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Installments</h2>
        {overdueCount > 0 && (
          <Badge variant="danger">{overdueCount} overdue</Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'overdue', 'paid'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Amount</THeadCell>
            <THeadCell>Due Date</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Paid At</THeadCell>
            <THeadCell>Reference</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {filtered.map((inst) => {
            const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date()
            return (
              <TBodyRow key={inst.id}>
                <TBodyCell className="font-medium">₦{inst.amount.toLocaleString()}</TBodyCell>
                <TBodyCell>{new Date(inst.dueDate).toLocaleDateString()}</TBodyCell>
                <TBodyCell>
                  <Badge
                    variant={
                      inst.status === 'paid' ? 'success'
                      : isOverdue ? 'danger'
                      : 'warning'
                    }
                  >
                    {isOverdue && inst.status === 'pending' ? 'overdue' : inst.status}
                  </Badge>
                </TBodyCell>
                <TBodyCell>{inst.paidAt ? new Date(inst.paidAt).toLocaleDateString() : '—'}</TBodyCell>
                <TBodyCell className="text-xs font-mono">{inst.paymentReference ?? '—'}</TBodyCell>
                <TBodyCell>
                  {inst.status === 'pending' && (
                    <Button variant="primary" size="sm" onClick={() => { setPayModal(inst); setPaymentRef('') }}>
                      Mark Paid
                    </Button>
                  )}
                </TBodyCell>
              </TBodyRow>
            )
          })}
          {filtered.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={6} className="text-center text-gray-400 py-8">No installments found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Confirm Payment">
        <div className="space-y-4">
          {payModal && (
            <p className="text-sm">
              Mark installment of <strong>₦{payModal.amount.toLocaleString()}</strong> due{' '}
              {new Date(payModal.dueDate).toLocaleDateString()} as paid?
            </p>
          )}
          <Input
            id="payment-ref"
            label="Payment Reference"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            required
          />
          <Button onClick={handleMarkPaid} className="w-full" disabled={!paymentRef}>Confirm</Button>
        </div>
      </Modal>
    </div>
  )
}
