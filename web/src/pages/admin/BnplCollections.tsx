import { useEffect, useState, useCallback } from 'react'
import { api } from '../../api/client'
import { naira } from '../../lib/utils'

interface CohortBucket {
  label: string
  count: number
  totalAmount: number
}

interface CohortsData {
  cohorts: CohortBucket[]
  totalDelinquentAmount: number
  totalActivePrincipal: number
  delinquencyRate: number
}

interface InstallmentRow {
  id: string
  dueDate: string
  amount: number
  status: string
  daysLate: number
}

export function AdminBnplCollections() {
  const [tab, setTab] = useState<'cohorts' | 'schedule'>('cohorts')
  const [cohorts, setCohorts] = useState<CohortsData | null>(null)
  const [schedule, setSchedule] = useState<InstallmentRow[]>([])
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    api.get('/bnpl/collections/cohorts').then(r => setCohorts(r.data))
  }, [])

  const fetchSchedule = useCallback(() => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    api.get('/bnpl/collections/schedule', { params }).then(r => setSchedule(r.data))
  }, [statusFilter])

  useEffect(() => { if (tab === 'schedule') fetchSchedule() }, [tab, fetchSchedule])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Collections</h2>

      <div className="flex gap-4 border-b dark:border-gray-700">
        {(['cohorts', 'schedule'] as const).map(t => (
          <button key={t} className={`pb-2 text-sm font-medium ${tab === t ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setTab(t)}>{t === 'cohorts' ? 'Delinquency Cohorts' : 'Repayment Schedule'}</button>
        ))}
      </div>

      {tab === 'cohorts' && cohorts && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500">Delinquency Rate</div>
              <div className="text-2xl font-bold mt-1 text-red-600">{(cohorts.delinquencyRate * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500">Outstanding Delinquent</div>
              <div className="text-2xl font-bold mt-1">{naira(cohorts.totalDelinquentAmount)}</div>
            </div>
            <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500">Active Principal</div>
              <div className="text-2xl font-bold mt-1">{naira(cohorts.totalActivePrincipal)}</div>
            </div>
          </div>

          <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-3">Bucket</th>
                  <th className="p-3">Count</th>
                  <th className="p-3">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.cohorts.map(c => (
                  <tr key={c.label} className="border-b dark:border-gray-700">
                    <td className="p-3">{c.label}</td>
                    <td className="p-3">{c.count}</td>
                    <td className="p-3 font-medium">{naira(c.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'schedule' && (
        <>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-3">Installment</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Days Late</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(s => (
                  <tr key={s.id} className="border-b dark:border-gray-700">
                    <td className="p-3 font-mono text-xs">{s.id.slice(0, 8)}...</td>
                    <td className="p-3">{new Date(s.dueDate).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{naira(s.amount)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === 'paid' ? 'bg-green-100 text-green-700' :
                        s.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{s.status}</span>
                    </td>
                    <td className="p-3">{s.daysLate > 0 ? `${s.daysLate}d` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
