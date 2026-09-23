import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { DesignCredit } from './DesignCredit'
import { useBranding } from '../../stores/branding.store'
import { useRolePermissions } from '../../stores/role-permissions.store'

export function AppLayout() {
  const { load, loaded } = useBranding()
  const { load: loadPerms, loaded: permsLoaded } = useRolePermissions()
  useEffect(() => { if (!loaded) load() }, [loaded, load])
  useEffect(() => { if (!permsLoaded) loadPerms() }, [permsLoaded, loadPerms])
  return (
    <div className="flex h-screen bg-[#FFF9EF]">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main id="main-content" className="flex-1 overflow-y-auto p-3 lg:p-6">
          <Outlet />
        </main>
        <div className="shrink-0 border-t border-[#EDE2D3] bg-white px-4 py-2">
          <DesignCredit className="text-center" />
        </div>
      </div>
    </div>
  )
}
