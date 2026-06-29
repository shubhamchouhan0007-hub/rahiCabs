import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { fmtDate, fmtDateTime } from '../../utils/format'
import '../client/Client.css'

const NAV = [
  { path: '/admin',           label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { path: '/admin/bookings',  label: 'Bookings',  icon: 'fas fa-list' },
  { path: '/admin/drivers',   label: 'Drivers',   icon: 'fas fa-car' },
  { path: '/admin/users',     label: 'Users',     icon: 'fas fa-users' },
  { path: '/admin/messages',  label: 'Messages',  icon: 'fas fa-envelope' },
  { path: '/admin/settings',  label: 'Settings',  icon: 'fas fa-cog' },
]

export default function AdminDashboard() {
  return (
    <Layout navItems={NAV} role="ADMIN">
      <Routes>
        <Route index            element={<AdminHome />} />
        <Route path="bookings"  element={<AdminBookings />} />
        <Route path="drivers"   element={<AdminDrivers />} />
        <Route path="users"     element={<AdminUsers />} />
        <Route path="messages"  element={<AdminMessages />} />
        <Route path="settings"  element={<AdminSettings />} />
        <Route path="*"         element={<Navigate to="/admin" replace />} />
      </Routes>
    </Layout>
  )
}

// ── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ current }) {
  const navigate = useNavigate()
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'16px', fontSize:'14px', color:'#6b7280' }}>
      <span onClick={() => navigate('/admin')} style={{ cursor:'pointer', color:'#134e4a', fontWeight:500 }}>Dashboard</span>
      <span>/</span>
      <span style={{ color:'#111827', fontWeight:500 }}>{current}</span>
    </div>
  )
}

// ── Dashboard Home ───────────────────────────────────────────────────────────

function AdminHome() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}) }, [])
  if (!stats) return <Spinner />
  return (
    <div>
      <h2 className="page-title">Admin Dashboard</h2>
      <div className="stats-grid">
        <StatCard label="Total Bookings"  value={stats.total}        icon="fas fa-ticket-alt"    color="#3b82f6" to="/admin/bookings" />
        <StatCard label="Pending"         value={stats.pending}      icon="fas fa-clock"          color="#f59e0b" to="/admin/bookings?filter=PENDING" />
        <StatCard label="In Progress"     value={stats.inProgress}   icon="fas fa-car"            color="#8b5cf6" to="/admin/bookings?filter=IN_PROGRESS" />
        <StatCard label="Completed"       value={stats.completed}    icon="fas fa-check-circle"   color="#10b981" to="/admin/bookings?filter=COMPLETED" />
        <StatCard label="Cancelled"       value={stats.cancelled}    icon="fas fa-times-circle"   color="#ef4444" to="/admin/bookings?filter=CANCELLED" />
        <StatCard label="Total Users"     value={stats.totalUsers}   icon="fas fa-users"          color="#06b6d4" to="/admin/users" />
        <StatCard label="Total Drivers"   value={stats.totalDrivers} icon="fas fa-id-card"        color="#7c3aed" to="/admin/drivers" />
        <StatCard label="Revenue (₹)"     value={stats.totalRevenue != null ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN',{maximumFractionDigits:0})}` : '₹0'} icon="fas fa-rupee-sign" color="#059669" to="/admin/bookings" />
      </div>
    </div>
  )
}

// ── Bookings ─────────────────────────────────────────────────────────────────

