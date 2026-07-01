import { DocumentTitle } from '../components/common/DocumentTitle'
import { PageContainer } from '../components/ui/PageContainer'

export function PlaceholderPage({ title, description, documentTitle }) {
  return (
    <>
      <DocumentTitle title={documentTitle ?? `${title} — Asdify`} />
      <PageContainer>
        <div className="ui-card" style={{ marginTop: '2rem' }}>
          <h1 className="page-title">{title}</h1>
          <p className="page-lead">{description}</p>
          <p className="muted">This page ships in a later module — routing is active now.</p>
        </div>
      </PageContainer>
    </>
  )
}
