import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Alert } from '../components/ui/Alert'
import { DocumentTitle } from '../components/common/DocumentTitle'
import { Spinner } from '../components/ui/Spinner'
import { fetchAssessments } from '../services/assessmentService'
import { ensureGuestSession } from '../services/sessionService'

import { useAuth } from '../state/AuthContext'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'combined', label: 'Combined' },
  { value: 'image', label: 'Image' },
  { value: 'screening', label: 'Screening' },
  { value: 'video', label: 'Video' },
]

const RISK_CHIPS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'pending', label: 'Pending' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All outcomes' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Incomplete / failed' },
]

function typeLabel(type) {
  const t = String(type ?? '').toLowerCase()
  if (t === 'combined') return 'Combined assessment'
  if (t === 'image') return 'Image assessment'
  if (t === 'screening') return 'Screening'
  if (t === 'video') return 'Video assessment'
  return `${type || 'Assessment'}`
}

function riskBadgeClass(level) {
  const l = String(level ?? 'Pending').toLowerCase()
  if (l === 'low') return 'history-risk history-risk--low'
  if (l === 'medium') return 'history-risk history-risk--medium'
  if (l === 'high') return 'history-risk history-risk--high'
  return 'history-risk history-risk--pending'
}

export function HistoryPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)

  const [assessmentType, setAssessmentType] = useState('')
  const [riskSelection, setRiskSelection] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('desc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)

  const riskParam = useMemo(() => {
    if (!riskSelection.length) return undefined
    return riskSelection.join(',')
  }, [riskSelection])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await ensureGuestSession()
      const data = await fetchAssessments({
        limit: pageSize,
        offset: page * pageSize,
        type: assessmentType || undefined,
        riskLevel: riskParam,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sort,
      })
      setItems(data.assessments ?? [])
      setTotal(typeof data.total === 'number' ? data.total : (data.assessments ?? []).length)
    } catch (err) {
      setError(err.message ?? 'Could not load history.')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [assessmentType, riskParam, statusFilter, dateFrom, dateTo, sort, page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const pageSafe = Math.min(page, totalPages - 1)

  useEffect(() => {
    if (page !== pageSafe) setPage(pageSafe)
  }, [page, pageSafe])

  function toggleRisk(value) {
    setPage(0)
    setRiskSelection((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function resetFilters() {
    setAssessmentType('')
    setRiskSelection([])
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setSort('desc')
    setPage(0)
  }

  const activeFilterCount =
    (assessmentType ? 1 : 0) +
    riskSelection.length +
    (statusFilter ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (sort !== 'desc' ? 1 : 0)

  return (
    <>
      <DocumentTitle title="Assessment History — Asdify" />
      <div className="history-page">
        <section className="history-page__hero lp-section">
          <p className="section-eyebrow">{user?.role === 'parent' ? 'Your account' : 'Session history'}</p>
          <h1 className="section-title">Assessment history</h1>
          <p className="section-lead">
            {user?.role === 'parent'
              ? 'Browse every assessment you have saved while signed in. Filter by type, risk level, or date — then reopen the full detail view anytime.'
              : 'Assessments tied to this browser session. Sign in as a parent to keep a permanent record across devices.'}
          </p>
        </section>

        <div className="lp-section history-page__body">
          <div className="history-filters ui-card">
            <div className="history-filters__head">
              <h2 className="history-filters__title">Find an assessment</h2>
              <p className="history-filters__hint muted small">
                Module 7 — filter, sort, and paginate. Results update automatically.
              </p>
            </div>

            <div className="history-filters__grid">
              <label className="history-field">
                <span className="history-field__label">Type</span>
                <select
                  className="history-field__control"
                  value={assessmentType}
                  onChange={(e) => {
                    setPage(0)
                    setAssessmentType(e.target.value)
                  }}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="history-field">
                <span className="history-field__label">Outcome</span>
                <select
                  className="history-field__control"
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(0)
                    setStatusFilter(e.target.value)
                  }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="history-field">
                <span className="history-field__label">From</span>
                <input
                  className="history-field__control"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPage(0)
                    setDateFrom(e.target.value)
                  }}
                />
              </label>

              <label className="history-field">
                <span className="history-field__label">To</span>
                <input
                  className="history-field__control"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setPage(0)
                    setDateTo(e.target.value)
                  }}
                />
              </label>

              <label className="history-field">
                <span className="history-field__label">Sort by date</span>
                <select
                  className="history-field__control"
                  value={sort}
                  onChange={(e) => {
                    setPage(0)
                    setSort(e.target.value)
                  }}
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </label>

              <label className="history-field">
                <span className="history-field__label">Per page</span>
                <select
                  className="history-field__control"
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPage(0)
                    setPageSize(Number(e.target.value))
                  }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </label>
            </div>

            <div className="history-filters__risk">
              <span className="history-field__label">Risk level</span>
              <div className="history-chip-row" role="group" aria-label="Risk level filters">
                {RISK_CHIPS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`history-chip${riskSelection.includes(c.value) ? ' history-chip--active' : ''}`}
                    onClick={() => toggleRisk(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="history-filters__actions">
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={resetFilters}>
                Clear filters
              </button>
              {activeFilterCount > 0 ? (
                <span className="muted small">{activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}</span>
              ) : null}
            </div>
          </div>

          {error ? (
            <Alert variant="error" title="History error">
              {error}
            </Alert>
          ) : null}

          <div className="history-results-head">
            <p className="history-results-count">
              {loading ? 'Loading…' : <strong>{total}</strong>}
              {!loading ? ` assessment${total === 1 ? '' : 's'} match` : null}
            </p>
          </div>

          {loading ? (
            <div className="ui-card history-loading">
              <Spinner label="Loading history…" />
            </div>
          ) : null}

          {!loading && !error ? (
            items.length === 0 ? (
              <div className="ui-card history-empty">
                <h3 className="history-empty__title">No assessments match</h3>
                <p className="muted">
                  Try widening your filters, or run a new screening or combined assessment from the dashboard.
                </p>
                <div className="history-empty__actions">
                  <Link className="ui-btn ui-btn--primary ui-btn--sm" to="/assessment/new">
                    New assessment
                  </Link>
                  <Link className="ui-btn ui-btn--secondary ui-btn--sm" to="/screening">
                    Screening
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <ul className="history-card-list">
                  {items.map((item) => (
                    <li key={item.id}>
                      <article className="history-card">
                        <div className="history-card__main">
                          <div className="history-card__type-row">
                            <span className="history-card__type">{typeLabel(item.type)}</span>
                            <time className="history-card__time" dateTime={item.created_at}>
                              {new Date(item.created_at).toLocaleString()}
                            </time>
                          </div>
                          <p className="history-card__id muted small">ID {item.id.slice(0, 8)}…</p>
                        </div>
                        <div className="history-card__side">
                          <span className={riskBadgeClass(item.risk_level)}>
                            {item.risk_level ?? 'Pending'}
                          </span>
                          <span
                            className={`history-status history-status--${String(item.status || 'unknown').toLowerCase()}`}
                          >
                            {item.status === 'failed' ? 'Incomplete' : item.status === 'completed' ? 'Completed' : String(item.status ?? '—')}
                          </span>
                          <Link className="ui-btn ui-btn--secondary ui-btn--sm" to={`/history/${item.id}`}>
                            Open detail
                          </Link>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>

                <nav className="history-pagination" aria-label="Pagination">
                  <button
                    type="button"
                    className="ui-btn ui-btn--ghost ui-btn--sm"
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="history-pagination__meta muted small">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="ui-btn ui-btn--ghost ui-btn--sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Next
                  </button>
                </nav>
              </>
            )
          ) : null}
        </div>
      </div>
    </>
  )
}
