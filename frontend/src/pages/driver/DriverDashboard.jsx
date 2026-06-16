import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../services/api'
import '../client/Client.css'

const NAV = [
  { path: '/driver',        label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { path: '/driver/rides',  label: 'My Rides',  icon: 'fas fa-car' },
  { path: '/driver/profile',label: 'Profile',   icon: 'fas fa-user' },
]

export default function DriverDashboard() {
  return (
    <Layout navItems={NAV} role="DRIVER">
      <Routes>
        <Route index          element={<DriverHome />} />
        <Route path="rides"   element={<DriverRides />} />
        <Route path="profile" element={<DriverProfile />} />
        <Route path="*"       element={<Navigate to="/driver" replace />} />
      </Routes>
    </Layout>
  )
}

function DriverHome() {
  const [rides, setRides] = useState([])
  useEffect(() => { api.get('/driver/rides').then(r => setRides(r.data)).catch(() => {}) }, [])

  const today = new Date().toDateString()
  const todayRides = rides.filter(r => r.scheduledAt && new Date(r.scheduledAt).toDateString() === today)

  return (
    <div>
      <h2 className="page-title">Driver Dashboard</h2>
      <div className="stats-grid">
        <StatCard label="Total Rides"    value={rides.length}                                       icon="fas fa-route"        color="#3b82f6" />
        <StatCard label="Today's Rides"  value={todayRides.length}                                  icon="fas fa-calendar-day" color="#f59e0b" />
        <StatCard label="Completed"      value={rides.filter(r=>r.status==='COMPLETED').length}     icon="fas fa-check-circle" color="#10b981" />
        <StatCard label="Pending"        value={rides.filter(r=>r.status==='PENDING').length}       icon="fas fa-clock"        color="#8b5cf6" />
      </div>
      <div className="card mt-24">
        <div className="card-header"><h3>Recent Rides</h3></div>
        {rides.length === 0
          ? <div className="empty-state"><i className="fas fa-car" /><p>No rides assigned yet.</p></div>
          : <RideTable rides={rides.slice(0, 5)} />}
      </div>
    </div>
  )
}

function DriverRides() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const load = () => api.get('/driver/rides').then(r => { setRides(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    try { await api.put(`/driver/rides/${id}/status?status=${status}`); load(); setMsg({ type:'success', text:'Status updated!' }) }
    catch { setMsg({ type:'error', text:'Failed to update.' }) }
  }

  return (
    <div>
      <h2 className="page-title">My Rides</h2>
      {msg && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'} mb-16`}>{msg.text}</div>}
      <div className="card">
        {loading ? <Spinner /> : rides.length === 0
          ? <div className="empty-state"><i className="fas fa-car" /><p>No rides assigned yet.</p></div>
          : <RideTable rides={rides} onUpdateStatus={updateStatus} />}
      </div>
    </div>
  )
}

function DriverProfile() {
  const [profile, setProfile] = useState(null)
  const [avail, setAvail]     = useState(true)
  const [msg, setMsg]         = useState(null)

  useEffect(() => {
    api.get('/driver/profile').then(r => { setProfile(r.data); setAvail(r.data.isAvailable) }).catch(() => {})
  }, [])

  const toggle = async () => {
    try {
      const next = !avail
      await api.put(`/driver/availability?available=${next}`)
      setAvail(next); setMsg({ type:'success', text:`You are now ${next ? 'Available' : 'Unavailable'}` })
    } catch { setMsg({ type:'error', text:'Failed to update.' }) }
  }

  if (!profile) return <Spinner />

  return (
    <div>
      <h2 className="page-title">My Profile</h2>
      {msg && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'} mb-16`}>{msg.text}</div>}
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="profile-hero">
          <div className="profile-avatar">{profile.name?.[0]?.toUpperCase()}</div>
          <div><h3>{profile.name}</h3><p>{profile.email}</p></div>
        </div>
        <div className="profile-info">
          <div className="info-row"><span>Phone</span><b>{profile.phone || '—'}</b></div>
          <div className="info-row"><span>Vehicle</span><b>{profile.vehicleNumber || '—'} {profile.vehicleType && `(${profile.vehicleType})`}</b></div>
          <div className="info-row"><span>Total Rides</span><b>{profile.totalRides}</b></div>
          <div className="info-row"><span>Rating</span><b>⭐ {profile.rating}</b></div>
          <div className="info-row"><span>Status</span>
            <span className={`badge badge-${avail ? 'success' : 'danger'}`}>{avail ? 'Available' : 'Unavailable'}</span>
          </div>
        </div>
        <button className={`btn-toggle ${avail ? 'btn-danger' : 'btn-success'}`} onClick={toggle}>
          <i className={`fas fa-${avail ? 'times' : 'check'}`} />
          {avail ? ' Go Unavailable' : ' Go Available'}
        </button>
      </div>
    </div>
  )
}

function RideTable({ rides, onUpdateStatus }) {
  const allowed = { CONFIRMED: ['IN_PROGRESS'], IN_PROGRESS: ['COMPLETED'] }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>Client</th><th>Pickup → Drop</th><th>Service</th><th>Status</th><th>Scheduled</th>{onUpdateStatus && <th>Action</th>}</tr>
        </thead>
        <tbody>
          {rides.map(r => (
            <tr key={r.id}>
              <td>#{r.id}</td>
              <td>{r.clientName}<br /><small className="muted">{r.clientPhone}</small></td>
              <td>{r.pickupLocation}<br /><small className="muted">→ {r.dropLocation}</small></td>
              <td><span className="tag">{r.serviceType.replace('_',' ')}</span></td>
              <td><StatusBadge status={r.status} /></td>
              <td>{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '—'}</td>
              {onUpdateStatus && <td>
                {(allowed[r.status] || []).map(next => (
                  <button key={next} className="btn-sm btn-primary" onClick={() => onUpdateStatus(r.id, next)}>
                    {next.replace('_',' ')}
                  </button>
                ))}
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color+'18', color }}><i className={icon} /></div>
      <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
    </div>
  )
}
function StatusBadge({ status }) {
  const map = { PENDING:'warning', CONFIRMED:'info', IN_PROGRESS:'purple', COMPLETED:'success', CANCELLED:'danger' }
  return <span className={`badge badge-${map[status]||'info'}`}>{status.replace('_',' ')}</span>
}
function Spinner() { return <div className="spinner"><i className="fas fa-spinner fa-spin" /></div> }
