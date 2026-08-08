import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { naira } from '../../lib/utils'

interface Payment {
  id: string
  providerReference: string
  provider: string
  status: string
  amount: number
  fee: number
  userId: string
  createdAt: string
}

export function PaymentTransactionLog() {
  const [data, setData] = useState<{ data: Payment[]; total: number; page: number; totalPages: number } | null>(null)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetch = useCallback(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type) params.set('type', type)
    if (status) params.set('status', status)
    params.set('page', String(page))
    api.get(`/admin/super/payment-transactions?${params}`).then(r => setData(r.data))
  }, [search, type, status, page])

  useEffect(() => { fetch() }, [fetch])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Payment Transaction Log</h1>

      <div className="flex gap-4 flex-wrap">
        <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" placeholder="Search reference..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
          <option value="">All Providers</option>
          <option value="paystack">Paystack</option>
          <option value="korapay">Korapay</option>
        </select>
        <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="successful">Successful</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {data && (
        <>
          <div className="text-sm text-gray-500">{data.total} transactions found</div>
          <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-3">Reference</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Fee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p, i) => (
                  <tr key={p.id} className={`border-b dark:border-gray-700 ${
                    [
                      'bg-sky-50 dark:bg-sky-950/20',
                      'bg-emerald-50 dark:bg-emerald-950/20',
                      'bg-amber-50 dark:bg-amber-950/20',
                      'bg-fuchsia-50 dark:bg-fuchsia-950/20',
                      'bg-violet-50 dark:bg-violet-950/20',
                    ][i % 5]
                  }`}>
                    <td className="p-3 font-mono text-xs">{p.providerReference}</td>
                    <td className="p-3 font-mono text-xs">{p.userId.slice(0, 8)}...</td>
                    <td className="p-3 capitalize">{p.provider}</td>
                    <td className="p-3 font-medium">{naira(Number(p.amount))}</td>
                    <td className="p-3">{naira(Number(p.fee))}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'successful' ? 'bg-green-100 text-green-700' :
                        p.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded text-sm disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="px-3 py-1 border rounded text-sm disabled:opacity-50" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
