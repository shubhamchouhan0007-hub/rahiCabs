import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Home.css'

const SERVICE_TYPES = ['CITY_TAXI','ONE_WAY','HOURLY_RENTAL','ROUND_TRIP','AIRPORT_TRANSFER','OUTSTATION']
const SERVICE_LABELS = { CITY_TAXI:'City Taxi', ONE_WAY:'One Way', HOURLY_RENTAL:'Hourly Rental', ROUND_TRIP:'Round Trip', AIRPORT_TRANSFER:'Airport Transfer', OUTSTATION:'Outstation' }
const STATUS_COLOR   = { PENDING:'warning', CONFIRMED:'info', IN_PROGRESS:'purple', COMPLETED:'success', CANCELLED:'danger' }

export default function Home() {
  const [scrolled, setScrolled]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [testiIdx, setTestiIdx]       = useState(0)
  const statsRef                       = useRef(null)
  const statsAnimated                  = useRef(false)

  /* ---- Guest Booking Form ---- */
  const [bookForm, setBookForm] = useState({ guestName:'', guestPhone:'', pickupLocation:'', dropLocation:'', serviceType:'CITY_TAXI', scheduledAt:'', notes:'' })
  const [bookStatus, setBookStatus] = useState(null) // {type, msg, bookingId}
  const [bookLoading, setBookLoading] = useState(false)

  const handleBookChange = e => setBookForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleBookSubmit = async e => {
    e.preventDefault()
    setBookLoading(true); setBookStatus(null)
    try {
      const payload = { ...bookForm, scheduledAt: bookForm.scheduledAt ? bookForm.scheduledAt + ':00' : null }
      const res = await axios.post('/api/public/bookings', payload)
      setBookStatus({ type:'success', msg:`Booking confirmed! Your Booking ID is #${res.data.id}. Save your phone number to track it.`, bookingId: res.data.id })
      setBookForm({ guestName:'', guestPhone:'', pickupLocation:'', dropLocation:'', serviceType:'CITY_TAXI', scheduledAt:'', notes:'' })
    } catch {
      setBookStatus({ type:'error', msg:'Failed to submit booking. Please try again.' })
    } finally { setBookLoading(false) }
  }

  /* ---- Check Booking ---- */
  const [checkPhone, setCheckPhone] = useState('')
  const [checkResults, setCheckResults] = useState(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [checkError, setCheckError] = useState(null)

  const handleCheck = async e => {
    e.preventDefault()
    setCheckLoading(true); setCheckError(null); setCheckResults(null)
    try {
      const res = await axios.get(`/api/public/bookings/check?phone=${encodeURIComponent(checkPhone.trim())}`)
      setCheckResults(res.data)
      if (res.data.length === 0) setCheckError('No bookings found for this phone number.')
    } catch {
      setCheckError('Error fetching bookings. Please try again.')
    } finally { setCheckLoading(false) }
  }

  /* Navbar scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Scroll reveal */
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* Animated counters */
  useEffect(() => {
    const nums = document.querySelectorAll('.stat-num[data-target]')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && !statsAnimated.current) {
          statsAnimated.current = true
          nums.forEach(el => {
            const target = +el.dataset.target
            let cur = 0
            const step = Math.ceil(target / 60)
            const t = setInterval(() => {
              cur = Math.min(cur + step, target)
              el.textContent = cur
              if (cur >= target) clearInterval(t)
            }, 25)
          })
        }
      })
    }, { threshold: 0.5 })
    if (statsRef.current) io.observe(statsRef.current)
    return () => io.disconnect()
  }, [])

  /* Testimonials auto-slide */
  const testimonials = [
    { initials: 'PS', name: 'Priya Sharma',  role: 'Business Professional, Patna',     stars: 5,   text: '"Best cab service in Bihar! The driver was on time, polite, and the car was spotless. Will definitely use RahiCabs again."' },
    { initials: 'AK', name: 'Amit Kumar',    role: 'Software Engineer, Muzaffarpur',   stars: 5,   text: '"Booked a round trip from Muzaffarpur to Patna airport. Extremely smooth experience and the fare was very reasonable!"' },
    { initials: 'SR', name: 'Sunita Rai',    role: 'Teacher, Darbhanga',               stars: 4.5, text: '"I use RahiCabs for my daily office commute. Consistent, professional, and the booking is super convenient."' },
    { initials: 'RV', name: 'Rajesh Verma',  role: 'Doctor, Supaul',                  stars: 5,   text: '"Travelled with family from Supaul to Patna. The car was comfortable, AC was great, and the driver was very careful. 5 stars!"' },
    { initials: 'NJ', name: 'Neha Jha',      role: 'Entrepreneur, Bhagalpur',          stars: 5,   text: '"Quick booking, zero hidden charges, and the driver arrived 10 minutes early. That\'s the reliability I was looking for!"' },
  ]
  useEffect(() => {
    const t = setInterval(() => setTestiIdx(i => (i + 1) % testimonials.length), 4000)
    return () => clearInterval(t)
  }, [testimonials.length])

  const areas = ['Patna','Muzaffarpur','Samastipur','Sitamarhi','Darbhanga','Supaul','Saharsa','Madhepura','Purnia','Araria','Katihar','Kishanganj','Bhagalpur','Gaya','Motihari','Begusarai','Munger','Nalanda']

  return (
    <>
      {/* NAVBAR */}
      <nav className={`h-navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="h-container h-nav-inner">
          <a href="#home" className="h-logo">
            <span className="h-logo-icon"><i className="fas fa-taxi" /></span>
            <span className="h-logo-text">Rahi<span className="h-accent">Cabs</span></span>
          </a>
          <ul className={`h-nav-links${menuOpen ? ' open' : ''}`}>
            <li><a href="#home"         onClick={() => setMenuOpen(false)}>Home</a></li>
            <li><a href="#services"     onClick={() => setMenuOpen(false)}>Services</a></li>
            <li><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a></li>
            <li><a href="#why-us"       onClick={() => setMenuOpen(false)}>Why Us</a></li>
            <li><a href="#areas"        onClick={() => setMenuOpen(false)}>Areas</a></li>
            <li><a href="#contact"      onClick={() => setMenuOpen(false)}>Contact</a></li>
          </ul>
          <div className="h-nav-auth">
            <Link to="/customer/login" className="h-btn-ghost">My Bookings</Link>
            <Link to="/book" className="h-btn h-btn-primary h-nav-cta"><i className="fas fa-taxi" /> Book Now</Link>
          </div>
          <button className={`h-hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="h-hero" id="home">
        <div className="h-hero-bg">
          <div className="h-shape h-shape-1" />
          <div className="h-shape h-shape-2" />
          <div className="h-shape h-shape-3" />
        </div>
        <div className="h-container h-hero-container">
          <div className="h-hero-content">
            <div className="h-hero-badge"><i className="fas fa-star" /> Rated 4.9 / 5 by 2000+ Riders</div>
            <h1 className="h-hero-title">Your <span className="h-gradient-text">Premium Ride</span><br />Starts Here</h1>
            <p className="h-hero-subtitle">Safe, affordable, and on-time cab service across Bihar.<br />Trusted by thousands — available 24 × 7.</p>
            <div className="h-hero-actions">
              <Link to="/book" className="h-btn h-btn-primary h-btn-lg"><i className="fas fa-car" /> Book a Ride</Link>
              <Link to="/customer/login" className="h-btn h-btn-outline h-btn-lg"><i className="fas fa-search" /> My Bookings</Link>
            </div>
            <div className="h-hero-stats" ref={statsRef}>
              {[['5000','Happy Riders'],['150','Expert Drivers'],['20','Cities Covered'],['24','/ 7 Support']].map(([n,l],i) => (
                <div key={i} className="h-stat-wrap">
                  {i > 0 && <div className="h-stat-divider" />}
                  <div className="h-stat">
                    <div><span className="stat-num" data-target={i < 3 ? n : undefined}>{i === 3 ? n : '0'}</span>{i < 3 ? <span>+</span> : null}</div>
                    <span className="h-stat-label">{l}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-hero-visual">
            <div className="h-float-cards">
              <div className="h-float-card h-card-1"><i className="fas fa-shield-alt" /><span>100% Verified Drivers</span></div>
              <div className="h-float-card h-card-2"><i className="fas fa-map-marker-alt" /><span>Live Tracking</span></div>
              <div className="h-float-card h-card-3"><i className="fas fa-rupee-sign" /><span>Transparent Pricing</span></div>
            </div>
            <div className="h-hero-circle">
              <div className="h-car-wrap"><i className="fas fa-car-side" /></div>
              <div className="h-road" />
            </div>
          </div>
        </div>
        <div className="h-hero-wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc"/></svg>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="h-trust-bar">
        <div className="h-container h-trust-grid">
          {[
            ['fas fa-star','4.9+ Rated Drivers','Expert & courteous professionals'],
            ['fas fa-car','Clean & Comfortable','Premium fleet, regularly serviced'],
            ['fas fa-clock','Always On Time','Reliable & punctual every ride'],
            ['fas fa-user-check','Verified Drivers','Background-checked team'],
          ].map(([icon,title,sub],i) => (
            <div key={i} className="h-trust-item reveal">
              <i className={`${icon} h-trust-icon`} />
              <div><strong>{title}</strong><span>{sub}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="h-section h-services" id="services">
        <div className="h-container">
          <div className="h-section-header reveal">
            <span className="h-section-tag">What We Offer</span>
            <h2>Our <span className="h-gradient-text">Services</span></h2>
            <p>Comprehensive cab solutions tailored to every journey</p>
          </div>
          <div className="h-services-grid">
            {[
              ['fas fa-taxi',     'City Taxi',         'Reliable rides available anytime, anywhere. Perfect for quick commutes or planned city travels.'],
              ['fas fa-route',    'One Way Trip',       'Affordable one-way trips with no return charges. Budget-friendly for solo or quick rides.'],
              ['fas fa-clock',    'Hourly Rental',      'Book by the hour for city tours or errands. Flexible and comfortable for families or groups.'],
              ['fas fa-sync-alt', 'Round Trip',         'Round trip service for go-and-return journeys. Plan with complete peace of mind.'],
              ['fas fa-plane',    'Airport Transfer',   'Stress-free airport pickup and drop-off. Never miss a flight with our punctual service.'],
              ['fas fa-users',    'Outstation Rides',   'Comfortable intercity travel across Bihar and beyond. Safe, spacious, and affordable.'],
            ].map(([icon,title,desc],i) => (
              <div key={i} className="h-service-card reveal">
                <div className="h-service-icon"><i className={icon} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <Link to="/register" className="h-service-link">Book Now <i className="fas fa-arrow-right" /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="h-section h-how" id="how-it-works">
        <div className="h-container">
          <div className="h-section-header reveal">
            <span className="h-section-tag">Simple & Easy</span>
            <h2>How It <span className="h-gradient-text">Works</span></h2>
            <p>Get your cab in 3 quick steps — no hassle</p>
          </div>
          <div className="h-steps">
            {[
              ['fas fa-user-plus','01','Register & Book','Create your account and book a ride online in seconds. Choose your service type, pickup, and time.'],
              ['fas fa-check-circle','02','Get Confirmed','Receive instant confirmation with driver details, arrival time, and fare estimate.'],
              ['fas fa-smile-beam','03','Enjoy Your Ride','Sit back and relax. Your verified driver arrives on time for a premium experience.'],
            ].map(([icon,num,title,desc],i) => (
              <div key={i} className="h-step-wrap">
                {i > 0 && <div className="h-step-arrow"><i className="fas fa-chevron-right" /></div>}
                <div className="h-step reveal">
                  <div className="h-step-num">{num}</div>
                  <div className="h-step-icon"><i className={icon} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOOK A RIDE (guest) ===== */}
      <section className="h-section h-book-section" id="book-ride">
        <div className="h-container">
          <div className="h-section-header reveal">
            <span className="h-section-tag">No Account Needed</span>
            <h2>Book Your <span className="h-gradient-text">Ride Now</span></h2>
            <p>Fill in the details below — no registration required. We'll confirm shortly.</p>
          </div>
          <div className="h-book-card reveal">
            {bookStatus && (
              <div className={`h-book-alert h-book-alert-${bookStatus.type}`}>
                <i className={`fas fa-${bookStatus.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
                {bookStatus.msg}
              </div>
            )}
            <form className="h-book-form" onSubmit={handleBookSubmit}>
              <div className="h-book-row">
                <div className="h-fg">
                  <label><i className="fas fa-user" /> Full Name *</label>
                  <input name="guestName" value={bookForm.guestName} onChange={handleBookChange} placeholder="Your full name" required />
                </div>
                <div className="h-fg">
                  <label><i className="fas fa-phone" /> Phone Number *</label>
                  <input name="guestPhone" value={bookForm.guestPhone} onChange={handleBookChange} placeholder="10-digit mobile number" required pattern="[6-9]\d{9}" title="Valid 10-digit Indian mobile number" />
                </div>
              </div>
              <div className="h-book-row">
                <div className="h-fg">
                  <label><i className="fas fa-map-marker-alt" /> Pickup Location *</label>
                  <input name="pickupLocation" value={bookForm.pickupLocation} onChange={handleBookChange} placeholder="City / Area / Landmark" required />
                </div>
                <div className="h-fg">
                  <label><i className="fas fa-flag-checkered" /> Drop Location *</label>
                  <input name="dropLocation" value={bookForm.dropLocation} onChange={handleBookChange} placeholder="City / Area / Landmark" required />
                </div>
              </div>
              <div className="h-book-row">
                <div className="h-fg">
                  <label><i className="fas fa-taxi" /> Service Type *</label>
                  <select name="serviceType" value={bookForm.serviceType} onChange={handleBookChange} required>
                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="h-fg">
                  <label><i className="fas fa-calendar-alt" /> Scheduled Date & Time</label>
                  <input type="datetime-local" name="scheduledAt" value={bookForm.scheduledAt} onChange={handleBookChange} />
                </div>
              </div>
              <div className="h-fg">
                <label><i className="fas fa-comment" /> Notes (optional)</label>
                <textarea name="notes" value={bookForm.notes} onChange={handleBookChange} rows="2" placeholder="Any special requirements..." />
              </div>
              <button type="submit" className="h-btn h-btn-primary h-btn-full" disabled={bookLoading}>
                <i className={`fas fa-${bookLoading ? 'spinner fa-spin' : 'paper-plane'}`} />
                {bookLoading ? 'Booking...' : 'Confirm Booking'}
              </button>
              <p className="h-book-note">Already have an account? <Link to="/login">Login</Link> for a better experience. New user? <Link to="/register">Register here</Link>.</p>
            </form>
          </div>
        </div>
      </section>

      {/* ===== CHECK BOOKING ===== */}
      <section className="h-section h-check-section" id="check-booking">
        <div className="h-container">
          <div className="h-section-header reveal">
            <span className="h-section-tag">Track Status</span>
            <h2>Check Your <span className="h-gradient-text">Booking</span></h2>
            <p>Enter the phone number you used while booking to see the status.</p>
          </div>
          <div className="h-check-card reveal">
            <form className="h-check-form" onSubmit={handleCheck}>
              <div className="h-check-input-wrap">
                <i className="fas fa-phone h-check-icon" />
                <input value={checkPhone} onChange={e => setCheckPhone(e.target.value)} placeholder="Enter your phone number" required pattern="[6-9]\d{9}" title="Valid 10-digit Indian mobile number" />
                <button type="submit" className="h-btn h-btn-primary" disabled={checkLoading}>
                  <i className={`fas fa-${checkLoading ? 'spinner fa-spin' : 'search'}`} /> {checkLoading ? 'Checking...' : 'Check'}
                </button>
              </div>
            </form>
            {checkError && <div className="h-check-msg h-check-msg-warn"><i className="fas fa-info-circle" /> {checkError}</div>}
            {checkResults && checkResults.length > 0 && (
              <div className="h-check-results">
                {checkResults.map(b => (
                  <div key={b.id} className="h-booking-card">
                    <div className="h-bk-header">
                      <span className="h-bk-id">Booking #{b.id}</span>
                      <span className={`h-badge h-badge-${STATUS_COLOR[b.status] || 'info'}`}>{b.status.replace('_',' ')}</span>
                    </div>
                    <div className="h-bk-body">
                      <div className="h-bk-row"><i className="fas fa-map-marker-alt" /><span><b>Pickup:</b> {b.pickupLocation}</span></div>
                      <div className="h-bk-row"><i className="fas fa-flag-checkered" /><span><b>Drop:</b> {b.dropLocation}</span></div>
                      <div className="h-bk-row"><i className="fas fa-taxi" /><span><b>Service:</b> {SERVICE_LABELS[b.serviceType]}</span></div>
                      {b.scheduledAt && <div className="h-bk-row"><i className="fas fa-calendar" /><span><b>Scheduled:</b> {new Date(b.scheduledAt).toLocaleString()}</span></div>}
                      {b.driverName  && <div className="h-bk-row"><i className="fas fa-user-tie" /><span><b>Driver:</b> {b.driverName} — {b.driverPhone}</span></div>}
                      <div className="h-bk-row"><i className="fas fa-clock" /><span><b>Booked on:</b> {new Date(b.createdAt).toLocaleString()}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="h-section h-why" id="why-us">
        <div className="h-container h-why-container">
          <div className="h-why-visual reveal">
            <div className="h-why-badge">
              <span className="h-badge-num">4.9</span>
              <div className="h-badge-stars"><i className="fas fa-star"/><i className="fas fa-star"/><i className="fas fa-star"/><i className="fas fa-star"/><i className="fas fa-star-half-alt"/></div>
              <span className="h-badge-lbl">Customer Rating</span>
            </div>
            <div className="h-why-pill h-pill-1"><i className="fas fa-users" /> 5000+ Happy Customers</div>
            <div className="h-why-pill h-pill-2"><i className="fas fa-map-marked-alt" /> 20+ Cities Covered</div>
          </div>
          <div className="h-why-content">
            <div className="h-section-header h-left reveal">
              <span className="h-section-tag">Our Advantage</span>
              <h2>Why Choose <span className="h-gradient-text">RahiCabs</span>?</h2>
              <p>We go beyond just a ride — we deliver an experience you can trust.</p>
            </div>
            {[
              ['fas fa-user-tie','Professional Drivers','Courteous, well-trained, and background-verified professionals committed to your safety.'],
              ['fas fa-tag',     'Transparent Pricing','No hidden charges, no surge pricing. The fare you\'re quoted is the fare you pay.'],
              ['fas fa-headset', '24/7 Customer Support','Our support team is always ready to assist — day or night, weekdays or holidays.'],
              ['fas fa-shield-alt','Safe & Insured Rides','Every ride is insured and every driver is verified. Your safety is our top priority.'],
            ].map(([icon,title,desc],i) => (
              <div key={i} className="h-why-feature reveal">
                <div className="h-why-feat-icon"><i className={icon} /></div>
                <div><h4>{title}</h4><p>{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AREAS */}
      <section className="h-section h-areas" id="areas">
        <div className="h-container">
          <div className="h-section-header reveal">
            <span className="h-section-tag">Coverage</span>
            <h2>Our <span className="h-gradient-text">Service Areas</span></h2>
            <p>We cover all major cities and districts across Bihar</p>
          </div>
          <div className="h-areas-grid reveal">
            {areas.map(a => (
              <div key={a} className="h-area-pill"><i className="fas fa-map-marker-alt" /> {a}</div>
            ))}
            <div className="h-area-pill h-area-more">+ Many More</div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="h-section h-testimonials">
        <div className="h-container">
          <div className="h-section-header reveal">
            <span className="h-section-tag">What People Say</span>
            <h2>Customer <span className="h-gradient-text">Reviews</span></h2>
            <p>Real experiences from real passengers</p>
          </div>
          <div className="h-testi-wrap reveal">
            <div className="h-testi-card">
              <div className="h-testi-stars">
                {Array.from({length: 5}, (_,i) => {
                  const s = testimonials[testiIdx].stars
                  return <i key={i} className={i < Math.floor(s) ? 'fas fa-star' : (i < s ? 'fas fa-star-half-alt' : 'far fa-star')} />
                })}
              </div>
              <p>{testimonials[testiIdx].text}</p>
              <div className="h-testi-author">
                <div className="h-testi-avatar">{testimonials[testiIdx].initials}</div>
                <div><strong>{testimonials[testiIdx].name}</strong><span>{testimonials[testiIdx].role}</span></div>
              </div>
            </div>
            <div className="h-testi-controls">
              <button className="h-testi-btn" onClick={() => setTestiIdx(i => (i - 1 + testimonials.length) % testimonials.length)}><i className="fas fa-chevron-left" /></button>
              <div className="h-testi-dots">
                {testimonials.map((_,i) => <button key={i} className={`h-dot${i === testiIdx ? ' active' : ''}`} onClick={() => setTestiIdx(i)} />)}
              </div>
              <button className="h-testi-btn" onClick={() => setTestiIdx(i => (i + 1) % testimonials.length)}><i className="fas fa-chevron-right" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="h-cta-banner">
        <div className="h-cta-shape" />
        <div className="h-container h-cta-content reveal">
          <div>
            <h2>Ready for a <span className="h-gradient-text-light">Premium Ride</span>?</h2>
            <p>Book your cab now and experience the RahiCabs difference. Available 24/7, across Bihar.</p>
          </div>
          <div className="h-cta-actions">
            <Link to="/register" className="h-btn h-btn-white h-btn-lg"><i className="fas fa-user-plus" /> Get Started</Link>
            <Link to="/login" className="h-btn h-btn-outline-white h-btn-lg"><i className="fas fa-sign-in-alt" /> Login</Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="h-section h-contact" id="contact">
        <div className="h-container h-contact-container">
          <div className="h-contact-info reveal">
            <div className="h-section-header h-left">
              <span className="h-section-tag">Reach Out</span>
              <h2>Get In <span className="h-gradient-text">Touch</span></h2>
              <p>We're always here to help. Reach out via any channel below.</p>
            </div>
            {[
              ['fas fa-phone-alt','Call Us','+91 99999 99999',<a href="tel:+919999999999">+91 99999 99999</a>],
              ['fab fa-whatsapp','WhatsApp','Available 24/7',<a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>],
              ['fas fa-envelope','Email Us','Replies within 2 hrs',<a href="mailto:info@rahicabs.com">info@rahicabs.com</a>],
              ['fas fa-map-marker-alt','Our Base','Bihar, India',<span>Serving Bihar & beyond</span>],
            ].map(([icon,,sub,link],i) => (
              <div key={i} className="h-contact-item">
                <div className="h-contact-icon"><i className={icon} /></div>
                <div>{link}<span>{sub}</span></div>
              </div>
            ))}
          </div>
          <div className="h-contact-form-wrap reveal">
            <h3>Send a Message</h3>
            <form className="h-contact-form" onSubmit={e => e.preventDefault()}>
              <div className="h-cf-row">
                <input type="text"  placeholder="Your Name"  required />
                <input type="tel"   placeholder="Your Phone" required />
              </div>
              <input type="email" placeholder="Email Address" required />
              <textarea rows="4"  placeholder="Your Message" required />
              <button type="submit" className="h-btn h-btn-primary h-btn-full"><i className="fas fa-paper-plane" /> Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="h-footer">
        <div className="h-container h-footer-inner">
          <div className="h-footer-brand">
            <span className="h-logo-icon"><i className="fas fa-taxi" /></span>
            <span className="h-logo-text">Rahi<span className="h-accent">Cabs</span></span>
          </div>
          <p>© {new Date().getFullYear()} RahiCabs. All rights reserved. Safe & reliable cab service across Bihar.</p>
          <div className="h-footer-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}
