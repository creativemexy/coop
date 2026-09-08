import { create } from 'zustand'
import { api } from '../api/client'

interface Branding {
  organizationName: string
  logoUrl: string | null
  primaryColor: string
  accentColor: string
}

interface BrandingState {
  branding: Branding
  loaded: boolean
  load: () => Promise<void>
  setName: (name: string) => Promise<void>
  uploadLogo: (file: File) => Promise<string>
  setColors: (primary: string, accent: string) => Promise<void>
}

function applyColors(p: string, a: string) {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', p)
  root.style.setProperty('--brand-accent', a)
}

const DEFAULTS = { organizationName: 'Coop BNPL', logoUrl: null, primaryColor: '#2563eb', accentColor: '#7c3aed' }

export const DEFAULT_LOGO = '/logo.jpg'

applyColors(DEFAULTS.primaryColor, DEFAULTS.accentColor)

export const useBranding = create<BrandingState>((set) => ({
  branding: { ...DEFAULTS },
  loaded: false,
  load: async () => {
    try {
      const { data } = await api.get('/branding')
      const b = { organizationName: data.organizationName, logoUrl: data.logoUrl, primaryColor: data.primaryColor || DEFAULTS.primaryColor, accentColor: data.accentColor || DEFAULTS.accentColor }
      if (b.logoUrl) {
        b.logoUrl = `${b.logoUrl}${b.logoUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
      }
      applyColors(b.primaryColor, b.accentColor)
      set({ branding: b, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },
  setName: async (name: string) => {
    await api.put('/branding/name', { name })
    set((s) => ({ branding: { ...s.branding, organizationName: name } }))
  },
  uploadLogo: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/branding/logo', form)
    const logoUrl = `${data.logoUrl}?v=${Date.now()}`
    set((s) => ({ branding: { ...s.branding, logoUrl } }))
    return logoUrl
  },
  setColors: async (primary: string, accent: string) => {
    await api.put('/branding/colors', { primaryColor: primary, accentColor: accent })
    applyColors(primary, accent)
    set((s) => ({ branding: { ...s.branding, primaryColor: primary, accentColor: accent } }))
  },
}))
