import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store'

/**
 * Wraps the admin route. Requires authentication AND role === 'admin'.
 */
export const AdminRoute = () => {
  const { isAuthenticated, isLoading, role } = useAuthStore()

  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (role !== 'admin') {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
