import { Link } from 'react-router-dom'
import { DocumentTitle } from '../../components/common/DocumentTitle'
import { MetaDescription } from '../../components/common/MetaDescription'
import {
  IconAlertMedical,
  IconArrowLeft,
  IconAtom,
  IconBinoculars,
  IconChip,
  IconCode,
  IconCog,
  IconDatabase,
  IconDocument,
  IconLeaf,
  IconShield,
  IconTarget,
  IconUsers,
} from '../../components/icons/DecorativeIcons'

const VALUES = [
  'Clarity over noise',
  'Screening, not labelling',
  'Accessibility first',
  'Emotional safety',
  'Open disclaimers',
  'Privacy by default',
]

const TECH_ITEMS = [
  { Icon: IconAtom, label: 'React 19 + Vite', note: 'Fast, component-driven UI' },
  { Icon: IconCode, label: 'Python / Flask', note: 'Lightweight REST API' },
  { Icon: IconChip, label: 'MobileNetV2 / ViT', note: 'Server-side CNN inference' },
  { Icon: IconDatabase, label: 'SQLite to PostgreSQL', note: 'Local-first, cloud-ready' },
  { Icon: IconShield, label: 'JWT + bcrypt RBAC', note: 'Role-based access control' },
  { Icon: IconDocument, label: 'Automated PDF reports', note: 'Structured, shareable output' },
]

export function AboutPage() {
  return (
    <>
      <DocumentTitle title="About Asdify — Mission &amp; Technology" />
      <MetaDescription content="Learn why Asdify exists: mindful ASD screening support for families and clinicians, with transparent AI, clear disclaimers, and human-centred design." />

      <section className="about-hero" aria-labelledby="about-heading">
        <div className="about-hero__inner">
          <div className="about-hero__eyebrow anim-fade-in">
            <span className="pill-badge">
              <span className="pill-badge__dot" />
              Our mission
            </span>
          </div>
          <h1 id="about-heading" className="about-hero__title anim-fade-up">
            Thoughtful technology for a sensitive conversation
          </h1>
          <p className="about-hero__lead anim-fade-up anim-delay-2">
            Asdify exists to reduce the gap between an early parental concern and a meaningful professional conversation — without
            adding noise, anxiety, or misplaced certainty along the way.
          </p>
        </div>
      </section>

      <section className="lp-section page-container--narrow" style={{ margin: '0 auto' }}>
        <div className="about-grid anim-fade-up">
          <div className="about-card">
            <span className="about-card__icon" aria-hidden="true">
              <IconTarget className="about-card__icon-svg" />
            </span>
            <h2 className="about-card__title">Our mission</h2>
            <p className="about-card__text">
              We believe early concern deserves clarity — not noise. Asdify combines validated questionnaires, optional image-assisted
              signals, and transparent reporting so the first conversation with a care team starts from shared understanding rather than
              confusion.
            </p>
          </div>
          <div className="about-card">
            <span className="about-card__icon" aria-hidden="true">
              <IconLeaf className="about-card__icon-svg" />
            </span>
            <h2 className="about-card__title">Core values</h2>
            <p className="about-card__text" style={{ marginBottom: '1rem' }}>
              Every design and engineering decision is filtered through these commitments:
            </p>
            <div className="about-values">
              {VALUES.map((v) => (
                <div className="value-pill" key={v}>
                  <span className="value-pill__dot" />
                  {v}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="about-card anim-fade-up anim-delay-2" style={{ marginBottom: '1.5rem' }}>
          <span className="about-card__icon" aria-hidden="true">
            <IconCog className="about-card__icon-svg" />
          </span>
          <h2 className="about-card__title">Technology, explained without jargon</h2>
          <p className="about-card__text" style={{ marginBottom: '1.5rem' }}>
            A React interface talks to a private Flask API. All model inference runs on the server — keeping the browser lightweight and
            your data within controlled boundaries. We build module by module, with each layer adding clinical functionality without
            breaking what came before.
          </p>
          <div className="about-tech-grid">
            {TECH_ITEMS.map((t) => {
              const TIcon = t.Icon
              return (
                <div key={t.label} className="about-tech-tile">
                  <span className="about-tech-tile__icon-wrap" aria-hidden="true">
                    <TIcon className="about-tech-tile__icon" />
                  </span>
                  <div>
                    <div className="about-tech-tile__label">{t.label}</div>
                    <div className="about-tech-tile__note">{t.note}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="about-grid anim-fade-up anim-delay-3" style={{ marginBottom: '1.5rem' }}>
          <div className="about-card">
            <span className="about-card__icon" aria-hidden="true">
              <IconUsers className="about-card__icon-svg" />
            </span>
            <h2 className="about-card__title">Who builds this?</h2>
            <p className="about-card__text">
              Designers, engineers, and clinical advisors collaborating with an inclusion-first mindset. Accessibility and plain language
              are not polish — they are part of bedside manner translated into software.
            </p>
          </div>
          <div className="about-card">
            <span className="about-card__icon" aria-hidden="true">
              <IconBinoculars className="about-card__icon-svg" />
            </span>
            <h2 className="about-card__title">What is next?</h2>
            <p className="about-card__text">
              Upcoming modules include real AI inference pipelines, full doctor workspaces, automated PDF generation, admin analytics, and
              eventually a continuous-learning architecture — built module by module with full backwards compatibility.
            </p>
          </div>
        </div>

        <div className="about-disclaimer anim-fade-up anim-delay-4" style={{ marginBottom: '2.5rem' }}>
          <p className="about-disclaimer__title">
            <IconAlertMedical className="about-disclaimer__title-icon" aria-hidden="true" />
            Important clinical disclaimer
          </p>
          <p className="about-disclaimer__text">
            <strong>Asdify provides decision-support screening — not a diagnosis.</strong> Only qualified healthcare professionals can
            diagnose or exclude autism spectrum conditions. Always combine these outputs with a full developmental history, physical
            examination, and professional clinical assessment. If you have immediate concerns about your child&apos;s development,
            contact your GP or paediatrician directly.
          </p>
        </div>

        <div className="about-back-links">
          <Link to="/" className="ui-btn ui-btn--primary ui-btn--icon-inline">
            <IconArrowLeft className="ui-btn__start-icon" />
            Back to home
          </Link>
          <Link to="/register" className="ui-btn ui-btn--secondary">
            Create an account
          </Link>
        </div>
      </section>
    </>
  )
}
