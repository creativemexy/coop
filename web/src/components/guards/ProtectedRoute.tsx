import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../stores/auth.store'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const ROLE_ROUTES: Record<string, string> = {
    apex_business_manager: '/apex-bm',
  }
  const rolePath = (role: string) => ROLE_ROUTES[role] ?? `/${role.replace(/_/g, '-')}`

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={rolePath(user.role)} replace />
  }

  return <Outlet />
}
