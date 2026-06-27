import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { fmtDate, fmtDateTime } from '../../utils/format'
import '../client/Client.css'
import './Driver.css'

const NAV = [
  { path: '/driver',          label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { path: '/driver/rides',    label: 'My Rides',  icon: 'fas fa-car' },
  { path: '/driver/earnings', label: 'Earnings',  icon: 'fas fa-rupee-sign' },
  { path: '/driver/profile',  label: 'Profile',   icon: 'fas fa-user' },
]

export default function DriverDashboard() {
  return (
    <Layout navItems={NAV} role="DRIVER">
      <Routes>
        <Route index            element={<DriverHome />} />
        <Route path="rides"     element={<DriverRides />} />
        <Route path="earnings"  element={<DriverEarnings />} />
        <Route path="profile"   element={<DriverProfile />} />
        <Route path="*"         element={<Navigate to="/driver" replace />} />
      </Routes>
    </Layout>
  )
}

// ── Home ─────────────────────────────────────────────────────────────────────

function DriverHome() {
  const toast    = useToast()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [rides, setRides] = useState([])
  const [avail, setAvail] = useState(true)
  const [profile, setProfile] = useState(null)
  const prevPendingRef = useRef(null)

  const load = async () => {
    try {
      const [s, r, p] = await Promise.all([
        api.get('/driver/stats'),
        api.get('/driver/rides'),
        api.get('/driver/profile'),
      ])
      const newPending = s.data.pending
      if (prevPendingRef.current !== null && newPending > prevPendingRef.current)
        toast(`New ride assigned to you!`, 'info')
      prevPendingRef.current = newPending
      setStats(s.data); setRides(r.data); setProfile(p.data); setAvail(p.data.isAvailable)
    } catch { /* silent */ }
  }

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id) }, [])

  const toggleAvail = async () => {
    try {
      const next = !avail
      await api.put(`/driver/availability?available=${next}`)
      setAvail(next)
      toast(`You are now ${next ? 'Available for rides' : 'Unavailable'}`, next ? 'success' : 'info')
    } catch { toast('Failed to update availability.', 'error') }
  }

  const today     = new Date().toDateString()
  const active    = rides.find(r => r.status === 'IN_PROGRESS')
  const todayRides = rides.filter(r => r.scheduledAt && new Date(r.scheduledAt).toDateString() === today)
  const pending   = rides.filter(r => r.status === 'PENDING' || r.status === 'CONFIRMED')

  if (!stats) return <Spinner />

  return (
    <div>
      {/* Greeting + availability toggle */}
      <div className="driver-topbar">
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>
            Good {greeting()}, {profile?.name?.split(' ')[0] || 'Driver'} 👋
          </h2>
          <p className="driver-subtitle">Here's your overview for today</p>
        </div>
        <button className={`avail-toggle ${avail ? 'avail-on' : 'avail-off'}`} onClick={toggleAvail}>
          <span className="avail-dot" />
          {avail ? 'Available' : 'Unavailable'}
        </button>
      </div>

      {/* Active ride banner */}
      {active && (
        <div className="active-ride-banner">
          <div className="active-ride-pulse" />
          <div className="active-ride-info">
            <div className="active-ride-label"><i className="fas fa-circle" /> RIDE IN PROGRESS</div>
            <div className="active-ride-route">
              <span><i className="fas fa-map-marker-alt" /> {active.pickupLocation}</span>
              <i className="fas fa-long-arrow-alt-right" />
              <span><i className="fas fa-flag-checkered" /> {active.dropLocation}</span>
            </div>
            <div className="active-ride-meta">
              <span><i className="fas fa-user" /> {active.clientName || active.guestName}</span>
              {(active.clientPhone || active.guestPhone) && (
                <a href={`tel:${active.clientPhone || active.guestPhone}`} className="active-ride-call">
                  <i className="fas fa-phone" /> {active.clientPhone || active.guestPhone}
                </a>
              )}
              <span><i className="fas fa-rupee-sign" /> ₹{Number(active.fare||0).toLocaleString('en-IN',{maximumFractionDigits:0})}</span>
            </div>
          </div>
          <button className="active-ride-complete" onClick={() => navigate('/driver/rides')}>
            Complete Ride <i className="fas fa-arrow-right" />
          </button>
        </div>
      )}

      {/* New ride alert */}
      {pending.length > 0 && !active && (
        <div className="new-ride-alert" onClick={() => navigate('/driver/rides')}>
          <i className="fas fa-bell" />
          <span>You have <b>{pending.length}</b> pending ride{pending.length > 1 ? 's' : ''} waiting</span>
          <i className="fas fa-chevron-right" />
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total Rides"   value={stats.total}       icon="fas fa-route"        color="#3b82f6" to="/driver/rides" />
        <StatCard label="Today's Rides" value={todayRides.length} icon="fas fa-calendar-day" color="#f59e0b" to="/driver/rides" />
        <StatCard label="Completed"     value={stats.completed}   icon="fas fa-check-circle" color="#10b981" to="/driver/rides?tab=COMPLETED" />
        <StatCard label="In Progress"   value={stats.inProgress}  icon="fas fa-car"          color="#8b5cf6" to="/driver/rides?tab=IN_PROGRESS" />
        <StatCard label="Pending"       value={stats.pending}     icon="fas fa-clock"        color="#ef4444" to="/driver/rides?tab=PENDING" />
        <StatCard
          label="Total Earnings"
          value={`₹${Number(stats.totalEarnings||0).toLocaleString('en-IN',{maximumFractionDigits:0})}`}
          icon="fas fa-rupee-sign" color="#059669" to="/driver/earnings"
        />
      </div>

      {/* Recent rides */}
      <div className="card mt-24">
        <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3>Recent Rides</h3>
          <button className="link-btn" onClick={() => navigate('/driver/rides')}>View all <i className="fas fa-arrow-right" /></button>
        </div>
        {rides.length === 0
          ? <div className="empty-state"><i className="fas fa-car" /><p>No rides assigned yet. Stay available!</p></div>
          : <RideCards rides={rides.slice(0, 3)} />}
      </div>
    </div>
  )
}

// ── My Rides ──────────────────────────────────────────────────────────────────

function Breadcrumb({ current }) {
  const navigate = useNavigate()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'16px', fontSize:'14px', color:'#6b7280' }}>
      <span onClick={() => navigate('/driver')} style={{ cursor:'pointer', color:'#1a1f4e', fontWeight:500 }}>Dashboard</span>
      <span>/</span>
      <span style={{ color:'#111827', fontWeight:500 }}>{current}</span>
    </div>
  )
}

