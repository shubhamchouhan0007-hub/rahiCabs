# 🧪 RahiCabs Testing Guide

## Prerequisites
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:5173`
- Database (H2 or PostgreSQL) connected

---

## 🚀 Quick Start Testing

### 1. Start Backend
```bash
cd backend
mvn spring-boot:run
# OR if Maven not installed, use your IDE to run RahiCabsApplication.java
```

**Expected Output:**
```
Started RahiCabsApplication in X.XXX seconds
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## 📱 Test Scenarios

## Scenario 1: Guest Booking Flow (First-Time User)

### Step 1: Access Booking Page
1. Open browser: `http://localhost:5173`
2. Click "**Book Now**" button in navigation

**Expected:** Redirect to `/book` page showing map

### Step 2: Select Pickup Location
1. Look for instruction: "Click on map to select pickup location"
2. Click anywhere on the map
3. Wait 2-3 seconds for reverse geocoding

**Expected:** 
- Pickup location input field populates with address
- Marker appears on map at clicked location

### Step 3: Select Drop Location
1. Click "**Select Drop**" button to switch mode
2. Click different location on map
3. Wait 2-3 seconds

**Expected:**
- Drop location input field populates
- Second marker appears on map

### Step 4: Calculate Fare
1. Click "**Calculate Fare**" button
2. Wait for calculation

**Expected:**
- Page advances to Step 2
- Fare summary displays:
  - Distance (in km)
  - Duration (in minutes)
  - Total Fare (₹)
  - Advance Amount (15%)
  - Remaining Amount

**Example Output:**
```
Distance: 10.5 km
Duration: 16 minutes
Total Fare: ₹115.50
Advance (15%): ₹17.33
Remaining: ₹98.17
```

### Step 5: Enter Customer Details
Fill in the form:
- **Full Name:** `Test User`
- **Phone Number:** `9876543210` (10 digits)
- **Email:** `test@example.com` (optional)
- **Service Type:** Select `STANDARD`
- **Notes:** `Test booking` (optional)

Click "**Send OTP**"

**Expected:**
- Backend console shows OTP:
```
=== OTP GENERATED ===
Phone: 9876543210
OTP: 123456
Expires at: 2024-06-24T15:25:00
====================
```
- Page advances to Step 3 (OTP verification)

### Step 6: Verify OTP
1. Check backend console for OTP
2. Enter the 6-digit OTP
3. Click "**Proceed to Payment**"

**Expected:**
- OTP verified successfully
- Razorpay payment modal opens
- Shows advance amount to pay

### Step 7: Complete Payment (Test Mode)
**In Razorpay Test Modal:**
1. Card Number: `4111 1111 1111 1111`
2. CVV: `123`
3. Expiry: Any future date
4. Click "**Pay**"

**Expected:**
- Payment successful
- Alert: "Booking confirmed!"
- Redirect to customer dashboard

### Step 8: Verify Booking Created
**Backend Console Check:**
```sql
-- Check customer created
SELECT * FROM customers WHERE phone_number = '9876543210';

-- Check booking created
SELECT * FROM bookings WHERE customer_id = (SELECT id FROM customers WHERE phone_number = '9876543210');

-- Check payment recorded
SELECT * FROM payments WHERE customer_id = (SELECT id FROM customers WHERE phone_number = '9876543210');
```

**Frontend Check:**
- Dashboard shows booking in "My Bookings"
- Booking status: `CONFIRMED`
- Payment status: `SUCCESS`

---

## Scenario 2: Returning Customer Login

### Step 1: Logout (if logged in)
1. Go to customer dashboard
2. Click "**Logout**"

**Expected:** Redirect to home page

### Step 2: Access My Bookings
1. From home page, click "**My Bookings**" in navigation
2. Or go directly to: `http://localhost:5173/customer/login`

**Expected:** Customer login page displays

### Step 3: Login with OTP
1. Enter phone number: `9876543210` (from previous booking)
2. Click "**Send OTP**"

**Backend Console:**
```
=== OTP GENERATED ===
Phone: 9876543210
OTP: 654321
Expires at: 2024-06-24T15:30:00
====================
```

3. Enter OTP from console
4. Click "**Verify & Login**"

**Expected:**
- Login successful
- Redirect to `/customer/dashboard`
- Shows previous booking(s)
- No welcome message (returning user)

---

## Scenario 3: New User Login (No Bookings)

