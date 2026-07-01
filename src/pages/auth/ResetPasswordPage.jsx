import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { DocumentTitle } from '../../components/common/DocumentTitle'
import { MetaDescription } from '../../components/common/MetaDescription'
import { Alert } from '../../components/ui/Alert'
import { PageContainer } from '../../components/ui/PageContainer'

/** Legacy reset links redirect to the OTP-based forgot-password flow. */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')

  useEffect(() => {
    if (!token) return
    navigate('/forgot-password', { replace: true })
  }, [navigate, token])

  return (
    <>
      <DocumentTitle title="Choose a new password — Asdify" />
      <MetaDescription content="Reset your Asdify password using a verification code sent to your email." />
      <PageContainer className="page-narrow">
        <div className="auth-card">
          <h1 className="page-title">Password reset moved to email codes</h1>
          <Alert variant="info" title="Use verification code">
            Password reset now uses a 6-digit code sent to your email instead of a link.
          </Alert>
          <p className="auth-muted">
            <Link to="/forgot-password">Go to forgot password</Link> · <Link to="/login">Sign in</Link>
          </p>
        </div>
      </PageContainer>
    </>
  )
}
