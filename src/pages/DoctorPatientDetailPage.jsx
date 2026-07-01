import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { IconArrowLeft } from '../components/icons/DecorativeIcons'
import { DocumentTitle } from '../components/common/DocumentTitle'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import {
  createAssessmentReportShare,
  downloadAssessmentReport,
} from '../services/assessmentService'
import {
  fetchDoctorAssessment,
  fetchDoctorPatient,
  patchDoctorClinicalNotes,
} from '../services/doctorService'

function riskPillClass(level) {
  if (level === 'High') return 'doctor-risk-pill doctor-risk-pill--high'
  if (level === 'Medium') return 'doctor-risk-pill doctor-risk-pill--medium'
  if (level === 'Low') return 'doctor-risk-pill doctor-risk-pill--low'
  return 'doctor-risk-pill doctor-risk-pill--muted'
}

function typeLabel(t) {
  if (t === 'screening') return 'Screening'
  if (t === 'combined') return 'Combined'
  if (t === 'image') return 'Image'
  if (t === 'video') return 'Video'
  return t || 'Assessment'
}

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return '—'
  }
}

export function DoctorPatientDetailPage() {
  const { id: parentId } = useParams()
  const pid = Number(parentId)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parent, setParent] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [openId, setOpenId] = useState(null)
  const [detailById, setDetailById] = useState({})
  const [loadingAid, setLoadingAid] = useState(null)
  const [detailError, setDetailError] = useState('')
  const [notesDraft, setNotesDraft] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [notesMessage, setNotesMessage] = useState('')
  const [pdfBusy, setPdfBusy] = useState(null)
  const [shareBusy, setShareBusy] = useState(null)
  const [actionError, setActionError] = useState('')

  const load = useCallback(async () => {
    if (!Number.isFinite(pid)) {
      setError('Invalid patient id.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await fetchDoctorPatient(pid)
      setParent(data.parent)
      setAssessments(data.assessments ?? [])
    } catch (e) {
      setError(e.message ?? 'Could not load patient.')
      setParent(null)
      setAssessments([])
    } finally {
      setLoading(false)
    }
  }, [pid])

  useEffect(() => {
    void load()
  }, [load])

  async function ensureDetail(aid) {
    if (detailById[aid]) return detailById[aid]
    setLoadingAid(aid)
    setDetailError('')
    try {
      const data = await fetchDoctorAssessment(aid)
      const a = data.assessment
      setDetailById((prev) => ({ ...prev, [aid]: a }))
      const dn = a?.output?.doctor_notes
      const existing =
        typeof dn === 'string' ? dn : typeof dn?.text === 'string' ? dn.text : ''
      setNotesDraft((prev) => ({
        ...prev,
        [aid]: existing,
      }))
      return a
    } catch (e) {
      setDetailError(e.message ?? 'Could not load assessment.')
      return null
    } finally {
      setLoadingAid(null)
    }
  }

  async function toggleRow(aid) {
    setActionError('')
    setNotesMessage('')
    if (openId === aid) {
      setOpenId(null)
      return
    }
    setOpenId(aid)
    const cached = detailById[aid]
    if (cached) {
      const dn = cached?.output?.doctor_notes
      const existing =
        typeof dn === 'string' ? dn : typeof dn?.text === 'string' ? dn.text : ''
      setNotesDraft((prev) => (prev[aid] != null ? prev : { ...prev, [aid]: existing }))
      return
    }
    await ensureDetail(aid)
  }

  async function saveNotes(aid) {
    const text = (notesDraft[aid] ?? '').trim()
    if (!text) {
      setActionError('Add note text before saving.')
      return
    }
    setSavingId(aid)
    setActionError('')
    setNotesMessage('')
    try {
      const data = await patchDoctorClinicalNotes(aid, text)
      const a = data.assessment
      setDetailById((prev) => ({ ...prev, [aid]: a }))
      setNotesMessage('Clinical notes saved. They will appear on the PDF for this assessment.')
      void load()
    } catch (e) {
      setActionError(e.message ?? 'Could not save notes.')
    } finally {
      setSavingId(null)
    }
  }

  if (!Number.isFinite(pid)) {
    return (
      <div className="lp-section">
        <Alert title="Invalid link" variant="error">
          This patient link is not valid.
        </Alert>
        <Link to="/doctor/patients">Back to patients</Link>
      </div>
    )
  }

  return (
    <>
      <DocumentTitle title={parent ? `${parent.full_name || 'Patient'} — Asdify` : 'Patient — Asdify'} />
      <div className="doctor-portal">
        <div className="lp-section doctor-detail__top">
          <Link to="/doctor/patients" className="doctor-detail__back">
            <IconArrowLeft className="doctor-detail__back-icon decorative-icon" aria-hidden />
            Patients
          </Link>
          {loading ? (
            <div className="ui-card">
              <Spinner label="Loading patient…" />
            </div>
          ) : null}
          {error ? (
            <Alert variant="error" title="Patient">
              {error}
            </Alert>
          ) : null}
          {!loading && parent ? (
            <header className="doctor-detail__header">
              <p className="doctor-portal__eyebrow">Assigned patient</p>
              <h1 className="doctor-portal__title">{parent.full_name || 'Parent account'}</h1>
              <p className="muted">{parent.email}</p>
              <div className="doctor-detail__profile">
                {parent.child_name ? (
                  <span>
                    <strong>Child</strong>: {parent.child_name}
                  </span>
                ) : null}
                {parent.child_dob ? (
                  <span>
                    <strong>DOB</strong>: {parent.child_dob}
                  </span>
                ) : null}
              </div>
            </header>
          ) : null}
        </div>

        {!loading && parent ? (
          <div className="lp-section doctor-detail__body">
            <h2 className="doctor-detail__section-title">Assessment history</h2>
            <p className="muted small doctor-detail__section-hint">
              Expand a row to review model output, attach clinical notes, download PDF, or create a time-limited share link.
            </p>

            {actionError ? (
              <Alert variant="error" title="Action">
                {actionError}
              </Alert>
            ) : null}
            {notesMessage ? (
              <Alert variant="success" title="Notes">
                {notesMessage}
              </Alert>
            ) : null}

            {assessments.length === 0 ? (
              <div className="ui-card doctor-empty">
                <p className="muted">No assessments are linked to this parent account yet.</p>
              </div>
            ) : (
              <ul className="doctor-timeline">
                {assessments.map((row) => {
                  const isOpen = openId === row.id
                  const detail = detailById[row.id]
                  return (
                    <li key={row.id}>
                      <div className={`doctor-timeline__row${isOpen ? ' doctor-timeline__row--open' : ''}`}>
                        <button type="button" className="doctor-timeline__summary" onClick={() => void toggleRow(row.id)}>
                          <span className={riskPillClass(row.risk_level)}>{row.risk_level ?? '—'}</span>
                          <span className="doctor-timeline__type">{typeLabel(row.type)}</span>
                          <span className="muted small">{formatWhen(row.created_at)}</span>
                          <span className="doctor-timeline__chev" aria-hidden>
                            {isOpen ? '▾' : '▸'}
                          </span>
                        </button>
                        {isOpen ? (
                          <div className="doctor-timeline__panel">
                            {loadingAid === row.id && !detail ? <Spinner label="Loading details…" /> : null}
                            {detailError && !detail ? <p className="muted">{detailError}</p> : null}
                            {detail ? (
                              <div className="doctor-expand">
                                <div className="doctor-expand__meta">
                                  <span>
                                    Status: <strong>{row.status}</strong>
                                  </span>
                                  {detail.output?.recommendation ? (
                                    <p className="doctor-expand__reco">
                                      <strong>Recommendation</strong>: {detail.output.recommendation}
                                    </p>
                                  ) : null}
                                </div>
                                <label className="doctor-notes-label">
                                  <span>Clinical notes (visible on PDF)</span>
                                  <textarea
                                    className="doctor-notes-area"
                                    rows={5}
                                    value={notesDraft[row.id] ?? ''}
                                    onChange={(e) =>
                                      setNotesDraft((prev) => ({ ...prev, [row.id]: e.target.value }))
                                    }
                                    placeholder="Summarize observations, follow-up plan, or messaging for the family…"
                                  />
                                </label>
                                <div className="doctor-expand__actions">
                                  <Button
                                    variant="primary"
                                    disabled={savingId === row.id}
                                    onClick={() => void saveNotes(row.id)}
                                  >
                                    {savingId === row.id ? 'Saving…' : 'Save notes'}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    disabled={pdfBusy === row.id}
                                    onClick={async () => {
                                      setPdfBusy(row.id)
                                      setActionError('')
                                      try {
                                        await downloadAssessmentReport(row.id)
                                      } catch (e) {
                                        setActionError(e.message ?? 'PDF failed.')
                                      } finally {
                                        setPdfBusy(null)
                                      }
                                    }}
                                  >
                                    {pdfBusy === row.id ? 'PDF…' : 'Download PDF'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    disabled={shareBusy === row.id}
                                    onClick={async () => {
                                      setShareBusy(row.id)
                                      setActionError('')
                                      try {
                                        const data = await createAssessmentReportShare(row.id, { expiresInHours: 72 })
                                        const url = data.share?.url
                                        if (url && navigator.clipboard?.writeText) {
                                          await navigator.clipboard.writeText(url)
                                          setNotesMessage('Share link copied (72h).')
                                        } else if (url) {
                                          setNotesMessage(url)
                                        }
                                      } catch (e) {
                                        setActionError(e.message ?? 'Share failed.')
                                      } finally {
                                        setShareBusy(null)
                                      }
                                    }}
                                  >
                                    {shareBusy === row.id ? 'Link…' : 'Copy share link'}
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </>
  )
}
