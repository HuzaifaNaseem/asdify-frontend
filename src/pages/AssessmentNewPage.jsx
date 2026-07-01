import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { IconArrowLeft } from '../components/icons/DecorativeIcons'
import { PatientDetailsCard } from '../components/common/PatientDetailsCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { DocumentTitle } from '../components/common/DocumentTitle'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { submitAssessment } from '../services/assessmentService'
import { ensureGuestSession } from '../services/sessionService'
import { useAuth } from '../state/AuthContext'

const REPETITIVE_OPTIONS = [
  'Hand flapping',
  'Repetitive rocking',
  'Repeating words or sounds',
  'Strong routine dependence',
]

const EMPTY_PATIENT = {
  childName: '',
  childDob: '',
  childAge: '',
  childGender: '',
  caregiverName: '',
  relationship: '',
}

/** Match backend default (ASDIFY_MAX_IMAGE_MB) */
const MAX_IMAGE_BYTES = Math.max(1, Number(import.meta.env.VITE_MAX_IMAGE_MB) || 15) * 1024 * 1024

const IMAGE_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png'

function validateImageFile(file) {
  if (!file) return null
  const okType = /^image\/(jpeg|png)$/i.test(file.type) || file.type === ''
  const name = (file.name || '').toLowerCase()
  const extOk = /\.(jpe?g|png)$/i.test(name)
  if (!okType && !extOk) {
    return 'Please use a JPG or PNG image.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = MAX_IMAGE_BYTES / (1024 * 1024)
    return `Image must be ${mb} MB or smaller.`
  }
  if (file.size <= 0) {
    return 'This file appears empty.'
  }
  return null
}

const SOCIAL_SCALE = [
  { v: 1, label: '1 — Minimal' },
  { v: 2, label: '2 — Reduced' },
  { v: 3, label: '3 — Somewhat typical' },
  { v: 4, label: '4 — Mostly typical' },
  { v: 5, label: '5 — Strong / typical' },
]

function canAdvanceToBehaviorStep(imageFile, imageError) {
  if (imageError) return false
  if (!imageFile) return true
  return validateImageFile(imageFile) === null
}

/**
 * Module 5 — New assessment: patient details → image step → behavior step,
 * drag-and-drop image, validation, submit phases (uploading / analyzing).
 */
