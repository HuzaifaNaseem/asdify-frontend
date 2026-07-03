import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { DocumentTitle } from '../../components/common/DocumentTitle'
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton'
import { MetaDescription } from '../../components/common/MetaDescription'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageContainer } from '../../components/ui/PageContainer'
import { useAuth } from '../../state/AuthContext'

const ROLES = [
  { value: 'parent', label: 'Parent / caregiver' },
  { value: 'doctor', label: 'Medical professional (requires approval)' },
]

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('parent')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!consent) {
      setError('Please confirm you agree to the Terms and Privacy Policy.')
      return
    }
    setPending(true)
    try {
      const data = await register({ full_name: fullName, email, password, role })
      if (role === 'parent') {
        navigate('/dashboard', { replace: true })
        return
      }
      navigate('/register/pending', { replace: true, state: { email: data.user?.email ?? email } })
    } catch (err) {
      setError(err.message ?? 'Could not register.')
    } finally {
      setPending(false)
    }
  }

  async function onGoogleToken(accessToken) {
    setError('')
    setPending(true)
    try {
      // Google sign-up always creates/uses a parent account.
      await loginWithGoogle(accessToken)
    } catch (err) {
      setError(err.message ?? 'Could not sign up with Google.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <DocumentTitle title="Create account — Asdify" />
      <MetaDescription content="Create an Asdify account as a parent/caregiver or as a clinician. Clinician accounts require administrator approval." />
      <PageContainer className="page-narrow">
        <div className="auth-card">
          <h1 className="page-title">Create a gentle, secure account</h1>
          <p className="page-lead calm-intro">
            Asdify supports parents and clinicians. Doctor accounts remain pending until an administrator approves them.
          </p>

          {error ? (
            <Alert variant="error" title="Please review">
              {error}
            </Alert>
          ) : null}

          <form className="stack stack--form" onSubmit={onSubmit} noValidate>
            <Input
              id="reg-name"
              name="full_name"
              label="Full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              id="reg-email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <fieldset className="ui-fieldset">
              <legend className="ui-label">I am signing up as</legend>
              <div className="stack stack--tight">
                {ROLES.map((r) => (
                  <label key={r.value} className="ui-radio-line">
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Input
              id="reg-password"
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Minimum 8 characters; production may require 10+ with upper, lower, and a digit."
              required
            />
            <Input
              id="reg-confirm"
              name="confirm"
              type="password"
              label="Confirm password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <label className="ui-check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
              <span>
                I agree to the <Link to="/privacy-policy">Privacy Policy</Link> and understand that Asdify provides screening
                support, not a clinical diagnosis.
              </span>
            </label>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          {role === 'parent' ? (
            <>
              <div className="auth-divider">or</div>
              <GoogleSignInButton
                onToken={onGoogleToken}
                onError={() => setError('Google sign-up failed. Please try again.')}
              />
            </>
          ) : null}

          <p className="auth-muted">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </PageContainer>
    </>
  )
}
