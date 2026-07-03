import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PatientDetailsCard } from '../components/common/PatientDetailsCard'
import { DocumentTitle } from '../components/common/DocumentTitle'
import { MetaDescription } from '../components/common/MetaDescription'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { fetchScreeningQuestions, submitScreeningAnswers } from '../services/screeningService'
import { downloadAssessmentReport } from '../services/assessmentService'
import { ensureGuestSession } from '../services/sessionService'
import { useAuth } from '../state/AuthContext'

/** Maps API risk_band.band to alert variant */
const BAND_TO_TONE = {
  'Minimal Risk': 'success',
  'Low Risk': 'success',
  'Moderate Risk': 'info',
  'High Risk': 'error',
  'Very High Risk': 'error',
}

const FALLBACK_RISK_TO_TONE = {
  Low: 'success',
  Medium: 'info',
  High: 'error',
}

const EMPTY_PATIENT = {
  childName: '',
  childDob: '',
  childAge: '',
  childGender: '',
  caregiverName: '',
  relationship: '',
}

// Phases: 'patient' → 'questionnaire' → 'result'
export function ScreeningPage() {
  const { user } = useAuth()
  const [phase, setPhase] = useState('patient')
  const [patientInfo, setPatientInfo] = useState(EMPTY_PATIENT)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [questionsData, setQuestionsData] = useState(null)
  const [error, setError] = useState('')
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [saveToAccount, setSaveToAccount] = useState(true)

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
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        await ensureGuestSession()
        const data = await fetchScreeningQuestions()
        if (cancelled) return
        setQuestionsData(data)
      } catch (e) {
        if (cancelled) return
        setError(e.message ?? 'Could not load questionnaire.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const questions = questionsData?.questions ?? []
  const current = questions[idx]
  const progress = questions.length ? Math.round(((idx + 1) / questions.length) * 100) : 0
  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => {
      const v = answers[q.key]
      return typeof v === 'string' && v.length > 0
    })

  const resultSummary = useMemo(() => {
    if (!result) return null
    const finalPct = Math.round(Number(result.final_score ?? 0))
    const band = result.risk_band?.band ?? ''
    const tone =
      (band && BAND_TO_TONE[band]) || FALLBACK_RISK_TO_TONE[result.risk_level] || 'info'
    return { finalPct, tone, band, bandColor: result.risk_band?.color }
  }, [result])

  function chooseAnswer(value) {
    if (!current) return
    setAnswers((prev) => ({ ...prev, [current.key]: value }))
  }

  async function onSubmit() {
    if (!allAnswered) return
    setSubmitting(true)
    setError('')
    try {
      const patientPayload = Object.fromEntries(
        Object.entries(patientInfo)
          .filter(([, v]) => v && v.toString().trim())
          .map(([k, v]) => [
            k.replace(/([A-Z])/g, '_$1').toLowerCase(), // camelCase → snake_case
            v.toString().trim(),
          ])
      )
      const data = await submitScreeningAnswers({
        answers,
        saveResult: user?.role === 'parent' ? saveToAccount : true,
        patientInfo: patientPayload,
      })
      setResult(data.result)
      setPhase('result')
    } catch (e) {
      setError(e.message ?? 'Failed to score questionnaire.')
    } finally {
      setSubmitting(false)
    }
  }

  const childLabel = patientInfo.childName?.trim()
    ? `for ${patientInfo.childName.trim()}`
    : ''

  return (
    <>
      <DocumentTitle title="Online Screening — Asdify" />
      <MetaDescription content="Complete the AQ-10 (Child) autism screening questionnaire, scored by a trained model, with an instant risk band and PDF report." />

      <section className="lp-section">
        <p className="section-eyebrow">Module 9 · Questionnaire engine</p>
        <h1 className="section-title">ASD screening questionnaire {childLabel}</h1>
        <p className="section-lead">
          Based on the validated AQ-10 (Child) screening instrument and scored by a trained
          machine-learning model. It supports early conversations but does not replace clinical
          diagnosis.
        </p>

        {error ? (
          <Alert title="Screening error" variant="error">
            {error}
          </Alert>
        ) : null}

        {/* ── Phase 1: Patient details ───────────────────────────────── */}
        {phase === 'patient' && !loading ? (
          <PatientDetailsCard
            value={patientInfo}
            onChange={setPatientInfo}
            onContinue={() => setPhase('questionnaire')}
            continueLabel="Continue to Questionnaire"
          />
        ) : null}

        {loading && phase === 'patient' ? (
          <div className="ui-card">
            <Spinner label="Loading questionnaire..." />
          </div>
        ) : null}

        {/* ── Phase 2: Questionnaire ─────────────────────────────────── */}
        {phase === 'questionnaire' && !result && questions.length > 0 ? (
          <div className="ui-card screening-card">
            {user?.role === 'parent' ? (
              <label className="screening-save-account">
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={(e) => setSaveToAccount(e.target.checked)}
                />
                <span>
                  Save to <strong>my account</strong> history (recommended). If unchecked, the result stays in this
                  browser session only.
                </span>
              </label>
            ) : null}
            <div className="screening-progress">
              <div className="screening-progress__meta">
                <span>
                  Question {idx + 1} of {questions.length}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="screening-progress__bar">
                <div className="screening-progress__bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {current?.domain ? (
              <p className="screening-domain muted small">
                Domain:{' '}
                <span className="screening-domain__tag">{current.domain.replace(/_/g, ' ')}</span>
              </p>
            ) : null}

            <h2 className="screening-question">{current?.text}</h2>

            <div className="screening-answers screening-answers--grid">
              {(current?.options ?? []).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`screening-answer screening-answer--long ${
                    answers[current?.key] === opt.value ? 'is-selected' : ''
                  }`}
                  onClick={() => chooseAnswer(opt.value)}
                >
                  <span className="screening-answer__letter">{opt.value}</span>
                  <span className="screening-answer__text">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="screening-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  if (idx === 0) {
                    setPhase('patient')
                  } else {
                    setIdx((v) => Math.max(0, v - 1))
                  }
                }}
              >
                {idx === 0 ? 'Back to Details' : 'Previous'}
              </Button>
              {idx < questions.length - 1 ? (
                <Button
                  onClick={() => setIdx((v) => Math.min(questions.length - 1, v + 1))}
                  disabled={!answers[current?.key]}
                >
                  Next
                </Button>
              ) : (
                <Button onClick={onSubmit} disabled={!allAnswered || submitting}>
                  {submitting ? 'Scoring...' : 'Submit & Score'}
                </Button>
              )}
            </div>
            <p className="muted small">
              {user?.role === 'parent' && !saveToAccount
                ? 'You chose not to link this run to your account; it remains available under this session only.'
                : 'Your result is stored so you can open it again from History for this session or account.'}
            </p>
          </div>
        ) : null}

        {/* ── Phase 3: Results ───────────────────────────────────────── */}
        {phase === 'result' && result ? (
          <div className="ui-card screening-result">
            <div
              className="screening-result-banner"
              style={{ '--band-color': resultSummary.bandColor || 'var(--accent)' }}
            >
              <div className="screening-result-banner__top">
                <div>
                  <span className="screening-result-banner__eyebrow">Screening result</span>
                  <h2 className="screening-result-banner__band">
                    {result.risk_band?.band ?? result.risk_level}
                  </h2>
                </div>
                <div className="screening-result-banner__score">
                  <span className="screening-result-banner__score-num">{resultSummary.finalPct}</span>
                  <span className="screening-result-banner__score-max">/100</span>
                </div>
              </div>
              <div className="screening-result-banner__bar" aria-hidden="true">
                <span
                  className="screening-result-banner__bar-fill"
                  style={{ width: `${resultSummary.finalPct}%` }}
                />
              </div>
              <p className="screening-result-banner__sub">
                AQ-10 screening (0–100) · {result.critical_score ?? 0} of 10 AQ-10 indicators flagged.
              </p>
            </div>

            <p className="screening-recommendation">{result.recommendation}</p>

            <div className="screening-badges">
              {result.saved_to_account ? (
                <span className="screening-badge is-saved">Saved to your account</span>
              ) : user?.role === 'parent' ? (
                <span className="screening-badge">Session only (not on account)</span>
              ) : (
                <span className="screening-badge is-saved">Saved to this session</span>
              )}
            </div>

            <details className="screening-domain-details">
              <summary>Score breakdown &amp; technical details</summary>
              {result.domain_scores_weighted ? (
                <ul className="screening-domain-list">
                  {Object.entries(result.domain_scores_weighted).map(([k, v]) => (
                    <li key={k}>
                      {k.replace(/_/g, ' ')}: {typeof v === 'number' ? v.toFixed(2) : v}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="muted small screening-tech-line">
                Weighted sum {result.weighted_sum} / {result.max_possible_weighted} · Model{' '}
                {result.model_version}
              </p>
              {result.risk_items?.length ? (
                <p className="muted small screening-tech-line">
                  Flagged items: {result.risk_items.join(', ')}
                </p>
              ) : null}
            </details>

            <div className="screening-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setResult(null)
                  setPhase('patient')
                  setIdx(0)
                  setAnswers({})
                  setPatientInfo(EMPTY_PATIENT)
                  setPdfError('')
                  setSaveToAccount(true)
                }}
              >
                Start again
              </Button>
              <Button
                variant="primary"
                disabled={pdfLoading}
                onClick={async () => {
                  setPdfError('')
                  setPdfLoading(true)
                  try {
                    await downloadAssessmentReport(result.assessment_id)
                  } catch (e) {
                    setPdfError(e?.message ?? 'Could not download PDF.')
                  } finally {
                    setPdfLoading(false)
                  }
                }}
              >
                {pdfLoading ? 'Preparing PDF…' : 'Download PDF report'}
              </Button>
              <Link
                className="ui-btn ui-btn--secondary"
                to={`/assessment/result/${result.assessment_id}`}
                state={{ freshResult: true }}
              >
                Open result page
              </Link>
            </div>
            {pdfError ? (
              <Alert title="PDF download" variant="error">
                {pdfError}
              </Alert>
            ) : null}
          </div>
        ) : null}
      </section>
    </>
  )
}
