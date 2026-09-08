import { create } from 'zustand'

/**
 * Cookie & tracking consent.
 *
 * Coop BNPL's web console sets no advertising, analytics or marketing cookies.
 * The only HTTP cookie set today is `csrf-secret` (a strictly-necessary
 * security cookie issued by the API). This store lets visitors record their
 * preference and keeps a first-party record (`coop_consent`) so the banner is
 * not shown again. If future optional trackers are added, they MUST be gated
 * behind `allowOptional` before any code loads them.
 */

const CONSENT_COOKIE = 'coop_consent'
const CONSENT_VERSION = 1
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year

export type ConsentChoice = 'accepted' | 'declined'
export type ConsentState = 'unknown' | 'accepted' | 'declined'

export interface ConsentPrefs {
  /** Strictly necessary — always on (CSRF/security). */
  necessary: boolean
  /** Optional categories. No optional trackers exist today; wired for the future. */
  analytics: boolean
  ads: boolean
  marketing: boolean
  version: number
  decidedAt: string
}

const defaultPrefs: ConsentPrefs = {
  necessary: true,
  analytics: false,
  ads: false,
  marketing: false,
  version: CONSENT_VERSION,
  decidedAt: '',
}

function parseConsent(raw: string | null): ConsentPrefs | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ConsentPrefs
    if (parsed.version !== CONSENT_VERSION) return null
    return { ...defaultPrefs, ...parsed }
  } catch {
    return null
  }
}

function readCookie(): string | null {
  const match = document.cookie.split('; ').find((part) => part.startsWith(`${CONSENT_COOKIE}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

function writeCookie(value: string, days: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${days * 24 * 60 * 60}${secure}`
}

interface ConsentStateShape {
  state: ConsentState
  prefs: ConsentPrefs
  /** Whether code may load optional (analytics/ads/marketing) technology right now. */
  canLoadOptional: boolean
  init: () => void
  acceptAll: () => void
  decline: () => void
}

export const useConsent = create<ConsentStateShape>((set, get) => ({
  state: 'unknown',
  prefs: { ...defaultPrefs },
  canLoadOptional: false,

  init: () => {
    if (get().state !== 'unknown') return
    const prefs = parseConsent(readCookie())
    if (prefs) {
      // Any optional category enabled => treated as informed acceptance.
      const anyOptional = prefs.analytics || prefs.ads || prefs.marketing
      set({
        state: anyOptional ? 'accepted' : 'declined',
        prefs,
        canLoadOptional: anyOptional,
      })
    } else {
      // No recorded preference — only strict necessity is active; nothing optional may load.
      set({ state: 'unknown', canLoadOptional: false })
    }
  },

  acceptAll: () => {
    // Accepting records consent. No optional trackers exist today, so nothing
    // new is loaded — this just captures informed consent for the audit trail.
    const prefs: ConsentPrefs = {
      ...defaultPrefs,
      decidedAt: new Date().toISOString(),
    }
    writeCookie(JSON.stringify(prefs), MAX_AGE_SECONDS / 86400)
    set({ state: 'accepted', prefs, canLoadOptional: true })
  },

  decline: () => {
    const prefs: ConsentPrefs = {
      ...defaultPrefs,
      analytics: false,
      ads: false,
      marketing: false,
      decidedAt: new Date().toISOString(),
    }
    writeCookie(JSON.stringify(prefs), MAX_AGE_SECONDS / 86400)
    set({ state: 'declined', prefs, canLoadOptional: false })
  },
}))