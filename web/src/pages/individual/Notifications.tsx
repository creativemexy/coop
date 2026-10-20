import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Bell, BellRing, CheckCircle2, AlertTriangle, XCircle, MailOpen, CheckCheck, ChevronRight,
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string | null
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

const typeMeta = (t: string) => {
  switch (t) {
    case 'success':
      return { icon: CheckCircle2, tile: 'bg-[#176B5B]/10 text-[#176B5B]', badge: 'bg-[#176B5B]/10 text-[#176B5B]' }
    case 'warning':
      return { icon: AlertTriangle, tile: 'bg-[#E4A42A]/15 text-[#8A5A00]', badge: 'bg-[#E4A42A]/15 text-[#8A5A00]' }
    case 'error':
      return { icon: XCircle, tile: 'bg-[#B3261E]/10 text-[#B3261E]', badge: 'bg-[#B3261E]/10 text-[#B3261E]' }
    case 'info':
      return { icon: BellRing, tile: 'bg-[#9D4824]/10 text-[#9D4824]', badge: 'bg-[#9D4824]/10 text-[#9D4824]' }
    default:
      return { icon: BellRing, tile: 'bg-[#EDE2D3] text-[#6B5245]', badge: 'bg-[#EDE2D3] text-[#6B5245]' }
  }
}

const ghostSm =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7DCCB] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B5245] transition hover:bg-[#FFF9EF] hover:text-[#2C1B13] cursor-pointer'

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  const load = useCallback(() => {
    api.get('/notifications').then((r) => {
      setNotifications(Array.isArray(r.data?.data) ? r.data.data : [])
      setUnread(typeof r.data?.unread === 'number' ? r.data.unread : 0)
    }).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const dismiss = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
      setUnread((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      load()
    } catch {}
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B79B6B]">Inbox</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2C1B13]">Notifications</h1>
          <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">
            {unread > 0
              ? <>You have <strong className="text-[#8A5A00]">{unread} unread</strong> notification{unread !== 1 ? 's' : ''}.</>
              : notifications.length > 0 ? 'You are all caught up.' : 'Your updates will appear here.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className={ghostSm}>
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <Bell size={22} className="text-[#176B5B]" />
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E7DCCB] bg-white/60 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#176B5B]/10">
            <MailOpen size={26} className="text-[#176B5B]" />
          </div>
          <p className="font-bold text-[#2C1B13]">No notifications yet</p>
          <p className="max-w-sm text-sm text-[#6B5245]">Payment confirmations, KYC updates, and account alerts will land here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const meta = typeMeta(n.type)
            const Icon = meta.icon
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                  n.isRead ? 'border-[#E7DCCB]' : 'border-[#E4A42A]/50 bg-gradient-to-br from-[#F7D674]/15 to-white'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.tile}`}>
                  <Icon size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-bold text-[#2C1B13] ${n.isRead ? '' : ''}`}>{n.title}</p>
                    {!n.isRead && (
                      <span className="rounded-full bg-[#E4A42A]/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#8A5A00]">New</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>{n.type}</span>
                  </div>
                  {n.message && <p className="mt-1 text-sm leading-relaxed text-[#6B5245]">{n.message}</p>}
                  <p className="mt-1.5 text-xs text-[#B79B6B]">{relativeTime(n.createdAt)}</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {n.link && (
                    <button type="button" onClick={() => navigate(n.link!)} className={ghostSm}>
                      View <ChevronRight size={13} />
                    </button>
                  )}
                  {!n.isRead && (
                    <button type="button" onClick={() => dismiss(n.id)} className="text-xs font-semibold text-[#B79B6B] transition hover:text-[#8A5A00] cursor-pointer">
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
