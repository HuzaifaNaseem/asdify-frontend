import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { DocumentTitle } from '../../components/common/DocumentTitle'
import { MetaDescription } from '../../components/common/MetaDescription'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageContainer } from '../../components/ui/PageContainer'
import { useAuth } from '../../state/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const from = location.state?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const registered = Boolean(location.state?.registered)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setPending(true)
    try {
      await login(email, password, from)
    } catch (err) {
      setError(err.message ?? 'Could not sign in.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <DocumentTitle title="Sign in — Asdify" />
      <MetaDescription content="Sign in to Asdify to continue screenings, view history, or access your clinical workspace." />
      <PageContainer className="page-narrow">
        <div className="auth-card">
          <h1 className="page-title">Welcome back</h1>
          <p className="page-lead calm-intro">
            Sign in with the email you used to register. If you are a clinician, your account must be approved before access is
            granted.
          </p>

          {registered ? (
            <Alert variant="success" title="Account ready">
              Your account is ready. Sign in whenever you feel comfortable.
            </Alert>
          ) : null}

          {location.state?.message ? (
            <Alert variant="info" title="Sign in again">
              {location.state.message}
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="error" title="Could not sign in">
              {error}
            </Alert>
          ) : null}

          <form className="stack stack--form" onSubmit={onSubmit} noValidate>
            <Input
              id="login-email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="login-password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="auth-form-aside">
              <Link to="/forgot-password" className="auth-form-aside__link">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="auth-muted">
            New to Asdify? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </PageContainer>
    </>
  )
}
