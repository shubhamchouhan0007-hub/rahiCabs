import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const customerApi = {
  // OTP & Authentication
  sendOtp: (phoneNumber) => 
    axios.post(`${API_URL}/customer/send-otp`, { phoneNumber }),

  verifyOtp: (phoneNumber, otp) => 
    axios.post(`${API_URL}/customer/verify-otp`, { phoneNumber, otp }),

  loginWithOtp: (phoneNumber, otp) => 
    axios.post(`${API_URL}/customer/login`, { phoneNumber, otp }),

  // Fare Calculation
  calculateFare: (data) => 
    axios.post(`${API_URL}/customer/calculate-fare`, data),

  // Booking
  createBooking: (bookingData) => 
    axios.post(`${API_URL}/customer/book`, bookingData),

  // Payment
  verifyPayment: (paymentData) => 
    axios.post(`${API_URL}/customer/verify-payment`, paymentData),

  // Protected Routes (requires token)
  getProfile: (token) => 
    axios.get(`${API_URL}/customer/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  updateProfile: (token, data) => 
    axios.put(`${API_URL}/customer/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getBookings: (token) => 
    axios.get(`${API_URL}/customer/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getBookingDetails: (token, bookingId) => 
    axios.get(`${API_URL}/customer/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getPaymentHistory: (token) => 
    axios.get(`${API_URL}/customer/payments`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  getSavedLocations: (token) => 
    axios.get(`${API_URL}/customer/saved-locations`, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  addSavedLocation: (token, data) => 
    axios.post(`${API_URL}/customer/saved-locations`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }),

  deleteSavedLocation: (token, locationId) => 
    axios.delete(`${API_URL}/customer/saved-locations/${locationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
};

export default customerApi;