export function AssessmentNewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [phase, setPhase] = useState('patient')
  const [assessStep, setAssessStep] = useState('image')
  const [patientInfo, setPatientInfo] = useState(EMPTY_PATIENT)

  const [imageFile, setImageFile] = useState(null)
  const [imageError, setImageError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const [speechDelay, setSpeechDelay] = useState('no')
  const [speechSeverity, setSpeechSeverity] = useState('none')
  const [socialLevel, setSocialLevel] = useState(3)
  const [repetitive, setRepetitive] = useState([])
  const [notes, setNotes] = useState('')
  const [behaviorError, setBehaviorError] = useState('')

  const [submitPhase, setSubmitPhase] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'parent') return
    setPatientInfo((prev) => {
      const next = { ...prev }
      if (user.child_name && !prev.childName) next.childName = user.child_name
      if (user.child_dob && !prev.childDob) next.childDob = user.child_dob
      if (user.full_name && !prev.caregiverName) next.caregiverName = user.full_name
      return next
    })
  }, [user])

  useEffect(() => {
    if (speechDelay === 'no') {
      setSpeechSeverity('none')
    }
  }, [speechDelay])

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const trySetImage = useCallback((file) => {
    setImageError('')
    if (!file) {
      setImageFile(null)
      return
    }
    const err = validateImageFile(file)
    if (err) {
      setImageError(err)
      setImageFile(null)
      return
    }
    setImageFile(file)
  }, [])

  const canSubmit = useMemo(
    () => imageFile || notes.trim() || repetitive.length > 0 || speechDelay === 'yes',
    [imageFile, notes, repetitive, speechDelay],
  )

  const validateBehavior = useCallback(() => {
    if (notes.length > 10_000) {
      return 'Additional observations must be 10,000 characters or fewer.'
    }
    return ''
  }, [notes])

  function onToggleRepetitive(value) {
    setRepetitive((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    )
  }

  function onPickFileClick() {
    fileInputRef.current?.click()
  }

  function onFileInputChange(e) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    trySetImage(file)
  }

  function onDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer?.files?.[0] ?? null
    trySetImage(file)
  }

  function onDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  function onDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  function clearImage() {
    setImageFile(null)
    setImageError('')
  }

  function advanceToBehaviorIfValid() {
    if (imageFile) {
      const err = validateImageFile(imageFile)
      if (err) {
        setImageError(err)
        return
      }
    }
    setImageError('')
    setAssessStep('behavior')
    setBehaviorError('')
  }

  function continueToBehavior() {
    advanceToBehaviorIfValid()
  }

  useEffect(() => {
    if (submitPhase !== 'uploading') return undefined
    const id = window.setTimeout(() => {
      setSubmitPhase((p) => (p === 'uploading' ? 'analyzing' : p))
    }, 4000)
    return () => window.clearTimeout(id)
  }, [submitPhase])

  async function onSubmit(e) {
    e.preventDefault()
    const bv = validateBehavior()
    if (bv) {
      setBehaviorError(bv)
      return
    }
    if (!canSubmit) return

    setError('')
    setBehaviorError('')
    setSubmitPhase(imageFile ? 'uploading' : 'analyzing')
    try {
      await ensureGuestSession()
      const behavior = {
        speech_delay: speechDelay,
        speech_severity: speechSeverity,
        social_interaction_level: Number(socialLevel),
        repetitive_behaviors: repetitive,
        additional_notes: notes,
      }
      const patientPayload = Object.fromEntries(
        Object.entries(patientInfo)
          .filter(([, v]) => v && v.toString().trim())
          .map(([k, v]) => [
            k.replace(/([A-Z])/g, '_$1').toLowerCase(),
            v.toString().trim(),
          ]),
      )
      const data = await submitAssessment({
        imageFile,
        behavior,
        patientInfo: patientPayload,
        onPhase: (p) => setSubmitPhase(p),
      })
      navigate(`/assessment/result/${data.assessment.id}`, { state: { freshResult: true } })
    } catch (err) {
      setError(err.message ?? 'Could not complete assessment.')
    } finally {
      setSubmitPhase(null)
    }
  }

  const childLabel = patientInfo.childName?.trim() ? ` — ${patientInfo.childName.trim()}` : ''

  const progressLabel =
    submitPhase === 'uploading'
      ? 'Uploading and preprocessing image…'
      : submitPhase === 'analyzing'
        ? 'Running analysis on our servers…'
        : ''

  return (
    <>
      <DocumentTitle title="New Assessment — Asdify" />

      {submitPhase ? (
        <div className="assessment-submit-overlay" role="status" aria-live="polite">
          <div className="assessment-submit-overlay__card ui-card">
            <Spinner label={progressLabel} />
            <p className="assessment-submit-overlay__hint muted">
              Please keep this tab open. Large photos can take a little longer.
            </p>
          </div>
        </div>
      ) : null}

      <section className="lp-section assessment-new">
        <p className="section-eyebrow">Assessment · Module 5</p>
        <h1 className="section-title">New AI-assisted assessment{childLabel}</h1>
        <p className="section-lead">
          Add an optional photo, then describe behaviors. Everything is processed securely on the server.
        </p>

        {error ? (
          <Alert title="Assessment failed" variant="error">
            {error}
          </Alert>
        ) : null}

        {phase === 'patient' ? (
          <PatientDetailsCard
            value={patientInfo}
            onChange={setPatientInfo}
            onContinue={() => {
              setPhase('assessment')
              setAssessStep('image')
            }}
            continueLabel="Continue to assessment"
          />
        ) : null}

        {phase === 'assessment' ? (
          <div className="assessment-flow ui-card">
            <div className="assessment-stepper" aria-label="Assessment steps">
              <button
                type="button"
                className={`assessment-stepper__step${assessStep === 'image' ? ' is-active' : ''}${assessStep === 'behavior' ? ' is-done' : ''}`}
                onClick={() => setAssessStep('image')}
              >
                <span className="assessment-stepper__n">1</span>
                <span className="assessment-stepper__label">Image</span>
              </button>
              <span className="assessment-stepper__bar" aria-hidden />
              <button
                type="button"
                className={`assessment-stepper__step${assessStep === 'behavior' ? ' is-active' : ''}`}
                disabled={assessStep === 'image' && !canAdvanceToBehaviorStep(imageFile, imageError)}
                onClick={() => {
                  if (assessStep === 'image') advanceToBehaviorIfValid()
                }}
              >
                <span className="assessment-stepper__n">2</span>
                <span className="assessment-stepper__label">Behavior</span>
              </button>
            </div>

            {patientInfo.childName?.trim() ? (
              <div className="patient-summary-strip">
                <span className="patient-summary-strip__label">For reports:</span>
                <strong>{patientInfo.childName.trim()}</strong>
                {patientInfo.childAge?.trim() || patientInfo.childDob ? (
                  <span className="muted small">
                    &nbsp;·&nbsp;
                    {patientInfo.childAge?.trim() || patientInfo.childDob}
                  </span>
                ) : null}
                <button type="button" className="patient-summary-strip__edit" onClick={() => setPhase('patient')}>
                  Edit patient details
                </button>
              </div>
            ) : (
              <button type="button" className="ui-btn ui-btn--ghost patient-details-back ui-btn--icon-inline" onClick={() => setPhase('patient')}>
                <IconArrowLeft className="ui-btn__start-icon" />
                Edit patient details
              </button>
            )}

            {assessStep === 'image' ? (
              <div className="assessment-panel anim-fade-up">
                <h2 className="assessment-panel__title">Child photograph</h2>
                <p className="assessment-panel__lead muted">
                  Optional clear, front-facing photo (JPG or PNG). Drag and drop or browse. No image is required if you submit
                  behavioral details in the next step.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="assessment-file-input visually-hidden"
                  aria-hidden
                  tabIndex={-1}
                  onChange={onFileInputChange}
                />

                <div
                  role="button"
                  tabIndex={0}
                  className={`assessment-dropzone${dragActive ? ' is-drag-active' : ''}${imageFile ? ' has-file' : ''}`}
                  onClick={onPickFileClick}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      onPickFileClick()
                    }
                  }}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  aria-label="Drop image here or press Enter to browse files"
                >
                  {!imageFile && !previewUrl ? (
                    <div className="assessment-dropzone__placeholder">
                      <span className="assessment-dropzone__icon" aria-hidden>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 16V4M12 4L8 8M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                          <path
                            d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <strong>Drop a photo here</strong>
                      <span className="muted">or click to choose · JPG / PNG · max {MAX_IMAGE_BYTES / (1024 * 1024)} MB</span>
                    </div>
                  ) : null}
                  {previewUrl ? (
                    <div className="assessment-dropzone__preview">
                      <img src={previewUrl} alt="" className="assessment-preview-img" />
                      <div className="assessment-dropzone__preview-meta">
                        <span className="assessment-filename">{imageFile?.name ?? 'Image'}</span>
                        <button
                          type="button"
                          className="ui-btn ui-btn--secondary ui-btn--sm"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            clearImage()
                          }}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          className="ui-btn ui-btn--ghost ui-btn--sm"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            onPickFileClick()
                          }}
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {imageError ? (
                  <Alert variant="error" title="Image not accepted">
                    {imageError}
                  </Alert>
                ) : null}

                <div className="assessment-panel__actions">
                  <Button type="button" variant="secondary" onClick={continueToBehavior}>
                    {imageFile ? 'Continue to behavior' : 'Continue without photo'}
                  </Button>
                </div>
              </div>
            ) : null}

            {assessStep === 'behavior' ? (
              <form className="assessment-panel assessment-form anim-fade-up" onSubmit={onSubmit} noValidate>
                <h2 className="assessment-panel__title">Behavioral observations</h2>
                <p className="assessment-panel__lead muted">
                  Provide at least one signal: speech delay, repetitive behaviors, social interaction level, or written notes
                  (or include a photo from the previous step).
                </p>

                <button type="button" className="ui-btn ui-btn--ghost assessment-back-step ui-btn--icon-inline" onClick={() => setAssessStep('image')}>
                  <IconArrowLeft className="ui-btn__start-icon" />
                  Back to image
                </button>

                <div className="assessment-grid">
                  <label className="ui-field">
                    <span className="ui-label">Speech delay</span>
                    <select className="ui-input" value={speechDelay} onChange={(e) => setSpeechDelay(e.target.value)}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>

                  <label className="ui-field">
                    <span className="ui-label">Speech severity {speechDelay === 'no' ? '(N/A)' : ''}</span>
                    <select
                      className="ui-input"
                      value={speechSeverity}
                      disabled={speechDelay === 'no'}
                      onChange={(e) => setSpeechSeverity(e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </label>

                  <div className="ui-field assessment-social">
                    <span className="ui-label" id="social-label">
                      Social interaction level
                    </span>
                    <div className="assessment-social__scale" role="group" aria-labelledby="social-label">
                      {SOCIAL_SCALE.map(({ v, label }) => (
                        <label key={v} className={`assessment-social__opt${socialLevel === v ? ' is-selected' : ''}`}>
                          <input
                            type="radio"
                            name="socialLevel"
                            value={v}
                            checked={socialLevel === v}
                            onChange={() => setSocialLevel(v)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <fieldset className="ui-fieldset">
                  <legend className="ui-label">Repetitive behaviors (optional, multi-select)</legend>
                  <div className="assessment-checkbox-grid">
                    {REPETITIVE_OPTIONS.map((item) => (
                      <label key={item} className="ui-check">
                        <input
                          type="checkbox"
                          checked={repetitive.includes(item)}
                          onChange={() => onToggleRepetitive(item)}
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="ui-field">
                  <span className="ui-label">Additional observations</span>
                  <textarea
                    className="ui-input"
                    rows="4"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything else a clinician should know…"
                    maxLength={10_000}
                  />
                  <span className="ui-hint">{notes.length} / 10,000</span>
                </label>

                {behaviorError ? (
                  <Alert variant="error" title="Check your answers">
                    {behaviorError}
                  </Alert>
                ) : null}

                {!canSubmit ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    Add a photo in step 1, or enter at least one behavioral indicator above, to enable submit.
                  </p>
                ) : null}

                <div className="assessment-panel__actions screening-actions">
                  <Button type="submit" disabled={!canSubmit || Boolean(submitPhase)}>
                    Submit &amp; analyze
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  )
}