### Step 1: Login with New Number
1. Go to: `http://localhost:5173/customer/login`
2. Enter NEW phone number: `9123456789`
3. Click "**Send OTP**"

**Backend Console:**
```
=== OTP GENERATED ===
Phone: 9123456789
OTP: 789012
====================
```

4. Enter OTP
5. Click "**Verify & Login**"

**Expected:**
- New customer account created automatically
- Login successful
- Welcome banner: "Welcome to RahiCabs! 🎉"
- Empty state: "No Bookings Yet"
- Button: "Book Your First Ride"

---

## Scenario 4: Customer Profile Management

### Step 1: View Profile
1. Login to customer dashboard
2. Click "**Profile**" in sidebar

**Expected:** Display:
- Customer Code (e.g., `CUST1234567890`)
- Full Name
- Phone Number
- Email
- Member Since
- Total Bookings

### Step 2: Edit Profile
1. Click "**Edit Profile**"
2. Change Full Name to: `Updated Test User`
3. Update Email to: `updated@example.com`
4. Click "**Save Changes**"

**Expected:**
- Success message: "Profile updated successfully!"
- Profile refreshes with new values

---

## Scenario 5: Booking Details View

### Step 1: View Booking List
1. Go to customer dashboard
2. Click "**My Bookings**"

**Expected:**
- List of all bookings
- Each shows:
  - Booking ID
  - Status badge (color-coded)
  - Pickup location
  - Drop location
  - Date/time
  - Fare
  - Distance & duration

### Step 2: View Detailed Booking
1. Click on any booking card

**Expected:** Show details:
- Booking ID
- Full route information
- Service type
- Scheduled time
- Distance & duration
- Total fare
- Advance paid
- Remaining amount
- Booking status
- Driver info (if assigned)

---

## Scenario 6: Multiple Bookings

### Step 1: Create Second Booking
1. From dashboard, click "**New Booking**"
2. Or go to: `http://localhost:5173/book`
3. Follow booking flow with SAME phone number
4. Use different pickup/drop locations

**Expected:**
- OTP sent to same number
- No new account created (uses existing)
- Second booking added to history

### Step 2: Verify Multiple Bookings
1. Go to "My Bookings"
2. Should show both bookings
3. Latest booking at top

---

## 🔧 API Testing (Using cURL or Postman)

### Test 1: Send OTP
```bash
curl -X POST http://localhost:8080/api/customer/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Backend Console:** Shows OTP

---

### Test 2: Verify OTP
```bash
curl -X POST http://localhost:8080/api/customer/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

### Test 3: Login with OTP
```bash
curl -X POST http://localhost:8080/api/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customerId": 1,
  "fullName": "Test User",
  "phoneNumber": "9876543210",
  "email": "test@example.com",
  "isNewUser": false
}
```

**Save the token** for next requests!

---

### Test 4: Calculate Fare
```bash
curl -X POST http://localhost:8080/api/customer/calculate-fare \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLatitude": 22.5726,
    "pickupLongitude": 88.3639,
    "dropLatitude": 22.6568,
    "dropLongitude": 88.4285
  }'
```

**Expected Response:**
```json
{
  "distance": 10.5,
  "duration": 16,
  "totalFare": 115.5,
  "advanceAmount": 17.33,
  "remainingAmount": 98.17
}
```

---

### Test 5: Get Customer Profile (Protected)
```bash
curl -X GET http://localhost:8080/api/customer/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": 1,
  "customerCode": "CUST1234567890",
  "fullName": "Test User",
  "phoneNumber": "9876543210",
  "email": "test@example.com",
  "authType": "OTP",
  "accountStatus": "ACTIVE",
  "createdAt": "2024-06-24T10:00:00",
  "lastLogin": "2024-06-24T14:30:00",
  "totalBookings": 2
}
```

---

### Test 6: Get Bookings (Protected)
```bash
curl -X GET http://localhost:8080/api/customer/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "pickupLocation": "Kolkata Airport",
    "dropLocation": "Salt Lake",
    "serviceType": "STANDARD",
    "status": "CONFIRMED",
    "fare": 115.5,
    "distance": 10.5,
    "duration": 16,
    "createdAt": "2024-06-24T10:30:00"
  }
]
```

---

## 🐛 Common Issues & Solutions

### Issue 1: OTP Not Showing in Console
**Problem:** OTP not printed in backend console

