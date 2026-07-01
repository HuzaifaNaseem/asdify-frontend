import { Link } from 'react-router-dom'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageContainer } from '../../components/ui/PageContainer'

export function NotFoundPage() {
  return (
    <>
      <DocumentTitle title="Asdify — Page not found" />
      <PageContainer>
        <EmptyState
          title="Page not found"
          description="That URL does not exist or may have moved."
          action={
            <Link to="/" className="ui-btn ui-btn--primary">
              Go home
            </Link>
          }
        />
      </PageContainer>
    </>
  )
}
