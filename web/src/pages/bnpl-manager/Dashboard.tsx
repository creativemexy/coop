import { useState, useEffect } from 'react'
import { Card, CardTitle } from '../../components/ui/card'
import { api } from '../../api/client'

interface BnplDashboardData {
  totalCatalogItems: number
  totalPlans: number
  activeSubscriptions: number
  totalSubscriptions: number
  newSubscriptionsThisMonth: number
  installmentCompletionRate: number
}

export function BnplManagerDashboard() {
  const [data, setData] = useState<BnplDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/bnpl-manager')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { title: 'Catalog Items', value: data?.totalCatalogItems, border: 'border-orange-500' },
    { title: 'Active Plans', value: data?.totalPlans, border: 'border-blue-500' },
    { title: 'Active Subscriptions', value: data?.activeSubscriptions, border: 'border-emerald-500' },
    { title: 'Total Subscriptions', value: data?.totalSubscriptions, border: 'border-indigo-500' },
    { title: 'New (30d)', value: data?.newSubscriptionsThisMonth, border: 'border-cyan-500' },
    { title: 'Completion Rate', value: data ? `${(data.installmentCompletionRate * 100).toFixed(1)}%` : undefined, border: 'border-amber-500' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">BNPL Manager Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <Card key={c.title} className={c.border}>
            <CardTitle>{c.title}</CardTitle>
            <p className="mt-2 text-3xl font-bold">
              {loading ? '…' : c.value ?? '—'}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
