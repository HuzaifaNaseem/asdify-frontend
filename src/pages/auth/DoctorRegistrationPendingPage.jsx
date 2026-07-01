import { Link, useLocation } from 'react-router-dom'

import { DocumentTitle } from '../../components/common/DocumentTitle'
import { MetaDescription } from '../../components/common/MetaDescription'
import { Alert } from '../../components/ui/Alert'
import { PageContainer } from '../../components/ui/PageContainer'

export function DoctorRegistrationPendingPage() {
  const location = useLocation()
  const email = typeof location.state?.email === 'string' ? location.state.email : null

  return (
    <>
      <DocumentTitle title="Application pending — Asdify" />
      <MetaDescription content="Your clinician account is waiting for administrator approval." />
      <PageContainer className="page-narrow">
        <div className="auth-card">
          <h1 className="page-title">Thank you for registering</h1>
          <p className="page-lead calm-intro">
            Clinician accounts are reviewed by a platform administrator before you can sign in. This helps us keep Asdify safe
            for families.
          </p>
          <Alert variant="success" title="Application received">
            Your details have been saved. You&apos;ll get access once an administrator approves your account
            {email ? (
              <>
                {' '}
                (<strong>{email}</strong>)
              </>
            ) : null}
            .
          </Alert>
          <p className="auth-muted">
            After approval, use <Link to="/login">Sign in</Link> with the password you chose.
          </p>
          <p>
            <Link to="/" className="ui-btn ui-btn--secondary">
              Back to home
            </Link>
          </p>
        </div>
      </PageContainer>
    </>
  )
}
