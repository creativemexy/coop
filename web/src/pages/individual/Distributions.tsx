import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface DistPayment {
  id: string
  distribution: { type: string; description: string | null; recordDate: string; payDate: string }
  amount: number
  unitsAtRecord: number
  isPaid: boolean
  paidAt: string | null
  createdAt: string
}

export function Distributions() {
  const [history, setHistory] = useState<DistPayment[]>([])
  const [pending, setPending] = useState<DistPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/investments/distributions/mine').then((r) => setHistory(r.data)),
      api.get('/investments/distributions/pending').then((r) => setPending(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  if (loading) return <div className="py-12 text-center text-gray-500">Loading distributions...</div>

  const totalEarned = history.filter((d) => d.isPaid).reduce((s, d) => s + Number(d.amount), 0)
  const pendingTotal = pending.reduce((s, d) => s + Number(d.amount), 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Earnings & Distributions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Distributed</CardTitle>
          <p className="mt-2 text-3xl font-bold text-green-600">{formatCurrency(totalEarned)}</p>
        </Card>
        <Card className="border-yellow-500">
          <CardTitle className="text-sm font-medium text-gray-500">Pending Distributions</CardTitle>
          <p className="mt-2 text-3xl font-bold text-yellow-600">{formatCurrency(pendingTotal)}</p>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card>
          <CardTitle>Pending Distributions</CardTitle>
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Type</THeadCell>
                <THeadCell>Amount</THeadCell>
                <THeadCell>Units</THeadCell>
                <THeadCell>Record Date</THeadCell>
                <THeadCell>Pay Date</THeadCell>
                <THeadCell>Status</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {pending.map((d) => (
                <TBodyRow key={d.id}>
                  <TBodyCell className="capitalize">{d.distribution?.type?.replace('_', ' ') || 'Distribution'}</TBodyCell>
                  <TBodyCell className="font-medium">{formatCurrency(Number(d.amount))}</TBodyCell>
                  <TBodyCell>{d.unitsAtRecord}</TBodyCell>
                  <TBodyCell>{d.distribution?.recordDate ? new Date(d.distribution.recordDate).toLocaleDateString() : '—'}</TBodyCell>
                  <TBodyCell>{d.distribution?.payDate ? new Date(d.distribution.payDate).toLocaleDateString() : '—'}</TBodyCell>
                  <TBodyCell><Badge variant="warning">Pending</Badge></TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      <Card>
        <CardTitle>Distribution History</CardTitle>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 mt-4">No distributions yet</p>
        ) : (
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Type</THeadCell>
                <THeadCell>Amount</THeadCell>
                <THeadCell>Units</THeadCell>
                <THeadCell>Paid Date</THeadCell>
                <THeadCell>Status</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {history.map((d) => (
                <TBodyRow key={d.id}>
                  <TBodyCell className="capitalize">{d.distribution?.type?.replace('_', ' ') || 'Distribution'}</TBodyCell>
                  <TBodyCell className="font-medium">{formatCurrency(Number(d.amount))}</TBodyCell>
                  <TBodyCell>{d.unitsAtRecord}</TBodyCell>
                  <TBodyCell>{d.paidAt ? new Date(d.paidAt).toLocaleDateString() : '—'}</TBodyCell>
                  <TBodyCell>
                    <Badge variant={d.isPaid ? 'success' : 'warning'}>{d.isPaid ? 'Paid' : 'Pending'}</Badge>
                  </TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
