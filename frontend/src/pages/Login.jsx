import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const routes = { CLIENT: '/client', ADMIN: '/admin', DRIVER: '/driver' }
      navigate(routes[user.role] || '/login')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <div className="auth-brand">
          <i className="fas fa-taxi" /> Rahi<b>Cabs</b>
        </div>
        <h1>Welcome back!</h1>
        <p>Sign in to manage bookings, rides, and more.</p>
        <div className="auth-features">
          <div><i className="fas fa-shield-alt" /> Secure & encrypted</div>
          <div><i className="fas fa-bolt" /> Role-based access</div>
          <div><i className="fas fa-clock" /> Available 24/7</div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Sign In</h2>
          <p className="auth-sub">Enter your credentials to continue</p>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrap">
                <i className="fas fa-envelope" />
                <input type="email" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock" />
                <input type="password" placeholder="••••••••" required
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
          <p className="auth-footer">Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  )
}
