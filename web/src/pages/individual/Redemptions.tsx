import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Modal } from '../../components/ui/modal'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface Holding {
  id: string
  product: { name: string }
  units: number
  currentValue: number
  isLocked: boolean
  lockedUntil: string | null
  costBasis: number
}

interface Redemption {
  id: string
  holding: { product: { name: string } }
  units: number
  amount: number
  status: string
  reason: string | null
  rejectionReason: string | null
  createdAt: string
  processedAt: string | null
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  requested: 'warning',
  approved: 'info',
  processed: 'info',
  paid: 'success',
  rejected: 'danger',
}

export function Redemptions() {
  const navigate = useNavigate()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])

  const raiseTicket = (subject: string, refId: string) => {
    navigate(`/individual/support?subject=${encodeURIComponent(subject)}&orderId=${refId}`)
  }
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null)
  const [redeemUnits, setRedeemUnits] = useState('')
  const [redeemReason, setRedeemReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetch = () => {
    setLoading(true)
    Promise.all([
      api.get('/investments/holdings').then((r) => setHoldings(r.data)),
      api.get('/investments/redemptions').then((r) => setRedemptions(r.data)),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  const handleSubmit = async () => {
    if (!selectedHolding || !redeemUnits) return
    setSubmitting(true)
    try {
      await api.post('/investments/redemptions', {
        holdingId: selectedHolding.id,
        units: Number(redeemUnits),
        reason: redeemReason || undefined,
      })
      setShowForm(false)
      setSelectedHolding(null)
      setRedeemUnits('')
      setRedeemReason('')
      fetch()
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const availableHoldings = holdings.filter((h) => !h.isLocked)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Redemptions / Withdrawals</h2>
        <Button onClick={() => setShowForm(true)} disabled={availableHoldings.length === 0}>
          Request Redemption
        </Button>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Request Redemption">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Holding</label>
            <select
              value={selectedHolding?.id || ''}
              onChange={(e) => {
                const h = holdings.find((h) => h.id === e.target.value)
                setSelectedHolding(h || null)
                setRedeemUnits('')
              }}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Select holding</option>
              {availableHoldings.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.product?.name} ({h.units} units - {formatCurrency(Number(h.currentValue))})
                </option>
              ))}
            </select>
          </div>
          {selectedHolding && (
            <>
              <Input
                label={`Units (max ${selectedHolding.units})`}
                type="number"
                value={redeemUnits}
                onChange={(e) => setRedeemUnits(e.target.value)}
                placeholder={`Max ${selectedHolding.units}`}
              />
              {redeemUnits && Number(redeemUnits) <= selectedHolding.units && (
                <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  Est. payout: {formatCurrency(Number(redeemUnits) * (Number(selectedHolding.currentValue) / selectedHolding.units))}
                </div>
              )}
              <Input
                label="Reason (optional)"
                value={redeemReason}
                onChange={(e) => setRedeemReason(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting || !redeemUnits || Number(redeemUnits) < 1 || Number(redeemUnits) > selectedHolding.units}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </>
          )}
        </div>
      </Modal>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-indigo-500">
              <CardTitle className="text-sm font-medium text-gray-500">Total Holdings</CardTitle>
              <p className="mt-2 text-3xl font-bold">{holdings.length}</p>
            </Card>
            <Card className="border-emerald-500">
              <CardTitle className="text-sm font-medium text-gray-500">Available for Redemption</CardTitle>
              <p className="mt-2 text-3xl font-bold">{availableHoldings.length}</p>
            </Card>
          </div>

          {redemptions.length > 0 && (
            <Card>
              <CardTitle>Redemption History</CardTitle>
              <Table>
                <THead>
                  <THeadRow>
                    <THeadCell>Product</THeadCell>
                    <THeadCell>Units</THeadCell>
                    <THeadCell>Amount</THeadCell>
                    <THeadCell>Status</THeadCell>
                    <THeadCell>Reason</THeadCell>
                    <THeadCell>Date</THeadCell>
                    <THeadCell>Actions</THeadCell>
                  </THeadRow>
                </THead>
                <TBody>
                  {redemptions.map((r) => (
                    <TBodyRow key={r.id}>
                      <TBodyCell className="font-medium">{r.holding?.product?.name || 'Unknown'}</TBodyCell>
                      <TBodyCell>{r.units}</TBodyCell>
                      <TBodyCell>{formatCurrency(Number(r.amount))}</TBodyCell>
                      <TBodyCell><Badge variant={statusColors[r.status] ?? 'default'}>{r.status}</Badge></TBodyCell>
                      <TBodyCell className="text-xs max-w-[150px] truncate">{r.reason || '—'}</TBodyCell>
                      <TBodyCell className="text-sm">{new Date(r.createdAt).toLocaleDateString()}</TBodyCell>
                      <TBodyCell>
                        <Button size="sm" variant="ghost" onClick={() => raiseTicket('Issue with redemption: ' + (r.holding?.product?.name || ''), r.id)}>Ticket</Button>
                      </TBodyCell>
                    </TBodyRow>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}

          {redemptions.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No redemption requests yet</p>
              <p className="text-sm mt-1">Submit a request to withdraw from an unlocked holding.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
