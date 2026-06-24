import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'
import './Client.css'

const NAV = [
  { path: '/client',        label: 'Dashboard',     icon: 'fas fa-tachometer-alt' },
  { path: '/client/book',   label: 'Book a Ride',   icon: 'fas fa-plus-circle' },
  { path: '/client/rides',  label: 'My Bookings',   icon: 'fas fa-list' },
]

// ---- Haversine distance ----
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
const RATE = 11   // ₹ per km
const MIN_FARE = 150

// ---- Nominatim autocomplete hook ----
function useLocationAC() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading]         = useState(false)
  const [coords, setCoords]           = useState(null)  // { lat, lon }
  const timerRef = useRef(null)

  const query = useCallback((text) => {
    clearTimeout(timerRef.current)
    setSuggestions([]); setCoords(null)
    if (text.length < 3) { setLoading(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        )
        setSuggestions(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    }, 380)
  }, [])

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    setSuggestions([]); setCoords(null); setLoading(false)
  }, [])

  return { suggestions, loading, coords, setCoords, query, reset, setSuggestions }
}

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
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  useEffect(() => {
    api.get('/client/bookings').then(r => setBookings(r.data))
      .catch(() => toast('Failed to load bookings.', 'error'))
  }, [])

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
  const toast = useToast()
  const [form, setForm] = useState({ pickupLocation:'', dropLocation:'', serviceType:'CITY_TAXI', scheduledAt:'', notes:'' })
  const [loading, setLoading] = useState(false)
  const [fareEst, setFareEst] = useState(null)

  const pickup = useLocationAC()
  const drop   = useLocationAC()

  // Recalculate fare whenever both coords are set
  useEffect(() => {
    if (pickup.coords && drop.coords) {
      const dist = haversineKm(pickup.coords.lat, pickup.coords.lon, drop.coords.lat, drop.coords.lon)
      const fare = Math.max(MIN_FARE, Math.round(dist * RATE))
      setFareEst({ dist: dist.toFixed(1), fare })
    } else {
      setFareEst(null)
    }
  }, [pickup.coords, drop.coords])

  const services = [
    { value:'CITY_TAXI',       label:'City Taxi' },
    { value:'ONE_WAY',         label:'One Way Trip' },
    { value:'HOURLY_RENTAL',   label:'Hourly Rental' },
    { value:'ROUND_TRIP',      label:'Round Trip' },
    { value:'AIRPORT_TRANSFER',label:'Airport Transfer' },
    { value:'OUTSTATION',      label:'Outstation' },
  ]

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.pickupLocation || !form.dropLocation) {
      toast('Please enter pickup and drop locations.', 'warning'); return
    }
    setLoading(true)
    try {
      const payload = { ...form, fare: fareEst ? fareEst.fare : null, scheduledAt: form.scheduledAt || null }
      await api.post('/client/bookings', payload)
      toast('Ride booked! We\'ll confirm shortly.', 'success')
      setForm({ pickupLocation:'', dropLocation:'', serviceType:'CITY_TAXI', scheduledAt:'', notes:'' })
      pickup.reset(); drop.reset(); setFareEst(null)
    } catch { toast('Booking failed. Please try again.', 'error') }
    finally  { setLoading(false) }
  }

  return (
    <div>
      <h2 className="page-title">Book a Ride</h2>
      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} className="book-form" autoComplete="off">
          {/* Pickup */}
          <div className="fg">
            <label>Pickup Location *</label>
            <div className="ac-wrap">
              <input type="text" placeholder="e.g. Patna Junction" required
                value={form.pickupLocation}
                onChange={e => { setForm(f => ({...f, pickupLocation: e.target.value})); pickup.query(e.target.value) }}
                onBlur={() => setTimeout(() => pickup.setSuggestions([]), 200)}
              />
              {pickup.loading && <span className="ac-spin"><i className="fas fa-spinner fa-spin" /></span>}
              {pickup.suggestions.length > 0 && (
                <ul className="ac-list">
                  {pickup.suggestions.map((s,i) => (
                    <li key={i} onMouseDown={() => {
                      setForm(f => ({...f, pickupLocation: s.display_name.split(',').slice(0,3).join(',')}))
                      pickup.setCoords({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) })
                      pickup.setSuggestions([])
                    }}>
                      <i className="fas fa-map-marker-alt" style={{color:'#f5a623',marginRight:8}} />
                      {s.display_name.split(',').slice(0,4).join(',')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Drop */}
          <div className="fg">
            <label>Drop Location *</label>
            <div className="ac-wrap">
              <input type="text" placeholder="e.g. Patna Airport" required
                value={form.dropLocation}
                onChange={e => { setForm(f => ({...f, dropLocation: e.target.value})); drop.query(e.target.value) }}
                onBlur={() => setTimeout(() => drop.setSuggestions([]), 200)}
              />
              {drop.loading && <span className="ac-spin"><i className="fas fa-spinner fa-spin" /></span>}
              {drop.suggestions.length > 0 && (
                <ul className="ac-list">
                  {drop.suggestions.map((s,i) => (
                    <li key={i} onMouseDown={() => {
                      setForm(f => ({...f, dropLocation: s.display_name.split(',').slice(0,3).join(',')}))
                      drop.setCoords({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) })
                      drop.setSuggestions([])
                    }}>
                      <i className="fas fa-map-marker-alt" style={{color:'#f5a623',marginRight:8}} />
                      {s.display_name.split(',').slice(0,4).join(',')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Fare estimate */}
          {fareEst && (
            <div className="fare-estimate">
              <i className="fas fa-route" />
              <span>Estimated distance: <b>{fareEst.dist} km</b></span>
              <span className="fare-amount">≈ ₹{fareEst.fare.toLocaleString('en-IN')}</span>
            </div>
          )}

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
                min={new Date().toISOString().slice(0,16)}
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
  const toast = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [cancelling, setCancelling] = useState(null)  // booking id being confirmed

  const load = () => api.get('/client/bookings').then(r => { setBookings(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const cancel = async id => {
    try {
      const res = await api.put(`/client/bookings/${id}/cancel`)
      toast(res.data.message || 'Booking cancelled.', res.data.success ? 'success' : 'error')
      if (res.data.success) load()
    } catch { toast('Failed to cancel booking.', 'error') }
    finally { setCancelling(null) }
  }

  return (
    <div>
      <h2 className="page-title">My Bookings</h2>

      {/* Cancel confirmation modal */}
      {cancelling && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon"><i className="fas fa-exclamation-triangle" style={{color:'#f59e0b'}} /></div>
            <h3>Cancel Booking?</h3>
            <p>Are you sure you want to cancel booking <b>#{cancelling}</b>? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setCancelling(null)}>Keep Booking</button>
              <button className="btn-danger-solid" onClick={() => cancel(cancelling)}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? <Spinner /> : bookings.length === 0
          ? <div className="empty-state"><i className="fas fa-inbox" /><p>No bookings found. <a href="/client/book">Book your first ride!</a></p></div>
          : <BookingTable bookings={bookings} onCancel={id => setCancelling(id)} />}
      </div>
    </div>
  )
}

function BookingTable({ bookings, onCancel }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>Pickup</th><th>Drop</th><th>Service</th><th>Fare</th><th>Status</th><th>Driver</th><th>Scheduled</th>{onCancel && <th>Action</th>}</tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td>#{b.id}</td>
              <td>{b.pickupLocation}</td>
              <td>{b.dropLocation}</td>
              <td><span className="tag">{b.serviceType.replace('_',' ')}</span></td>
              <td>{b.fare ? <span className="fare-cell">₹{Number(b.fare).toLocaleString('en-IN',{maximumFractionDigits:0})}</span> : <span className="muted">—</span>}</td>
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
