import { Link } from 'react-router-dom'

import { DocumentTitle } from '../components/common/DocumentTitle'
import { IconArrowRight, IconClipboard, IconListChecks, IconVideo } from '../components/icons/DecorativeIcons'

const TEST_OPTIONS = [
  {
    key: 'screening',
    title: 'Screening questionnaire',
    description: 'Structured M-CHAT–style questions with instant scoring and a downloadable summary.',
    to: '/screening',
    icon: IconListChecks,
  },
  {
    key: 'ai',
    title: 'AI assessment',
    description: 'Optional photo plus behavioral questionnaire — combined server-side scoring for caregivers.',
    to: '/assessment/new',
    icon: IconClipboard,
  },
  {
    key: 'video',
    title: 'Video assessment',
    description: 'Upload a 30–60 second clip for AI video and audio analysis — real model inference, not a placeholder.',
    to: '/assessment/video',
    icon: IconVideo,
  },
]

function TestOptionIcon({ Icon }) {
  return (
    <span className="asd-tests-hub__icon" aria-hidden>
      <Icon className="asd-tests-hub__icon-svg decorative-icon" />
    </span>
  )
}

export function ParentAsdTestsPage() {
  return (
    <>
      <DocumentTitle title="ASD assessments — Asdify" />

      <div className="asd-tests-hub lp-section">
        <header className="asd-tests-hub__intro anim-fade-up">
          <p className="asd-tests-hub__eyebrow">Parent module</p>
          <h1 className="asd-tests-hub__title">Choose how you would like to explore concerns</h1>
          <p className="asd-tests-hub__lead muted">
            Three entry points — one calm page. All are screening-style supports, not a diagnosis. Take your time;
            you can return here anytime from your dashboard.
          </p>
        </header>

        <div className="asd-tests-hub__grid">
          {TEST_OPTIONS.map((opt, i) => {
            const Icon = opt.icon
            return (
              <Link
                key={opt.key}
                to={opt.to}
                className={`asd-tests-hub__card anim-fade-up${opt.key === 'video' ? ' asd-tests-hub__card--accent' : ''}`}
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <TestOptionIcon Icon={Icon} />
                <div className="asd-tests-hub__body">
                  <h2 className="asd-tests-hub__card-title">{opt.title}</h2>
                  <p className="asd-tests-hub__card-desc">{opt.description}</p>
                </div>
                <span className="asd-tests-hub__chev" aria-hidden>
                  <IconArrowRight className="decorative-icon" />
                </span>
              </Link>
            )
          })}
        </div>

        <p className="asd-tests-hub__foot muted small">
          <Link to="/dashboard" className="text-link">
            Back to dashboard
          </Link>
          <span className="asd-tests-hub__dot" aria-hidden>
            ·
          </span>
          <Link to="/history" className="text-link">
            View full history
          </Link>
        </p>
      </div>
    </>
  )
}
