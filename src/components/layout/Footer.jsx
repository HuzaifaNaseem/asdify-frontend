import { Link } from 'react-router-dom'

const COLS = [
  {
    title: 'Platform',
    links: [
      { to: '/screening',    label: 'Start Screening' },
      { to: '/register',     label: 'Create Account' },
      { to: '/login',        label: 'Sign In' },
      { to: '/about',        label: 'About Asdify' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: '/about',          label: 'What is ASD?' },
      { to: '/privacy-policy', label: 'Privacy Policy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        {/* Brand column */}
        <div className="app-footer__brand-col">
          <p className="app-footer__brand">
            <img src="/logo.jpg" alt="" className="app-footer__brand-mark" width={28} height={28} decoding="async" />
            <span>Asdify</span>
          </p>
          <p className="app-footer__tagline">
            Calm, structured ASD screening for families and clinicians.
            Powered by AI — guided by compassion.
          </p>
        </div>

        {/* Link columns */}
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="app-footer__col-title">{col.title}</p>
            <ul className="app-footer__links">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="app-footer__bottom">
        <p className="app-footer__copy">
          © {new Date().getFullYear()} Asdify. All rights reserved.
        </p>
        <p className="app-footer__note">
          Results are a screening aid only — not a clinical diagnosis. Always consult a qualified professional.
        </p>
      </div>
    </footer>
  )
}
