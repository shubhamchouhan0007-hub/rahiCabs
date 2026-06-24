import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'
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
  const toast = useToast()
  const [stats, setStats]   = useState(null)
  const [rides, setRides]   = useState([])
  const prevPendingRef = useRef(null)

  const load = async () => {
    try {
      const [s, r] = await Promise.all([api.get('/driver/stats'), api.get('/driver/rides')])
      const newPending = s.data.pending
      if (prevPendingRef.current !== null && newPending > prevPendingRef.current) {
        toast(`You have ${newPending} new ride assignment${newPending > 1 ? 's' : ''}!`, 'info')
      }
      prevPendingRef.current = newPending
      setStats(s.data); setRides(r.data)
    } catch { /* silent */ }
  }

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id) }, [])

  const today = new Date().toDateString()
  const todayRides = rides.filter(r => r.scheduledAt && new Date(r.scheduledAt).toDateString() === today)

  if (!stats) return <Spinner />
  return (
    <div>
      <h2 className="page-title">Driver Dashboard</h2>
      <div className="stats-grid">
        <StatCard label="Total Rides"    value={stats.total}        icon="fas fa-route"        color="#3b82f6" />
        <StatCard label="Today's Rides"  value={todayRides.length}  icon="fas fa-calendar-day" color="#f59e0b" />
        <StatCard label="Completed"      value={stats.completed}    icon="fas fa-check-circle" color="#10b981" />
        <StatCard label="In Progress"    value={stats.inProgress}   icon="fas fa-car"          color="#8b5cf6" />
        <StatCard label="Pending"        value={stats.pending}      icon="fas fa-clock"        color="#ef4444" />
        <StatCard label="Earnings (₹)"   value={stats.totalEarnings != null ? `₹${Number(stats.totalEarnings).toLocaleString('en-IN',{maximumFractionDigits:0})}` : '₹0'} icon="fas fa-rupee-sign" color="#059669" />
      </div>
      <div className="card mt-24">
        <div className="card-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h3>Recent Rides</h3>
          <span style={{fontSize:'.8rem',color:'var(--text-muted)'}}>
            <i className="fas fa-sync-alt" style={{marginRight:4}} />Auto-refreshes every 30s
          </span>
        </div>
        {rides.length === 0
          ? <div className="empty-state"><i className="fas fa-car" /><p>No rides assigned yet.</p></div>
          : <RideTable rides={rides.slice(0, 5)} />}
      </div>
    </div>
  )
}

function DriverRides() {
  const toast = useToast()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/driver/rides').then(r => { setRides(r.data); setLoading(false) })
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id) }, [])

  const updateStatus = async (id, status) => {
    try { await api.put(`/driver/rides/${id}/status?status=${status}`); load(); toast('Status updated!', 'success') }
    catch { toast('Failed to update status.', 'error') }
  }

  return (
    <div>
      <h2 className="page-title">My Rides</h2>
      <div className="card">
        {loading ? <Spinner /> : rides.length === 0
          ? <div className="empty-state"><i className="fas fa-car" /><p>No rides assigned yet.</p></div>
          : <RideTable rides={rides} onUpdateStatus={updateStatus} />}
      </div>
    </div>
  )
}

function DriverProfile() {
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [avail, setAvail]     = useState(true)

  useEffect(() => {
    api.get('/driver/profile').then(r => { setProfile(r.data); setAvail(r.data.isAvailable) }).catch(() => {})
  }, [])

  const toggle = async () => {
    try {
      const next = !avail
      await api.put(`/driver/availability?available=${next}`)
      setAvail(next); toast(`You are now ${next ? 'Available' : 'Unavailable'}`, 'success')
    } catch { toast('Failed to update availability.', 'error') }
  }

  if (!profile) return <Spinner />

  return (
    <div>
      <h2 className="page-title">My Profile</h2>
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
          <tr><th>#</th><th>Client</th><th>Pickup → Drop</th><th>Service</th><th>Fare</th><th>Status</th><th>Scheduled</th>{onUpdateStatus && <th>Action</th>}</tr>
        </thead>
        <tbody>
          {rides.map(r => (
            <tr key={r.id}>
              <td>#{r.id}</td>
              <td>{r.clientName || r.guestName || '—'}<br /><small className="muted">{r.clientPhone || r.guestPhone || ''}</small></td>
              <td>{r.pickupLocation}<br /><small className="muted">→ {r.dropLocation}</small></td>
              <td><span className="tag">{r.serviceType.replace('_',' ')}</span></td>
              <td>{r.fare ? <span className="fare-cell">₹{Number(r.fare).toLocaleString('en-IN',{maximumFractionDigits:0})}</span> : <span className="muted">—</span>}</td>
              <td><StatusBadge status={r.status} /></td>
              <td>{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '—'}</td>
              {onUpdateStatus && <td>
                {(allowed[r.status] || []).map(next => (
                  <button key={next} className="btn-sm btn-primary" onClick={() => onUpdateStatus(r.id, next)}>
                    {next === 'IN_PROGRESS' ? 'Start Ride' : 'Complete'}
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