function DriverRides() {
  const toast = useToast()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [rides, setRides]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState(params.get('tab') || 'ALL')

  const load = () => api.get('/driver/rides').then(r => { setRides(r.data); setLoading(false) })
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id) }, [])

  const updateStatus = async (id, status) => {
    try { await api.put(`/driver/rides/${id}/status?status=${status}`); load(); toast('Status updated!', 'success') }
    catch { toast('Failed to update status.', 'error') }
  }

  const tabs = [
    { id:'ALL',         label:'All' },
    { id:'PENDING',     label:'Pending' },
    { id:'CONFIRMED',   label:'Confirmed' },
    { id:'IN_PROGRESS', label:'Active' },
    { id:'COMPLETED',   label:'Completed' },
  ]

  const visible = tab === 'ALL' ? rides : rides.filter(r => r.status === tab)

  return (
    <div>
      <Breadcrumb current="My Rides" />
      <h2 className="page-title">My Rides</h2>
      <div className="driver-tabs">
        {tabs.map(t => {
          const count = t.id === 'ALL' ? rides.length : rides.filter(r => r.status === t.id).length
          return (
            <button key={t.id} className={`driver-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label} {count > 0 && <span className="tab-badge">{count}</span>}
            </button>
          )
        })}
      </div>
      {loading ? <Spinner /> : visible.length === 0
        ? <div className="empty-state"><i className="fas fa-car" /><p>No {tab !== 'ALL' ? tab.toLowerCase().replace('_',' ') : ''} rides.</p></div>
        : <RideCards rides={visible} onUpdateStatus={updateStatus} detailed />}
    </div>
  )
}

// ── Earnings ──────────────────────────────────────────────────────────────────

function DriverEarnings() {
  const [rides, setRides]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/driver/rides').then(r => { setRides(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const completed = rides.filter(r => r.status === 'COMPLETED' && r.fare)
  const total     = completed.reduce((s, r) => s + (r.fare || 0), 0)

  const today     = new Date().toDateString()
  const todayEarnings = completed.filter(r => r.createdAt && new Date(r.createdAt).toDateString() === today)
    .reduce((s, r) => s + (r.fare || 0), 0)

  const byMonth = completed.reduce((acc, r) => {
    const key = r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month:'long', year:'numeric' }) : 'Unknown'
    acc[key] = (acc[key] || 0) + (r.fare || 0)
    return acc
  }, {})

  if (loading) return <Spinner />

  return (
    <div>
      <Breadcrumb current="Earnings" />
      <h2 className="page-title">My Earnings</h2>

      <div className="earnings-hero-grid">
        <div className="earnings-hero-card total">
          <div className="earnings-hero-icon"><i className="fas fa-rupee-sign" /></div>
          <div className="earnings-hero-label">Total Earnings</div>
          <div className="earnings-hero-value">₹{total.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
        </div>
        <div className="earnings-hero-card today">
          <div className="earnings-hero-icon"><i className="fas fa-calendar-day" /></div>
          <div className="earnings-hero-label">Today's Earnings</div>
          <div className="earnings-hero-value">₹{todayEarnings.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
        </div>
        <div className="earnings-hero-card rides">
          <div className="earnings-hero-icon"><i className="fas fa-check-circle" /></div>
          <div className="earnings-hero-label">Completed Rides</div>
          <div className="earnings-hero-value">{completed.length}</div>
        </div>
        <div className="earnings-hero-card avg">
          <div className="earnings-hero-icon"><i className="fas fa-chart-line" /></div>
          <div className="earnings-hero-label">Avg. per Ride</div>
          <div className="earnings-hero-value">₹{completed.length ? Math.round(total / completed.length).toLocaleString('en-IN') : 0}</div>
        </div>
      </div>

      {Object.keys(byMonth).length > 0 && (
        <div className="card mt-24">
          <div className="card-header"><h3>Monthly Breakdown</h3></div>
          <div className="earnings-month-list">
            {Object.entries(byMonth).map(([month, amt]) => (
              <div key={month} className="earnings-month-row">
                <span><i className="fas fa-calendar" /> {month}</span>
                <b>₹{amt.toLocaleString('en-IN',{maximumFractionDigits:0})}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-24">
        <div className="card-header"><h3>Ride-wise Earnings</h3></div>
        {completed.length === 0
          ? <div className="empty-state"><i className="fas fa-rupee-sign" /><p>No completed rides yet.</p></div>
          : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Customer</th><th>Route</th><th>Service</th><th>Fare</th><th>Date</th></tr>
              </thead>
              <tbody>
                {completed.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>{r.clientName || r.guestName || '—'}</td>
                    <td><small>{r.pickupLocation} → {r.dropLocation}</small></td>
                    <td><span className="tag">{r.serviceType?.replace('_',' ')}</span></td>
                    <td><span className="fare-cell">₹{Number(r.fare).toLocaleString('en-IN',{maximumFractionDigits:0})}</span></td>
                    <td><small>{fmtDate(r.createdAt)}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────────

function DriverProfile() {
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [avail, setAvail]     = useState(true)

  useEffect(() => {
    api.get('/driver/profile').then(r => { setProfile(r.data); setAvail(r.data.isAvailable) }).catch(() => {})
  }, [])

  const toggleAvail = async () => {
    try {
      const next = !avail
      await api.put(`/driver/availability?available=${next}`)
      setAvail(next)
      toast(`You are now ${next ? 'Available' : 'Unavailable'}`, 'success')
    } catch { toast('Failed to update.', 'error') }
  }

  if (!profile) return <Spinner />

  const initial = profile.name?.[0]?.toUpperCase()

  return (
    <div>
      <Breadcrumb current="Profile" />
      <h2 className="page-title">My Profile</h2>
      <div className="driver-profile-grid">

        {/* Identity card */}
        <div className="card driver-id-card">
          <div className="driver-avatar-lg">{initial}</div>
          <h3>{profile.name}</h3>
          <p className="driver-email">{profile.email}</p>
          <div className="driver-rating-badge">⭐ {profile.rating} Rating</div>
          <div className="driver-rides-badge"><i className="fas fa-route" /> {profile.totalRides} Rides</div>

          <div className={`avail-toggle ${avail ? 'avail-on' : 'avail-off'}`} onClick={toggleAvail}
            style={{ marginTop: 20, justifyContent:'center' }}>
            <span className="avail-dot" />
            {avail ? 'Available for rides' : 'Currently unavailable'}
          </div>
        </div>

        {/* Details */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div className="card-header"><h3><i className="fas fa-user" /> Personal Info</h3></div>
            <div className="profile-info">
              <div className="info-row"><span>Full Name</span><b>{profile.name}</b></div>
              <div className="info-row"><span>Phone</span><b>{profile.phone || '—'}</b></div>
              <div className="info-row"><span>Email</span><b>{profile.email}</b></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3><i className="fas fa-car" /> Vehicle Info</h3></div>
            <div className="profile-info">
              <div className="info-row"><span>Vehicle Number</span><b>{profile.vehicleNumber || '—'}</b></div>
              <div className="info-row"><span>Vehicle Type</span>
                <b>{profile.vehicleType ? <span className="tag">{profile.vehicleType}</span> : '—'}</b>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3><i className="fas fa-id-card" /> Documents</h3></div>
            <div className="profile-info">
              <div className="info-row"><span>Aadhaar No.</span>
                <b>{profile.aadhaarNumber ? maskAadhaar(profile.aadhaarNumber) : '—'}</b>
              </div>
              <div className="info-row"><span>License No.</span><b>{profile.licenseNumber || '—'}</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Ride Cards ────────────────────────────────────────────────────────────────

function RideCards({ rides, onUpdateStatus, detailed }) {
  const allowed = { CONFIRMED: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED' }
  const actionLabel = { IN_PROGRESS: 'Start Ride', COMPLETED: 'Complete Ride' }

  return (
    <div className="ride-cards">
      {rides.map(r => {
        const customer = r.clientName || r.guestName || '—'
        const phone    = r.clientPhone || r.guestPhone
        const nextStatus = allowed[r.status]

        return (
          <div key={r.id} className={`ride-card ride-card-${r.status?.toLowerCase()}`}>
            <div className="ride-card-header">
              <div className="ride-card-id">#{r.id}</div>
              <StatusBadge status={r.status} />
              <span className="tag" style={{ marginLeft:'auto' }}>{r.serviceType?.replace('_',' ')}</span>
            </div>

            <div className="ride-card-route">
              <div className="ride-route-point pickup">
                <span className="route-dot pickup-dot" />
                <span>{r.pickupLocation}</span>
              </div>
              <div className="route-line" />
              <div className="ride-route-point drop">
                <span className="route-dot drop-dot" />
                <span>{r.dropLocation}</span>
              </div>
            </div>

            <div className="ride-card-footer">
              <div className="ride-customer">
                <i className="fas fa-user" /> {customer}
                {phone && (
                  <a href={`tel:${phone}`} className="ride-call-btn" title="Call customer">
                    <i className="fas fa-phone" /> {detailed && phone}
                  </a>
                )}
              </div>
              <div className="ride-fare">
                {r.fare ? <><i className="fas fa-rupee-sign" /> ₹{Number(r.fare).toLocaleString('en-IN',{maximumFractionDigits:0})}</> : '—'}
              </div>
            </div>

            {detailed && r.scheduledAt && (
              <div className="ride-scheduled">
                <i className="fas fa-clock" /> {fmtDateTime(r.scheduledAt)}
              </div>
            )}

            {onUpdateStatus && nextStatus && (
              <button className={`ride-action-btn ${nextStatus === 'IN_PROGRESS' ? 'start' : 'complete'}`}
                onClick={() => onUpdateStatus(r.id, nextStatus)}>
                <i className={`fas fa-${nextStatus === 'IN_PROGRESS' ? 'play' : 'check'}`} />
                {actionLabel[nextStatus]}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskAadhaar(n) {
  const clean = n.replace(/\s/g, '')
  return clean.length >= 4 ? 'XXXX XXXX ' + clean.slice(-4) : n
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

function StatCard({ label, value, icon, color, to }) {
  const navigate = useNavigate()
  return (
    <div className="stat-card" onClick={() => to && navigate(to)}
      style={{ cursor: to ? 'pointer' : 'default' }}>
      <div className="stat-icon" style={{ background: color+'18', color }}><i className={icon} /></div>
      <div><div className="stat-value">{value ?? '—'}</div><div className="stat-label">{label}</div></div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { PENDING:'warning', CONFIRMED:'info', IN_PROGRESS:'purple', COMPLETED:'success', CANCELLED:'danger' }
  return <span className={`badge badge-${map[status]||'info'}`}>{status?.replace('_',' ')}</span>
}

function Spinner() { return <div className="spinner"><i className="fas fa-spinner fa-spin" /></div> }
