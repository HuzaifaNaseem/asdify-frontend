import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { DocumentTitle } from '../../components/common/DocumentTitle'
import { Alert } from '../../components/ui/Alert'
import { PageContainer } from '../../components/ui/PageContainer'
import { Spinner } from '../../components/ui/Spinner'
import { writeTokens } from '../../services/authStorage'
import { useAuth } from '../../state/AuthContext'

function safePath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
}

/**
 * Landing page for the Google redirect flow. The backend redirects here with
 * the session tokens (or an error) in the URL fragment; we store them, refresh
 * the user, and continue to the dashboard.
 */
export function GoogleCallbackPage() {
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  // Parse the fragment once, synchronously, during the first render.
  const [handoff] = useState(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    return {
      error: params.get('error') || '',
      access: params.get('access_token') || '',
      refresh: params.get('refresh_token') || '',
      dest: safePath(params.get('redirect')),
    }
  })
  const [error, setError] = useState(
    handoff.error || (!handoff.access || !handoff.refresh ? 'Sign-in details were missing. Please try again.' : ''),
  )
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || error) return
    ran.current = true

    writeTokens(handoff.access, handoff.refresh)
    // Strip the tokens out of the URL so they don't linger in history.
    window.history.replaceState(null, '', window.location.pathname)
    refreshUser()
      .then(() => navigate(handoff.dest, { replace: true }))
      .catch(() => setError('Could not complete sign-in. Please try again.'))
  }, [error, handoff, refreshUser, navigate])

  return (
    <>
      <DocumentTitle title="Signing in — Asdify" />
      <PageContainer className="page-narrow">
        <div className="auth-card">
          {error ? (
            <>
              <h1 className="page-title">Sign-in failed</h1>
              <Alert variant="error" title="Could not sign in with Google">
                {error}
              </Alert>
              <p className="auth-muted">
                <Link to="/login">Back to sign in</Link>
              </p>
            </>
          ) : (
            <div className="profile-page__loading">
              <Spinner label="Completing Google sign-in…" />
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
}
