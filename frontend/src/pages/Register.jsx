import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import './Auth.css'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ name:'', email:'', password:'', phone:'', role:'CLIENT', vehicleNumber:'', vehicleType:'', aadhaarNumber:'', licenseNumber:'' })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const isDriver = form.role === 'DRIVER'

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

  const set = field => e => setForm({ ...form, [field]: e.target.value })

  return (
    <>
    <TopBar />
    <div className="auth-wrapper" style={{ paddingTop: 56 }}>
      <div className="auth-left">
        <div className="auth-brand"><i className="fas fa-taxi" /> Rahi<b>Cab</b></div>
        <h1>Join RahiCab</h1>
        <p>{isDriver ? 'Register as a driver and start earning with RahiCab.' : 'Create your account to book rides instantly.'}</p>
        <div className="auth-features">
          <div><i className="fas fa-user" /> Book rides instantly</div>
          <div><i className="fas fa-car" /> Drive &amp; earn money</div>
          <div><i className="fas fa-shield-alt" /> Safe &amp; verified</div>
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
              <label>Register As</label>
              <div className="input-wrap">
                <i className="fas fa-id-badge" />
                <select value={form.role} onChange={set('role')}>
                  <option value="CLIENT">Client (Book Rides)</option>
                  <option value="DRIVER">Driver (Drive &amp; Earn)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrap">
                <i className="fas fa-user" />
                <input type="text" placeholder="Your Name" required value={form.name} onChange={set('name')} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email</label>
                <div className="input-wrap">
                  <i className="fas fa-envelope" />
                  <input type="email" placeholder="you@example.com" required value={form.email} onChange={set('email')} />
                </div>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="input-wrap">
                  <i className="fas fa-phone" />
                  <input type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock" />
                <input type="password" placeholder="Min. 6 characters" required minLength={6} value={form.password} onChange={set('password')} />
              </div>
            </div>

            {isDriver && (
              <>
                <div className="auth-section-divider"><span>Vehicle Details</span></div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Number</label>
                    <div className="input-wrap">
                      <i className="fas fa-car" />
                      <input type="text" placeholder="BR01AB1234" value={form.vehicleNumber} onChange={set('vehicleNumber')} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <div className="input-wrap">
                      <i className="fas fa-car-side" />
                      <select value={form.vehicleType} onChange={set('vehicleType')}>
                        <option value="">Select type…</option>
                        {['SEDAN','SUV','HATCHBACK','TEMPO','BUS'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="auth-section-divider"><span>Documents</span></div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Aadhaar Number</label>
                    <div className="input-wrap">
                      <i className="fas fa-id-card" />
                      <input type="text" placeholder="XXXX XXXX XXXX" value={form.aadhaarNumber} onChange={set('aadhaarNumber')} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>License Number</label>
                    <div className="input-wrap">
                      <i className="fas fa-file-alt" />
                      <input type="text" placeholder="BR-XXXXXXXXXX" value={form.licenseNumber} onChange={set('licenseNumber')} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? <><i className="fas fa-spinner fa-spin" /> Creating…</> : `Create ${isDriver ? 'Driver' : ''} Account`}
            </button>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
    </>
  )
}
