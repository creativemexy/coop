import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../stores/auth.store'

const ROLE_ROUTES: Record<string, string> = {
  apex_business_manager: '/apex-bm',
}
const rolePath = (role: string) => ROLE_ROUTES[role] ?? `/${role.replace(/_/g, '-')}`

export function SocialCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithToken, user } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')
    if (token && refreshToken) {
      loginWithToken(token, refreshToken).then((u) => {
        navigate(rolePath(u.role), { replace: true })
      })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, loginWithToken])

  if (user) {
    navigate(rolePath(user.role), { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-gray-500">Completing sign in...</p>
    </div>
  )
}
