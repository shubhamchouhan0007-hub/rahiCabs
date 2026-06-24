import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import customerApi from '../../services/customerApi';
import './CustomerDashboard.css';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useCustomer();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await customerApi.getBookings(token);
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading bookings...</div>;

  if (bookings.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Bookings Yet</h2>
        <p>You haven't made any bookings yet.</p>
        <button onClick={() => window.location.href = '/book'} className="btn-primary">
          Book Your First Ride
        </button>
      </div>
    );
  }

  return (
    <div className="bookings-list">
      <h2>My Bookings</h2>
      {bookings.map((booking) => (
        <div key={booking.id} className="booking-card">
          <div className="booking-header">
            <span className="booking-id">Booking #{booking.id}</span>
            <span className={`status ${booking.status.toLowerCase()}`}>
              {booking.status}
            </span>
          </div>
          <div className="booking-details">
            <div className="detail-row">
              <i className="fas fa-map-marker-alt"></i>
              <div>
                <strong>Pickup:</strong> {booking.pickupLocation}
              </div>
            </div>
            <div className="detail-row">
              <i className="fas fa-flag-checkered"></i>
              <div>
                <strong>Drop:</strong> {booking.dropLocation}
              </div>
            </div>
            <div className="detail-row">
              <i className="fas fa-calendar"></i>
              <div>
                <strong>Date:</strong> {new Date(booking.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="detail-row">
              <i className="fas fa-rupee-sign"></i>
              <div>
                <strong>Fare:</strong> ₹{booking.fare}
              </div>
            </div>
            {booking.distance && (
              <div className="detail-row">
                <i className="fas fa-route"></i>
                <div>
                  <strong>Distance:</strong> {booking.distance} km | {booking.duration} mins
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Profile() {
  const { customer, token, refreshProfile } = useCustomer();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(customer?.fullName || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await customerApi.updateProfile(token, { fullName, email });
      await refreshProfile();
      setMessage('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-section">
      <h2>My Profile</h2>
      {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}
      
      <div className="profile-card">
        {!editing ? (
          <>
            <div className="profile-info">
              <div className="info-row">
                <label>Customer Code:</label>
                <span>{customer?.customerCode}</span>
              </div>
              <div className="info-row">
                <label>Full Name:</label>
                <span>{customer?.fullName}</span>
              </div>
              <div className="info-row">
                <label>Phone Number:</label>
                <span>{customer?.phoneNumber}</span>
              </div>
              <div className="info-row">
                <label>Email:</label>
                <span>{customer?.email || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <label>Member Since:</label>
                <span>{new Date(customer?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <label>Total Bookings:</label>
                <span>{customer?.totalBookings || 0}</span>
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit Profile
            </button>
          </>
        ) : (
          <form onSubmit={handleUpdate}>
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="button-group">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, logout } = useCustomer();
  const [showWelcome, setShowWelcome] = useState(location.state?.welcome || false);

  useEffect(() => {
    if (showWelcome) {
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [showWelcome]);

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  return (
    <div className="customer-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>RahiCabs</h2>
          <p>Welcome, {customer?.fullName}!</p>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => navigate('/customer/dashboard')} className="nav-item">
            <i className="fas fa-home"></i> Dashboard
          </button>
          <button onClick={() => navigate('/customer/dashboard/bookings')} className="nav-item">
            <i className="fas fa-list"></i> My Bookings
          </button>
          <button onClick={() => navigate('/customer/dashboard/profile')} className="nav-item">
            <i className="fas fa-user"></i> Profile
          </button>
          <button onClick={() => navigate('/book')} className="nav-item highlight">
            <i className="fas fa-plus"></i> New Booking
          </button>
        </nav>
        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      <div className="dashboard-content">
        {showWelcome && (
          <div className="welcome-banner">
            <h2>Welcome to RahiCabs! 🎉</h2>
            <p>Your account has been created successfully.</p>
          </div>
        )}

        <Routes>
          <Route path="/" element={<MyBookings />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}
