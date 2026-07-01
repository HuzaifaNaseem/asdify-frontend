import { Link } from 'react-router-dom'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { MetaDescription } from '../../components/common/MetaDescription'
import {
  IconArrowRight,
  IconBrain,
  IconChart,
  IconCheck,
  IconClipboard,
  IconFolder,
  IconLock,
  IconStethoscope,
  IconUsers,
} from '../../components/icons/DecorativeIcons'

const FEATURES = [
  {
    Icon: IconBrain,
    title: 'AI-Assisted Analysis',
    text: 'Server-side CNN inference on uploaded images for facial pattern and gaze signals — no client GPU needed.',
  },
  {
    Icon: IconClipboard,
    title: 'Guided Questionnaires',
    text: 'M-CHAT–style paginated forms with calm pacing and instant scoring delivered directly to the screen.',
  },
  {
    Icon: IconChart,
    title: 'Readable Risk Reports',
    text: 'Low / Medium / High framing with confidence scores — careful language that never oversteps clinical bounds.',
  },
  {
    Icon: IconStethoscope,
    title: 'Clinician Collaboration',
    text: 'Role-gated doctor workspace with patient timelines, clinical notes, and secure PDF report sharing.',
  },
  {
    Icon: IconLock,
    title: 'Privacy by Design',
    text: 'Bcrypt passwords, JWT RBAC, no public image URLs, and access-controlled storage from day one.',
  },
  {
    Icon: IconFolder,
    title: 'Assessment History',
    text: 'Every submission is saved with full inputs and outputs for trend review and longitudinal follow-up.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Create your account',
    text: 'Parents register instantly. Clinicians request access and are approved by an organisation admin.',
  },
  {
    num: '02',
    title: 'Submit an assessment',
    text: 'Upload an optional image and complete the behavioural questionnaire at your own pace.',
  },
  {
    num: '03',
    title: 'Receive your report',
    text: 'A structured risk summary with plain-language recommendations appears immediately after processing.',
  },
  {
    num: '04',
    title: 'Share with your team',
    text: 'Download a secure PDF and bring it to your next appointment with a qualified specialist.',
  },
]

const STATS = [
  { value: '1 in 36', label: 'Children diagnosed', sub: 'with ASD (USA, 2023)' },
  { value: '<3s', label: 'Inference time', sub: 'per image, server-side' },
  { value: '3 roles', label: 'Secure access', sub: 'Parent · Doctor · Admin' },
  { value: '100%', label: 'Private by default', sub: 'No public image URLs' },
]

