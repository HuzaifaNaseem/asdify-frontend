import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext'
import { useTheme } from '../../state/ThemeContext'
import { IconClose, IconMenu } from '../icons/DecorativeIcons'

const linkClass = ({ isActive }) =>
  ['nav-link', isActive ? 'nav-link--active' : ''].filter(Boolean).join(' ')

function dashboardPath(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'doctor') return '/doctor/dashboard'
  return '/dashboard'
}

export function Header() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (!navOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [navOpen])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }
    const mq = window.matchMedia('(min-width: 1025px)')
    const onChange = () => {
      if (mq.matches) setNavOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <header className={`app-header${scrolled ? ' scrolled' : ''}${navOpen ? ' app-header--nav-open' : ''}`}>
      <div className="app-header__inner">
        <NavLink to="/" className="app-logo" end onClick={() => setNavOpen(false)}>
          <img src="/logo.jpg" alt="" className="app-logo__mark" width={32} height={32} decoding="async" />
          Asdify
        </NavLink>

        <button
          type="button"
          className="app-header__menu-btn"
          aria-expanded={navOpen}
          aria-controls="primary-navigation"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setNavOpen((o) => !o)}
        >
          {navOpen ? <IconClose className="app-header__menu-icon" /> : <IconMenu className="app-header__menu-icon" />}
        </button>

        {navOpen ? (
          <button
            type="button"
            className="app-header__backdrop"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <nav
          id="primary-navigation"
          className={['app-nav', navOpen ? 'app-nav--open' : ''].filter(Boolean).join(' ')}
          aria-label="Primary"
        >
          <NavLink to="/" className={linkClass} end onClick={() => setNavOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/about" className={linkClass} onClick={() => setNavOpen(false)}>
            About ASD
          </NavLink>
          <NavLink to="/privacy-policy" className={linkClass} onClick={() => setNavOpen(false)}>
            Privacy
          </NavLink>
          {user?.role === 'parent' ? (
            <>
              <NavLink to="/dashboard/asd-tests" className={linkClass} onClick={() => setNavOpen(false)}>
                ASD tests
              </NavLink>
              <NavLink to="/history" className={linkClass} onClick={() => setNavOpen(false)}>
                History
              </NavLink>
            </>
          ) : null}

          <button
            type="button"
            className="theme-toggle"
            onClick={() => toggleTheme()}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="theme-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="theme-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              {user.role === 'doctor' ? (
                <NavLink to="/doctor/patients" className={linkClass} onClick={() => setNavOpen(false)}>
                  Patients
                </NavLink>
              ) : null}
              {user.role === 'admin' ? (
                <>
                  <NavLink to="/admin/users" className={linkClass} onClick={() => setNavOpen(false)}>
                    Users
                  </NavLink>
                  <NavLink to="/admin/reports" className={linkClass} onClick={() => setNavOpen(false)}>
                    Reports
                  </NavLink>
                </>
              ) : null}
              <NavLink to={dashboardPath(user.role)} className={linkClass} onClick={() => setNavOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/profile" className={linkClass} onClick={() => setNavOpen(false)}>
                Profile
              </NavLink>
              <button
                type="button"
                className="nav-link nav-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  setNavOpen(false)
                  void logout()
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setNavOpen(false)}>
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  ['nav-link', 'nav-link--cta', isActive ? 'nav-link--active' : ''].filter(Boolean).join(' ')
                }
                onClick={() => setNavOpen(false)}
              >
                Get Started
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
