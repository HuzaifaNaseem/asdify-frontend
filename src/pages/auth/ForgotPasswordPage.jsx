import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { DocumentTitle } from '../../components/common/DocumentTitle'
import { MetaDescription } from '../../components/common/MetaDescription'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageContainer } from '../../components/ui/PageContainer'
import { forgotPassword, resetPasswordWithOtp } from '../../services/authService'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onRequestOtp(e) {
    e.preventDefault()
    setError('')
    setStatus('')
    setPending(true)
    try {
      const data = await forgotPassword(email)
      setStatus(data.message ?? 'Verification code sent.')
      setStep('otp')
    } catch (err) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  async function onResetPassword(e) {
    e.preventDefault()
    setError('')
    setStatus('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setPending(true)
    try {
      const data = await resetPasswordWithOtp(email, otp.trim(), password)
      setStatus(data.message ?? 'Password updated.')
      setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (err) {
      setError(err.message ?? 'Could not reset password.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <DocumentTitle title="Forgot password — Asdify" />
      <MetaDescription content="Reset your Asdify password using a verification code sent to your email." />
      <PageContainer className="page-narrow">
        <div className="auth-card">
          <h1 className="page-title">{step === 'email' ? 'Reset your password' : 'Enter verification code'}</h1>
          <p className="page-lead calm-intro">
            {step === 'email'
              ? 'Enter the email address linked to your account. We will send a one-time code if it is registered.'
              : `We sent a 6-digit code to ${email}. Enter it below with your new password.`}
          </p>

          {error ? (
            <Alert variant="error" title="Could not continue">
              {error}
            </Alert>
          ) : null}
          {status ? (
            <Alert variant="success" title={step === 'otp' ? 'Code sent' : 'All set'}>
              {status}
            </Alert>
          ) : null}

          {step === 'email' ? (
            <form className="stack stack--form" onSubmit={onRequestOtp} noValidate>
              <Input
                id="forgot-email"
                name="email"
                type="email"
                label="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={pending}>
                {pending ? 'Sending…' : 'Send verification code'}
              </Button>
            </form>
          ) : (
            <form className="stack stack--form" onSubmit={onResetPassword} noValidate>
              <Input
                id="forgot-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                label="Verification code"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
              <Input
                id="forgot-password"
                name="password"
                type="password"
                label="New password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                id="forgot-confirm"
                name="confirm"
                type="password"
                label="Confirm new password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <Button type="submit" disabled={pending}>
                {pending ? 'Updating…' : 'Update password'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setPassword('')
                  setConfirm('')
                  setStatus('')
                  setError('')
                }}
              >
                Use a different email
              </Button>
            </form>
          )}

          <p className="auth-muted">
            Return to <Link to="/login">Sign in</Link>
          </p>
        </div>
      </PageContainer>
    </>
  )
}
