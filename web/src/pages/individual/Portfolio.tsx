import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, THead, THeadRow, THeadCell, TBody, TBodyRow, TBodyCell } from '../../components/ui/table'

interface Holding {
  id: string
  product: { name: string; type: string; riskTier: string; expectedReturnRate: number }
  units: number
  costBasis: number
  currentValue: number
  isLocked: boolean
  lockedUntil: string | null
  maturityDate: string | null
  createdAt: string
}

interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  unrealizedReturn: number
  unrealizedReturnPct: number
  totalEarned: number
  lockedValue: number
  availableValue: number
  holdingCount: number
}

export function Portfolio() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)

  const raiseTicket = (holding: Holding) => {
    navigate(`/individual/support?subject=${encodeURIComponent('Issue with investment holding: ' + (holding.product?.name || ''))}&orderId=${holding.id}`)
  }

  useEffect(() => {
    Promise.all([
      api.get('/investments/portfolio').then((r) => setSummary(r.data)),
      api.get('/investments/holdings').then((r) => setHoldings(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n)

  if (loading) return <div className="py-12 text-center text-gray-500">Loading portfolio...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">My Portfolio</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-indigo-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Invested</CardTitle>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(summary?.totalInvested ?? 0)}</p>
        </Card>
        <Card className="border-emerald-500">
          <CardTitle className="text-sm font-medium text-gray-500">Current Value</CardTitle>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(summary?.currentValue ?? 0)}</p>
        </Card>
        <Card className="border-blue-500">
          <CardTitle className="text-sm font-medium text-gray-500">Unrealized Return</CardTitle>
          <p className={`mt-2 text-2xl font-bold ${(summary?.unrealizedReturn ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary ? `${summary.unrealizedReturn >= 0 ? '+' : ''}${summary.unrealizedReturnPct.toFixed(1)}%` : '—'}
          </p>
        </Card>
        <Card className="border-amber-500">
          <CardTitle className="text-sm font-medium text-gray-500">Total Earned</CardTitle>
          <p className="mt-2 text-2xl font-bold text-green-600">{formatCurrency(summary?.totalEarned ?? 0)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-purple-500">
          <CardTitle className="text-sm font-medium text-gray-500">Locked Value</CardTitle>
          <p className="mt-2 text-xl font-bold">{formatCurrency(summary?.lockedValue ?? 0)}</p>
        </Card>
        <Card className="border-cyan-500">
          <CardTitle className="text-sm font-medium text-gray-500">Available / Unlocked</CardTitle>
          <p className="mt-2 text-xl font-bold text-green-600">{formatCurrency(summary?.availableValue ?? 0)}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Holdings ({summary?.holdingCount ?? 0})</CardTitle>
        {holdings.length === 0 ? (
          <p className="text-sm text-gray-400 mt-4">No holdings yet. <Link to="/individual/investments" className="text-blue-600 hover:underline">Browse investments</Link></p>
        ) : (
          <Table>
            <THead>
              <THeadRow>
                <THeadCell>Product</THeadCell>
                <THeadCell>Units</THeadCell>
                <THeadCell>Cost Basis</THeadCell>
                <THeadCell>Current Value</THeadCell>
                <THeadCell>Return</THeadCell>
                <THeadCell>Status</THeadCell>
                <THeadCell>Maturity</THeadCell>
                <THeadCell>Actions</THeadCell>
              </THeadRow>
            </THead>
            <TBody>
              {holdings.map((h) => {
                const returnAmt = Number(h.currentValue) - Number(h.costBasis)
                const returnPct = Number(h.costBasis) > 0 ? (returnAmt / Number(h.costBasis)) * 100 : 0
                return (
                  <TBodyRow key={h.id}>
                    <TBodyCell className="font-medium">{h.product?.name || 'Unknown'}</TBodyCell>
                    <TBodyCell>{h.units}</TBodyCell>
                    <TBodyCell>{formatCurrency(Number(h.costBasis))}</TBodyCell>
                    <TBodyCell>{formatCurrency(Number(h.currentValue))}</TBodyCell>
                    <TBodyCell>
                      <span className={returnAmt >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {returnAmt >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                      </span>
                    </TBodyCell>
                    <TBodyCell>
                      {h.isLocked ? (
                        <Badge variant="warning">Locked {h.lockedUntil ? `until ${new Date(h.lockedUntil).toLocaleDateString()}` : ''}</Badge>
                      ) : (
                        <Badge variant="success">Available</Badge>
                      )}
                    </TBodyCell>
                    <TBodyCell className="text-sm">
                      {h.maturityDate ? new Date(h.maturityDate).toLocaleDateString() : '—'}
                    </TBodyCell>
                    <TBodyCell>
                      <Button size="sm" variant="ghost" onClick={() => raiseTicket(h)}>Raise Ticket</Button>
                    </TBodyCell>
                  </TBodyRow>
                )
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
