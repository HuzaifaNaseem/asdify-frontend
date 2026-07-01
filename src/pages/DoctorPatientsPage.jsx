import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { DocumentTitle } from '../components/common/DocumentTitle'
import { Alert } from '../components/ui/Alert'
import { Spinner } from '../components/ui/Spinner'
import { fetchDoctorPatients } from '../services/doctorService'

function riskPillClass(level) {
  if (level === 'High') return 'doctor-risk-pill doctor-risk-pill--high'
  if (level === 'Medium') return 'doctor-risk-pill doctor-risk-pill--medium'
  if (level === 'Low') return 'doctor-risk-pill doctor-risk-pill--low'
  return 'doctor-risk-pill doctor-risk-pill--muted'
}

function formatShort(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

export function DoctorPatientsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [patients, setPatients] = useState([])
  const [q, setQ] = useState('')
  const [risk, setRisk] = useState('')

  useEffect(() => {
    let cancelled = false
    const delay = q.trim() ? 300 : 0
    const t = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchDoctorPatients({ q: q.trim() || undefined, risk: risk || undefined })
        if (!cancelled) setPatients(data.patients ?? [])
      } catch (e) {
        if (!cancelled) {
          setError(e.message ?? 'Could not load patients.')
          setPatients([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, delay)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [q, risk])

  return (
    <>
      <DocumentTitle title="Patients — Asdify" />
      <div className="doctor-portal">
        <section className="doctor-dir__hero lp-section">
          <p className="doctor-portal__eyebrow">Module 11</p>
          <h1 className="doctor-portal__title">Patients</h1>
          <p className="doctor-portal__lead">
            Search your assigned panel. Risk badges reflect each family&apos;s latest saved assessment.
          </p>

          <div className="doctor-dir__filters">
            <label className="doctor-field">
              <span className="doctor-field__label">Search</span>
              <input
                className="doctor-field__input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, email, or child"
                aria-label="Search patients"
              />
            </label>
            <label className="doctor-field">
              <span className="doctor-field__label">Latest risk</span>
              <select className="doctor-field__input" value={risk} onChange={(e) => setRisk(e.target.value)}>
                <option value="">Any</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
          </div>
        </section>

        <div className="lp-section doctor-dir__body">
          {error ? (
            <Alert variant="error" title="Patients">
              {error}
            </Alert>
          ) : null}

          {loading ? (
            <div className="ui-card">
              <Spinner label="Loading patients…" />
            </div>
          ) : null}

          {!loading && !patients.length ? (
            <div className="ui-card doctor-empty">
              <h2 className="doctor-empty__title">No patients match</h2>
              <p className="muted">
                Adjust filters or ask your administrator to link parent accounts to your clinician profile.
              </p>
            </div>
          ) : null}

          {!loading && patients.length > 0 ? (
            <ul className="doctor-patient-grid">
              {patients.map((p) => {
                const la = p.last_assessment
                return (
                  <li key={p.id}>
                    <Link to={`/doctor/patients/${p.id}`} className="doctor-patient-card">
                      <div className="doctor-patient-card__head">
                        <span className={riskPillClass(la?.risk_level)}>{la?.risk_level ?? 'No data'}</span>
                        <span className="muted small">{formatShort(la?.created_at)}</span>
                      </div>
                      <h2 className="doctor-patient-card__name">{p.full_name || 'Parent'}</h2>
                      <p className="muted small doctor-patient-card__email">{p.email}</p>
                      {p.child_name ? <p className="doctor-patient-card__child">Child: {p.child_name}</p> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </>
  )
}
