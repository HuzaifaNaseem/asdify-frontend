import { Navigate, useLocation } from 'react-router-dom'

import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../state/AuthContext'

export function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="page-container page-container--centered">
        <Spinner label="Loading your session…" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
