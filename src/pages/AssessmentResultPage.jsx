import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { DocumentTitle } from '../components/common/DocumentTitle'
import { Spinner } from '../components/ui/Spinner'
import { createAssessmentReportShare, downloadAssessmentReport, fetchAssessmentById } from '../services/assessmentService'
import { ensureGuestSession } from '../services/sessionService'

const RISK_THEME = {
  Low: { tone: 'success', bar: 'var(--success)', chip: 'result-risk-chip--low' },
  Medium: { tone: 'info', bar: '#f59e0b', chip: 'result-risk-chip--medium' },
  High: { tone: 'error', bar: 'var(--error)', chip: 'result-risk-chip--high' },
}

const BLEND_LABELS = {
  image: 'Image analysis',
  behavior: 'Behavior scoring',
  screening: 'Linked screening',
  video: 'Video analysis',
}

const RISK_PARENT_TIP = {
  Low: 'Most children develop at their own pace. Keep routine well-child visits and revisit screening if new concerns appear.',
  Medium:
    'A moderate signal often warrants a structured follow-up. Consider sharing this summary with your pediatrician or early-intervention team.',
  High: 'A higher-risk signal deserves timely professional follow-up. Use this summary to start a conversation with qualified care — it is not a diagnosis.',
}

/** Fallback blend when viewing legacy assessments without stored blend rows. */
function deriveLegacyBlend(componentsUsed) {
  if (!componentsUsed?.length) return []
  const weights = { image: 0.45, behavior: 0.35, screening: 0.2, video: 1.0 }
  let sum = 0
  const raw = componentsUsed.map((c) => {
    const w = weights[c] ?? 1 / componentsUsed.length
    sum += w
    return { component: c, w }
  })
  return raw.map(({ component, w }) => ({
    component,
    weight_share_pct: Math.round((w / sum) * 1000) / 10,
    component_score: null,
    contribution: null,
  }))
}

function MetricChip({ label, value }) {
  return (
    <div className="result-metric-chip">
      <span className="result-metric-chip__label">{label}</span>
      <span className="result-metric-chip__value">{value}</span>
    </div>
  )
}

function ConfidenceGauge({ label, valuePct, accent }) {
  return (
    <div className="result-gauge">
      <div className="result-gauge__head">
        <span className="result-gauge__label">{label}</span>
        <span className="result-gauge__pct">{valuePct}%</span>
      </div>
      <div className="result-gauge__track" role="progressbar" aria-valuenow={valuePct} aria-valuemin={0} aria-valuemax={100}>
        <div className="result-gauge__fill" style={{ width: `${valuePct}%`, background: accent }} />
      </div>
    </div>
  )
}

