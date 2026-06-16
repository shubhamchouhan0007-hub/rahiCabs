import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]     = useState({ name:'', email:'', password:'', phone:'', role:'CLIENT' })
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register(form)
      setSuccess('Registration successful! Redirecting to login…')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-brand"><i className="fas fa-taxi" /> Rahi<b>Cabs</b></div>
        <h1>Join RahiCabs</h1>
        <p>Create your account as a client, driver, or admin.</p>
        <div className="auth-features">
          <div><i className="fas fa-user" /> Book rides instantly</div>
          <div><i className="fas fa-car" /> Drive & earn money</div>
          <div><i className="fas fa-chart-bar" /> Admin control panel</div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p className="auth-sub">Fill in your details to get started</p>
          {error   && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrap">
                <i className="fas fa-user" />
                <input type="text" placeholder="Your Name" required
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <div className="input-wrap">
                  <i className="fas fa-envelope" />
                  <input type="email" placeholder="you@example.com" required
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="input-wrap">
                  <i className="fas fa-phone" />
                  <input type="tel" placeholder="+91 XXXXX XXXXX"
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock" />
                <input type="password" placeholder="Min. 6 characters" required minLength={6}
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Register As</label>
              <div className="input-wrap">
                <i className="fas fa-id-badge" />
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="CLIENT">Client (Book Rides)</option>
                  <option value="DRIVER">Driver (Drive & Earn)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin" /> Creating…</> : 'Create Account'}
            </button>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  )
}
