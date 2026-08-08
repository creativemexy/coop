import { create } from 'zustand'
import { api } from '../api/client'

type RoleConfig = {
  disabledFeatures: string[]
  disabledMenuItems: string[]
}

type RolePermissionsState = {
  config: Record<string, RoleConfig>
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
  isMenuDisabled: (role: string, label: string) => boolean
  isFeatureDisabled: (role: string, feature: string) => boolean
}

export const useRolePermissions = create<RolePermissionsState>((set, get) => ({
  config: {},
  loaded: false,
  loading: false,
  load: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const { data } = await api.get('/admin/super/role-permissions')
      set({ config: data ?? {}, loaded: true, loading: false })
    } catch {
      set({ loaded: true, loading: false })
    }
  },
  isMenuDisabled: (role, label) => {
    const cfg = get().config[role]
    if (!cfg) return false
    return cfg.disabledMenuItems.includes(label)
  },
  isFeatureDisabled: (role, feature) => {
    const cfg = get().config[role]
    if (!cfg) return false
    return cfg.disabledFeatures.includes(feature)
  },
}))
