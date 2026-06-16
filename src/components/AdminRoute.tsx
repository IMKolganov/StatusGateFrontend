import { Navigate, useLocation } from 'react-router-dom'
import { hasAdminPanelAccess } from '../auth/roles'
import { useAuth } from '../auth/useAuth'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { account, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="center-message">Loading...</div>
  }

  if (!account) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasAdminPanelAccess(account)) {
    return <Navigate to="/" replace />
  }

  return children
}
