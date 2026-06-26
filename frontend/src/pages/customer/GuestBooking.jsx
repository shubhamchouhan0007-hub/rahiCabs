import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import customerApi from '../../services/customerApi';
import TopBar from '../../components/TopBar';
import './GuestBooking.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 1 });
  }, [center, map]);
  return null;
}

const SERVICES = [
  { type: 'CITY_TAXI',        icon: 'fas fa-taxi',            label: 'City Taxi',        desc: 'Quick rides in the city',           color: '#f97316' },
  { type: 'ONE_WAY',          icon: 'fas fa-route',           label: 'One Way Trip',     desc: 'No return charges',                 color: '#3b82f6' },
  { type: 'HOURLY_RENTAL',    icon: 'fas fa-clock',           label: 'Hourly Rental',    desc: 'Book by the hour',                  color: '#8b5cf6' },
  { type: 'ROUND_TRIP',       icon: 'fas fa-sync-alt',        label: 'Round Trip',       desc: 'Go & return journey',               color: '#22c55e' },
  { type: 'AIRPORT_TRANSFER', icon: 'fas fa-plane-departure', label: 'Airport Transfer', desc: 'Punctual airport rides',            color: '#06b6d4' },
  { type: 'OUTSTATION',       icon: 'fas fa-map-marked-alt',  label: 'Outstation',       desc: 'Intercity travel across Bihar',     color: '#ec4899' },
];

const STEPS = ['Location', 'Service', 'Verify', 'Payment'];

