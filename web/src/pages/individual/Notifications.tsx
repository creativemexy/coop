import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'

interface Notification {
  id: string
  title: string
  message: string | null
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

const typeColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  success: 'success',
  warning: 'warning',
  error: 'danger',
  info: 'info',
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

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      load()
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      load()
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold dark:text-gray-100">Notifications</h2>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">No notifications yet</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.isRead ? '' : 'border-l-4 border-l-blue-500'}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {!n.isRead && <Badge variant="info">New</Badge>}
                    <Badge variant={typeColors[n.type] ?? 'default'}>{n.type}</Badge>
                  </div>
                  {n.message && <p className="text-sm text-gray-500 mt-1">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {n.link && (
                    <Button variant="ghost" size="sm" onClick={() => navigate(n.link!)}>View</Button>
                  )}
                  {!n.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>Dismiss</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
