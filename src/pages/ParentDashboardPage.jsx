import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { IconArrowRight } from '../components/icons/DecorativeIcons'
import { DocumentTitle } from '../components/common/DocumentTitle'
import { Alert } from '../components/ui/Alert'
import { Spinner } from '../components/ui/Spinner'
import { fetchParentDashboard } from '../services/dashboardService'
import { useAuth } from '../state/AuthContext'

const TIPS = [
  {
    title: 'Early patterns',
    body: 'Many autistic children show differences in social communication and flexible behavior. Early support can improve quality of life — screening is a first step, not a diagnosis.',
  },
  {
    title: 'When to seek help',
    body: 'If you notice consistent differences in eye contact, response to name, pretend play, or repetitive movements, consider sharing observations with a pediatrician or developmental specialist.',
  },
  {
    title: 'Trust your instincts',
    body: 'You know your child best. If something feels off, it is appropriate to ask questions and pursue a professional evaluation.',
  },
  {
    title: 'Using results wisely',
    body: 'Risk levels on Asdify are decision-support summaries. Always discuss outcomes with a qualified clinician who can take a full developmental history.',
  },
]

function formatAssessmentType(type) {
  if (type === 'screening') return 'Screening'
  if (type === 'image') return 'Image analysis'
  if (type === 'combined') return 'Combined'
  if (type === 'video') return 'Video assessment'
  return type ? String(type) : 'Assessment'
}

function formatDateShort(iso) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function riskPillClass(level) {
  if (level === 'High') return 'dashboard-risk-pill dashboard-risk-pill--high'
  if (level === 'Medium') return 'dashboard-risk-pill dashboard-risk-pill--medium'
  if (level === 'Low') return 'dashboard-risk-pill dashboard-risk-pill--low'
  return 'dashboard-risk-pill dashboard-risk-pill--muted'
}

function riskLabel(level, status) {
  if (level) return level
  if (status === 'failed') return 'Incomplete'
  return 'Pending'
}

