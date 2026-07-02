import { Navigate } from 'react-router-dom'

import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../state/AuthContext'

function dashboardPath(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'doctor') return '/doctor/dashboard'
  return '/dashboard'
}

/** Auth pages (login/register/forgot-password) — bounce already-signed-in users to their dashboard. */
export function GuestOnlyRoute({ children }) {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div className="page-container page-container--centered">
        <Spinner label="Loading your session…" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={dashboardPath(user.role)} replace />
  }

  return children
}
