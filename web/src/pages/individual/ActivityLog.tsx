import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../../api/client'
import {
  ShieldCheck, LogIn, LogOut, PiggyBank, Landmark, FileText, Activity, Ban,
  ChevronLeft, ChevronRight, Fingerprint, Monitor, MapPin,
} from 'lucide-react'

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

const actionMeta = (action: string) => {
  switch (action) {
    case 'login':
      return { label: 'Logged in', icon: LogIn, tile: 'bg-[#176B5B]/10 text-[#176B5B]' }
    case 'logout':
      return { label: 'Logged out', icon: LogOut, tile: 'bg-[#EDE2D3] text-[#6B5245]' }
    case 'savings_deposit':
      return { label: 'Savings deposit', icon: PiggyBank, tile: 'bg-[#176B5B]/10 text-[#176B5B]' }
    case 'savings_withdrawal':
      return { label: 'Savings withdrawal', icon: Landmark, tile: 'bg-[#E4A42A]/15 text-[#8A5A00]' }
    case 'loan_apply':
      return { label: 'Loan application', icon: FileText, tile: 'bg-[#9D4824]/10 text-[#9D4824]' }
    default:
      return { label: action.replace(/_/g, ' '), icon: Activity, tile: 'bg-[#EDE2D3] text-[#6B5245]' }
  }
}

const pagerCls =
  'inline-flex h-8 items-center justify-center gap-1 rounded-full border border-[#E7DCCB] bg-white px-3 text-xs font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] hover:text-[#2C1B13] disabled:opacity-40 disabled:pointer-events-none cursor-pointer'

function PaginationBar({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDE2D3] px-4 py-3.5">
      <p className="text-xs font-medium text-[#6B5245]">
        Showing <span className="font-bold text-[#2C1B13]">{from}</span>–<span className="font-bold text-[#2C1B13]">{to}</span> of{' '}
        <span className="font-bold text-[#2C1B13]">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button className={pagerCls} disabled={safePage <= 1} onClick={() => onChange(safePage - 1)}>
          <ChevronLeft size={14} /> Previous
        </button>
        <button className={pagerCls} disabled={safePage >= totalPages} onClick={() => onChange(safePage + 1)}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function MetaChip({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF9EF] px-2.5 py-1 text-xs font-medium text-[#6B5245]">
      {icon} {text}
    </span>
  )
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
      location: l.location,
    })),
    ...activities.map((a) => {
      const info = actionMeta(a.action)
      return {
        id: a.id,
        date: a.createdAt,
        type: 'activity' as const,
        label: info.label,
        detail: a.details ? Object.values(a.details).slice(0, 2).join(' · ') : '',
        status: 'completed',
        icon: info.icon,
        tile: info.tile,
      }
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filtered = tab === 'all' ? combined : tab === 'logins' ? combined.filter((c) => c.type === 'login') : combined.filter((c) => c.type === 'activity')

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const changeTab = (t: typeof tab) => { setTab(t); setPage(1) }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'all', label: 'All Activity' },
    { key: 'logins', label: 'Login History' },
    { key: 'actions', label: 'Actions' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Security & Monitoring</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Security Activity</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            Every login and account action recorded on your profile.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
          <ShieldCheck size={22} className="text-[#176B5B]" />
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-full border border-[#E7DCCB] bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition cursor-pointer ${
              tab === t.key
                ? 'bg-[#176B5B] text-[#FFF9EF] shadow-sm'
                : 'text-[#6B5245] hover:text-[#2C1B13]'
            }`}
          >
            {t.label}
            {t.key === 'all' && filtered.length > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? 'bg-[#FFF9EF]/20' : 'bg-[#EDE2D3] text-[#6B5245]'}`}>
                {filtered.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-[#E7DCCB] bg-white shadow-sm">
        <div className="border-b border-[#EDE2D3] px-6 py-4">
          <p className="font-black tracking-[-0.02em] text-[#2C1B13]">
            {tab === 'all' ? 'Recent Activity' : tab === 'logins' ? 'Login History' : 'Account Actions'}
          </p>
          <p className="text-xs text-[#6B5245]">Newest first</p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDE2D3]/60">
              <Activity size={26} className="text-[#6B5245]" />
            </div>
            <p className="font-bold text-[#2C1B13]">No activity recorded yet</p>
            <p className="max-w-sm text-sm text-[#6B5245]">Your logins and account actions will show up here.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#EDE2D3]">
              {paged.map((entry) => {
                const isLogin = entry.type === 'login'
                return (
                  <div key={entry.id} className="flex items-start gap-4 px-6 py-4 transition hover:bg-[#FFF9EF]/70">
                    {isLogin ? (
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${entry.status === 'success' ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'}`}>
                        {entry.status === 'success' ? <LogIn size={17} /> : <Ban size={17} />}
                      </span>
                    ) : (
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${entry.tile}`}>
                        {(() => { const I = entry.icon; return <I size={17} /> })()}
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#2C1B13]">{entry.label}</p>
                        {isLogin && (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                            entry.status === 'success' ? 'bg-[#176B5B]/10 text-[#176B5B]' : 'bg-[#B3261E]/10 text-[#B3261E]'
                          }`}>
                            {entry.status}
                          </span>
                        )}
                      </div>
                      {entry.detail && <p className="mt-1 text-xs text-[#6B5245]">{entry.detail}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {isLogin && entry.ip && <MetaChip icon={<Fingerprint size={12} />} text={entry.ip} />}
                        {isLogin && entry.location && <MetaChip icon={<MapPin size={12} />} text={entry.location} />}
                        {isLogin && entry.userAgent && <MetaChip icon={<Monitor size={12} />} text={entry.userAgent} />}
                      </div>
                    </div>

                    <p className="shrink-0 text-right text-xs text-[#6B5245]">
                      {new Date(entry.date).toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
            <PaginationBar page={page} total={filtered.length} pageSize={pageSize} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
