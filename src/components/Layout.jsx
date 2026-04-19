import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

const NAV = [
  { section: 'Main' },
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/employees', icon: '👥', label: 'Employees' },
  { section: 'Operations' },
  { to: '/roster', icon: '📅', label: 'Roster' },
  { to: '/timetracking', icon: '⏱', label: 'Time Tracking' },
  { to: '/payroll', icon: '💰', label: 'Payroll' },
  { section: 'Security' },
  { to: '/sites', icon: '🏢', label: 'Sites' },
  { to: '/incidents', icon: '🚨', label: 'Incidents' },
  { section: 'Records' },
  { to: '/auditlog', icon: '📋', label: 'Audit Log' },
]

export default function Layout() {
  const { user, supabase } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">Rosti<span>fy</span></div>
          <div className="logo-sub">Workforce Management</div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) =>
            item.section ? (
              <div className="nav-section" key={i}>{item.section}</div>
            ) : (
              <NavLink
                key={i} to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="user-email">{user?.email}</div>
              <button className="btn-logout" onClick={handleLogout}>Sign out</button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
