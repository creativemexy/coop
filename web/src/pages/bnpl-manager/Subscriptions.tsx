import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/ui/modal'

interface Installment {
  id: string
  dueDate: string
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  paidAt?: string
  paymentReference?: string
}

interface Plan {
  id: string
  catalogItem?: { name: string }
  organizationId: string
}

interface Subscription {
  id: string
  userId: string
  planId: string
  plan?: Plan
  status: string
  downPayment: number
  totalAmount: number
  amountPaid: number
  nextInstallmentDate?: string
  createdAt: string
  installments?: Installment[]
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  created: 'default',
  pending_payment: 'warning',
  disbursed: 'info',
  active_repayment: 'success',
  settled: 'info',
  defaulted: 'danger',
}

function formatStatus(s: string) {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)

  const fetch = useCallback(() => {
    const params = statusFilter ? { status: statusFilter } : {}
    api.get('/bnpl/subscriptions', { params }).then((r) => setSubscriptions(r.data))
  }, [statusFilter])

  useEffect(() => { fetch() }, [fetch])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Subscriptions</h2>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'created', 'pending_payment', 'disbursed', 'active_repayment', 'settled', 'defaulted'].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s ? s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'All'}
          </Button>
        ))}
      </div>

      <Table>
        <THead>
          <THeadRow>
            <THeadCell>Item</THeadCell>
            <THeadCell>Total</THeadCell>
            <THeadCell>Paid</THeadCell>
            <THeadCell>Balance</THeadCell>
            <THeadCell>Status</THeadCell>
            <THeadCell>Next Due</THeadCell>
            <THeadCell>Created</THeadCell>
            <THeadCell />
          </THeadRow>
        </THead>
        <TBody>
          {subscriptions.map((s) => {
            const balance = s.totalAmount - s.amountPaid
            return (
              <TBodyRow key={s.id}>
                <TBodyCell className="font-medium">{s.plan?.catalogItem?.name ?? '—'}</TBodyCell>
                <TBodyCell>₦{s.totalAmount.toLocaleString()}</TBodyCell>
                <TBodyCell>₦{s.amountPaid.toLocaleString()}</TBodyCell>
                <TBodyCell className={balance > 0 ? 'text-red-600 font-medium' : ''}>
                  ₦{balance.toLocaleString()}
                </TBodyCell>
                <TBodyCell>
                  <Badge variant={statusColors[s.status] ?? 'default'}>{formatStatus(s.status)}</Badge>
                </TBodyCell>
                <TBodyCell>
                  {s.nextInstallmentDate
                    ? new Date(s.nextInstallmentDate).toLocaleDateString()
                    : '—'}
                </TBodyCell>
                <TBodyCell>{new Date(s.createdAt).toLocaleDateString()}</TBodyCell>
                <TBodyCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSub(s)}>View</Button>
                </TBodyCell>
              </TBodyRow>
            )
          })}
          {subscriptions.length === 0 && (
            <TBodyRow>
              <TBodyCell colSpan={8} className="text-center text-gray-400 py-8">No subscriptions found</TBodyCell>
            </TBodyRow>
          )}
        </TBody>
      </Table>

      <Modal open={!!selectedSub} onClose={() => setSelectedSub(null)} title="Subscription Details">
        {selectedSub && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Item:</span><p className="font-medium">{selectedSub.plan?.catalogItem?.name ?? '—'}</p></div>
              <div><span className="text-gray-500">Status:</span><div className="mt-0.5"><Badge variant={statusColors[selectedSub.status] ?? 'default'}>{formatStatus(selectedSub.status)}</Badge></div></div>
              <div><span className="text-gray-500">Total:</span><p className="font-medium">₦{selectedSub.totalAmount.toLocaleString()}</p></div>
              <div><span className="text-gray-500">Paid:</span><p className="font-medium">₦{selectedSub.amountPaid.toLocaleString()}</p></div>
              <div><span className="text-gray-500">Down Payment:</span><p className="font-medium">₦{selectedSub.downPayment.toLocaleString()}</p></div>
              <div><span className="text-gray-500">Next Due:</span><p className="font-medium">{selectedSub.nextInstallmentDate ? new Date(selectedSub.nextInstallmentDate).toLocaleDateString() : '—'}</p></div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 dark:text-gray-200">Installments</h4>
              <div className="space-y-2">
                {selectedSub.installments?.map((inst) => {
                  const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date()
                  return (
                    <div key={inst.id} className="flex items-center justify-between rounded-lg border dark:border-gray-700 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium">₦{inst.amount.toLocaleString()}</span>
                        <span className="text-gray-500 ml-2">due {new Date(inst.dueDate).toLocaleDateString()}</span>
                      </div>
                      <Badge
                        variant={
                          inst.status === 'paid' ? 'success'
                          : isOverdue ? 'danger'
                          : inst.status === 'overdue' ? 'danger'
                          : 'warning'
                        }
                      >
                        {isOverdue && inst.status === 'pending' ? 'overdue' : inst.status}
                      </Badge>
                    </div>
                  )
                })}
                {(!selectedSub.installments || selectedSub.installments.length === 0) && (
                  <p className="text-sm text-gray-400">No installments</p>
                )}
              </div>
            </div>

            <Button variant="secondary" className="w-full" onClick={() => setSelectedSub(null)}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