function AdminBookings() {
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const [bookings, setBookings] = useState([])
  const [drivers,  setDrivers]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState(searchParams.get('filter') || 'ALL')

  const load = () => Promise.all([api.get('/admin/bookings'), api.get('/admin/drivers')])
    .then(([b, d]) => { setBookings(b.data); setDrivers(d.data); setLoading(false) })

  useEffect(() => { load() }, [])

  const assign = async (bookingId, driverId) => {
    try { await api.put(`/admin/bookings/${bookingId}/assign-driver/${driverId}`); load(); toast('Driver assigned!', 'success') }
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
    return matchSearch && (filter === 'ALL' || b.status === filter)
  })

  return (
    <div>
      <Breadcrumb current="Bookings" />
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
          {['PENDING_PAYMENT','PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s =>
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
        <span className="result-count">{visible.length} booking{visible.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="card">
        {loading ? <Spinner /> : visible.length === 0
          ? <div className="empty-state"><i className="fas fa-inbox" /><p>{search || filter !== 'ALL' ? 'No matching bookings.' : 'No bookings yet.'}</p></div>
          : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Client</th><th>Pickup → Drop</th><th>Service</th><th>Scheduled</th><th>Fare</th><th>Status</th><th>Driver</th><th>Assign Driver</th><th>Update Status</th></tr>
              </thead>
              <tbody>
                {visible.map(b => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>{b.clientName || b.guestName || '—'}<br /><small className="muted">{b.clientPhone || b.guestPhone || ''}</small></td>
                    <td>{b.pickupLocation}<br /><small className="muted">→ {b.dropLocation}</small></td>
                    <td><span className="tag">{b.serviceType.replace('_',' ')}</span></td>
                    <td><small>{fmtDateTime(b.scheduledAt || b.createdAt)}</small></td>
                    <td>{b.fare ? <span className="fare-cell">₹{Number(b.fare).toLocaleString('en-IN',{maximumFractionDigits:0})}</span> : <span className="muted">—</span>}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{b.driverName || <span className="muted">—</span>}</td>
                    <td>
                      <select className="select-sm" defaultValue="" onChange={e => e.target.value && assign(b.id, e.target.value)}>
                        <option value="">Assign…</option>
                        {drivers.map(d => <option key={d.userId} value={d.userId}>{d.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="select-sm" value={b.status} onChange={e => updateStatus(b.id, e.target.value)}>
                        {['PENDING_PAYMENT','PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'].map(s =>
                          <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
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

// ── Drivers ──────────────────────────────────────────────────────────────────

function AdminDrivers() {
  const toast = useToast()
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', vehicleNumber:'', vehicleType:'', aadhaarNumber:'', licenseNumber:'' })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/admin/drivers').then(r => { setDrivers(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/admin/drivers', form)
      toast('Driver added!', 'success')
      setShowModal(false); setForm({ name:'', email:'', password:'', phone:'', vehicleNumber:'', vehicleType:'', aadhaarNumber:'', licenseNumber:'' })
      load()
    } catch(err) {
      toast(err.response?.data?.error || 'Failed to add driver.', 'error')
    } finally { setSaving(false) }
  }

  const remove = async (userId, name) => {
    if (!confirm(`Delete driver "${name}"? This cannot be undone.`)) return
    try { await api.delete(`/admin/drivers/${userId}`); toast('Driver deleted.', 'success'); load() }
    catch { toast('Failed to delete.', 'error') }
  }

  return (
    <div>
      <Breadcrumb current="Drivers" />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 className="page-title">Drivers</h2>
        <button className="btn-primary-sm" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus" /> Add Driver
        </button>
      </div>

      {showModal && (
        <Modal title="Add New Driver" onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="modal-form">
            <div className="form-row">
              <FormField label="Full Name *" value={form.name} onChange={v => setForm(f=>({...f,name:v}))} placeholder="John Doe" required />
              <FormField label="Email" type="email" value={form.email} onChange={v => setForm(f=>({...f,email:v}))} placeholder="john@example.com (optional)" />
            </div>
            <div className="form-row">
              <FormField label="Password *" type="password" value={form.password} onChange={v => setForm(f=>({...f,password:v}))} placeholder="Min 6 chars" required />
              <FormField label="Phone" value={form.phone} onChange={v => setForm(f=>({...f,phone:v}))} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="form-row">
              <FormField label="Vehicle Number" value={form.vehicleNumber} onChange={v => setForm(f=>({...f,vehicleNumber:v}))} placeholder="BR01AB1234" />
              <div className="form-field">
                <label>Vehicle Type</label>
                <select value={form.vehicleType} onChange={e => setForm(f=>({...f,vehicleType:e.target.value}))}>
                  <option value="">Select…</option>
                  {['SEDAN','SUV','HATCHBACK','TEMPO','BUS'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <FormField label="Aadhaar Number" value={form.aadhaarNumber} onChange={v => setForm(f=>({...f,aadhaarNumber:v}))} placeholder="XXXX XXXX XXXX" />
              <FormField label="License Number" value={form.licenseNumber} onChange={v => setForm(f=>({...f,licenseNumber:v}))} placeholder="BR-XXXXXXXXXX" />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary-sm" disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : 'Add Driver'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="card">
        {loading ? <Spinner /> : drivers.length === 0
          ? <div className="empty-state"><i className="fas fa-car" /><p>No drivers yet.</p></div>
          : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Vehicle</th><th>Aadhaar</th><th>License</th><th>Rides</th><th>Rating</th><th>Available</th><th>Action</th></tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td>
                    <td>{d.email}</td>
                    <td>{d.phone || '—'}</td>
                    <td>{d.vehicleNumber || '—'} {d.vehicleType && <span className="tag">{d.vehicleType}</span>}</td>
                    <td>{d.aadhaarNumber || '—'}</td>
                    <td>{d.licenseNumber || '—'}</td>
                    <td>{d.totalRides}</td>
                    <td>⭐ {d.rating}</td>
                    <td><span className={`badge badge-${d.isAvailable ? 'success' : 'danger'}`}>{d.isAvailable ? 'Yes' : 'No'}</span></td>
                    <td>
                      <button className="btn-danger-sm" onClick={() => remove(d.userId, d.name)}>
                        <i className="fas fa-trash" />
                      </button>
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

// ── Users ─────────────────────────────────────────────────────────────────────

function AdminUsers() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', role:'CLIENT' })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/admin/users').then(r => { setUsers(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/admin/users', form)
      toast('User added!', 'success')
      setShowModal(false); setForm({ name:'', email:'', password:'', phone:'', role:'CLIENT' })
      load()
    } catch(err) {
      toast(err.response?.data?.error || 'Failed to add user.', 'error')
    } finally { setSaving(false) }
  }

  const remove = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return
    try { await api.delete(`/admin/users/${id}`); toast('User deleted.', 'success'); load() }
    catch { toast('Failed to delete.', 'error') }
  }

  const roleColor = { CLIENT:'info', ADMIN:'purple', DRIVER:'success' }

  return (
    <div>
      <Breadcrumb current="Users" />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 className="page-title">All Users</h2>
        <button className="btn-primary-sm" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus" /> Add User
        </button>
      </div>

      {showModal && (
        <Modal title="Add New User" onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="modal-form">
            <div className="form-row">
              <FormField label="Full Name *" value={form.name} onChange={v => setForm(f=>({...f,name:v}))} placeholder="Jane Doe" required />
              <FormField label="Email *" type="email" value={form.email} onChange={v => setForm(f=>({...f,email:v}))} placeholder="jane@example.com" required />
            </div>
            <div className="form-row">
              <FormField label="Password *" type="password" value={form.password} onChange={v => setForm(f=>({...f,password:v}))} placeholder="Min 6 chars" required />
              <FormField label="Phone" value={form.phone} onChange={v => setForm(f=>({...f,phone:v}))} placeholder="+91 XXXXX XXXXX" />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                <option value="CLIENT">Client</option>
                <option value="DRIVER">Driver</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-ghost-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary-sm" disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : 'Add User'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="card">
        {loading ? <Spinner /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td><b>{u.name}</b></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`badge badge-${roleColor[u.role]||'info'}`}>{u.role}</span></td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>
                      <button className="btn-danger-sm" onClick={() => remove(u.id, u.name)}
                        disabled={u.role === 'ADMIN'} title={u.role === 'ADMIN' ? 'Cannot delete admin' : 'Delete user'}>
                        <i className="fas fa-trash" />
                      </button>
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

// ── Settings ──────────────────────────────────────────────────────────────────

function AdminSettings() {
  const toast = useToast()
  const [settings, setSettings] = useState(null)
  const [tab, setTab] = useState('fare')
  const [saving, setSaving] = useState(false)
  const [newArea, setNewArea] = useState('')

  useEffect(() => { api.get('/admin/settings').then(r => setSettings(r.data)).catch(() => toast('Failed to load settings.', 'error')) }, [])

  const save = async () => {
    setSaving(true)
    try { await api.put('/admin/settings', settings); toast('Settings saved!', 'success') }
    catch { toast('Failed to save.', 'error') }
    finally { setSaving(false) }
  }

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  const areas = settings?.areas ? settings.areas.split(',').map(a => a.trim()).filter(Boolean) : []

  const addArea = () => {
    const a = newArea.trim()
    if (!a || areas.includes(a)) return
    set('areas', [...areas, a].join(','))
    setNewArea('')
  }

  const removeArea = area => set('areas', areas.filter(a => a !== area).join(','))

  if (!settings) return <Spinner />

  const tabs = [
    { id:'fare',    label:'Fare & Pricing',   icon:'fas fa-rupee-sign' },
    { id:'areas',   label:'Service Areas',    icon:'fas fa-map-marker-alt' },
    { id:'stats',   label:'Homepage Stats',   icon:'fas fa-chart-bar' },
    { id:'contact', label:'Contact Info',     icon:'fas fa-phone' },
    { id:'banner',  label:'Announcement',     icon:'fas fa-bullhorn' },
  ]

  return (
    <div>
      <Breadcrumb current="Settings" />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 className="page-title">Settings</h2>
        <button className="btn-primary-sm" onClick={save} disabled={saving}>
          {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save Changes</>}
        </button>
      </div>

      <div className="settings-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`settings-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      <div className="card settings-card">
        {tab === 'fare' && (
          <div className="settings-section">
            <h3>Fare &amp; Pricing</h3>
            <p className="settings-desc">These rates apply to all bookings in real time.</p>
            <div className="settings-grid">
              <SettingField label="Rate per km (₹)" type="number" value={settings['fare.per_km'] || ''} onChange={v => set('fare.per_km', v)} hint="e.g. 11" />
              <SettingField label="Minimum Fare (₹)" type="number" value={settings['fare.minimum'] || ''} onChange={v => set('fare.minimum', v)} hint="e.g. 150" />
              <SettingField label="Advance Payment (%)" type="number" value={settings['fare.advance_pct'] || ''} onChange={v => set('fare.advance_pct', v)} hint="e.g. 15" />
            </div>
          </div>
        )}

        {tab === 'areas' && (
          <div className="settings-section">
            <h3>Service Areas</h3>
            <p className="settings-desc">Cities shown on the homepage service areas section.</p>
            <div className="area-add-row">
              <input value={newArea} onChange={e => setNewArea(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addArea())}
                placeholder="Add city name…" className="area-input" />
              <button className="btn-primary-sm" onClick={addArea}><i className="fas fa-plus" /> Add</button>
            </div>
            <div className="area-chips">
              {areas.map(a => (
                <span key={a} className="area-chip">
                  <i className="fas fa-map-marker-alt" /> {a}
                  <button onClick={() => removeArea(a)}><i className="fas fa-times" /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        {tab === 'stats' && (
          <div className="settings-section">
            <h3>Homepage Stats</h3>
            <p className="settings-desc">Numbers shown in the hero section of the homepage.</p>
            <div className="settings-grid">
              <SettingField label="Happy Riders" type="number" value={settings['stats.happy_riders'] || ''} onChange={v => set('stats.happy_riders', v)} hint="e.g. 5000" />
              <SettingField label="Expert Drivers" type="number" value={settings['stats.drivers'] || ''} onChange={v => set('stats.drivers', v)} hint="e.g. 150" />
              <SettingField label="Cities Covered" type="number" value={settings['stats.cities'] || ''} onChange={v => set('stats.cities', v)} hint="e.g. 20" />
            </div>
          </div>
        )}

        {tab === 'contact' && (
          <div className="settings-section">
            <h3>Contact Information</h3>
            <p className="settings-desc">Shown in the contact section and footer of the homepage.</p>
            <div className="settings-grid">
              <SettingField label="Phone Number" value={settings['contact.phone'] || ''} onChange={v => set('contact.phone', v)} hint="+91 XXXXX XXXXX" />
              <SettingField label="Email Address" type="email" value={settings['contact.email'] || ''} onChange={v => set('contact.email', v)} hint="info@rahicab.com" />
            </div>
          </div>
        )}

        {tab === 'banner' && (
          <div className="settings-section">
            <h3>Announcement Banner</h3>
            <p className="settings-desc">Shows a banner at the top of the homepage for promotions or alerts.</p>
            <div className="settings-toggle-row">
              <label className="toggle-label">
                <div className={`toggle${settings['banner.enabled'] === 'true' ? ' on' : ''}`}
                  onClick={() => set('banner.enabled', settings['banner.enabled'] === 'true' ? 'false' : 'true')}>
                  <div className="toggle-knob" />
                </div>
                Banner {settings['banner.enabled'] === 'true' ? 'Enabled' : 'Disabled'}
              </label>
            </div>
            <SettingField label="Banner Text" value={settings['banner.text'] || ''} onChange={v => set('banner.text', v)} hint="e.g. 🎉 Festive offer: 20% off all rides this weekend!" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, to }) {
  const navigate = useNavigate()
  return (
    <div className="stat-card" onClick={() => to && navigate(to)} style={{ cursor: to ? 'pointer' : 'default' }}>
      <div className="stat-icon" style={{ background: color+'18', color }}><i className={icon} /></div>
      <div><div className="stat-value">{value ?? '…'}</div><div className="stat-label">{label}</div></div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box wide">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, type='text', placeholder='', required }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} />
    </div>
  )
}

function SettingField({ label, value, onChange, type='text', hint }) {
  return (
    <div className="setting-field">
      <label>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={hint} />
      {hint && <span className="setting-hint">{hint}</span>}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { PENDING_PAYMENT:'danger', PENDING:'warning', CONFIRMED:'info', IN_PROGRESS:'purple', COMPLETED:'success', CANCELLED:'danger' }
  return <span className={`badge badge-${map[status]||'info'}`}>{status.replace(/_/g,' ')}</span>
}

function Spinner() { return <div className="spinner"><i className="fas fa-spinner fa-spin" /></div> }

// ── Messages ──────────────────────────────────────────────────────────────────

function AdminMessages() {
  const navigate = useNavigate()
  const toast    = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = () => api.get('/admin/messages').then(r => { setMessages(r.data.messages || []); setLoading(false) })
  useEffect(() => { load() }, [])

  const markRead = async id => {
    await api.put(`/admin/messages/${id}/read`)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m))
  }

  const unread = messages.filter(m => !m.isRead).length

  return (
    <div>
      <Breadcrumb current="Messages" />
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <h2 className="page-title" style={{ margin:0 }}>Contact Messages</h2>
        {unread > 0 && <span className="badge badge-danger">{unread} unread</span>}
      </div>
      {loading ? <Spinner /> : messages.length === 0
        ? <div className="empty-state"><i className="fas fa-envelope-open" /><p>No messages yet.</p></div>
        : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {messages.map(m => (
            <div key={m.id} className="card" style={{
              padding:'16px 20px', borderLeft:`4px solid ${m.isRead ? '#e8e0d0' : '#c9841a'}`,
              opacity: m.isRead ? 0.75 : 1
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'.95rem' }}>{m.name}
                    {!m.isRead && <span className="badge badge-warning" style={{ marginLeft:8, fontSize:'.68rem' }}>New</span>}
                  </div>
                  <div style={{ fontSize:'.82rem', color:'#9ca3af', marginTop:2 }}>
                    <i className="fas fa-phone" style={{ marginRight:5 }} />{m.phone}
                    {m.email && <><span style={{ margin:'0 8px' }}>·</span><i className="fas fa-envelope" style={{ marginRight:5 }} />{m.email}</>}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <small style={{ color:'#9ca3af' }}>{fmtDateTime(m.sentAt)}</small>
                  {!m.isRead && (
                    <button className="btn-primary-sm" onClick={() => markRead(m.id)}>
                      <i className="fas fa-check" /> Mark Read
                    </button>
                  )}
                </div>
              </div>
              <p style={{ marginTop:10, fontSize:'.9rem', color:'#374151', lineHeight:1.6,
                background:'#f8f6f0', padding:'10px 14px', borderRadius:8, margin:'10px 0 0' }}>
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
