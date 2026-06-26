import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCustomer } from '../context/CustomerContext'
import customerApi from '../services/customerApi'
import TopBar from '../components/TopBar'
import './Auth.css'

export default function Login() {
  const { login }         = useAuth()
  const { login: custLogin } = useCustomer()
  const navigate          = useNavigate()

  const [mode, setMode]       = useState('customer') // 'staff' | 'customer'
  const [form, setForm]       = useState({ email: '', password: '' })
  const [phone, setPhone]     = useState('')
  const [otp, setOtp]         = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const timerRef              = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const switchMode = m => {
    setMode(m); setError(''); setOtpSent(false)
    setPhone(''); setOtp(''); setForm({ email:'', password:'' })
    clearInterval(timerRef.current); setCountdown(0)
  }

  // ── Staff login ────────────────────────────────────────────────────────────
  const handleStaffLogin = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const routes = { CLIENT:'/client', ADMIN:'/admin', DRIVER:'/driver' }
      navigate(routes[user.role] || '/')
    } catch {
      setError('Invalid email or password.')
    } finally { setLoading(false) }
  }

  // ── Customer OTP login ─────────────────────────────────────────────────────
  const startCountdown = () => {
    setCountdown(60)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(timerRef.current); return 0 } return p - 1 })
    }, 1000)
  }

  const sendOtp = async e => {
    e?.preventDefault(); setError(''); setLoading(true)
    if (!phone || phone.length !== 10) { setError('Enter a valid 10-digit phone number.'); setLoading(false); return }
    try {
      await customerApi.sendOtp(phone)
      setOtpSent(true); startCountdown()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.')
    } finally { setLoading(false) }
  }

  const verifyOtp = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    if (!otp || otp.length !== 6) { setError('Enter a valid 6-digit OTP.'); setLoading(false); return }
    try {
      const res = await customerApi.loginWithOtp(phone, otp)
      custLogin(res.data)
      navigate('/customer/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.')
    } finally { setLoading(false) }
  }

  return (
    <>
    <TopBar />
    <div className="auth-wrapper" style={{ paddingTop: 56 }}>

      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand"><i className="fas fa-taxi" /> Rahi<b>Cab</b></div>
        <h1>Welcome back!</h1>
        <p>
          {mode === 'staff'
            ? 'Sign in to manage your bookings, rides, and operations.'
            : 'Login with your phone number to track or book rides.'}
        </p>
        <div className="auth-features">
          <div><i className="fas fa-shield-alt" /> Secure &amp; encrypted</div>
          <div><i className="fas fa-bolt" /> Role-based access</div>
          <div><i className="fas fa-clock" /> Available 24/7</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">

          {error && <div className="alert alert-danger">{error}</div>}

          {/* ── Staff form ── */}
          {mode === 'staff' && (
            <>
              <h2>Sign In</h2>
              <p className="auth-sub">For Admin, Driver &amp; Client accounts</p>
              <form onSubmit={handleStaffLogin}>
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrap">
                    <i className="fas fa-envelope" />
                    <input type="email" placeholder="you@example.com" required
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrap">
                    <i className="fas fa-lock" />
                    <input type="password" placeholder="••••••••" required
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn-auth" disabled={loading}>
                  {loading ? <><i className="fas fa-spinner fa-spin" /> Signing in…</> : 'Sign In'}
                </button>
              </form>
              <p className="auth-footer">Don't have an account? <Link to="/register">Register</Link></p>
            </>
          )}

          {/* ── Customer OTP form ── */}
          {mode === 'customer' && (
            <>
              <h2>{otpSent ? 'Enter OTP' : 'Customer Login'}</h2>
              <p className="auth-sub">
                {otpSent ? `OTP sent to +91 ${phone}` : 'Login with your phone number — no password needed'}
              </p>

              {!otpSent ? (
                <form onSubmit={sendOtp}>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="input-wrap phone-prefix-wrap">
                      <span className="phone-prefix">+91</span>
                      <input type="tel" placeholder="10-digit number" maxLength={10}
                        value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-auth" disabled={loading}>
                    {loading ? <><i className="fas fa-spinner fa-spin" /> Sending…</> : <><i className="fas fa-paper-plane" /> Send OTP</>}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyOtp}>
                  <div className="form-group">
                    <label>6-digit OTP</label>
                    <div className="input-wrap">
                      <i className="fas fa-key" />
                      <input type="text" placeholder="Enter OTP" maxLength={6}
                        value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                        autoFocus required />
                    </div>
                  </div>
                  <button type="submit" className="btn-auth" disabled={loading}>
                    {loading ? <><i className="fas fa-spinner fa-spin" /> Verifying…</> : 'Verify & Login'}
                  </button>
                  <div className="otp-actions">
                    <button type="button" className="text-btn" onClick={() => { setOtpSent(false); setOtp(''); setError('') }}>
                      Change Number
                    </button>
                    <button type="button" className="text-btn" onClick={sendOtp} disabled={loading || countdown > 0}>
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}

              <p className="auth-footer" style={{ marginTop: 16 }}>
                Want to book a ride? <Link to="/book">Book Now</Link>
              </p>
              <div className="partner-login-link">
                <button onClick={() => switchMode('staff')}>
                  <i className="fas fa-key" /> Partner Login
                </button>
              </div>
            </>
          )}

          {/* ── Staff back link ── */}
          {mode === 'staff' && (
            <p className="auth-footer" style={{ marginTop: 12 }}>
              <button className="text-btn" onClick={() => switchMode('customer')}>
                ← Back to Customer Login
              </button>
            </p>
          )}

        </div>
      </div>
    </div>
    </>
  )
}
