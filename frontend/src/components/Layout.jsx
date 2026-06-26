import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

export default function Layout({ children, navItems, role }) {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const roleColors = { CLIENT: '#3b82f6', ADMIN: '#8b5cf6', DRIVER: '#10b981' }
  const roleColor  = roleColors[role] || '#f5a623'

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo" onClick={() => navigate('/')} style={{ cursor:'pointer' }}>
            <i className="fas fa-taxi" style={{ color: '#f5a623' }} />
            <span>Rahi<b>Cab</b></span>
          </span>
          <button className="sidebar-close" onClick={() => setOpen(false)}>
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="role-badge" style={{ background: roleColor }}>
          {role}
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) =>
              'nav-item' + (isActive ? ' active' : '')
            } onClick={() => setOpen(false)}>
              <i className={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      {/* Main */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setOpen(true)}>
              <i className="fas fa-bars" />
            </button>
            <span className="topbar-brand" onClick={() => navigate('/')}>
              <i className="fas fa-taxi" /> Rahi<b>Cab</b>
            </span>
          </div>
          <div className="topbar-right">
            <span className="topbar-greeting">Hi, {user?.name} 👋</span>
          </div>
        </header>
        <div className="page-body">{children}</div>
      </main>
    </div>
  )
}
