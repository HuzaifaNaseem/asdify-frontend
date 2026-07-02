import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { IconArrowRight } from '../components/icons/DecorativeIcons'
import { DocumentTitle } from '../components/common/DocumentTitle'
import { Alert } from '../components/ui/Alert'
import { Spinner } from '../components/ui/Spinner'
import { fetchDoctorDashboard } from '../services/doctorService'
import { useAuth } from '../state/AuthContext'

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

function typeLabel(t) {
  if (t === 'screening') return 'Screening'
  if (t === 'combined') return 'Combined'
  if (t === 'image') return 'Image'
  if (t === 'video') return 'Video'
  return t || 'Assessment'
}

function riskClass(level) {
  if (level === 'High') return 'doctor-risk-pill doctor-risk-pill--high'
  if (level === 'Medium') return 'doctor-risk-pill doctor-risk-pill--medium'
  if (level === 'Low') return 'doctor-risk-pill doctor-risk-pill--low'
  return 'doctor-risk-pill doctor-risk-pill--muted'
}

export function DoctorDashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const firstName = useMemo(() => {
    const raw = (user?.full_name || '').trim()
    if (!raw) return 'Doctor'
    const tokens = raw.split(/\s+/).filter((t) => !/^(dr|mr|mrs|ms|prof|miss)\.?$/i.test(t))
    return tokens[0] || 'Doctor'
  }, [user])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const d = await fetchDoctorDashboard()
        if (!cancelled) setData(d)
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Could not load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const activity = data?.recent_activity ?? []

  return (
    <>
      <DocumentTitle title="Clinician workspace — Asdify" />

      <div className="doctor-portal">
        <section className="doctor-portal__hero">
          <div className="doctor-portal__hero-inner lp-section">
            <p className="doctor-portal__eyebrow">Module 11 · Clinician portal</p>
            <h1 className="doctor-portal__title">Welcome, {firstName}</h1>
            <p className="doctor-portal__lead">
              Review assigned families, scan recent assessment activity, and open patient timelines. Assignments are managed
              by your administrator.
            </p>

            <div className="doctor-portal__stats">
              <article className="doctor-stat-card">
                <span className="doctor-stat-card__label">Assigned patients</span>
                <p className="doctor-stat-card__value">{loading ? '—' : data?.assigned_patients ?? 0}</p>
              </article>
              <article className="doctor-stat-card">
                <span className="doctor-stat-card__label">Assessments (30 days)</span>
                <p className="doctor-stat-card__value">{loading ? '—' : data?.assessments_last_30_days ?? 0}</p>
              </article>
              <Link to="/doctor/patients" className="doctor-stat-card doctor-stat-card--cta">
                <span className="doctor-stat-card__label">Directory</span>
                <p className="doctor-stat-card__value doctor-stat-card__value--sm stat-cta-caption">
                  <span>Open patient list</span>
                  <IconArrowRight className="stat-cta-caption__icon decorative-icon" aria-hidden />
                </p>
              </Link>
            </div>
          </div>
        </section>

        <div className="doctor-portal__main lp-section">
          {loading ? (
            <div className="ui-card">
              <Spinner label="Loading workspace…" />
            </div>
          ) : null}

          {error ? (
            <Alert variant="error" title="Could not load dashboard">
              {error}
            </Alert>
          ) : null}

          {!loading && !error && !activity.length ? (
            <div className="ui-card doctor-empty">
              <h2 className="doctor-empty__title">No recent activity</h2>
              <p className="muted">
                When parents in your panel complete assessments, they will appear here. Ask your administrator to assign
                patient accounts if your list is empty.
              </p>
              <Link className="ui-btn ui-btn--primary ui-btn--sm" to="/doctor/patients">
                View patients
              </Link>
            </div>
          ) : null}

          {!loading && !error && activity.length > 0 ? (
            <section className="doctor-activity">
              <div className="doctor-activity__head">
                <h2 className="doctor-activity__title">Recent activity</h2>
                <p className="muted small">Latest assessments across your assigned families</p>
              </div>
              <ul className="doctor-activity__list">
                {activity.map((row) => (
                  <li key={row.id}>
                    <article className="doctor-activity-row">
                      <div className="doctor-activity-row__main">
                        <span className={`${riskClass(row.risk_level)}`}>{row.risk_level ?? '—'}</span>
                        <div>
                          <p className="doctor-activity-row__title">
                            {row.parent_name || 'Parent'}
                            <span className="muted small"> · {typeLabel(row.type)}</span>
                          </p>
                          <p className="muted small doctor-activity-row__meta">
                            {formatDateTime(row.created_at)} · {row.parent_email}
                          </p>
                        </div>
                      </div>
                      <div className="doctor-activity-row__actions">
                        <Link className="ui-btn ui-btn--ghost ui-btn--sm" to={`/doctor/patients/${row.user_id}`}>
                          Patient
                        </Link>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </>
  )
}
