import { useEffect, useMemo, useState } from 'react'

import { AdminPortalNav } from '../../components/admin/AdminPortalNav'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import { downloadAnonymizedAssessmentsCsv, fetchAdminAnalytics } from '../../services/adminService'

function BarRow({ label, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="admin-bar-row">
      <span className="admin-bar-row__label">{label}</span>
      <div className="admin-bar-row__track" role="presentation">
        <div className="admin-bar-row__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="admin-bar-row__value">{count}</span>
    </div>
  )
}

export function AdminReportsPage() {
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [exportBusy, setExportBusy] = useState(false)
  const [exportErr, setExportErr] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const d = await fetchAdminAnalytics(days)
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) setError(e.message ?? 'Could not load analytics.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [days])

  const ts = data?.timeseries ?? []
  const byType = data?.by_type ?? []
  const byRisk = data?.by_risk ?? []

  const maxDay = useMemo(() => {
    const rows = data?.timeseries ?? []
    return rows.reduce((m, x) => Math.max(m, x.count), 0)
  }, [data?.timeseries])
  const maxType = useMemo(() => {
    const rows = data?.by_type ?? []
    return rows.reduce((m, x) => Math.max(m, x.count), 0)
  }, [data?.by_type])
  const maxRisk = useMemo(() => {
    const rows = data?.by_risk ?? []
    return rows.reduce((m, x) => Math.max(m, x.count), 0)
  }, [data?.by_risk])

  async function onExport() {
    setExportErr('')
    setExportBusy(true)
    try {
      await downloadAnonymizedAssessmentsCsv()
    } catch (e) {
      setExportErr(e.message ?? 'Download failed.')
    } finally {
      setExportBusy(false)
    }
  }

  return (
    <>
      <DocumentTitle title="Platform reports — Asdify" />

      <div className="admin-portal">
        <section className="admin-portal__hero admin-portal__hero--compact">
          <div className="admin-portal__hero-inner lp-section">
            <AdminPortalNav />
            <p className="admin-portal__eyebrow">Module 12 · Admin portal</p>
            <h1 className="admin-portal__title">Usage & exports</h1>
            <p className="admin-portal__lead">
              Review screening volume and risk mix over a rolling window. CSV exports use salted pseudo-identifiers only —
              no emails or raw assessment IDs.
            </p>
          </div>
        </section>

        <div className="admin-portal__main lp-section">
          <div className="admin-reports-toolbar">
            <label className="admin-field">
              <span className="admin-field__label">Window</span>
              <select className="admin-select" value={days} onChange={(e) => setDays(Number(e.target.value, 10))}>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
              </select>
            </label>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--sm" disabled={exportBusy} onClick={() => void onExport()}>
              {exportBusy ? 'Preparing…' : 'Download anonymized CSV'}
            </button>
          </div>

          {exportErr ? (
            <Alert variant="error" title="Export failed">
              {exportErr}
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="error" title="Could not load analytics">
              {error}
            </Alert>
          ) : null}

          {loading ? (
            <div className="ui-card">
              <Spinner label="Loading analytics…" />
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="admin-reports-grid">
              <section className="admin-panel">
                <div className="admin-panel__head">
                  <h2 className="admin-panel__title">Assessments per day</h2>
                  <p className="muted small">{data?.days} day window · completed and failed runs</p>
                </div>
                {ts.length === 0 ? (
                  <p className="muted">No assessments in this range.</p>
                ) : (
                  <div className="admin-bar-list admin-bar-list--scroll">
                    {ts.map((row) => (
                      <BarRow key={row.date} label={row.date} count={row.count} max={maxDay} />
                    ))}
                  </div>
                )}
              </section>

              <section className="admin-panel">
                <div className="admin-panel__head">
                  <h2 className="admin-panel__title">By modality</h2>
                </div>
                {byType.length === 0 ? (
                  <p className="muted">No breakdown available.</p>
                ) : (
                  <div className="admin-bar-list">
                    {byType.map((row) => (
                      <BarRow key={row.type} label={row.type} count={row.count} max={maxType} />
                    ))}
                  </div>
                )}
              </section>

              <section className="admin-panel">
                <div className="admin-panel__head">
                  <h2 className="admin-panel__title">Risk distribution</h2>
                  <p className="muted small">Completed assessments only</p>
                </div>
                {byRisk.length === 0 ? (
                  <p className="muted">No completed assessments in range.</p>
                ) : (
                  <div className="admin-bar-list">
                    {byRisk.map((row) => (
                      <BarRow key={row.risk_level} label={row.risk_level} count={row.count} max={maxRisk} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
