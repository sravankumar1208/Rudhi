import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store'

/**
 * Wraps protected routes. Redirects unauthenticated users to /auth.
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) return null // AuthProvider handles the spinner

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <Outlet />
}
