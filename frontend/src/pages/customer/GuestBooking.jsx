import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import customerApi from '../../services/customerApi';
import './GuestBooking.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map click handler component
function MapClickHandler({ onMapClick, selectingPickup }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function GuestBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Locations, 2: Details, 3: OTP, 4: Payment

  // Location states
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropLocation, setDropLocation] = useState('');
  const [dropCoords, setDropCoords] = useState(null);
  const [selectingPickup, setSelectingPickup] = useState(true);
  
  // Search states
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropSearch, setDropSearch] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Fare details
  const [fareDetails, setFareDetails] = useState(null);
  
  // Booking details
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState('CITY_TAXI');
  const [notes, setNotes] = useState('');
  
  // OTP
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);
  
  // Loading & errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default map center (Kolkata)
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Debounced search for pickup location
  useEffect(() => {
    if (pickupSearch.length < 3) {
      setPickupSuggestions([]);
      return;
    }

    const delaySearch = setTimeout(() => {
      searchLocation(pickupSearch, 'pickup');
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [pickupSearch]);

  // Debounced search for drop location
  useEffect(() => {
    if (dropSearch.length < 3) {
      setDropSuggestions([]);
      return;
    }

    const delaySearch = setTimeout(() => {
      searchLocation(dropSearch, 'drop');
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [dropSearch]);

  const searchLocation = async (query, type) => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
      );
      const data = await response.json();
      
      if (type === 'pickup') {
        setPickupSuggestions(data);
      } else {
        setDropSuggestions(data);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectSearchResult = (result, type) => {
    const coords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    
    if (type === 'pickup') {
      setPickupLocation(result.display_name);
      setPickupCoords(coords);
      setPickupSearch('');
      setPickupSuggestions([]);
      setMapCenter([coords.lat, coords.lng]);
    } else {
      setDropLocation(result.display_name);
      setDropCoords(coords);
      setDropSearch('');
      setDropSuggestions([]);
      setMapCenter([coords.lat, coords.lng]);
    }
  };

  const handleMapClick = async (latlng) => {
    try {
      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await response.json();
      const address = data.display_name;

      if (selectingPickup) {
        setPickupLocation(address);
        setPickupCoords(latlng);
      } else {
        setDropLocation(address);
        setDropCoords(latlng);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const calculateFare = async () => {
    if (!pickupCoords || !dropCoords) {
      setError('Please select both pickup and drop locations');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await customerApi.calculateFare({
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lng,
        dropLatitude: dropCoords.lat,
        dropLongitude: dropCoords.lng,
      });
      setFareDetails(response.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate fare');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await customerApi.sendOtp(phoneNumber);
      setOtpSent(true);
      setStep(3);
      startCountdown();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingData = {
        name,
        phoneNumber,
        email,
        pickupLocation,
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lng,
        dropLocation,
        dropLatitude: dropCoords.lat,
        dropLongitude: dropCoords.lng,
        serviceType,
        distance: fareDetails.distance,
        duration: fareDetails.duration,
        totalFare: fareDetails.totalFare,
        notes,
        otp,
      };

      const response = await customerApi.createBooking(bookingData);
      
      // Open Razorpay payment
      openRazorpay(response.data.paymentOrder, response.data.bookingId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = (paymentOrder, bookingId) => {
    const options = {
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: 'RahiCabs',
      description: 'Advance Payment (15%)',
      order_id: paymentOrder.orderId,
      handler: async (response) => {
        await verifyPayment(response, bookingId);
      },
      prefill: {
        name: name,
        email: email,
        contact: phoneNumber,
      },
      theme: {
        color: '#3399cc',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const verifyPayment = async (paymentResponse, bookingId) => {
    try {
      await customerApi.verifyPayment({
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
        bookingId: bookingId,
      });

      alert('Booking confirmed! You will receive a confirmation shortly.');
      navigate('/customer/my-bookings');
    } catch (err) {
      setError('Payment verification failed. Please contact support.');
    }
  };

  return (
    <div className="guest-booking">
      <div className="booking-header">
        <h1>Book Your Ride</h1>
        <div className="step-indicator">
          <span className={step >= 1 ? 'active' : ''}>1. Location</span>
          <span className={step >= 2 ? 'active' : ''}>2. Details</span>
          <span className={step >= 3 ? 'active' : ''}>3. Verify</span>
          <span className={step >= 4 ? 'active' : ''}>4. Payment</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {step === 1 && (
        <div className="location-step">
          <div className="location-selector">
            <div className="location-inputs">
              <div className="input-group">
                <label>Pickup Location</label>
                <div className="search-wrapper">
                  <input
                    type="text"
                    value={pickupSearch || pickupLocation}
                    onChange={(e) => setPickupSearch(e.target.value)}
                    onFocus={() => setPickupSearch(pickupLocation)}
                    placeholder="Search for pickup location..."
                    className="search-input"
                  />
                  {searchLoading && pickupSearch && (
                    <i className="fas fa-spinner fa-spin search-icon"></i>
                  )}
                  {pickupSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {pickupSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => selectSearchResult(suggestion, 'pickup')}
                        >
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{suggestion.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <small className="input-hint">Or click on the map below to select</small>
              </div>

              <div className="input-group">
                <label>Drop Location</label>
                <div className="search-wrapper">
                  <input
                    type="text"
                    value={dropSearch || dropLocation}
                    onChange={(e) => setDropSearch(e.target.value)}
                    onFocus={() => setDropSearch(dropLocation)}
                    placeholder="Search for drop location..."
                    className="search-input"
                  />
                  {searchLoading && dropSearch && (
                    <i className="fas fa-spinner fa-spin search-icon"></i>
                  )}
                  {dropSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {dropSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => selectSearchResult(suggestion, 'drop')}
                        >
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{suggestion.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <small className="input-hint">Or click on the map below to select</small>
              </div>
            </div>

            <div className="map-container">
              <div className="map-instructions">
                <p><i className="fas fa-info-circle"></i> You can also click directly on the map to select locations</p>
              </div>
              <MapContainer center={mapCenter} zoom={13} style={{ height: '400px', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} selectingPickup={selectingPickup} />
                {pickupCoords && (
                  <Marker position={[pickupCoords.lat, pickupCoords.lng]}>
                    <Popup>Pickup Location</Popup>
                  </Marker>
                )}
                {dropCoords && (
                  <Marker position={[dropCoords.lat, dropCoords.lng]}>
                    <Popup>Drop Location</Popup>
                  </Marker>
                )}
              </MapContainer>
              <div className="map-toggle">
                <button
                  className={`toggle-btn ${selectingPickup ? 'active' : ''}`}
                  onClick={() => setSelectingPickup(true)}
                >
                  <i className="fas fa-map-marker-alt"></i> Select Pickup on Map
                </button>
                <button
                  className={`toggle-btn ${!selectingPickup ? 'active' : ''}`}
                  onClick={() => setSelectingPickup(false)}
                >
                  <i className="fas fa-flag-checkered"></i> Select Drop on Map
                </button>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={calculateFare}
              disabled={!pickupCoords || !dropCoords || loading}
            >
              {loading ? 'Calculating...' : 'Calculate Fare'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && fareDetails && (
        <div className="details-step">
          <div className="fare-summary">
            <h3>Fare Details</h3>
            <p><strong>Distance:</strong> {fareDetails.distance} km</p>
            <p><strong>Duration:</strong> {fareDetails.duration} minutes</p>
            <p><strong>Total Fare:</strong> ₹{fareDetails.totalFare}</p>
            <p><strong>Advance (15%):</strong> ₹{fareDetails.advanceAmount}</p>
            <p><strong>Remaining:</strong> ₹{fareDetails.remainingAmount}</p>
          </div>

          <div className="booking-form">
            <h3>Enter Your Details</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number (10 digits)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={10}
              required
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              <option value="CITY_TAXI">City Taxi</option>
              <option value="ONE_WAY">One Way</option>
              <option value="ROUND_TRIP">Round Trip</option>
              <option value="AIRPORT_TRANSFER">Airport Transfer</option>
              <option value="HOURLY_RENTAL">Hourly Rental</option>
              <option value="OUTSTATION">Outstation</option>
            </select>
            <textarea
              placeholder="Additional notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button className="btn-primary" onClick={sendOtp} disabled={loading || !name || !phoneNumber}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="otp-step">
          <h3>Verify Your Phone Number</h3>
          <p>Enter the 6-digit OTP sent to {phoneNumber}</p>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
          />
          <button className="btn-primary" onClick={handleBooking} disabled={loading || otp.length !== 6}>
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
          <button className="btn-secondary" onClick={sendOtp} disabled={loading || countdown > 0}>
            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
      )}
    </div>
  );
}
