import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Card, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

interface LoginEntry {
  id: string
  ipAddress: string | null
  userAgent: string | null
  device: string | null
  location: string | null
  success: boolean
  reason: string | null
  createdAt: string
}

interface ActivityEntry {
  id: string
  action: string
  details: Record<string, any> | null
  createdAt: string
}

const actionLabels: Record<string, { label: string; icon: string; color: string }> = {
  login: { label: 'Logged in', icon: '🔑', color: 'text-blue-600' },
  logout: { label: 'Logged out', icon: '🚪', color: 'text-gray-600' },
  savings_deposit: { label: 'Savings deposit', icon: '💰', color: 'text-green-600' },
  savings_withdrawal: { label: 'Savings withdrawal', icon: '🏦', color: 'text-red-600' },
  loan_apply: { label: 'Loan application', icon: '📋', color: 'text-purple-600' },
}

export function ActivityLog() {
  const [logs, setLogs] = useState<LoginEntry[]>([])
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [tab, setTab] = useState<'all' | 'logins' | 'actions'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    api.post('/auth/login-history').then((r) => setLogs(r.data))
    api.get('/users/me/activity').then((r) => setActivities(r.data.data))
  }, [])

  const combined = [
    ...logs.map((l) => ({
      id: l.id,
      date: l.createdAt,
      type: 'login' as const,
      label: l.success ? 'Successful login' : 'Failed login attempt',
      detail: l.success ? '' : l.reason || '',
      status: l.success ? 'success' : 'failed',
      ip: l.ipAddress,
      userAgent: l.userAgent,
    })),
    ...activities.map((a) => {
      const info = actionLabels[a.action] ?? { label: a.action.replace(/_/g, ' '), icon: '•', color: 'text-gray-600' }
      return {
        id: a.id,
        date: a.createdAt,
        type: 'activity' as const,
        label: info.label,
        detail: a.details ? Object.values(a.details).slice(0, 2).join(' · ') : '',
        status: 'completed',
        icon: info.icon,
        color: info.color,
      }
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filtered = tab === 'all' ? combined : tab === 'logins' ? combined.filter((c) => c.type === 'login') : combined.filter((c) => c.type === 'activity')

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const changeTab = (t: typeof tab) => { setTab(t); setPage(1) }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold dark:text-gray-100">Security Activity</h2>

      <div className="flex gap-2">
        {(['all', 'logins', 'actions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t === 'all' ? 'All Activity' : t === 'logins' ? 'Login History' : 'Actions'}
          </button>
        ))}
      </div>

      <Card>
        <CardTitle className="text-sm font-medium text-gray-500 mb-4">
          {tab === 'all' ? 'Recent Activity' : tab === 'logins' ? 'Login History' : 'Account Actions'}
        </CardTitle>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">No activity recorded yet</p>
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((entry, i) => (
                <div key={entry.id} className={`flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0 rounded-lg px-2 ${
                  [
                    'bg-sky-50/40 dark:bg-sky-950/10',
                    'bg-emerald-50/40 dark:bg-emerald-950/10',
                    'bg-amber-50/40 dark:bg-amber-950/10',
                    'bg-fuchsia-50/40 dark:bg-fuchsia-950/10',
                    'bg-violet-50/40 dark:bg-violet-950/10',
                  ][i % 5]
                }`}>
                  {entry.type === 'activity' ? (
                    <span className="text-lg shrink-0 mt-0.5">{entry.icon}</span>
                  ) : (
                    <span className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${entry.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${entry.type === 'activity' ? entry.color : ''}`}>{entry.label}</span>
                      {entry.type === 'login' && (
                        <Badge variant={entry.status === 'success' ? 'success' : 'danger'}>
                          {entry.status}
                        </Badge>
                      )}
                    </div>
                    {entry.detail && <p className="text-xs text-gray-500 mt-0.5">{entry.detail}</p>}
                    {entry.type === 'login' && entry.ip && (
                      <p className="text-xs text-gray-400 mt-0.5">IP: {entry.ip}</p>
                    )}
                    {entry.type === 'login' && entry.userAgent && (
                      <p className="text-xs text-gray-400 truncate max-w-md">{entry.userAgent}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded text-sm disabled:opacity-50" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <button className="px-3 py-1 border rounded text-sm disabled:opacity-50" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
