import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useBranding } from '../../stores/branding.store'
import { useRolePermissions } from '../../stores/role-permissions.store'

export function AppLayout() {
  const { load, loaded } = useBranding()
  const { load: loadPerms, loaded: permsLoaded } = useRolePermissions()
  useEffect(() => { if (!loaded) load() }, [loaded, load])
  useEffect(() => { if (!permsLoaded) loadPerms() }, [permsLoaded, loadPerms])
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
