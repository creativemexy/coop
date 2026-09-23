import { create } from 'zustand'
import { api, fetchCsrfToken, setAccessToken, refreshAccessToken } from '../api/client'

export type Role =
  | 'super_admin'
  | 'admin'
  | 'operational_admin'
  | 'customer_care'
  | 'accountant'
  | 'business_manager'
  | 'apex_business_manager'
  | 'bnpl_manager'
  | 'individual'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: Role
  kycStatus?: string
  isActive?: boolean
  createdAt?: string
  organizationId?: string
  apexOrganizationId?: string
  registrationFeePaid?: boolean
  notificationPreferences?: { email?: boolean; sms?: boolean; inApp?: boolean }
}

export interface LoginResult extends User {
  passwordChangeRequired?: boolean
}

export interface RegisterResponse {
  registrationFeeRequired: boolean
  registrationFeeAmount: number
  pendingUserId?: string
  user?: User
  accessToken?: string
  refreshToken?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (emailOrPhone: string, password: string) => Promise<LoginResult>
  loginWithToken: (accessToken: string, refreshToken: string) => Promise<User>
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; organizationCode?: string }) => Promise<RegisterResponse>
  completeFirstLogin: (emailOrPhone: string, currentPassword: string, newPassword: string) => Promise<LoginResult>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: async (emailOrPhone, password) => {
    const { data } = await api.post('/auth/login', { emailOrPhone, password })
    if (data.passwordChangeRequired) {
      return { ...data.user, passwordChangeRequired: true }
    }
    setAccessToken(data.accessToken)
    await fetchCsrfToken()
    set({ user: data.user, isAuthenticated: true })
    return data.user
  },

  completeFirstLogin: async (emailOrPhone, currentPassword, newPassword) => {
    await api.post('/auth/complete-first-login', { emailOrPhone, currentPassword, newPassword })
    return get().login(emailOrPhone, newPassword)
  },

  loginWithToken: async (accessToken) => {
    setAccessToken(accessToken)
    await fetchCsrfToken()
    const { data } = await api.get('/users/me')
    set({ user: data, isAuthenticated: true })
    return data
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    if (data.accessToken) {
      setAccessToken(data.accessToken)
      await fetchCsrfToken()
      set({ user: data.user, isAuthenticated: true })
    }
    return data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch { /* ignore */ }
    setAccessToken(null)
    sessionStorage.removeItem('csrf_token')
    set({ user: null, isAuthenticated: false })
  },

  restoreSession: async () => {
    try {
      await fetchCsrfToken()
      const refreshed = await refreshAccessToken()
      if (!refreshed) throw new Error('no session')
      const { data } = await api.get('/users/me')
      set({ user: data, isAuthenticated: true })
    } catch {
      setAccessToken(null)
      sessionStorage.removeItem('csrf_token')
      set({ user: null, isAuthenticated: false })
    }
  },

  refreshUser: async () => {
    try {
      const { data } = await api.get('/users/me')
      set({ user: data })
    } catch { /* ignore */ }
  },
}))
