import { useState, useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'
import '../client/Client.css'

const NAV = [
  { path: '/admin',          label: 'Dashboard',  icon: 'fas fa-tachometer-alt' },
  { path: '/admin/bookings', label: 'Bookings',   icon: 'fas fa-list' },
  { path: '/admin/drivers',  label: 'Drivers',    icon: 'fas fa-car' },
  { path: '/admin/users',    label: 'Users',      icon: 'fas fa-users' },
]

export default function AdminDashboard() {
  return (
    <Layout navItems={NAV} role="ADMIN">
      <Routes>
        <Route index           element={<AdminHome />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="drivers"  element={<AdminDrivers />} />
        <Route path="users"    element={<AdminUsers />} />
        <Route path="*"        element={<Navigate to="/admin" replace />} />
      </Routes>
    </Layout>
  )
}

function AdminHome() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}) }, [])
  if (!stats) return <Spinner />
  return (
    <div>
      <h2 className="page-title">Admin Dashboard</h2>
      <div className="stats-grid">
        <StatCard label="Total Bookings"  value={stats.total}        icon="fas fa-ticket-alt"    color="#3b82f6" />
        <StatCard label="Pending"         value={stats.pending}      icon="fas fa-clock"          color="#f59e0b" />
        <StatCard label="In Progress"     value={stats.inProgress}   icon="fas fa-car"            color="#8b5cf6" />
        <StatCard label="Completed"       value={stats.completed}    icon="fas fa-check-circle"   color="#10b981" />
        <StatCard label="Cancelled"       value={stats.cancelled}    icon="fas fa-times-circle"   color="#ef4444" />
        <StatCard label="Total Users"     value={stats.totalUsers}   icon="fas fa-users"           color="#06b6d4" />
        <StatCard label="Total Drivers"   value={stats.totalDrivers} icon="fas fa-id-card"         color="#7c3aed" />
        <StatCard label="Revenue (₹)"     value={stats.totalRevenue != null ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN', {maximumFractionDigits:0})}` : '₹0'} icon="fas fa-rupee-sign" color="#059669" />
      </div>
    </div>
  )
}

function AdminBookings() {
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [drivers,  setDrivers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('ALL')

  const load = () => Promise.all([api.get('/admin/bookings'), api.get('/admin/drivers')])
    .then(([b, d]) => { setBookings(b.data); setDrivers(d.data); setLoading(false) })

  useEffect(() => { load() }, [])

  const assign = async (bookingId, driverId) => {
    try { await api.put(`/admin/bookings/${bookingId}/assign-driver/${driverId}`); load(); toast('Driver assigned successfully!', 'success') }
    catch { toast('Failed to assign driver.', 'error') }
  }

  const updateStatus = async (id, status) => {
    try { await api.put(`/admin/bookings/${id}/status?status=${status}`); load(); toast('Status updated!', 'success') }
    catch { toast('Failed to update status.', 'error') }
  }

  const visible = bookings.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (b.clientName  && b.clientName.toLowerCase().includes(q)) ||
      (b.clientPhone && b.clientPhone.includes(q)) ||
      (b.guestName   && b.guestName.toLowerCase().includes(q)) ||
      (b.guestPhone  && b.guestPhone.includes(q)) ||
      (b.pickupLocation && b.pickupLocation.toLowerCase().includes(q)) ||
      (b.dropLocation   && b.dropLocation.toLowerCase().includes(q))
    const matchFilter = filter === 'ALL' || b.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <h2 className="page-title">All Bookings</h2>
      <div className="admin-toolbar">
        <div className="search-box">
          <i className="fas fa-search" />
          <input type="text" placeholder="Search by name, phone, location…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="ALL">All Statuses</option>
          {['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s =>
            <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
        <span className="result-count">{visible.length} booking{visible.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="card">
        {loading ? <Spinner /> : visible.length === 0
          ? <div className="empty-state"><i className="fas fa-inbox" /><p>{search || filter !== 'ALL' ? 'No matching bookings.' : 'No bookings found.'}</p></div>
          : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Client</th><th>Pickup → Drop</th><th>Service</th><th>Fare</th><th>Status</th><th>Driver</th><th>Assign Driver</th><th>Update Status</th></tr>
              </thead>
              <tbody>
                {visible.map(b => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>
                      {b.clientName || b.guestName || '—'}
                      <br /><small className="muted">{b.clientPhone || b.guestPhone || ''}</small>
                    </td>
                    <td>{b.pickupLocation}<br /><small className="muted">→ {b.dropLocation}</small></td>
                    <td><span className="tag">{b.serviceType.replace('_',' ')}</span></td>
                    <td>{b.fare ? <span className="fare-cell">₹{Number(b.fare).toLocaleString('en-IN',{maximumFractionDigits:0})}</span> : <span className="muted">—</span>}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{b.driverName || <span className="muted">—</span>}</td>
                    <td>
                      <select className="select-sm" defaultValue=""
                        onChange={e => e.target.value && assign(b.id, e.target.value)}>
                        <option value="">Assign…</option>
                        {drivers.map(d => <option key={d.userId} value={d.userId}>{d.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="select-sm" value={b.status}
                        onChange={e => updateStatus(b.id, e.target.value)}>
                        {['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s =>
                          <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                      </select>
                    </td>
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

function AdminDrivers() {
  const toast = useToast()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/admin/drivers')
      .then(r => { setDrivers(r.data); setLoading(false) })
      .catch(() => toast('Failed to load drivers.', 'error'))
  }, [])

  return (
    <div>
      <h2 className="page-title">Drivers</h2>
      <div className="card">
        {loading ? <Spinner /> : drivers.length === 0
          ? <div className="empty-state"><i className="fas fa-car" /><p>No drivers registered yet.</p></div>
          : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Vehicle</th><th>Total Rides</th><th>Rating</th><th>Available</th></tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td>
                    <td>{d.email}</td>
                    <td>{d.phone || '—'}</td>
                    <td>{d.vehicleNumber || '—'} {d.vehicleType && <span className="tag">{d.vehicleType}</span>}</td>
                    <td>{d.totalRides}</td>
                    <td>⭐ {d.rating}</td>
                    <td><span className={`badge badge-${d.isAvailable ? 'success' : 'danger'}`}>{d.isAvailable ? 'Yes' : 'No'}</span></td>
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

function AdminUsers() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/admin/users')
      .then(r => { setUsers(r.data); setLoading(false) })
      .catch(() => toast('Failed to load users.', 'error'))
  }, [])

  const roleColor = { CLIENT:'info', ADMIN:'purple', DRIVER:'success' }

  return (
    <div>
      <h2 className="page-title">All Users</h2>
      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td><b>{u.name}</b></td><td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`badge badge-${roleColor[u.role]||'info'}`}>{u.role}</span></td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
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

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color+'18', color }}><i className={icon} /></div>
      <div><div className="stat-value">{value ?? '…'}</div><div className="stat-label">{label}</div></div>
    </div>
  )
}
function StatusBadge({ status }) {
  const map = { PENDING:'warning', CONFIRMED:'info', IN_PROGRESS:'purple', COMPLETED:'success', CANCELLED:'danger' }
  return <span className={`badge badge-${map[status]||'info'}`}>{status.replace('_',' ')}</span>
}
function Spinner() { return <div className="spinner"><i className="fas fa-spinner fa-spin" /></div> }
