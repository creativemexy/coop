import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface StatementData {
  portfolio: {
    totalInvested: number
    currentValue: number
    unrealizedReturn: number
    totalEarned: number
    lockedValue: number
    availableValue: number
  }
  holdings: Array<{
    id: string
    productName: string
    units: number
    costBasis: number
    currentValue: number
    isLocked: boolean
    lockedUntil: string | null
    maturityDate: string | null
  }>
  orders: Array<{
    id: string
    productName: string
    amount: number
    units: number
    unitPrice: number
    fee: number
    status: string
    createdAt: string
  }>
  distributions: Array<{
    id: string
    type: string
    amount: number
    unitsAtRecord: number
    isPaid: boolean
    paidAt: string | null
  }>
  redemptions: Array<{
    id: string
    productName: string
    units: number
    amount: number
    status: string
    createdAt: string
  }>
}

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  paid: 'success',
  placed: 'warning',
  payment_confirmed: 'info',
  invested: 'info',
  allocated: 'success',
  cancelled: 'danger',
  failed: 'danger',
}

export function InvestmentStatements() {
  const navigate = useNavigate()
  const [data, setData] = useState<StatementData | null>(null)
  const [loading, setLoading] = useState(true)

  const raiseTicket = (subject: string, orderId: string) => {
    navigate(`/individual/support?subject=${encodeURIComponent(subject)}&orderId=${orderId}`)
  }

  useEffect(() => {
    api.get('/investments/statement').then((r) => {
      setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  if (loading) return <div className="py-12 text-center text-gray-500">Loading statement...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Investment Statement</h2>

      <Card className="border-indigo-500">
        <CardTitle>Portfolio Summary</CardTitle>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Invested</p>
            <p className="text-xl font-bold">{formatCurrency(data?.portfolio.totalInvested ?? 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Value</p>
            <p className="text-xl font-bold">{formatCurrency(data?.portfolio.currentValue ?? 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unrealized Return</p>
            <p className={`text-xl font-bold ${(data?.portfolio.unrealizedReturn ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data?.portfolio.unrealizedReturn ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Distributions</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(data?.portfolio.totalEarned ?? 0)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Holdings</CardTitle>
        {!data?.holdings?.length ? (
          <p className="text-sm text-gray-400 mt-4">No holdings</p>
        ) : (
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Product</THeadCell>
                <THeadCell>Units</THeadCell>
                <THeadCell>Cost Basis</THeadCell>
                <THeadCell>Current Value</THeadCell>
                <THeadCell>Status</THeadCell>
                <THeadCell>Maturity</THeadCell>
                <THeadCell>Actions</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {data.holdings.map((h) => (
                <TBodyRow key={h.id}>
                  <TBodyCell className="font-medium">{h.productName}</TBodyCell>
                  <TBodyCell>{h.units}</TBodyCell>
                  <TBodyCell>{formatCurrency(h.costBasis)}</TBodyCell>
                  <TBodyCell>{formatCurrency(h.currentValue)}</TBodyCell>
                  <TBodyCell>
                    {h.isLocked ? (
                      <Badge variant="warning">Locked until {h.lockedUntil ? new Date(h.lockedUntil).toLocaleDateString() : '?'}</Badge>
                    ) : (
                      <Badge variant="success">Available</Badge>
                    )}
                  </TBodyCell>
                  <TBodyCell className="text-sm">{h.maturityDate ? new Date(h.maturityDate).toLocaleDateString() : '—'}</TBodyCell>
                  <TBodyCell>
                    <Button size="sm" variant="ghost" onClick={() => raiseTicket('Issue with holding: ' + h.productName, h.id)}>Ticket</Button>
                  </TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardTitle>Orders</CardTitle>
        {!data?.orders?.length ? (
          <p className="text-sm text-gray-400 mt-4">No orders</p>
        ) : (
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Product</THeadCell>
                <THeadCell>Amount</THeadCell>
                <THeadCell>Units</THeadCell>
                <THeadCell>Fee</THeadCell>
                <THeadCell>Status</THeadCell>
                <THeadCell>Date</THeadCell>
                <THeadCell>Actions</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {data.orders.map((o) => (
                <TBodyRow key={o.id}>
                  <TBodyCell className="font-medium">{o.productName}</TBodyCell>
                  <TBodyCell>{formatCurrency(o.amount)}</TBodyCell>
                  <TBodyCell>{o.units || '—'}</TBodyCell>
                  <TBodyCell>{formatCurrency(o.fee)}</TBodyCell>
                  <TBodyCell><Badge variant={statusColors[o.status] ?? 'default'}>{o.status}</Badge></TBodyCell>
                  <TBodyCell className="text-sm">{new Date(o.createdAt).toLocaleDateString()}</TBodyCell>
                  <TBodyCell>
                    <Button size="sm" variant="ghost" onClick={() => raiseTicket('Issue with order: ' + o.productName, o.id)}>Ticket</Button>
                  </TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardTitle>Distribution History</CardTitle>
        {!data?.distributions?.length ? (
          <p className="text-sm text-gray-400 mt-4">No distributions</p>
        ) : (
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Type</THeadCell>
                <THeadCell>Amount</THeadCell>
                <THeadCell>Units</THeadCell>
                <THeadCell>Status</THeadCell>
                <THeadCell>Paid Date</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {data.distributions.map((d) => (
                <TBodyRow key={d.id}>
                  <TBodyCell className="capitalize">{d.type.replace('_', ' ')}</TBodyCell>
                  <TBodyCell className="font-medium">{formatCurrency(d.amount)}</TBodyCell>
                  <TBodyCell>{d.unitsAtRecord}</TBodyCell>
                  <TBodyCell><Badge variant={d.isPaid ? 'success' : 'warning'}>{d.isPaid ? 'Paid' : 'Pending'}</Badge></TBodyCell>
                  <TBodyCell className="text-sm">{d.paidAt ? new Date(d.paidAt).toLocaleDateString() : '—'}</TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {data?.redemptions?.length ? (
        <Card>
          <CardTitle>Redemptions</CardTitle>
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Product</THeadCell>
                <THeadCell>Units</THeadCell>
                <THeadCell>Amount</THeadCell>
                <THeadCell>Status</THeadCell>
                <THeadCell>Date</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {data.redemptions.map((r) => (
                <TBodyRow key={r.id}>
                  <TBodyCell className="font-medium">{r.productName}</TBodyCell>
                  <TBodyCell>{r.units}</TBodyCell>
                  <TBodyCell>{formatCurrency(r.amount)}</TBodyCell>
                  <TBodyCell><Badge variant={statusColors[r.status] ?? 'default'}>{r.status}</Badge></TBodyCell>
                  <TBodyCell className="text-sm">{new Date(r.createdAt).toLocaleDateString()}</TBodyCell>
                </TBodyRow>
              ))}
            </TBody>
          </Table>
        </Card>
      ) : null}
    </div>
  )
}
