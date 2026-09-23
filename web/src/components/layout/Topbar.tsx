import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../stores/auth.store'
import { useTheme } from '../../stores/theme.store'
import { useSidebar } from '../../stores/sidebar.store'
import { api } from '../../api/client'
import { Menu, Bell, Sun, Moon, LogOut } from 'lucide-react'

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
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#EDE2D3] bg-white px-3 lg:gap-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
        <button
          onClick={toggleMobile}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#6B5245] transition-colors hover:bg-[#EDE2D3] hover:text-[#23150F] cursor-pointer lg:hidden"
          title="Toggle menu"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <span className="h-4 w-px bg-[#EDE2D3]" />
          <span className="text-sm font-bold capitalize tracking-tight text-[#2C1B13]">
            {user.role.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 lg:gap-3">
        {user?.role === 'individual' && (
          <button
            onClick={() => navigate('/individual/notifications')}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#6B5245] transition-colors hover:bg-[#EDE2D3] hover:text-[#23150F] cursor-pointer"
            title="Notifications"
            aria-label={`Notifications${unreadCount > 0 ? `${unreadCount} unread` : ''}`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#B3261E] text-[9px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={toggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#6B5245] transition-colors hover:bg-[#EDE2D3] hover:text-[#23150F] cursor-pointer"
          title="Toggle theme"
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <span className="hidden rounded-full bg-[#176B5B]/10 px-3 py-1.5 text-xs font-bold capitalize text-[#176B5B] lg:inline-block">
          {user?.role?.replace(/_/g, ' ')}
        </span>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#E7DCCB] px-3.5 py-2 text-xs font-semibold text-[#6B5245] transition-colors hover:border-[#B3261E]/40 hover:bg-[#B3261E]/5 hover:text-[#B3261E] cursor-pointer"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  )
}