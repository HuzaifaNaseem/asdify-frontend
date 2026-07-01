import { Link } from 'react-router-dom'

import { ApiStatus } from '../../components/common/ApiStatus'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { MetaDescription } from '../../components/common/MetaDescription'
import { IconArrowLeft } from '../../components/icons/DecorativeIcons'
import { PageContainer } from '../../components/ui/PageContainer'

export function ApiStatusPage() {
  return (
    <>
      <DocumentTitle title="Asdify — API Status" />
      <MetaDescription content="Check whether the Asdify frontend can reach the backend API and view the configured API base URL." />
      <PageContainer className="api-status-page">
        <p className="api-status-page__back">
          <Link to="/" className="text-link text-link--with-icon">
            <IconArrowLeft className="text-link__icon decorative-icon" />
            Back to home
          </Link>
        </p>
        <header className="api-status-page__header">
          <h1>API status</h1>
          <p className="api-status-page__lead">
            This page pings <code className="inline-code">/api/health</code> on the configured backend and shows
            whether the site is connected to the server.
          </p>
        </header>
        <ApiStatus />
      </PageContainer>
    </>
  )
}
