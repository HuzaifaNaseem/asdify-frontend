import { Link } from 'react-router-dom'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageContainer } from '../../components/ui/PageContainer'

export function UnauthorizedPage() {
  return (
    <>
      <DocumentTitle title="Asdify — Access denied" />
      <PageContainer>
        <EmptyState
          title="You do not have access"
          description="This area is restricted by role. Authentication and route guards will enforce this in Module 1."
          action={
            <>
              <Link to="/login" className="ui-btn ui-btn--primary">
                Log in
              </Link>
              <Link to="/" className="ui-btn ui-btn--secondary">
                Home
              </Link>
            </>
          }
        />
      </PageContainer>
    </>
  )
}
