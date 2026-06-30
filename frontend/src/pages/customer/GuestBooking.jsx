import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import customerApi from '../../services/customerApi';
import TopBar from '../../components/TopBar';
import { loadGoogleMaps } from '../../utils/loadGoogleMaps';
import { auth } from '../../utils/firebase';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import './GuestBooking.css';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

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
  const [pickupVal, setPickupVal]       = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropVal, setDropVal]           = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [dropCoords, setDropCoords]     = useState(null);
  const [selectingPickup, setSelectingPickup] = useState(true);
  const selectingPickupRef = useRef(true);
  useEffect(() => { selectingPickupRef.current = selectingPickup; }, [selectingPickup]);

  const [pickupSugs, setPickupSugs]     = useState([]);
  const [dropSugs, setDropSugs]         = useState([]);
  const [nearbyAirports, setNearbyAirports] = useState([]);
  const [sugLoading, setSugLoading]     = useState(false);
  const skipPickupSearch = useRef(false);
  const skipDropSearch   = useRef(false);
  const pickupTimer      = useRef(null);
  const dropTimer        = useRef(null);

  // Google API refs
  const acServiceRef     = useRef(null);
  const geocoderRef      = useRef(null);
  const placesServiceRef = useRef(null);
  const mapDivRef        = useRef(null);
  const gMapRef          = useRef(null);
  const pickupMarkerRef  = useRef(null);
  const dropMarkerRef    = useRef(null);
  const [gMapVersion, setGMapVersion] = useState(0); // increments to trigger marker effects

  const [locating, setLocating]       = useState(false);
  const [locateError, setLocateError] = useState('');

  /* ── Step 2: Service + Details ─────────── */
  const paramService = searchParams.get('service');
  const [serviceType, setServiceType] = useState(
    paramService && SERVICES.find(s => s.type === paramService) ? paramService : ''
  );
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [returnDate, setReturnDate]   = useState('');
  const [vehicleType, setVehicleType] = useState('SEDAN');  // for OUTSTATION pricing

  /* ── Step 3: Phone + OTP ───────────────── */
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const otpRefs                        = useRef([]);
  const [otpSent, setOtpSent]         = useState(false);
  const recaptchaRef                   = useRef(null);  // Firebase invisible reCAPTCHA
  const confirmationRef                = useRef(null);  // Firebase confirmationResult
  const timerRef                       = useRef(null);
  const [countdown, setCountdown]     = useState(0);

  /* ── Step 4: Fare + Pay ────────────────── */
  const [fareDetails, setFareDetails]   = useState(null);
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

  /* ── Ensure Google API loaded ────────────── */
  const ensureApi = useCallback(async () => {
    await loadGoogleMaps(MAPS_KEY);
    if (!acServiceRef.current) acServiceRef.current = new window.google.maps.places.AutocompleteService();
    if (!geocoderRef.current)  geocoderRef.current  = new window.google.maps.Geocoder();
    if (!placesServiceRef.current) placesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
  }, []);

  /* ── Nearest airports (Airport Transfer) ─── */
  const findNearestAirports = useCallback(async (coords) => {
    try {
      await ensureApi();
      placesServiceRef.current.nearbySearch(
        {
          location: new window.google.maps.LatLng(coords.lat, coords.lng),
          rankBy: window.google.maps.places.RankBy.DISTANCE,
          type: 'airport',
        },
        (results, status) => {
          setNearbyAirports(
            status === window.google.maps.places.PlacesServiceStatus.OK && results
              ? results.slice(0, 3) : []
          );
        }
      );
    } catch { setNearbyAirports([]); }
  }, [ensureApi]);

  const selectAirport = (airport) => {
    const loc = airport.geometry.location;
    const coords = { lat: loc.lat(), lng: loc.lng() };
    skipDropSearch.current = true;
    setDropVal(airport.name); setDropLocation(airport.name); setDropCoords(coords);
    setDropSugs([]); setNearbyAirports([]);
    if (gMapRef.current) gMapRef.current.panTo(coords);
  };

  useEffect(() => {
    if (serviceType === 'AIRPORT_TRANSFER' && pickupCoords) findNearestAirports(pickupCoords);
    else setNearbyAirports([]);
  }, [serviceType, pickupCoords, findNearestAirports]);

  /* ── Init Google Map when step 1 renders ─── */
  useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;

    loadGoogleMaps(MAPS_KEY).then(() => {
      if (cancelled || !mapDivRef.current || gMapRef.current) return;
      acServiceRef.current = acServiceRef.current || new window.google.maps.places.AutocompleteService();
      geocoderRef.current  = geocoderRef.current  || new window.google.maps.Geocoder();

      const map = new window.google.maps.Map(mapDivRef.current, {
        center: { lat: 25.5941, lng: 85.1376 },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
      });
      gMapRef.current = map;
      setGMapVersion(v => v + 1);

      map.addListener('click', e => {
        const lat = e.latLng.lat(), lng = e.latLng.lng();
        reverseGeocode(lat, lng, selectingPickupRef.current);
      });
    });

    return () => {
      cancelled = true;
      gMapRef.current = null;
      if (pickupMarkerRef.current) { pickupMarkerRef.current.setMap(null); pickupMarkerRef.current = null; }
      if (dropMarkerRef.current)   { dropMarkerRef.current.setMap(null);   dropMarkerRef.current   = null; }
      setGMapVersion(0);
    };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Update pickup marker on coord change ─── */
  useEffect(() => {
    if (!gMapRef.current || !window.google?.maps) return;
    if (pickupMarkerRef.current) { pickupMarkerRef.current.setMap(null); pickupMarkerRef.current = null; }
    if (pickupCoords) {
      pickupMarkerRef.current = new window.google.maps.Marker({
        map: gMapRef.current,
        position: pickupCoords,
        label: { text: 'P', color: '#fff', fontWeight: 'bold', fontSize: '12px' },
        title: 'Pickup',
      });
      gMapRef.current.panTo(pickupCoords);
    }
  }, [pickupCoords, gMapVersion]);

  /* ── Update drop marker on coord change ───── */
  useEffect(() => {
    if (!gMapRef.current || !window.google?.maps) return;
    if (dropMarkerRef.current) { dropMarkerRef.current.setMap(null); dropMarkerRef.current = null; }
    if (dropCoords) {
      dropMarkerRef.current = new window.google.maps.Marker({
        map: gMapRef.current,
        position: dropCoords,
        label: { text: 'D', color: '#fff', fontWeight: 'bold', fontSize: '12px' },
        title: 'Drop',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      gMapRef.current.panTo(dropCoords);
    }
  }, [dropCoords, gMapVersion]);

  /* ── Reverse geocode (map click / my location) ── */
  const reverseGeocode = useCallback(async (lat, lng, isPickup) => {
    try {
      await ensureApi();
      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        const label = (status === 'OK' && results[0])
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (isPickup) {
          skipPickupSearch.current = true;
          setPickupVal(label); setPickupLocation(label); setPickupCoords({ lat, lng });
        } else {
          skipDropSearch.current = true;
          setDropVal(label); setDropLocation(label); setDropCoords({ lat, lng });
        }
      });
    } catch {}
  }, [ensureApi]);

  /* ── Use current GPS location ───────────── */
  const useMyLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          await reverseGeocode(lat, lng, true);
          setSelectingPickup(false);
          if (gMapRef.current) gMapRef.current.panTo({ lat, lng });
        } catch { setError('Could not get address. Search manually.'); }
        finally   { setLocating(false); }
      },
      () => { setLocateError('Location denied — allow in browser settings or search manually.'); setLocating(false); }
    );
  };

  /* ── Place search (Google Places Autocomplete) ─ */
  const searchPlace = useCallback(async (query, type) => {
    if (!query || query.length < 3) {
      type === 'pickup' ? setPickupSugs([]) : setDropSugs([]);
      return;
    }
    setSugLoading(true);
    try {
      await ensureApi();
      acServiceRef.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
          location: new window.google.maps.LatLng(25.5941, 85.1376),
          radius: 400000, // bias toward Bihar (400km radius from Patna)
        },
        (preds, status) => {
          const results = (status === 'OK' && preds) ? preds : [];
          type === 'pickup' ? setPickupSugs(results) : setDropSugs(results);
          setSugLoading(false);
        }
      );
    } catch { setSugLoading(false); }
  }, [ensureApi]);

  /* ── Debounce search on input ────────────── */
  useEffect(() => {
    if (skipPickupSearch.current) { skipPickupSearch.current = false; return; }
    if (pickupVal.length < 3) { setPickupSugs([]); return; }
    clearTimeout(pickupTimer.current);
    pickupTimer.current = setTimeout(() => searchPlace(pickupVal, 'pickup'), 400);
    return () => clearTimeout(pickupTimer.current);
  }, [pickupVal, searchPlace]);

  useEffect(() => {
    if (skipDropSearch.current) { skipDropSearch.current = false; return; }
    if (dropVal.length < 3) { setDropSugs([]); return; }
    clearTimeout(dropTimer.current);
    dropTimer.current = setTimeout(() => searchPlace(dropVal, 'drop'), 400);
    return () => clearTimeout(dropTimer.current);
  }, [dropVal, searchPlace]);

  /* ── Select a suggestion ─────────────────── */
  const selectPlace = async (prediction, type) => {
    const label = prediction.description;
    try {
      await ensureApi();
      geocoderRef.current.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status !== 'OK' || !results[0]) return;
        const loc    = results[0].geometry.location;
        const coords = { lat: loc.lat(), lng: loc.lng() };
        if (type === 'pickup') {
          skipPickupSearch.current = true;
          setPickupVal(label); setPickupLocation(label); setPickupCoords(coords);
          setPickupSugs([]);
        } else {
          skipDropSearch.current = true;
          setDropVal(label); setDropLocation(label); setDropCoords(coords);
          setDropSugs([]);
        }
        if (gMapRef.current) gMapRef.current.panTo(coords);
      });
    } catch {}
  };

  /* ── Step navigation ─────────────────────── */
  const goToService = () => {
    if (!pickupCoords || !dropCoords) { setError('Please set both pickup and drop locations'); return; }
    setStep(2);
  };

  const goToVerify = async () => {
    if (!serviceType)  { setError('Please select a service type'); return; }
    if (!name.trim())  { setError('Please enter your full name'); return; }
    if (!journeyDate)  { setError('Please select your journey date'); return; }
    if (serviceType === 'ROUND_TRIP' && !returnDate) { setError('Please select a return date for Round Trip'); return; }
    setLoading(true); setError('');
    try {
      const res = await customerApi.calculateFare({
        pickupLatitude:  pickupCoords.lat, pickupLongitude: pickupCoords.lng,
        dropLatitude:    dropCoords.lat,   dropLongitude:   dropCoords.lng,
        serviceType,
        vehicleType: serviceType === 'OUTSTATION' ? vehicleType : null,
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
      // Set up the invisible reCAPTCHA once (required by Firebase phone auth on web)
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      // Firebase sends the real SMS OTP to +91<number>
      confirmationRef.current = await signInWithPhoneNumber(auth, '+91' + phoneNumber, recaptchaRef.current);
      setOtp(['', '', '', '', '', '']);
      setOtpSent(true); startCountdown();
    } catch (err) {
      // Reset reCAPTCHA so the user can retry cleanly
      try { recaptchaRef.current?.clear(); } catch {}
      recaptchaRef.current = null;
      const code = err?.code || '';
      if (code === 'auth/too-many-requests') setError('Too many attempts. Please try again later.');
      else if (code === 'auth/invalid-phone-number') setError('Invalid phone number.');
      else setError('Failed to send OTP. Please try again.');
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

  /* ── Create booking ──────────────────────── */
  const verifyAndBook = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    if (!confirmationRef.current) { setError('Please request an OTP first.'); return; }
    setLoading(true); setError('');
    try {
      // Verify the OTP with Firebase → get a signed ID token proving phone ownership
      const result = await confirmationRef.current.confirm(otpStr);
      const firebaseIdToken = await result.user.getIdToken();

      const res = await customerApi.createBooking({
        name, phoneNumber, email,
        pickupLocation, pickupLatitude: pickupCoords.lat, pickupLongitude: pickupCoords.lng,
        dropLocation,   dropLatitude:   dropCoords.lat,   dropLongitude:   dropCoords.lng,
        serviceType,
        scheduledAt: journeyDate ? journeyDate + ':00' : null,
        distance: fareDetails.distance, duration: fareDetails.duration, totalFare: fareDetails.totalFare,
        notes: [
          returnDate ? `Return date: ${returnDate}` : '',
          serviceType === 'OUTSTATION' ? `Vehicle: ${vehicleType}` : '',
        ].filter(Boolean).join(' | '),
        firebaseIdToken,
      });
      setPaymentOrder(res.data.paymentOrder);
      setBookingId(res.data.bookingId);
      setStep(4);
    } catch (err) {
      if (err?.code === 'auth/invalid-verification-code') setError('Incorrect OTP. Please check and try again.');
      else if (err?.code === 'auth/code-expired') setError('OTP expired. Please request a new one.');
      else setError(err.response?.data?.message || 'Booking failed. Try again.');
    } finally { setLoading(false); }
  };

  /* ── Razorpay payment ────────────────────── */
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
                      if (!v) { setPickupLocation(''); setPickupCoords(null); setPickupSugs([]); }
                    }}
                    onFocus={() => setSelectingPickup(true)}
                    placeholder="Pickup — street, village, landmark, mohalla"
                  />
                  {pickupVal.length >= 3 && sugLoading && <span className="gb-input-spinner"><i className="fas fa-spinner fa-spin" /></span>}
                  {pickupSugs.length > 0 && (
                    <div className="gb-suggestions">
                      {pickupSugs.map((s, i) => (
                        <div key={i} className="gb-suggestion" onMouseDown={() => selectPlace(s, 'pickup')}>
                          <i className="fas fa-map-marker-alt" />
                          <span>{s.description}</span>
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
                      if (!v) { setDropLocation(''); setDropCoords(null); setDropSugs([]); }
                    }}
                    onFocus={() => setSelectingPickup(false)}
                    placeholder="Drop — street, village, landmark, mohalla"
                  />
                  {dropVal.length >= 3 && sugLoading && <span className="gb-input-spinner"><i className="fas fa-spinner fa-spin" /></span>}
                  {dropSugs.length > 0 && (
                    <div className="gb-suggestions">
                      {dropSugs.map((s, i) => (
                        <div key={i} className="gb-suggestion" onMouseDown={() => selectPlace(s, 'drop')}>
                          <i className="fas fa-map-marker-alt" />
                          <span>{s.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {serviceType === 'AIRPORT_TRANSFER' && nearbyAirports.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#0f766e', marginBottom: 7 }}>
                    <i className="fas fa-plane-departure" /> Nearest airports to your pickup
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {nearbyAirports.map((a, i) => (
                      <button type="button" key={i} onClick={() => selectAirport(a)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
                          border: '1.5px solid #99f6e4', background: '#f0fdfa', borderRadius: 100,
                          fontSize: '.82rem', fontWeight: 600, color: '#134e4a', cursor: 'pointer',
                        }}>
                        <i className="fas fa-plane" style={{ fontSize: '.72rem' }} />
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Google Map */}
            <div className="gb-map-container">
              <div className="gb-map-toggle">
                <button className={`gb-toggle-btn${selectingPickup ? ' active' : ''}`} onClick={() => setSelectingPickup(true)}>
                  <i className="fas fa-circle" /> Pin Pickup
                </button>
                <button className={`gb-toggle-btn${!selectingPickup ? ' active drop' : ''}`} onClick={() => setSelectingPickup(false)}>
                  <i className="fas fa-map-marker-alt" /> Pin Drop
                </button>
              </div>
              <div ref={mapDivRef} style={{ height: '240px', width: '100%', borderRadius: '8px' }} />
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
                {serviceType === 'OUTSTATION' && (
                  <div className="gb-field">
                    <label>Vehicle Type *</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { v: 'SEDAN', label: 'Sedan', icon: 'fas fa-car',         rate: '₹1500/day + ₹11/km' },
                        { v: 'SUV',   label: 'SUV',   icon: 'fas fa-shuttle-van',  rate: '₹2000/day + ₹14/km' },
                      ].map(o => (
                        <button type="button" key={o.v} onClick={() => setVehicleType(o.v)}
                          style={{
                            flex: 1, padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                            border: vehicleType === o.v ? '2px solid #134e4a' : '1.5px solid #e2e8f0',
                            background: vehicleType === o.v ? '#f0fdfa' : '#fff',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            fontWeight: 600, color: '#1e293b',
                          }}>
                          <i className={o.icon} style={{ fontSize: '1.3rem', color: '#134e4a' }} />
                          {o.label}
                          <span style={{ fontSize: '.72rem', color: '#64748b', fontWeight: 500 }}>{o.rate}</span>
                        </button>
                      ))}
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
            {/* Firebase invisible reCAPTCHA mounts here */}
            <div id="recaptcha-container" />
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