export function LandingPage() {
  return (
    <>
      <DocumentTitle title="Asdify — Compassionate ASD Screening" />
      <MetaDescription content="Asdify combines guided questionnaires and AI-assisted image review to help families and clinicians explore autism spectrum concerns calmly and responsibly." />

      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-inner">
          <div className="anim-fade-up">
            <div className="hero__eyebrow">
              <span className="pill-badge">
                <span className="pill-badge__dot" />
                Medical Diagnostic System
              </span>
            </div>
            <h1 id="hero-heading" className="hero__title">
              Autism Spectrum <span>Screening</span> — <span>done gently</span>
            </h1>
            <p className="hero__lead">
              An innovative approach to early ASD risk assessment, combining structured behavioural questionnaires with optional
              AI-assisted image analysis. For families and healthcare professionals alike.
            </p>
            <div className="hero__actions">
              <Link to="/screening" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--icon-inline">
                Start Free Screening
                <IconArrowRight className="ui-btn__end-icon" />
              </Link>
              <Link to="/about" className="ui-btn ui-btn--secondary ui-btn--lg">
                Learn More
              </Link>
            </div>
            <p className="hero__note">
              <IconLock className="hero__note-icon-svg" />
              <span>No payment required. Results are not a clinical diagnosis.</span>
            </p>
          </div>

          <div className="hero__visual">
            <div className="hero__card anim-float">
              <p className="hero__card-title">What Asdify checks</p>
              <div className="hero__card-features">
                {[
                  'Eye contact & gaze patterns',
                  'Facial expression analysis',
                  'Behavioural questionnaire score',
                  'Combined AI risk classification',
                  'Clinician-ready PDF report',
                ].map((item) => (
                  <div className="hero__card-item" key={item}>
                    <div className="hero__card-check" aria-hidden="true">
                      <IconCheck className="hero__card-check-icon" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="stats-bar__inner">
          {STATS.map((s, i) => (
            <div className="stat-item anim-fade-up" style={{ animationDelay: `${i * 80}ms` }} key={s.label}>
              <span className="stat-item__value">{s.value}</span>
              <span className="stat-item__label">{s.label}</span>
              <span className="stat-item__sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="lp-section" aria-labelledby="features-heading">
        <p className="section-eyebrow">Platform capabilities</p>
        <h2 id="features-heading" className="section-title">
          Everything you need in one place
        </h2>
        <p className="section-lead">
          From secure intake to clinician collaboration, every module is designed with emotional sensitivity and clinical rigour in
          mind.
        </p>
        <div className="features-grid">
          {FEATURES.map((f, i) => {
            const Icon = f.Icon
            return (
              <article className="feature-card anim-fade-up" style={{ animationDelay: `${i * 60}ms` }} key={f.title}>
                <div className="feature-card__icon" aria-hidden="true">
                  <Icon className="feature-card__icon-svg" />
                </div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__text">{f.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <div className="lp-section--alt">
        <section className="lp-section" aria-labelledby="how-heading">
          <p className="section-eyebrow section-title--center" style={{ textAlign: 'center' }}>
            Process
          </p>
          <h2 id="how-heading" className="section-title section-title--center">
            From concern to clarity in four steps
          </h2>
          <p className="section-lead section-lead--center">Designed to feel manageable — even on difficult days.</p>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div className="step-card anim-fade-up" style={{ animationDelay: `${i * 90}ms` }} key={s.num}>
                <div className="step-card__num">{s.num}</div>
                <h3 className="step-card__title">{s.title}</h3>
                <p className="step-card__text">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="lp-section" aria-labelledby="audience-heading">
        <p className="section-eyebrow">Designed for</p>
        <h2 id="audience-heading" className="section-title">
          Who benefits from Asdify?
        </h2>
        <div className="audience-grid">
          <div className="audience-card audience-card--teal anim-fade-up anim-delay-1">
            <span className="audience-card__icon" aria-hidden="true">
              <IconUsers className="audience-card__icon-svg" />
            </span>
            <h3 className="audience-card__title">Families &amp; caregivers</h3>
            <p className="audience-card__text">
              Plain-language results, step-by-step guidance, and emotional respect throughout — especially when worry is at its highest.
            </p>
            <span className="audience-card__tag">No clinical knowledge required</span>
          </div>
          <div className="audience-card audience-card--sky anim-fade-up anim-delay-2">
            <span className="audience-card__icon" aria-hidden="true">
              <IconStethoscope className="audience-card__icon-svg" />
            </span>
            <h3 className="audience-card__title">Medical professionals</h3>
            <p className="audience-card__text">
              Structured intake reduces pre-consultation friction. Clinician accounts are approved by your organisation&apos;s admin
              before access is granted.
            </p>
            <span className="audience-card__tag">Role-gated access</span>
          </div>
        </div>
      </section>

      <section className="cta-section" aria-labelledby="cta-heading">
        <div className="cta-inner">
          <p className="section-eyebrow" style={{ color: 'var(--c-teal-400)' }}>
            Get started today
          </p>
          <h2 id="cta-heading" className="cta-title">
            Ready when <span>you are</span>
          </h2>
          <p className="cta-text">
            Screening takes emotional effort. Begin in your own time — there is no pressure, no countdown, and no cost to start.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="ui-btn ui-btn--primary ui-btn--lg">
              Create Free Account
            </Link>
            <Link to="/login" className="ui-btn ui-btn--outline-white ui-btn--lg">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
