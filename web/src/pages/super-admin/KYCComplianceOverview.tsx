import { useEffect, useState } from 'react'
import { api } from '../../api/client'

interface KycSubmission {
  id: string
  userId: string
  provider: string
  reference: string
  status: string
  rejectionReason: string | null
  submittedAt: string
  processedAt: string | null
}

interface KycOverview {
  total: number
  approved: number
  rejected: number
  pending: number
  recentSubmissions: KycSubmission[]
}

export function KYCComplianceOverview() {
  const [data, setData] = useState<KycOverview | null>(null)

  useEffect(() => {
    api.get('/admin/super/kyc-overview').then(r => setData(r.data))
  }, [])

  if (!data) return <div className="p-6">Loading...</div>

  const stats = [
    { label: 'Total Submissions', value: data.total, color: 'text-gray-900', border: 'border-indigo-500' },
    { label: 'Approved', value: data.approved, color: 'text-green-600', border: 'border-emerald-500' },
    { label: 'Rejected', value: data.rejected, color: 'text-red-600', border: 'border-red-500' },
    { label: 'Pending Review', value: data.pending, color: 'text-yellow-600', border: 'border-amber-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">KYC Compliance Overview</h1>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl border bg-white p-4 dark:bg-gray-800 dark:border-gray-700 ${s.border}`}>
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="p-4 border-b font-semibold dark:border-gray-700">Recent Submissions</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700 text-left">
              <th className="p-3">Reference</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.recentSubmissions.map((s, i) => (
              <tr key={s.id} className={`border-b dark:border-gray-700 ${
                [
                  'bg-sky-50 dark:bg-sky-950/20',
                  'bg-emerald-50 dark:bg-emerald-950/20',
                  'bg-amber-50 dark:bg-amber-950/20',
                  'bg-fuchsia-50 dark:bg-fuchsia-950/20',
                  'bg-violet-50 dark:bg-violet-950/20',
                ][i % 5]
              }`}>
                <td className="p-3 font-mono text-xs">{s.reference}</td>
                <td className="p-3 capitalize">{s.provider}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    s.status === 'approved' ? 'bg-green-100 text-green-700' :
                    s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{s.status}</span>
                </td>
                <td className="p-3 text-gray-500">{new Date(s.submittedAt).toLocaleDateString()}</td>
                <td className="p-3 text-gray-500">{s.rejectionReason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