function BlendVisualization({ blend }) {
  if (!blend?.length) return null
  return (
    <div className="result-blend">
      <h3 className="result-section-title">How your result was combined</h3>
      <p className="result-section-lead muted">
        Each signal contributes a weighted share to the blended risk score (MVP combiner). This transparency supports
        clinical review—not automated diagnosis.
      </p>
      <div className="result-blend__bar" aria-hidden>
        {blend.map((row) => (
          <div
            key={row.component}
            className={`result-blend__segment result-blend__segment--${row.component}`}
            style={{ flexGrow: Math.max(row.weight_share_pct || 1, 0.1) }}
            title={`${BLEND_LABELS[row.component] || row.component}: ${row.weight_share_pct}%`}
          />
        ))}
      </div>
      <ul className="result-blend__legend">
        {blend.map((row) => (
          <li key={row.component}>
            <span className={`result-blend__dot result-blend__dot--${row.component}`} aria-hidden />
            <span className="result-blend__legend-label">{BLEND_LABELS[row.component] || row.component}</span>
            <span className="result-blend__legend-pct">{row.weight_share_pct}% weight</span>
            {row.component_score != null ? (
              <span className="muted small">Score {Math.round(Number(row.component_score) * 100)}%</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Module 6 — Structured inference presentation: risk, confidence, blend, model lineage, summaries.
 */
export function AssessmentResultPage({ mode = 'result' }) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assessment, setAssessment] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [shareBusy, setShareBusy] = useState(false)
  const [shareError, setShareError] = useState('')
  const [shareNotice, setShareNotice] = useState('')
  const [dismissSavedBanner, setDismissSavedBanner] = useState(false)
  const showSavedBanner = mode === 'result' && location.state?.freshResult === true && !dismissSavedBanner

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        await ensureGuestSession()
        const data = await fetchAssessmentById(id)
        if (cancelled) return
        setAssessment(data.assessment)
      } catch (err) {
        if (cancelled) return
        setError(err.message ?? 'Could not load assessment.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const out = assessment?.output ?? {}
  const riskLevel = assessment?.risk_level
  const theme = RISK_THEME[riskLevel] ?? RISK_THEME.Medium

  const riskInfo = useMemo(() => {
    if (!assessment) return null
    const t = RISK_THEME[assessment.risk_level] ?? RISK_THEME.Medium
    const score = Number(assessment.risk_score ?? 0)
    return {
      scorePct: Math.round(score * 100),
      confidencePct: Math.round(Number(assessment.confidence ?? 0) * 100),
      tone: t.tone,
      bar: t.bar,
      chip: t.chip,
    }
  }, [assessment])

  const blend = useMemo(() => {
    if (!assessment) return []
    const rows = out.combiner?.blend
    if (rows?.length) return rows
    return deriveLegacyBlend(out.components_used)
  }, [assessment, out.combiner?.blend, out.components_used])

  const imageComp = out.components?.image
  const behaviorComp = out.components?.behavior
  const screeningComp = out.components?.screening
  const videoComp = out.components?.video
  const videoSignalPct = Math.round(
    Number(videoComp?.risk_score ?? videoComp?.asd_probability ?? 0) * 100,
  )
  const videoConfidencePct = Math.round(
    Number(videoComp?.confidence ?? assessment?.confidence ?? videoComp?.asd_probability ?? 0) * 100,
  )
  const videoLatencyMs = videoComp?.model?.latency_ms ?? videoComp?.inference_time_ms
  const videoModelName =
    videoComp?.model?.name ??
    (videoComp?.runtime?.video_backbone
      ? `${videoComp.runtime.video_backbone}+${videoComp.runtime.audio_backbone ?? 'yamnet'}`
      : null)
  const isScreeningOnly = assessment?.type === 'screening'

  const behaviorInputs = assessment?.inputs?.behavior ?? {}

  const parentTip = RISK_PARENT_TIP[assessment?.risk_level] ?? RISK_PARENT_TIP.Medium

  const doctorNotes = out.doctor_notes ?? out.clinical_notes ?? assessment?.doctor_notes ?? null

  const dismissSaved = () => {
    setDismissSavedBanner(true)
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} })
  }

  return (
    <>
      <DocumentTitle title={`${mode === 'history' ? 'Assessment detail' : 'Assessment result'} — Asdify`} />

      <div className="result-page lp-section">
        <header className="result-page__intro">
          <p className="result-page__eyebrow">
            {mode === 'history' ? 'History · Module 7' : 'Results · Module 8'}
          </p>
          <h1 className="result-page__title">
            {mode === 'history' ? 'Saved assessment' : 'Your assessment result'}
          </h1>
          <p className="result-page__lead muted">
            Blended risk estimate from server-side models. Use this alongside — not instead of — professional evaluation.
          </p>
        </header>

        {showSavedBanner ? (
          <Alert variant="success" title="Saved to your history">
            <div className="result-saved-banner">
              <p>This assessment is stored and you can reopen it anytime from History.</p>
              <button type="button" className="result-saved-banner__close ui-btn ui-btn--ghost ui-btn--sm" onClick={dismissSaved}>
                Dismiss
              </button>
            </div>
          </Alert>
        ) : null}

        {loading ? (
          <div className="ui-card result-page__loading">
            <Spinner label="Loading analysis…" />
          </div>
        ) : null}

        {error ? (
          <Alert title="Could not load result" variant="error">
            {error}
          </Alert>
        ) : null}

        {!loading && assessment?.status === 'failed' ? (
          <Alert title="Assessment incomplete" variant="error">
            This assessment did not finish processing. Please start a new assessment from the dashboard.
          </Alert>
        ) : null}

        {!loading && assessment && assessment.status !== 'failed' ? (
          <>
            <section className={`result-hero result-hero--${(assessment.risk_level || 'Medium').toLowerCase()} anim-fade-up`}>
              <div className="result-hero__main">
                <p className="result-hero__label">Blended risk category</p>
                <p className={`result-hero__risk ${riskInfo?.chip ?? theme.chip}`}>{assessment.risk_level}</p>
                <p className="result-hero__meta muted">
                  Updated {new Date(assessment.created_at).toLocaleString()} · Type{' '}
                  <strong>{String(assessment.type || '').toUpperCase()}</strong>
                  {out.pipeline?.version ? (
                    <>
                      {' '}
                      · Pipeline <strong>{out.pipeline.version}</strong>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="result-hero__gauges">
                <ConfidenceGauge
                  label="Blended risk score"
                  valuePct={riskInfo?.scorePct ?? 0}
                  accent={riskInfo?.bar ?? theme.bar}
                />
                <ConfidenceGauge
                  label="Model confidence"
                  valuePct={riskInfo?.confidencePct ?? 0}
                  accent="var(--accent)"
                />
              </div>
            </section>

            <Alert variant={riskInfo?.tone ?? 'info'} title="Important">
              This tool provides a screening-style risk summary, not a clinical diagnosis. Discuss all results with a
              qualified professional.
            </Alert>

            <p className="result-parent-tip muted anim-fade-up">{parentTip}</p>

            {isScreeningOnly && screeningComp ? (
              <section className="ui-card result-panel anim-fade-up anim-delay-1">
                <h2 className="result-section-title">Questionnaire screening</h2>
                <p className="result-section-lead muted">
                  Score derived from the structured screening engine linked to this record.
                </p>
                <div className="result-metrics-row">
                  {screeningComp.final_score != null ? (
                    <MetricChip label="Final score" value={`${Math.round(Number(screeningComp.final_score))}%`} />
                  ) : null}
                  {screeningComp.risk_band?.band ? (
                    <MetricChip label="Risk band" value={screeningComp.risk_band.band} />
                  ) : null}
                </div>
              </section>
            ) : null}

            {!isScreeningOnly && blend.length > 0 ? (
              <section className="ui-card result-panel anim-fade-up anim-delay-1">
                <BlendVisualization blend={blend} />
              </section>
            ) : null}

            {!isScreeningOnly && (imageComp || behaviorComp || videoComp) ? (
              <div className="result-two-col">
                {videoComp ? (
                  <section className="ui-card result-panel anim-fade-up anim-delay-2">
                    <h2 className="result-section-title">
                      {videoComp.summary?.parent_facing?.title ?? 'Video analysis'}
                    </h2>
                    <p className="muted small" style={{ marginTop: 0 }}>
                      {videoModelName ?? 'video model'}
                      {videoComp.model?.version ? <> · {videoComp.model.version}</> : null}
                      {videoComp.model?.runtime ? <> · {videoComp.model.runtime}</> : null}
                      {videoLatencyMs != null ? <> · {videoLatencyMs}ms</> : null}
                    </p>
                    <div className="result-metrics-row">
                      <MetricChip label="Signal" value={`${videoSignalPct}%`} />
                      <MetricChip label="Confidence" value={`${videoConfidencePct}%`} />
                    </div>
                    {videoComp.features && typeof videoComp.features === 'object' ? (
                      <div className="result-metrics-row result-metrics-row--tight">
                        {videoComp.features.duration_reported_sec != null ? (
                          <MetricChip label="Clip length" value={`${videoComp.features.duration_reported_sec}s`} />
                        ) : null}
                        {videoComp.features.engagement_proxy != null ? (
                          <MetricChip label="Engagement proxy" value={String(videoComp.features.engagement_proxy)} />
                        ) : null}
                        {videoComp.features.social_attention_proxy != null ? (
                          <MetricChip
                            label="Social attention proxy"
                            value={String(videoComp.features.social_attention_proxy)}
                          />
                        ) : null}
                      </div>
                    ) : null}
                    {videoComp.summary?.parent_facing?.bullets?.length ? (
                      <ul className="result-bullet-list">
                        {videoComp.summary.parent_facing.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="muted small result-disclaimer-inline">
                      {videoComp.summary?.parent_facing?.disclaimer ?? videoComp.features?.demo_disclaimer}
                    </p>
                  </section>
                ) : null}

                {imageComp ? (
                  <section className="ui-card result-panel anim-fade-up anim-delay-2">
                    <h2 className="result-section-title">{imageComp.summary?.parent_facing?.title ?? 'Image analysis'}</h2>
                    <p className="muted small" style={{ marginTop: 0 }}>
                      {imageComp.model?.name} · {imageComp.model?.version} · {imageComp.model?.runtime} ·{' '}
                      {imageComp.model?.latency_ms}ms
                    </p>
                    <div className="result-metrics-row">
                      <MetricChip
                        label="Signal (MVP)"
                        value={`${Math.round(Number(imageComp.score ?? 0) * 100)}%`}
                      />
                      <MetricChip
                        label="Local confidence"
                        value={`${Math.round(Number(imageComp.confidence ?? 0) * 100)}%`}
                      />
                    </div>
                    {imageComp.summary?.mean_luminance != null ? (
                      <div className="result-metrics-row result-metrics-row--tight">
                        <MetricChip label="Mean luminance" value={String(imageComp.summary.mean_luminance)} />
                        <MetricChip label="Edge density" value={String(imageComp.summary.edge_density)} />
                        <MetricChip label="Contrast" value={String(imageComp.summary.contrast)} />
                      </div>
                    ) : null}
                    {imageComp.summary?.parent_facing?.bullets?.length ? (
                      <ul className="result-bullet-list">
                        {imageComp.summary.parent_facing.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="muted small result-disclaimer-inline">
                      {imageComp.summary?.parent_facing?.disclaimer ?? imageComp.summary?.note}
                    </p>
                    {imageComp.preprocessing ? (
                      <div className="result-prep-box">
                        <strong>Preprocessing</strong>
                        <span>
                          {imageComp.preprocessing.resize_px}px RGB · JPEG q{imageComp.preprocessing.jpeg_quality} ·{' '}
                          {imageComp.preprocessing.note}
                        </span>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {behaviorComp ? (
                  <section className="ui-card result-panel anim-fade-up anim-delay-3">
                    <h2 className="result-section-title">
                      {behaviorComp.summary?.parent_facing?.title ?? 'Behavior scoring'}
                    </h2>
                    <p className="muted small" style={{ marginTop: 0 }}>
                      {behaviorComp.model?.name} · {behaviorComp.model?.version} · {behaviorComp.model?.runtime} ·{' '}
                      {behaviorComp.model?.latency_ms}ms
                    </p>
                    <div className="result-metrics-row">
                      <MetricChip label="Behavior signal" value={`${Math.round(Number(behaviorComp.score ?? 0) * 100)}%`} />
                      <MetricChip label="Local confidence" value={`${Math.round(Number(behaviorComp.confidence ?? 0) * 100)}%`} />
                    </div>
                    <div className="result-behavior-recap">
                      <h3 className="result-subheading">Your inputs</h3>
                      <ul className="result-recap-list">
                        <li>
                          <strong>Speech delay</strong>: {String(behaviorInputs.speech_delay ?? '—')}
                          {behaviorInputs.speech_delay === 'yes' ? (
                            <> · severity: {String(behaviorInputs.speech_severity ?? '—')}</>
                          ) : null}
                        </li>
                        <li>
                          <strong>Social interaction (1–5)</strong>: {behaviorInputs.social_interaction_level ?? '—'}
                        </li>
                        <li>
                          <strong>Repetitive behaviors</strong>:{' '}
                          {Array.isArray(behaviorInputs.repetitive_behaviors) &&
                          behaviorInputs.repetitive_behaviors.length
                            ? behaviorInputs.repetitive_behaviors.join(', ')
                            : '—'}
                        </li>
                        {behaviorInputs.additional_notes ? (
                          <li>
                            <strong>Notes</strong>: {behaviorInputs.additional_notes}
                          </li>
                        ) : null}
                      </ul>
                    </div>
                    {behaviorComp.summary?.parent_facing?.bullets?.length ? (
                      <ul className="result-bullet-list">
                        {behaviorComp.summary.parent_facing.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="muted small result-disclaimer-inline">
                      {behaviorComp.summary?.parent_facing?.disclaimer}
                    </p>
                  </section>
                ) : null}
              </div>
            ) : null}

            {out.performance?.total_latency_ms != null ? (
              <section className="result-perf strip-muted anim-fade-up">
                <span>
                  <strong>End-to-end latency (MVP)</strong>: {out.performance.total_latency_ms}ms total
                  {out.performance.combiner_latency_ms != null
                    ? ` · combiner ${out.performance.combiner_latency_ms}ms`
                    : ''}
                </span>
                {out.performance.note ? <span className="muted small">{out.performance.note}</span> : null}
              </section>
            ) : null}

            {assessment.model_runs?.length ? (
              <section className="ui-card result-panel result-lineage anim-fade-up">
                <h2 className="result-section-title">Model run lineage</h2>
                <p className="result-section-lead muted">
                  Immutable log of which model stages executed for this assessment (versioning for audits and future model
                  swaps).
                </p>
                <ol className="result-lineage__list">
                  {assessment.model_runs.map((run, i) => (
                    <li key={run.id} className="result-lineage__item">
                      <span className="result-lineage__step">{i + 1}</span>
                      <div>
                        <span className="result-lineage__type">{run.model_type}</span>
                        <span className="result-lineage__name">
                          {run.model_name} <em>{run.model_version}</em>
                        </span>
                        <span className="muted small">
                          {run.runtime} · {run.latency_ms}ms
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
                {out.combiner?.model ? (
                  <p className="muted small" style={{ marginBottom: 0 }}>
                    Active combiner: {out.combiner.model.name} ({out.combiner.model.version})
                  </p>
                ) : null}
              </section>
            ) : null}

            <section className="result-recommendation ui-card anim-fade-up">
              <h2 className="result-section-title">Recommendation</h2>
              <p className="result-recommendation__body">{out.recommendation ?? 'Consult a specialist for interpretation.'}</p>
            </section>

            <section className="ui-card result-doctor-notes anim-fade-up">
              <h2 className="result-section-title">Clinical notes</h2>
              {doctorNotes ? (
                <div className="result-doctor-notes__body">{typeof doctorNotes === 'string' ? doctorNotes : JSON.stringify(doctorNotes)}</div>
              ) : (
                <p className="muted small result-doctor-notes__placeholder">
                  When your care team uses the clinician workflow, their notes for this assessment will appear here. Nothing
                  has been attached yet.
                </p>
              )}
            </section>

            <div className="result-actions screening-actions">
              {mode === 'result' ? (
                <Link className="ui-btn ui-btn--primary" to="/history">
                  Done — view history
                </Link>
              ) : (
                <Link className="ui-btn ui-btn--primary" to="/history">
                  Back to history
                </Link>
              )}
              <Button
                variant="secondary"
                disabled={pdfLoading}
                onClick={async () => {
                  setPdfError('')
                  setPdfLoading(true)
                  try {
                    await downloadAssessmentReport(assessment.id)
                  } catch (e) {
                    setPdfError(e?.message ?? 'Could not download PDF.')
                  } finally {
                    setPdfLoading(false)
                  }
                }}
              >
                {pdfLoading ? 'Preparing PDF…' : 'Download PDF report'}
              </Button>
              <Link className="ui-btn ui-btn--ghost" to="/dashboard/asd-tests">
                All assessment options
              </Link>
              <Button
                variant="ghost"
                disabled={shareBusy || assessment.status === 'failed'}
                onClick={async () => {
                  setShareError('')
                  setShareNotice('')
                  setShareBusy(true)
                  try {
                    const data = await createAssessmentReportShare(assessment.id, { expiresInHours: 72 })
                    const url = data.share?.url
                    if (url && navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(url)
                      setShareNotice(
                        `Link copied. Anyone with the link can download this PDF until ${new Date(data.share.expires_at).toLocaleString()}.`,
                      )
                    } else if (url) {
                      setShareNotice(url)
                    }
                  } catch (e) {
                    setShareError(e?.message ?? 'Could not create a share link.')
                  } finally {
                    setShareBusy(false)
                  }
                }}
              >
                {shareBusy ? 'Creating link…' : 'Copy shareable PDF link'}
              </Button>
            </div>
            <p className="muted small" style={{ marginTop: '-0.25rem' }}>
              Share links expire automatically and do not require sign-in (Module 10). Treat them like sensitive medical
              information.
            </p>
            {shareNotice ? (
              <Alert variant="success" title="Time-limited share">
                {shareNotice}
              </Alert>
            ) : null}
            {shareError ? (
              <Alert variant="error" title="Share link">
                {shareError}
              </Alert>
            ) : null}
            {pdfError ? (
              <Alert title="PDF download" variant="error">
                {pdfError}
              </Alert>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  )
}
