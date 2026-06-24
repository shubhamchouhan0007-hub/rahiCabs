import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import customerApi from '../../services/customerApi';
import './CustomerLogin.css';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useCustomer();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await customerApi.sendOtp(phoneNumber);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await customerApi.loginWithOtp(phoneNumber, otp);
      login(response.data);
      
      if (response.data.isNewUser) {
        navigate('/customer/dashboard', { state: { welcome: true } });
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome to RahiCabs</h1>
          <p>Login with your phone number</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!otpSent ? (
          <form onSubmit={sendOtp} className="login-form">
            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={10}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="login-form">
            <div className="input-group">
              <label>Enter OTP</label>
              <p className="otp-info">OTP sent to {phoneNumber}</p>
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="otp-input"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setError('');
              }}
            >
              Change Phone Number
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={sendOtp}
              disabled={loading}
            >
              Resend OTP
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>Don't have bookings yet?</p>
          <button onClick={() => navigate('/book')} className="btn-link">
            Book Your First Ride
          </button>
        </div>
      </div>
    </div>
  );
}
