import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../stores/auth.store'
import { DesignCredit } from '../../components/layout/DesignCredit'
import { usePageMeta } from '../../lib/seo'

const ROLE_ROUTES: Record<string, string> = {
  apex_business_manager: '/apex-bm',
}
const rolePath = (role: string) => ROLE_ROUTES[role] ?? `/${role.replace(/_/g, '-')}`

export function SocialCallback() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const restoreSession = useAuth((s) => s.restoreSession)

  usePageMeta({
    title: 'Completing Sign In | FENAC COOP',
    description: 'Completing your FENAC COOP sign in.',
    noindex: true,
  })

  useEffect(() => {
    if (user) {
      navigate(rolePath(user.role), { replace: true })
      return
    }
    let cancelled = false
    // No tokens arrive in the URL. The backend delivered the refresh token as
    // an HttpOnly cookie during the OAuth redirect; we restore the session via
    // the cookie-backed refresh flow.
    restoreSession().then(() => {
      if (cancelled) return
      const u = useAuth.getState().user
      navigate(u ? rolePath(u.role) : '/login', { replace: true })
    })
    return () => {
      cancelled = true
    }
  }, [user, navigate, restoreSession])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div>
        <p className="text-gray-500">Completing sign in...</p>
        <DesignCredit className="mt-6 text-center" />
      </div>
    </div>
  )
}