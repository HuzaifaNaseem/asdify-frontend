import { Link } from 'react-router-dom'

import { IconArrowLeft } from '../../components/icons/DecorativeIcons'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { MetaDescription } from '../../components/common/MetaDescription'
import { PageContainer } from '../../components/ui/PageContainer'

export function PrivacyPolicyPage() {
  return (
    <>
      <DocumentTitle title="Privacy Policy — Asdify" />
      <MetaDescription content="Read how Asdify collects, uses, and protects caregiver, clinician, and child-related health data—with practical guidance on images, assessments, and your rights." />
      <PageContainer className="prose prose--calm">
        <h1 className="page-title page-title--serif">Privacy Policy</h1>
        <p className="page-lead calm-intro">
          Last updated: May 2026. This policy describes how Asdify handles personal, behavioral, and image data while Modules
          1–2 roll out. We will notify you thoughtfully when substantive changes occur.
        </p>

        <h2 className="prose-h2">What we collect</h2>
        <ul className="prose-list calm-intro">
          <li><strong>Account basics:</strong> name, email, role, authentication artifacts (hashed passwords, tokens).</li>
          <li><strong>Screening inputs:</strong> questionnaire answers, free-text notes you choose to share.</li>
          <li><strong>Optional images:</strong> uploads you explicitly provide for assisted review (PNG/JPG).</li>
          <li><strong>Technical metadata:</strong> timestamps, approximate device/browser info needed for security logs.</li>
        </ul>

        <h2 className="prose-h2">Why we use it</h2>
        <p className="calm-intro">
          Data powers your personalized history, shares results with the roles you authorize, and keeps the platform reliable.
          We do not sell personal health data. Analytics—when added—will prefer aggregated or de-identified forms.
        </p>

        <h2 className="prose-h2">How images &amp; clinical context stay private</h2>
        <p className="calm-intro">
          Images are health-adjacent and sensitive. They are transmitted over TLS in production, stored with access controls on
          the server, and never exposed via unauthenticated URLs. Only service components you permission can retrieve them.
        </p>

        <h2 className="prose-h2">Retention &amp; deletion</h2>
        <p className="calm-intro">
          Parents and admins can request deletion subject to legal or safety hold periods. Deleting an account removes access
          tokens immediately; backend purges continue Module-by-module as storage features mature.
        </p>

        <h2 className="prose-h2">Children’s privacy</h2>
        <p className="calm-intro">
          Caregivers must consent on behalf of minors. We minimize child-identifiable imagery exposure and encourage uploading
          only what clinicians need.
        </p>

        <h2 className="prose-h2">Contact</h2>
        <p className="calm-intro">
          Privacy questions can be routed through the clinical organization sponsoring your deployment. A dedicated contact
          channel will be published before production launch.
        </p>

        <p>
          <Link to="/" className="text-link text-link--with-icon">
            <IconArrowLeft className="text-link__icon decorative-icon" />
            Back to home
          </Link>
        </p>
      </PageContainer>
    </>
  )
}
