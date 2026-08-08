import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { naira } from '../../lib/utils'

const PAGE_SIZE = 10

interface MemberStatementRow {
  date: string
  type: string
  amount: number
  description: string
  status: string
  reference: string
}

export function AdminMemberStatements() {
  const [orgUsers, setOrgUsers] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [statements, setStatements] = useState<MemberStatementRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.get('/admin/users-by-org').then(r => {
      const orgs = r.data || []
      const flat: { id: string; firstName: string; lastName: string; email: string }[] = []
      for (const org of orgs) {
        for (const u of (org.users || [])) {
          flat.push(u)
        }
      }
      setOrgUsers(flat)
    })
  }, [])

  const fetchStatements = async () => {
    if (!selectedUserId) return
    setLoading(true)
    const params = new URLSearchParams({ userId: selectedUserId })
    api.get(`/admin/tenants/reports/member-statement?${params}`).then(r => {
      setStatements(r.data?.transactions || [])
      setPage(1)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { if (selectedUserId) fetchStatements() }, [selectedUserId])

  const totalPages = Math.max(1, Math.ceil((statements?.length || 0) / PAGE_SIZE))
  const paginated = useMemo(() => {
    if (!statements) return []
    const start = (page - 1) * PAGE_SIZE
    return statements.slice(start, start + PAGE_SIZE)
  }, [statements, page])

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages))
  }

  const exportCsv = () => {
    if (!statements) return
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Reference']
    const rows = statements.map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.description,
      t.amount,
      t.reference,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'member-statement.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Member Statements</h2>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Select Member</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
            <option value="">Choose a member...</option>
            {orgUsers.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
            ))}
          </select>
        </div>
        {statements && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" onClick={exportCsv}>Export CSV</button>
        )}
      </div>

      {loading && <div className="text-gray-500">Loading...</div>}

      {statements && (
        <>
          <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Reference</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t, i) => (
                  <tr key={i} className="border-b dark:border-gray-700">
                    <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="p-3 capitalize whitespace-nowrap">{t.type.replace(/_/g, ' ') || '—'}</td>
                    <td className="p-3">{t.description || '—'}</td>
                    <td className={`p-3 font-medium whitespace-nowrap ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{naira(Number(t.amount || 0))}</td>
                    <td className="p-3 font-mono text-xs">{t.reference || '—'}</td>
                  </tr>
                ))}
                {statements.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">No transactions found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {statements.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, statements.length)} of {statements.length}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`px-3 py-1.5 text-sm rounded-lg border cursor-pointer ${
                        p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
