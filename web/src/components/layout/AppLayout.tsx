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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main id="main-content" className="flex-1 overflow-y-auto p-3 lg:p-6">
          <Outlet />
        </main>
        <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2">
          <DesignCredit className="text-center" />
        </div>
      </div>
    </div>
  )
}
