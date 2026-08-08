import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../stores/auth.store'
import { useTheme } from '../../stores/theme.store'
import { useSidebar } from '../../stores/sidebar.store'
import { api } from '../../api/client'

export function Topbar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { toggleMobile } = useSidebar()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user?.role === 'individual') {
      api.get('/notifications/unread-count').then((r) => setUnreadCount(r.data)).catch(() => {})
    }
  }, [user])

  if (!user) return null

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white dark:bg-gray-900 dark:border-gray-700 px-3 lg:px-6 gap-2 lg:gap-4">
      <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 cursor-pointer shrink-0"
          title="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-1 lg:gap-4 shrink-0">
        {user?.role === 'individual' && (
          <button
            onClick={() => navigate('/individual/notifications')}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 cursor-pointer"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 cursor-pointer"
          title="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <span className="hidden lg:inline rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
          {user?.role?.replace('_', ' ')}
        </span>
        <button
          onClick={logout}
          className="text-xs lg:text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
