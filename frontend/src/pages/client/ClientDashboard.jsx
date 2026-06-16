import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../services/api'
import './Client.css'

const NAV = [
  { path: '/client',        label: 'Dashboard',     icon: 'fas fa-tachometer-alt' },
  { path: '/client/book',   label: 'Book a Ride',   icon: 'fas fa-plus-circle' },
  { path: '/client/rides',  label: 'My Bookings',   icon: 'fas fa-list' },
]

export default function ClientDashboard() {
  return (
    <Layout navItems={NAV} role="CLIENT">
      <Routes>
        <Route index         element={<ClientHome />} />
        <Route path="book"   element={<BookRide />} />
        <Route path="rides"  element={<MyBookings />} />
        <Route path="*"      element={<Navigate to="/client" replace />} />
      </Routes>
    </Layout>
  )
}

function ClientHome() {
  const [bookings, setBookings] = useState([])
  useEffect(() => { api.get('/client/bookings').then(r => setBookings(r.data)).catch(() => {}) }, [])

  const counts = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'PENDING').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    active:    bookings.filter(b => ['CONFIRMED','IN_PROGRESS'].includes(b.status)).length,
  }
  const recent = bookings.slice(0, 5)

  return (
    <div>
      <h2 className="page-title">My Dashboard</h2>
      <div className="stats-grid">
        <StatCard label="Total Bookings" value={counts.total}   icon="fas fa-ticket-alt"  color="#3b82f6" />
        <StatCard label="Pending"        value={counts.pending} icon="fas fa-clock"        color="#f59e0b" />
        <StatCard label="Active Rides"   value={counts.active}  icon="fas fa-car"          color="#8b5cf6" />
        <StatCard label="Completed"      value={counts.completed} icon="fas fa-check-circle" color="#10b981" />
      </div>
      <div className="card mt-24">
        <div className="card-header"><h3>Recent Bookings</h3></div>
        {recent.length === 0
          ? <div className="empty-state"><i className="fas fa-inbox" /><p>No bookings yet. <a href="/client/book">Book your first ride!</a></p></div>
          : <BookingTable bookings={recent} />}
      </div>
    </div>
  )
}

function BookRide() {
  const [form, setForm] = useState({ pickupLocation:'', dropLocation:'', serviceType:'CITY_TAXI', scheduledAt:'', fare:'', notes:'' })
  const [msg, setMsg]   = useState(null)
  const [loading, setLoading] = useState(false)

  const services = [
    { value:'CITY_TAXI',       label:'City Taxi' },
    { value:'ONE_WAY',         label:'One Way Trip' },
    { value:'HOURLY_RENTAL',   label:'Hourly Rental' },
    { value:'ROUND_TRIP',      label:'Round Trip' },
    { value:'AIRPORT_TRANSFER',label:'Airport Transfer' },
    { value:'OUTSTATION',      label:'Outstation' },
  ]

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setMsg(null)
    try {
      const payload = { ...form, fare: form.fare ? parseFloat(form.fare) : null, scheduledAt: form.scheduledAt || null }
      await api.post('/client/bookings', payload)
      setMsg({ type:'success', text:'Ride booked successfully! We\'ll confirm shortly.' })
      setForm({ pickupLocation:'', dropLocation:'', serviceType:'CITY_TAXI', scheduledAt:'', fare:'', notes:'' })
    } catch { setMsg({ type:'error', text:'Booking failed. Please try again.' }) }
    finally  { setLoading(false) }
  }

  return (
    <div>
      <h2 className="page-title">Book a Ride</h2>
      <div className="card" style={{ maxWidth: 600 }}>
        {msg && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'}`}>{msg.text}</div>}
        <form onSubmit={handleSubmit} className="book-form">
          <div className="fg">
            <label>Pickup Location *</label>
            <input type="text" placeholder="e.g. Patna Junction" required
              value={form.pickupLocation} onChange={e => setForm({...form, pickupLocation: e.target.value})} />
          </div>
          <div className="fg">
            <label>Drop Location *</label>
            <input type="text" placeholder="e.g. Patna Airport" required
              value={form.dropLocation} onChange={e => setForm({...form, dropLocation: e.target.value})} />
          </div>
          <div className="form-row-2">
            <div className="fg">
              <label>Service Type *</label>
              <select value={form.serviceType} onChange={e => setForm({...form, serviceType: e.target.value})}>
                {services.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>Scheduled At</label>
              <input type="datetime-local" value={form.scheduledAt}
                onChange={e => setForm({...form, scheduledAt: e.target.value})} />
            </div>
          </div>
          <div className="fg">
            <label>Notes (optional)</label>
            <textarea rows={3} placeholder="Any special instructions…"
              value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> Booking…</> : <><i className="fas fa-car" /> Book Now</>}
          </button>
        </form>
      </div>
    </div>
  )
}

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [msg, setMsg]           = useState(null)

  const load = () => api.get('/client/bookings').then(r => { setBookings(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const cancel = async id => {
    if (!confirm('Cancel this booking?')) return
    try {
      const res = await api.put(`/client/bookings/${id}/cancel`)
      setMsg({ type: res.data.success ? 'success' : 'error', text: res.data.message })
      load()
    } catch { setMsg({ type:'error', text:'Failed to cancel.' }) }
  }

  return (
    <div>
      <h2 className="page-title">My Bookings</h2>
      {msg && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'} mb-16`}>{msg.text}</div>}
      <div className="card">
        {loading ? <Spinner /> : bookings.length === 0
          ? <div className="empty-state"><i className="fas fa-inbox" /><p>No bookings found.</p></div>
          : <BookingTable bookings={bookings} onCancel={cancel} />}
      </div>
    </div>
  )
}

function BookingTable({ bookings, onCancel }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>Pickup</th><th>Drop</th><th>Service</th><th>Status</th><th>Driver</th><th>Scheduled</th>{onCancel && <th>Action</th>}</tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td>#{b.id}</td>
              <td>{b.pickupLocation}</td>
              <td>{b.dropLocation}</td>
              <td><span className="tag">{b.serviceType.replace('_',' ')}</span></td>
              <td><StatusBadge status={b.status} /></td>
              <td>{b.driverName || <span className="muted">Not assigned</span>}</td>
              <td>{b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : <span className="muted">—</span>}</td>
              {onCancel && <td>
                {['PENDING','CONFIRMED'].includes(b.status) &&
                  <button className="btn-sm btn-danger" onClick={() => onCancel(b.id)}>Cancel</button>}
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
      <div className="stat-icon" style={{ background: color + '18', color }}><i className={icon} /></div>
      <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { PENDING:'warning', CONFIRMED:'info', IN_PROGRESS:'purple', COMPLETED:'success', CANCELLED:'danger' }
  return <span className={`badge badge-${map[status] || 'info'}`}>{status.replace('_',' ')}</span>
}

function Spinner() { return <div className="spinner"><i className="fas fa-spinner fa-spin" /></div> }
