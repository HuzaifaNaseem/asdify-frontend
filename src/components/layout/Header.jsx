import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../state/AuthContext'
import { useTheme } from '../../state/ThemeContext'
import { IconChevronDown, IconClose, IconMenu } from '../icons/DecorativeIcons'

const linkClass = ({ isActive }) =>
  ['nav-link', isActive ? 'nav-link--active' : ''].filter(Boolean).join(' ')

const menuLinkClass = ({ isActive }) =>
  ['user-menu__link', isActive ? 'user-menu__link--active' : ''].filter(Boolean).join(' ')

function dashboardPath(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'doctor') return '/doctor/dashboard'
  return '/dashboard'
}

function roleMenuLinks(role) {
  if (role === 'doctor') return [{ to: '/doctor/patients', label: 'Patients' }]
  if (role === 'admin') {
    return [
      { to: '/admin/users', label: 'Users' },
      { to: '/admin/reports', label: 'Reports' },
    ]
  }
  return [
    { to: '/dashboard/asd-tests', label: 'ASD tests' },
    { to: '/history', label: 'History' },
  ]
}

function initials(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function Header() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    setNavOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!userMenuOpen) return undefined
    const onDocClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [userMenuOpen])

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
            <div className="user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="user-menu__trigger"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <span className="user-menu__avatar" aria-hidden="true">{initials(user.full_name)}</span>
                <span className="user-menu__name">{(user.full_name || '').split(/\s+/)[0] || 'Account'}</span>
                <IconChevronDown className={`user-menu__chevron${userMenuOpen ? ' user-menu__chevron--open' : ''}`} />
              </button>

              {userMenuOpen ? (
                <div className="user-menu__panel" role="menu">
                  <div className="user-menu__header">
                    <p className="user-menu__full-name">{user.full_name}</p>
                    <p className="user-menu__email">{user.email}</p>
                  </div>
                  <NavLink
                    to={dashboardPath(user.role)}
                    className={menuLinkClass}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Dashboard
                  </NavLink>
                  {roleMenuLinks(user.role).map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      className={menuLinkClass}
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {l.label}
                    </NavLink>
                  ))}
                  <NavLink
                    to="/profile"
                    className={menuLinkClass}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Profile
                  </NavLink>
                  <div className="user-menu__divider" role="separator" />
                  <button
                    type="button"
                    className="user-menu__link user-menu__link--danger"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setNavOpen(false)
                      void logout()
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
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
