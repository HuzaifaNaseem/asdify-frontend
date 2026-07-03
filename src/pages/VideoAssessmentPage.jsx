import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { PatientDetailsCard } from '../components/common/PatientDetailsCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { DocumentTitle } from '../components/common/DocumentTitle'
import { Spinner } from '../components/ui/Spinner'
import { submitVideoAssessment } from '../services/assessmentService'
import { useAuth } from '../state/AuthContext'

const MIN_SEC = 30
const MAX_SEC = 60
// The backend accepts a ±2s grace (MIN/MAX_VIDEO_DURATION_TOLERANCE = 28/62),
// so gate on the same tolerance rather than hard-blocking a clip a second or
// two outside the recommended 30–60s window.
const MIN_ACCEPT = 28
const MAX_ACCEPT = 62
const ACCEPT = 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov'
const STEP_DEFS = [
  { key: 'uploading', label: 'Uploading your video securely' },
  { key: 'reconnecting', label: 'Reconnecting to secure tunnel after interruption' },
  { key: 'server_processing', label: 'Server is preparing and validating the clip' },
  { key: 'ai_inference', label: 'AI model is analyzing video and audio signals' },
  { key: 'finalizing', label: 'Finalizing result and storing assessment' },
  { key: 'completed', label: 'Completed' },
]

const EMPTY_PATIENT = {
  childName: '',
  childDob: '',
  childAge: '',
  childGender: '',
  caregiverName: '',
  relationship: '',
}

function buildPatientPayload(patientInfo, notes = '') {
  const payload = Object.fromEntries(
    Object.entries(patientInfo)
      .filter(([, v]) => v && v.toString().trim())
      .map(([k, v]) => [k.replace(/([A-Z])/g, '_$1').toLowerCase(), v.toString().trim()]),
  )
  if (notes.trim()) {
    payload.additional_notes = notes.trim()
  }
  return payload
}