**Solutions:**
1. Check backend is running
2. Look for "=== OTP GENERATED ===" in logs
3. If using IDE, check console tab
4. If using terminal, scroll up to find OTP
5. Check logging level is not ERROR only

---

### Issue 2: Map Not Loading
**Problem:** Map shows blank or doesn't load

**Solutions:**
1. Check internet connection (uses OpenStreetMap CDN)
2. Verify Leaflet CSS is loaded in index.html
3. Check browser console for errors
4. Clear browser cache
5. Wait 3-5 seconds for tiles to load

---

### Issue 3: CORS Error
**Problem:** API calls fail with CORS error

**Solutions:**
1. Check backend `application.properties`:
   ```properties
   app.cors.allowed-origins=http://localhost:5173
   ```
2. Restart backend after changing CORS config
3. Verify frontend is running on port 5173
4. Clear browser cache

---

### Issue 4: Payment Modal Not Opening
**Problem:** Razorpay modal doesn't open

**Solutions:**
1. Check Razorpay script in index.html:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```
2. Check browser console for errors
3. Verify Razorpay key ID is set
4. Try different browser
5. Disable ad blockers

---

### Issue 5: OTP Verification Fails
**Problem:** "Invalid OTP" error

**Solutions:**
1. Verify OTP is still valid (5 min expiry)
2. Check you're using the most recent OTP
3. Ensure phone number matches exactly
4. Check attempt count not exceeded (3 max)
5. Send new OTP if expired

---

## ✅ Success Criteria

### Backend Tests Pass If:
- ✅ OTP generated and printed to console
- ✅ OTP verification returns success
- ✅ Customer account created in database
- ✅ Booking created with customer link
- ✅ Payment recorded with SUCCESS status
- ✅ JWT token generated and valid
- ✅ Protected endpoints require token
- ✅ Fare calculation returns correct values

### Frontend Tests Pass If:
- ✅ Map loads and displays tiles
- ✅ Clicking map selects locations
- ✅ Reverse geocoding shows addresses
- ✅ Fare calculation shows results
- ✅ OTP form accepts input
- ✅ Payment modal opens
- ✅ Login redirects to dashboard
- ✅ Bookings display correctly
- ✅ Profile shows customer data
- ✅ Responsive on mobile

### Integration Tests Pass If:
- ✅ Full booking flow completes
- ✅ Customer can login and see bookings
- ✅ New user gets welcome message
- ✅ Payment verification updates booking
- ✅ Multiple bookings per customer work
- ✅ Profile updates persist
- ✅ Token authentication works
- ✅ Logout clears session

---

## 📊 Test Coverage Summary

| Component | Tests | Status |
|-----------|-------|--------|
| OTP System | 5 scenarios | ✅ Manual |
| Authentication | 4 scenarios | ✅ Manual |
| Booking Flow | 3 scenarios | ✅ Manual |
| Payment | 2 scenarios | ✅ Manual |
| Dashboard | 3 scenarios | ✅ Manual |
| Profile | 2 scenarios | ✅ Manual |
| API Endpoints | 14 endpoints | ✅ cURL |

**Total Scenarios:** 19  
**Test Type:** Manual + API Testing  
**Automated Tests:** Not implemented

---

## 🎯 Next Steps for QA

1. **Automate Tests:**
   - Backend: JUnit + Mockito
   - Frontend: Jest + React Testing Library
   - E2E: Cypress or Playwright

2. **Load Testing:**
   - Use JMeter or K6
   - Test concurrent bookings
   - Test OTP rate limiting

3. **Security Testing:**
   - SQL injection tests
   - XSS tests
   - JWT token tampering
   - Rate limiting verification

4. **Performance Testing:**
   - Map load time
   - API response time
   - Database query optimization
   - Frontend bundle size

---

## ✅ Test Completion Checklist

- [ ] Guest booking flow completed successfully
- [ ] New customer account auto-created
- [ ] OTP sent and verified
- [ ] Payment completed (test mode)
- [ ] Booking visible in dashboard
- [ ] Returning customer can login
- [ ] New user sees welcome message
- [ ] Profile management works
- [ ] Multiple bookings per customer
- [ ] Map location selection works
- [ ] Fare calculation accurate
- [ ] All API endpoints respond correctly
- [ ] JWT authentication works
- [ ] CORS configured properly
- [ ] Error messages display correctly

---

**Happy Testing! 🧪**

For issues, check the logs, verify configuration, and ensure all services are running.
