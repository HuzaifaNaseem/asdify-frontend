import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { IconArrowRight } from '../../components/icons/DecorativeIcons'
import { AdminPortalNav } from '../../components/admin/AdminPortalNav'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import {
  approveDoctor,
  fetchAdminAudit,
  fetchAdminDashboard,
  rejectDoctor,
} from '../../services/adminService'
import { useAuth } from '../../state/AuthContext'

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
  return t || '—'
}

function riskClass(level) {
  if (level === 'High') return 'admin-risk-pill admin-risk-pill--high'
  if (level === 'Medium') return 'admin-risk-pill admin-risk-pill--medium'
  if (level === 'Low') return 'admin-risk-pill admin-risk-pill--low'
  return 'admin-risk-pill admin-risk-pill--muted'
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [audit, setAudit] = useState(null)
  const [auditErr, setAuditErr] = useState('')

  const firstName = useMemo(() => {
    const raw = (user?.full_name || '').trim()
    if (!raw) return 'Admin'
    const tokens = raw.split(/\s+/).filter((t) => !/^(dr|mr|mrs|ms|prof|miss)\.?$/i.test(t))
    return tokens[0] || 'Admin'
  }, [user])

  const load = useCallback(async () => {
    const d = await fetchAdminDashboard()
    setData(d)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await load()
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Could not load dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const a = await fetchAdminAudit({ limit: 25 })
        if (!cancelled) setAudit(a)
      } catch (err) {
        if (!cancelled) setAuditErr(err.message ?? 'Could not load audit log.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const pendingList = data?.users?.pending_doctors_list ?? []
  const recentAssess = data?.recent_assessments ?? []

  async function onApprove(id) {
    setActionError('')
    setBusyId(id)
    try {
      await approveDoctor(id)
      await load()
    } catch (e) {
      setActionError(e.message ?? 'Approval failed.')
    } finally {
      setBusyId(null)
    }
  }

  async function onReject(id) {
    if (!window.confirm('Decline this doctor registration? Their account will be marked inactive.')) return
    setActionError('')
    setBusyId(id)
    try {
      await rejectDoctor(id)
      await load()
    } catch (e) {
      setActionError(e.message ?? 'Could not decline registration.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <DocumentTitle title="Admin console — Asdify" />

      <div className="admin-portal">
        <section className="admin-portal__hero">
          <div className="admin-portal__hero-inner lp-section">
            <AdminPortalNav />
            <p className="admin-portal__eyebrow">Admin portal · Modules 12 &amp; 14</p>
            <h1 className="admin-portal__title">Welcome, {firstName}</h1>
            <p className="admin-portal__lead">
              Monitor platform health, review clinician registrations, and watch anonymized assessment activity.
              Sensitive timelines stay de-identified in the activity feed.
            </p>

            <div className="admin-portal__stats">
              <article className="admin-stat-card">
                <span className="admin-stat-card__label">Total users</span>
                <p className="admin-stat-card__value">{loading ? '—' : data?.users?.total ?? 0}</p>
                <p className="admin-stat-card__hint muted small">
                  Parents {data?.users?.by_role?.parent ?? '—'} · Doctors {data?.users?.by_role?.doctor ?? '—'} · Admins{' '}
                  {data?.users?.by_role?.admin ?? '—'}
                </p>
              </article>
              <article className="admin-stat-card">
                <span className="admin-stat-card__label">Assessments</span>
                <p className="admin-stat-card__value">{loading ? '—' : data?.assessments?.total ?? 0}</p>
                <p className="admin-stat-card__hint muted small">
                  Completed {data?.assessments?.completed ?? '—'} · Failed {data?.assessments?.failed ?? '—'} · 7d{' '}
                  {data?.assessments?.last_7_days ?? '—'}
                </p>
              </article>
              <article className="admin-stat-card">
                <span className="admin-stat-card__label">Pending doctors</span>
                <p className="admin-stat-card__value">{loading ? '—' : data?.users?.pending_doctors ?? 0}</p>
              </article>
              <Link to="/admin/reports" className="admin-stat-card admin-stat-card--cta">
                <span className="admin-stat-card__label">Analytics</span>
                <p className="admin-stat-card__value admin-stat-card__value--sm stat-cta-caption">
                  <span>Open reports</span>
                  <IconArrowRight className="stat-cta-caption__icon decorative-icon" aria-hidden />
                </p>
              </Link>
            </div>
          </div>
        </section>

        <div className="admin-portal__main lp-section">
          {loading ? (
            <div className="ui-card">
              <Spinner label="Loading admin data…" />
            </div>
          ) : null}

          {error ? (
            <Alert variant="error" title="Could not load dashboard">
              {error}
            </Alert>
          ) : null}

          {actionError ? (
            <Alert variant="error" title="Action failed">
              {actionError}
            </Alert>
          ) : null}

          {pendingList.length > 0 ? (
            <section className="admin-panel">
              <div className="admin-panel__head">
                <h2 className="admin-panel__title">Doctor approvals</h2>
                <p className="muted small">New registrations waiting for platform access</p>
              </div>
              <ul className="admin-pending-list">
                {pendingList.map((row) => (
                  <li key={row.id}>
                    <article className="admin-pending-row">
                      <div>
                        <p className="admin-pending-row__title">{row.full_name}</p>
                        <p className="muted small admin-pending-row__meta">
                          {row.email} · requested {formatDateTime(row.created_at)}
                        </p>
                      </div>
                      <div className="admin-pending-row__actions">
                        <button
                          type="button"
                          className="ui-btn ui-btn--primary ui-btn--sm"
                          disabled={busyId === row.id}
                          onClick={() => void onApprove(row.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="ui-btn ui-btn--ghost ui-btn--sm"
                          disabled={busyId === row.id}
                          onClick={() => void onReject(row.id)}
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data?.recent_signups?.length ? (
            <section className="admin-panel">
              <div className="admin-panel__head">
                <h2 className="admin-panel__title">Recent sign-ups</h2>
                <Link className="admin-inline-link" to="/admin/users">
                  Manage all users
                </Link>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_signups.map((u) => (
                      <tr key={u.id}>
                        <td>{u.full_name}</td>
                        <td className="admin-table__mono">{u.email}</td>
                        <td>
                          <span className="admin-badge">{u.role}</span>
                        </td>
                        <td>{u.status}</td>
                        <td className="muted">{formatDateTime(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {recentAssess.length > 0 ? (
            <section className="admin-panel">
              <div className="admin-panel__head">
                <h2 className="admin-panel__title">Anonymized activity</h2>
                <p className="muted small">Latest assessments — pseudo IDs only, no account linkage</p>
              </div>
              <ul className="admin-activity-list">
                {recentAssess.map((row) => (
                  <li key={row.pseudo_id}>
                    <article className="admin-activity-row">
                      <span className={riskClass(row.risk_level)}>{row.risk_level ?? '—'}</span>
                      <div className="admin-activity-row__body">
                        <p className="admin-activity-row__title">
                          {typeLabel(row.type)}
                          <span className="muted small"> · {row.status}</span>
                        </p>
                        <p className="muted small">
                          {formatDateTime(row.created_at)} · ID <span className="admin-table__mono">{row.pseudo_id}</span>
                        </p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {auditErr ? (
            <Alert variant="error" title="Audit log">
              {auditErr}
            </Alert>
          ) : null}

          {audit?.events?.length ? (
            <section className="admin-panel">
              <div className="admin-panel__head">
                <h2 className="admin-panel__title">Security audit trail</h2>
                <p className="muted small">Recent logins, admin actions, and account changes (Module 14)</p>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Subject</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.events.map((ev) => (
                      <tr key={ev.id}>
                        <td className="muted">{formatDateTime(ev.created_at)}</td>
                        <td>
                          <span className="admin-badge admin-badge--muted">{ev.action}</span>
                        </td>
                        <td>{ev.actor_user_id ?? '—'}</td>
                        <td className="admin-table__mono">
                          {ev.subject_type ? `${ev.subject_type}:${ev.subject_id ?? ''}` : '—'}
                        </td>
                        <td className="admin-table__mono">{ev.ip ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {!loading && !error && (data?.assessments?.total ?? 0) === 0 && !pendingList.length ? (
            <div className="ui-card admin-empty">
              <h2 className="admin-empty__title">Quiet platform</h2>
              <p className="muted">
                No pending doctors or recent assessments yet. When families run screenings, anonymized events will appear
                here.
              </p>
              <Link className="ui-btn ui-btn--primary ui-btn--sm" to="/admin/users">
                Open user management
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