export function VideoAssessmentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const videoPreviewRef = useRef(null)

  const [phase, setPhase] = useState('patient')
  const [patientInfo, setPatientInfo] = useState(EMPTY_PATIENT)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [duration, setDuration] = useState(null)
  const [durationError, setDurationError] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadPercent, setUploadPercent] = useState(0)
  const [activeStep, setActiveStep] = useState('')
  const [stepTrail, setStepTrail] = useState([])

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

  function activateStep(step, detail) {
    setActiveStep(step)
    setStepTrail((prev) => {
      const exists = prev.some((s) => s.step === step)
      if (exists) return prev
      return [...prev, { step, detail: detail || '' }]
    })
  }

  useEffect(() => {
    if (!submitting) return
    if (activeStep !== 'server_processing') return

    const t1 = window.setTimeout(() => activateStep('ai_inference', 'Extracting frames and audio features.'), 2200)
    const t2 = window.setTimeout(() => activateStep('finalizing', 'Computing risk score and saving output.'), 6500)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [submitting, activeStep])

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      setDuration(null)
      setDurationError('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  const onVideoMetadata = useCallback(() => {
    const el = videoPreviewRef.current
    if (!el || !Number.isFinite(el.duration)) return
    const d = el.duration
    setDuration(d)
    if (d < MIN_ACCEPT || d > MAX_ACCEPT) {
      setDurationError(`This clip is ${d.toFixed(1)}s long. Please use a video between ${MIN_SEC} and ${MAX_SEC} seconds.`)
    } else {
      setDurationError('')
    }
  }, [])

  const onPickFile = () => fileInputRef.current?.click()

  const onFileChange = (e) => {
    const f = e.target.files?.[0]
    setError('')
    setFile(f || null)
    if (!f) return
    setDuration(null)
    setDurationError('')
  }

  const clearFile = () => {
    setFile(null)
    setError('')
    setDurationError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Choose a video file first.')
      return
    }
    if (duration == null || !Number.isFinite(duration)) {
      setError('Wait for the preview to load, or try another file.')
      return
    }
    if (duration < MIN_ACCEPT || duration > MAX_ACCEPT) {
      setError(durationError || `Clip length must be between ${MIN_SEC} and ${MAX_SEC} seconds.`)
      return
    }

    setSubmitting(true)
    setUploadPercent(0)
    setStepTrail([])
    activateStep('uploading', 'Sending encrypted multipart upload.')
    try {
      const res = await submitVideoAssessment({
        videoFile: file,
        durationSeconds: duration,
        patientInfo: buildPatientPayload(patientInfo, notes),
        onProgress: ({ percent }) => {
          setUploadPercent(percent)
        },
        onPhase: (p) => {
          if (p === 'uploading') {
            activateStep('uploading', 'Sending encrypted multipart upload.')
          } else if (p === 'reconnecting') {
            activateStep('reconnecting', 'Tunnel interrupted. Waiting for reconnection, then retrying upload.')
          } else if (p === 'server_processing') {
            activateStep('server_processing', 'Upload complete. Waiting for server AI pipeline.')
          } else if (p === 'completed') {
            activateStep('completed', 'Assessment created successfully.')
          }
        },
      })
      const id = res?.assessment?.id
      if (id) {
        activateStep('completed', 'Assessment created successfully.')
        navigate(`/assessment/result/${id}`, { replace: true, state: { freshResult: true } })
      } else {
        setError('Upload succeeded but no assessment id was returned.')
      }
    } catch (err) {
      setError(err.message ?? 'Could not submit video.')
    } finally {
      setSubmitting(false)
    }
  }

  const childLabel = patientInfo.childName?.trim() ? ` for ${patientInfo.childName.trim()}` : ''

  return (
    <>
      <DocumentTitle title="Video assessment — Asdify" />

      <div className="video-assessment-page lp-section">
        <header className="video-assessment-page__intro anim-fade-up">
          <p className="video-assessment-page__eyebrow">Parent module · Video</p>
          <h1 className="video-assessment-page__title">Video assessment{childLabel}</h1>
          <p className="video-assessment-page__lead muted">
            Upload a single {MIN_SEC}–{MAX_SEC} second video (MP4, WebM, or MOV). Patient details from step one
            appear on your PDF report. For best results, use stable lighting, a clear view of your child, and everyday
            interaction — no staging required.
          </p>
        </header>

        {phase === 'patient' ? (
          <PatientDetailsCard
            value={patientInfo}
            onChange={setPatientInfo}
            onContinue={() => setPhase('video')}
            continueLabel="Continue to video upload"
            stepBadge="Step 1 of 2"
          />
        ) : null}

        {phase === 'video' ? (
          <form className="video-assessment-form ui-card anim-fade-up anim-delay-1" onSubmit={onSubmit} noValidate>
            <div className="patient-details-card__header" style={{ marginBottom: '1rem' }}>
              <span className="patient-details-card__badge">Step 2 of 2</span>
              <h2 className="patient-details-card__title">Upload video clip</h2>
              <p className="patient-details-card__lead muted">
                {patientInfo.childName?.trim() ? (
                  <>
                    Recording for <strong>{patientInfo.childName.trim()}</strong>
                    {patientInfo.childAge?.trim() || patientInfo.childDob ? (
                      <> · {patientInfo.childAge?.trim() || patientInfo.childDob}</>
                    ) : null}
                    .{' '}
                  </>
                ) : null}
                <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setPhase('patient')}>
                  Edit patient details
                </button>
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="visually-hidden"
              aria-hidden
              tabIndex={-1}
              onChange={onFileChange}
            />

            {!file ? (
              <button type="button" className="video-assessment-dropzone" onClick={onPickFile}>
                <span className="video-assessment-dropzone__label">Choose video file</span>
                <span className="video-assessment-dropzone__hint muted small">
                  {MIN_SEC}–{MAX_SEC} seconds · up to 150 MB · MP4, WebM, MOV
                </span>
              </button>
            ) : (
              <div className="video-assessment-preview-block">
                <video
                  ref={videoPreviewRef}
                  key={previewUrl}
                  src={previewUrl}
                  className="video-assessment-preview"
                  controls
                  muted
                  playsInline
                  onLoadedMetadata={onVideoMetadata}
                />
                <div className="video-assessment-preview-meta">
                  <span className="video-assessment-filename">{file.name}</span>
                  {duration != null && Number.isFinite(duration) ? (
                    <span className={`video-assessment-duration${durationError ? ' video-assessment-duration--bad' : ''}`}>
                      Duration: {duration.toFixed(1)}s
                    </span>
                  ) : (
                    <span className="muted small">Reading duration…</span>
                  )}
                  <Button type="button" variant="ghost" className="ui-btn--sm" onClick={clearFile}>
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {durationError ? (
              <Alert variant="error" title="Clip length">
                {durationError}
              </Alert>
            ) : null}

            <label className="ui-field">
              <span className="ui-label">Optional context for the report</span>
              <textarea
                className="ui-input video-assessment-notes"
                rows={3}
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                placeholder="Setting, concerns, or context clinicians might find helpful (optional)"
                maxLength={2000}
              />
            </label>

            {error ? (
              <Alert variant="error" title="Something went wrong">
                {error}
              </Alert>
            ) : null}

            {submitting ? (
              <div className="video-progress" aria-live="polite">
                <div className="video-progress__header">
                  <strong>Processing progress</strong>
                  <span>{uploadPercent}% uploaded</span>
                </div>
                <div
                  className="video-progress__bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={uploadPercent}
                >
                  <span className="video-progress__fill" style={{ width: `${uploadPercent}%` }} />
                </div>
                <p className="video-progress__active">
                  {STEP_DEFS.find((s) => s.key === activeStep)?.label || 'Preparing…'}
                </p>
                <ol className="video-progress__steps">
                  {STEP_DEFS.filter((s) => s.key !== 'completed').map((s) => {
                    const done = stepTrail.some((x) => x.step === s.key) && s.key !== activeStep
                    const active = s.key === activeStep
                    return (
                      <li
                        key={s.key}
                        className={`video-progress__step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}
                      >
                        <span className="video-progress__dot" aria-hidden="true" />
                        <span>{s.label}</span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ) : null}

            <div className="video-assessment-actions">
              <Button type="submit" disabled={submitting || !file || !!durationError || duration == null}>
                {submitting ? 'Uploading and analyzing…' : 'Submit for analysis'}
              </Button>
              <Link className="ui-btn ui-btn--secondary" to="/dashboard/asd-tests">
                Back to tests
              </Link>
            </div>

            {submitting ? <Spinner label="Please wait while AI assessment completes…" /> : null}
          </form>
        ) : null}
      </div>
    </>
  )
}