export default function GuestBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);

  /* ── Step 1: Locations ─────────────────── */
  const [pickupVal, setPickupVal] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropVal, setDropVal] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [dropCoords, setDropCoords] = useState(null);
  const [selectingPickup, setSelectingPickup] = useState(true);
  const selectingPickupRef = useRef(true);
  useEffect(() => { selectingPickupRef.current = selectingPickup; }, [selectingPickup]);
  const skipPickupSearch = useRef(false);
  const skipDropSearch   = useRef(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions]     = useState([]);
  const [searchLoading, setSearchLoading]         = useState(false);
  const [mapCenter, setMapCenter]                 = useState([25.5941, 85.1376]);
  const [locating, setLocating]                   = useState(false);
  const [locateError, setLocateError]             = useState('');

  /* ── Step 2: Service + Details ─────────── */
  const paramService = searchParams.get('service');
  const [serviceType, setServiceType] = useState(
    paramService && SERVICES.find(s => s.type === paramService) ? paramService : ''
  );
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [returnDate, setReturnDate]   = useState('');

  /* ── Step 3: Phone + OTP ───────────────── */
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const otpRefs                        = useRef([]);
  const [otpSent, setOtpSent]         = useState(false);
  const timerRef                       = useRef(null);
  const [countdown, setCountdown]     = useState(0);

  /* ── Step 4: Fare + Pay ────────────────── */
  const [fareDetails, setFareDetails] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [bookingId, setBookingId]       = useState(null);

  /* ── General ───────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!locateError) return;
    const t = setTimeout(() => setLocateError(''), 5000);
    return () => clearTimeout(t);
  }, [locateError]);

  /* ── Geolocation ────────────────────────── */
  useEffect(() => {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        pos => setMapCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const label = data.display_name.split(',').slice(0, 3).join(', ');
          skipPickupSearch.current = true;
          setPickupVal(label); setPickupLocation(label);
          setPickupCoords({ lat, lng });
          setMapCenter([lat, lng]);
          setSelectingPickup(false);
        } catch { setError('Could not get address. Search manually.'); }
        finally   { setLocating(false); }
      },
      () => { setLocateError('Location denied — allow in browser settings or search manually.'); setLocating(false); }
    );
  };

  /* ── Search debounce ────────────────────── */
  useEffect(() => {
    if (skipPickupSearch.current) { skipPickupSearch.current = false; return; }
    if (pickupVal.length < 3) { setPickupSuggestions([]); return; }
    const t = setTimeout(() => searchPlace(pickupVal, 'pickup'), 400);
    return () => clearTimeout(t);
  }, [pickupVal]);

  useEffect(() => {
    if (skipDropSearch.current) { skipDropSearch.current = false; return; }
    if (dropVal.length < 3) { setDropSuggestions([]); return; }
    const t = setTimeout(() => searchPlace(dropVal, 'drop'), 400);
    return () => clearTimeout(t);
  }, [dropVal]);

  const searchPlace = async (query, type) => {
    setSearchLoading(true);
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
      const data = await res.json();
      type === 'pickup' ? setPickupSuggestions(data) : setDropSuggestions(data);
    } catch {} finally { setSearchLoading(false); }
  };

  const selectPlace = (result, type) => {
    const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    const label  = result.display_name.split(',').slice(0, 3).join(', ');
    if (type === 'pickup') {
      skipPickupSearch.current = true;
      setPickupVal(label); setPickupLocation(label); setPickupCoords(coords);
      setPickupSuggestions([]); setMapCenter([coords.lat, coords.lng]);
    } else {
      skipDropSearch.current = true;
      setDropVal(label); setDropLocation(label); setDropCoords(coords);
      setDropSuggestions([]); setMapCenter([coords.lat, coords.lng]);
    }
  };

  const handleMapClick = async (latlng) => {
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await res.json();
      const label = data.display_name.split(',').slice(0, 3).join(', ');
      if (selectingPickupRef.current) {
        skipPickupSearch.current = true;
        setPickupVal(label); setPickupLocation(label);
        setPickupCoords({ lat: latlng.lat, lng: latlng.lng });
      } else {
        skipDropSearch.current = true;
        setDropVal(label); setDropLocation(label);
        setDropCoords({ lat: latlng.lat, lng: latlng.lng });
      }
    } catch {}
  };

  /* ── Step 1 → 2 ─────────────────────────── */
  const goToService = () => {
    if (!pickupCoords || !dropCoords) { setError('Please set both pickup and drop locations'); return; }
    setStep(2);
  };

  /* ── Step 2 → 3 (calculate fare) ──────────── */
  const goToVerify = async () => {
    if (!serviceType)  { setError('Please select a service type'); return; }
    if (!name.trim())  { setError('Please enter your full name'); return; }
    if (!journeyDate)  { setError('Please select your journey date'); return; }
    if (serviceType === 'ROUND_TRIP' && !returnDate) { setError('Please select a return date for Round Trip'); return; }
    setLoading(true); setError('');
    try {
      const res = await customerApi.calculateFare({
        pickupLatitude:  pickupCoords.lat, pickupLongitude:  pickupCoords.lng,
        dropLatitude:    dropCoords.lat,   dropLongitude:    dropCoords.lng,
      });
      setFareDetails(res.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate fare. Try again.');
    } finally { setLoading(false); }
  };

  /* ── OTP ─────────────────────────────────── */
  const startCountdown = () => {
    setCountdown(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(timerRef.current); return 0; } return prev - 1; });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) { setError('Please enter a valid 10-digit phone number'); return; }
    setLoading(true); setError('');
    try {
      await customerApi.sendOtp(phoneNumber);
      setOtpSent(true); startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  /* ── Step 3 → 4 (create booking) ──────────── */
  const verifyAndBook = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await customerApi.createBooking({
        name, phoneNumber, email,
        pickupLocation, pickupLatitude: pickupCoords.lat, pickupLongitude: pickupCoords.lng,
        dropLocation,   dropLatitude:   dropCoords.lat,   dropLongitude:   dropCoords.lng,
        serviceType,
        scheduledAt: journeyDate ? journeyDate + ':00' : null,
        distance: fareDetails.distance, duration: fareDetails.duration, totalFare: fareDetails.totalFare,
        notes: returnDate ? `Return date: ${returnDate}` : '',
        otp: otpStr,
      });
      setPaymentOrder(res.data.paymentOrder);
      setBookingId(res.data.bookingId);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Try again.');
    } finally { setLoading(false); }
  };

  /* ── Payment ─────────────────────────────── */
  const openRazorpay = () => {
    const options = {
      key: paymentOrder.keyId, amount: paymentOrder.amount, currency: paymentOrder.currency,
      name: 'RahiCab', description: 'Advance Payment (15%)', order_id: paymentOrder.orderId,
      handler: async (response) => {
        try {
          await customerApi.verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            bookingId,
          });
          navigate('/customer/my-bookings');
        } catch { setError('Payment verification failed. Contact support.'); }
      },
      prefill: { name, email, contact: phoneNumber },
      theme: { color: '#f97316' },
    };
    new window.Razorpay(options).open();
  };

  const selectedService = SERVICES.find(s => s.type === serviceType);
  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div className="gb-page">
      {/* ── Header ────────────────────────────── */}
      <header className="gb-header">
        <Link to="/" className="gb-back"><i className="fas fa-arrow-left" /></Link>
        <Link to="/" className="gb-logo">
          <span className="gb-logo-icon"><i className="fas fa-taxi" /></span>
          <span>Rahi<strong>Cab</strong></span>
        </Link>
        <div className="gb-steps">
          {STEPS.map((label, i) => (
            <div key={i} className={`gb-step${step === i + 1 ? ' active' : ''}${step > i + 1 ? ' done' : ''}`}>
              {i > 0 && <div className="gb-step-connector" />}
              <div className="gb-step-bubble">
                {step > i + 1 ? <i className="fas fa-check" /> : i + 1}
              </div>
              <span className="gb-step-label">{label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="gb-main">
        {error && (
          <div className="gb-error" role="alert">
            <i className="fas fa-exclamation-circle" /> {error}
            <button className="gb-error-close" onClick={() => setError('')}><i className="fas fa-times" /></button>
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 1 — LOCATION
        ══════════════════════════════════════ */}
        {step === 1 && (
          <div className="gb-card">
            <h2 className="gb-card-title"><i className="fas fa-map-marked-alt" /> Set Your Route</h2>

            {/* Locate button */}
            <div className="gb-locate-bar">
              <button className="gb-locate-btn" onClick={useMyLocation} disabled={locating}>
                {locating
                  ? <><i className="fas fa-spinner fa-spin" /> Locating...</>
                  : <><i className="fas fa-location-arrow" /> Use my current location</>}
              </button>
              {locateError && <p className="gb-locate-error"><i className="fas fa-lock" /> {locateError}</p>}
            </div>

            {/* Route inputs */}
            <div className="gb-route-inputs">
              <div className="gb-route-row">
                <div className="gb-route-dot pickup-dot" />
                <div className="gb-route-field">
                  <input
                    className="gb-route-input"
                    value={pickupVal}
                    onChange={e => {
                      const v = e.target.value; setPickupVal(v); setSelectingPickup(true);
                      if (!v) { setPickupLocation(''); setPickupCoords(null); setPickupSuggestions([]); }
                    }}
                    onFocus={() => setSelectingPickup(true)}
                    placeholder="Pickup location"
                  />
                  {pickupVal.length >= 3 && searchLoading && <span className="gb-input-spinner"><i className="fas fa-spinner fa-spin" /></span>}
                  {pickupSuggestions.length > 0 && (
                    <div className="gb-suggestions">
                      {pickupSuggestions.map((s, i) => (
                        <div key={i} className="gb-suggestion" onMouseDown={() => selectPlace(s, 'pickup')}>
                          <i className="fas fa-map-marker-alt" />
                          <span>{s.display_name.split(',').slice(0, 3).join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="gb-route-dashes" />

              <div className="gb-route-row">
                <div className="gb-route-dot drop-dot" />
                <div className="gb-route-field">
                  <input
                    className="gb-route-input"
                    value={dropVal}
                    onChange={e => {
                      const v = e.target.value; setDropVal(v); setSelectingPickup(false);
                      if (!v) { setDropLocation(''); setDropCoords(null); setDropSuggestions([]); }
                    }}
                    onFocus={() => setSelectingPickup(false)}
                    placeholder="Drop location"
                  />
                  {dropVal.length >= 3 && searchLoading && <span className="gb-input-spinner"><i className="fas fa-spinner fa-spin" /></span>}
                  {dropSuggestions.length > 0 && (
                    <div className="gb-suggestions">
                      {dropSuggestions.map((s, i) => (
                        <div key={i} className="gb-suggestion" onMouseDown={() => selectPlace(s, 'drop')}>
                          <i className="fas fa-map-marker-alt" />
                          <span>{s.display_name.split(',').slice(0, 3).join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="gb-map-container">
              <div className="gb-map-toggle">
                <button className={`gb-toggle-btn${selectingPickup ? ' active' : ''}`} onClick={() => setSelectingPickup(true)}>
                  <i className="fas fa-circle" /> Pin Pickup
                </button>
                <button className={`gb-toggle-btn${!selectingPickup ? ' active drop' : ''}`} onClick={() => setSelectingPickup(false)}>
                  <i className="fas fa-map-marker-alt" /> Pin Drop
                </button>
              </div>
              <MapContainer center={mapCenter} zoom={12} style={{ height: '240px', width: '100%' }} zoomControl={false} scrollWheelZoom={false}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <MapFlyTo center={mapCenter} />
                <MapClickHandler onMapClick={handleMapClick} />
                {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]}><Popup>Pickup</Popup></Marker>}
                {dropCoords   && <Marker position={[dropCoords.lat,   dropCoords.lng]}><Popup>Drop</Popup></Marker>}
              </MapContainer>
              <p className="gb-map-hint"><i className="fas fa-hand-pointer" /> Tap map to pin location</p>
            </div>

            <button className="gb-btn-primary" onClick={goToService} disabled={!pickupCoords || !dropCoords}>
              <i className="fas fa-chevron-right" /> Choose Service
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 2 — SERVICE + DETAILS
        ══════════════════════════════════════ */}
        {step === 2 && (
          <div className="gb-card">
            <h2 className="gb-card-title"><i className="fas fa-th-large" /> Choose Your Service</h2>

            {/* Service cards */}
            <div className="gb-service-grid">
              {SERVICES.map(svc => (
                <div
                  key={svc.type}
                  className={`gb-svc-card${serviceType === svc.type ? ' selected' : ''}`}
                  style={{ '--svc-color': svc.color }}
                  onClick={() => setServiceType(svc.type)}
                >
                  {serviceType === svc.type && <div className="gb-svc-check"><i className="fas fa-check" /></div>}
                  <div className="gb-svc-icon"><i className={svc.icon} /></div>
                  <div className="gb-svc-label">{svc.label}</div>
                  <div className="gb-svc-desc">{svc.desc}</div>
                </div>
              ))}
            </div>

            {/* Personal details */}
            <div className="gb-details-section">
              <h3 className="gb-section-title"><i className="fas fa-user" /> Your Details</h3>
              <div className="gb-form-grid">
                <div className="gb-field">
                  <label>Full Name *</label>
                  <div className="gb-input-icon">
                    <i className="fas fa-user" />
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                </div>
                <div className="gb-field">
                  <label>Email <span className="gb-optional">(optional)</span></label>
                  <div className="gb-input-icon">
                    <i className="fas fa-envelope" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                </div>
                <div className="gb-field">
                  <label>Journey Date & Time *</label>
                  <div className="gb-input-icon">
                    <i className="fas fa-calendar-alt" />
                    <input type="datetime-local" value={journeyDate} onChange={e => setJourneyDate(e.target.value)} min={minDate} />
                  </div>
                </div>
                {serviceType === 'ROUND_TRIP' && (
                  <div className="gb-field">
                    <label>Return Date & Time *</label>
                    <div className="gb-input-icon">
                      <i className="fas fa-calendar-check" />
                      <input type="datetime-local" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={journeyDate || minDate} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="gb-btn-row">
              <button className="gb-btn-back" onClick={() => setStep(1)}><i className="fas fa-arrow-left" /> Back</button>
              <button className="gb-btn-primary gb-btn-grow" onClick={goToVerify} disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin" /> Calculating...</> : <><i className="fas fa-shield-alt" /> Verify Phone &amp; Continue</>}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 3 — PHONE + OTP
        ══════════════════════════════════════ */}
        {step === 3 && (
          <div className="gb-otp-card">
            <div className="gb-otp-icon-wrap">
              <div className="gb-otp-icon"><i className="fas fa-mobile-alt" /></div>
            </div>
            <h2>Verify Your Number</h2>

            {!otpSent ? (
              <>
                <p className="gb-otp-desc">Enter your phone number to receive an OTP and confirm your booking</p>
                <div className="gb-phone-input">
                  <span className="gb-phone-prefix">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <button className="gb-btn-primary" onClick={sendOtp} disabled={loading || phoneNumber.length !== 10}>
                  {loading ? <><i className="fas fa-spinner fa-spin" /> Sending...</> : <><i className="fas fa-paper-plane" /> Send OTP</>}
                </button>
              </>
            ) : (
              <>
                <p className="gb-otp-desc">OTP sent to <strong>+91 {phoneNumber}</strong></p>
                <div className="gb-otp-boxes">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleOtpChange(e.target.value, i)}
                      onKeyDown={e => handleOtpKey(e, i)}
                      className={`gb-otp-box${d ? ' filled' : ''}`}
                    />
                  ))}
                </div>
                <button className="gb-btn-primary" onClick={verifyAndBook} disabled={loading || otp.join('').length !== 6}>
                  {loading ? <><i className="fas fa-spinner fa-spin" /> Verifying...</> : <><i className="fas fa-check-circle" /> Confirm Booking</>}
                </button>
                <button className="gb-btn-ghost" onClick={sendOtp} disabled={loading || countdown > 0}>
                  {countdown > 0 ? `Resend in ${countdown}s` : <><i className="fas fa-redo" /> Resend OTP</>}
                </button>
              </>
            )}

            <button className="gb-btn-ghost" style={{ marginTop: 8 }} onClick={() => setStep(2)}>
              <i className="fas fa-arrow-left" /> Back
            </button>
            <p className="gb-otp-note"><i className="fas fa-info-circle" /> Verifying creates your RahiCab account automatically</p>
          </div>
        )}

        {/* ══════════════════════════════════════
            STEP 4 — FARE SUMMARY + PAY
        ══════════════════════════════════════ */}
        {step === 4 && fareDetails && (
          <div className="gb-summary-page">
            {/* Big success header */}
            <div className="gb-summary-hero">
              <div className="gb-summary-check"><i className="fas fa-check" /></div>
              <h2>Booking Confirmed!</h2>
              <p>Complete payment to lock in your ride</p>
            </div>

            {/* Fare card */}
            <div className="gb-fare-card">
              <div className="gb-fare-top">
                <span className="gb-fare-label">Total Fare</span>
                <span className="gb-fare-big">₹{fareDetails.totalFare}</span>
                <span className="gb-fare-sub">{fareDetails.distance} km · ~{fareDetails.duration} min</span>
              </div>

              {/* Journey strip */}
              <div className="gb-journey-strip">
                <div className="gb-js-from"><span className="gb-js-dot pickup" /><span className="gb-js-text">{pickupLocation}</span></div>
                <div className="gb-js-line" />
                <div className="gb-js-to"><span className="gb-js-dot drop" /><span className="gb-js-text">{dropLocation}</span></div>
              </div>

              {/* Booking details */}
              <div className="gb-summary-details">
                <div className="gb-sd-row">
                  <span><i className="fas fa-taxi" /> Service</span>
                  <strong>{selectedService?.label}</strong>
                </div>
                <div className="gb-sd-row">
                  <span><i className="fas fa-user" /> Passenger</span>
                  <strong>{name}</strong>
                </div>
                <div className="gb-sd-row">
                  <span><i className="fas fa-calendar-alt" /> Journey</span>
                  <strong>{journeyDate ? new Date(journeyDate).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</strong>
                </div>
                {returnDate && (
                  <div className="gb-sd-row">
                    <span><i className="fas fa-calendar-check" /> Return</span>
                    <strong>{new Date(returnDate).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</strong>
                  </div>
                )}
              </div>

              {/* Payment split */}
              <div className="gb-payment-split">
                <div className="gb-split-row advance">
                  <div><i className="fas fa-bolt" /><span>Pay Now <small>(15% advance)</small></span></div>
                  <strong>₹{fareDetails.advanceAmount}</strong>
                </div>
                <div className="gb-split-row remaining">
                  <div><i className="fas fa-car" /><span>Pay on Arrival</span></div>
                  <strong>₹{fareDetails.remainingAmount}</strong>
                </div>
              </div>
            </div>

            <button className="gb-btn-pay" onClick={openRazorpay}>
              <i className="fas fa-lock" /> Pay ₹{fareDetails.advanceAmount} Now
            </button>
            <p className="gb-pay-note">Secure payment powered by Razorpay · Balance paid to driver on arrival</p>
          </div>
        )}
      </main>
    </div>
  );
}