function IconListChecks() {
  return (
    <svg className="dashboard-action__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg className="dashboard-action__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ParentDashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [tipIndex, setTipIndex] = useState(0)

  const firstName = useMemo(() => {
    const raw = (user?.full_name || '').trim()
    if (!raw) return 'there'
    const tokens = raw.split(/\s+/).filter((t) => !/^(dr|mr|mrs|ms|prof|miss)\.?$/i.test(t))
    return tokens[0] || 'there'
  }, [user])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchParentDashboard()
        if (!cancelled) setPayload(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 9000)
    return () => window.clearInterval(id)
  }, [])

  const summary = payload?.summary
  const recent = payload?.recent_assessments ?? []
  const total = summary?.total_assessments ?? 0
  const lastAt = summary?.last_assessment_at
  const lastDateShort = formatDateShort(lastAt)

  return (
    <>
      <DocumentTitle title="Asdify — Parent dashboard" />

      <div className="parent-dashboard">
        <section className="parent-dashboard__hero" aria-labelledby="dash-welcome">
          <div className="parent-dashboard__hero-inner">
            <div className="parent-dashboard__welcome anim-fade-up">
              <p className="parent-dashboard__eyebrow">Your home</p>
              <h1 id="dash-welcome" className="parent-dashboard__title">
                Welcome back, {firstName}
              </h1>
              <p className="parent-dashboard__lead">
                Track screenings, start a new assessment, and review recent results — all in one calm, private workspace.
              </p>
            </div>

            <div className="parent-dashboard__stats" aria-label="Assessment summary">
              <article className="dashboard-stat-card anim-fade-up anim-delay-1">
                <span className="dashboard-stat-card__label">Saved assessments</span>
                <p className="dashboard-stat-card__value">{loading ? '—' : total}</p>
                <p className="dashboard-stat-card__hint">Linked to your account when you are signed in</p>
              </article>
              <article className="dashboard-stat-card anim-fade-up anim-delay-2">
                <span className="dashboard-stat-card__label">Last activity</span>
                <p className="dashboard-stat-card__value dashboard-stat-card__value--sm">
                  {loading ? '—' : lastDateShort || 'None yet'}
                </p>
                <p className="dashboard-stat-card__hint">
                  {loading || !lastAt ? 'Complete a screening or assessment to see dates here.' : formatDateTime(lastAt)}
                </p>
              </article>
            </div>
          </div>
        </section>

        <div className="parent-dashboard__main lp-section">
          {loading ? (
            <div className="ui-card parent-dashboard__loading">
              <Spinner label="Loading your dashboard…" />
            </div>
          ) : null}

          {!loading && error ? (
            <Alert variant="error" title="Dashboard could not load">
              {error}
            </Alert>
          ) : null}

          {!loading && !error ? (
            <>
              <section className="parent-dashboard__actions-section anim-fade-up" aria-labelledby="quick-actions-heading">
                <h2 id="quick-actions-heading" className="parent-dashboard__section-title">
                  Quick actions
                </h2>
                <div className="parent-dashboard__actions">
                  <Link to="/dashboard/asd-tests" className="dashboard-action-card">
                    <IconListChecks />
                    <div className="dashboard-action-card__body">
                      <span className="dashboard-action-card__title">ASD assessments</span>
                      <span className="dashboard-action-card__desc">
                        Screening questionnaire, AI assessment, or video upload — start from one place
                      </span>
                    </div>
                    <span className="dashboard-action-card__chev" aria-hidden>
                      <IconArrowRight className="decorative-icon" />
                    </span>
                  </Link>
                  <Link to="/history" className="dashboard-action-card">
                    <IconClock />
                    <div className="dashboard-action-card__body">
                      <span className="dashboard-action-card__title">View history</span>
                      <span className="dashboard-action-card__desc">Open your full assessment timeline</span>
                    </div>
                    <span className="dashboard-action-card__chev" aria-hidden>
                      <IconArrowRight className="decorative-icon" />
                    </span>
                  </Link>
                </div>
              </section>

              <div className="parent-dashboard__split">
                <section className="parent-dashboard__recent anim-fade-up anim-delay-1" aria-labelledby="recent-heading">
                  <div className="parent-dashboard__recent-header">
                    <h2 id="recent-heading" className="parent-dashboard__section-title">
                      Recent assessments
                    </h2>
                    <Link to="/history" className="parent-dashboard__link-all">
                      See all
                    </Link>
                  </div>
                  <div className="dashboard-recent-panel">
                    {recent.length === 0 ? (
                      <div className="dashboard-empty">
                        <p className="dashboard-empty__title">No saved assessments yet</p>
                        <p className="muted dashboard-empty__text">
                          While signed in, new screenings and assessments are attached to your account and will appear here.
                        </p>
                        <div className="dashboard-empty__actions">
                          <Link to="/dashboard/asd-tests" className="ui-btn ui-btn--primary ui-btn--sm">
                            ASD assessments
                          </Link>
                          <Link to="/history" className="ui-btn ui-btn--secondary ui-btn--sm">
                            View history
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <ul className="dashboard-recent-list">
                        {recent.map((item) => (
                          <li key={item.id}>
                            <Link to={`/history/${item.id}`} className="dashboard-recent-row">
                              <div className="dashboard-recent-row__main">
                                <span className="dashboard-recent-row__type">{formatAssessmentType(item.type)}</span>
                                <time className="dashboard-recent-row__time" dateTime={item.created_at}>
                                  {formatDateTime(item.created_at)}
                                </time>
                              </div>
                              <span className={riskPillClass(item.risk_level)}>{riskLabel(item.risk_level, item.status)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>

                <aside
                  className="parent-dashboard__tip anim-fade-up anim-delay-2"
                  aria-live="polite"
                  aria-label="Educational tip"
                >
                  <div className="dashboard-tip">
                    <p className="dashboard-tip__label">Tip</p>
                    <h3 className="dashboard-tip__title">{TIPS[tipIndex].title}</h3>
                    <p className="dashboard-tip__body">{TIPS[tipIndex].body}</p>
                    <div className="dashboard-tip__dots" role="tablist" aria-label="Tips">
                      {TIPS.map((_, i) => (
                        <button
                          type="button"
                          key={`dashboard-tip-${i}`}
                          className={`dashboard-tip__dot${i === tipIndex ? ' is-active' : ''}`}
                          aria-label={`Show tip ${i + 1}`}
                          aria-selected={i === tipIndex}
                          onClick={() => setTipIndex(i)}
                        />
                      ))}
                    </div>
                  </div>
                </aside>
              </div>

              <p className="parent-dashboard__disclaimer muted small">
                Asdify provides screening-style summaries only. It does not replace clinical evaluation by a licensed professional.
              </p>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
