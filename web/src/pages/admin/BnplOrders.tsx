import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { naira } from '../../lib/utils'

interface Order {
  id: string
  userId: string
  status: string
  downPayment: number
  totalAmount: number
  amountPaid: number
  createdAt: string
  plan?: { catalogItem?: { name: string }; installmentCount: number; interestRate: number }
  riskLevel?: string
  overdueInstallmentCount?: number
}

export function AdminBnplOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetch = useCallback(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    api.get('/bnpl/subscriptions/orders', { params }).then(r => setOrders(r.data))
  }, [statusFilter, search])

  useEffect(() => { fetch() }, [fetch])

  const stats = {
    total: orders.length,
    active: orders.filter(o => o.status === 'active_repayment').length,
    overdue: orders.filter(o => (o.overdueInstallmentCount ?? 0) > 0).length,
    settled: orders.filter(o => o.status === 'settled').length,
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">BNPL Orders</h2>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 capitalize">{k}</div>
            <div className="text-2xl font-bold mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 w-64" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
          <option value="">All</option>
          <option value="created">Created</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="disbursed">Disbursed</option>
          <option value="active_repayment">Active Repayment</option>
          <option value="settled">Settled</option>
          <option value="defaulted">Defaulted</option>
        </select>
      </div>

      <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="p-3">Order ID</th>
              <th className="p-3">Product</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Paid</th>
              <th className="p-3">Status</th>
              <th className="p-3">Risk</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b dark:border-gray-700">
                <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                <td className="p-3">{o.plan?.catalogItem?.name || '—'}</td>
                <td className="p-3 font-medium">{naira(Number(o.totalAmount))}</td>
                <td className="p-3">{naira(Number(o.amountPaid))}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    o.status === 'settled' ? 'bg-green-100 text-green-700' :
                    o.status === 'defaulted' ? 'bg-red-100 text-red-700' :
                    o.status === 'active_repayment' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{o.status}</span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    o.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                    o.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{o.riskLevel || '—'}</span>
                </td>
                <td className="p-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
