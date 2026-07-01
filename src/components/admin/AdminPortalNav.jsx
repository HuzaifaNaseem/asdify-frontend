import { NavLink } from 'react-router-dom'

const link = ({ isActive }) =>
  ['admin-portal-nav__link', isActive ? 'admin-portal-nav__link--active' : ''].filter(Boolean).join(' ')

export function AdminPortalNav() {
  return (
    <nav className="admin-portal-nav" aria-label="Admin console">
      <NavLink to="/admin/dashboard" className={link} end>
        Dashboard
      </NavLink>
      <NavLink to="/admin/users" className={link}>
        Users
      </NavLink>
      <NavLink to="/admin/reports" className={link}>
        Reports
      </NavLink>
    </nav>
  )
}
