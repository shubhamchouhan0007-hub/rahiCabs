# RahiCabs API Documentation

## Base URL
```
http://localhost:8080/api
```

## Customer Authentication & Booking APIs

### 1. Send OTP
**Endpoint:** `POST /customer/send-otp`  
**Access:** Public  
**Description:** Send OTP to customer's phone number

**Request Body:**
```json
{
  "phoneNumber": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

### 2. Verify OTP
**Endpoint:** `POST /customer/verify-otp`  
**Access:** Public  
**Description:** Verify OTP entered by customer

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

---

### 3. Login with OTP
**Endpoint:** `POST /customer/login`  
**Access:** Public  
**Description:** Login customer with OTP and return JWT token

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customerId": 1,
  "fullName": "John Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com",
  "isNewUser": false
}
```

---

### 4. Calculate Fare
**Endpoint:** `POST /customer/calculate-fare`  
**Access:** Public  
**Description:** Calculate fare based on pickup and drop coordinates

**Request Body:**
```json
{
  "pickupLatitude": 22.5726,
  "pickupLongitude": 88.3639,
  "dropLatitude": 22.6568,
  "dropLongitude": 88.4285
}
```

**Response:**
```json
{
  "distance": 15.5,
  "duration": 23,
  "totalFare": 170.5,
  "advanceAmount": 25.58,
  "remainingAmount": 144.92
}
```

---

### 5. Create Booking
**Endpoint:** `POST /customer/book`  
**Access:** Public  
**Description:** Create booking with OTP verification and generate payment order

**Request Body:**
```json
{
  "name": "John Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com",
  "pickupLocation": "Kolkata Airport",
  "pickupLatitude": 22.6568,
  "pickupLongitude": 88.4285,
  "dropLocation": "Salt Lake Sector V",
  "dropLatitude": 22.5744,
  "dropLongitude": 88.4329,
  "serviceType": "STANDARD",
  "distance": 10.5,
  "duration": 20,
  "totalFare": 115.5,
  "notes": "Please call before arrival",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "bookingId": 45,
  "paymentOrder": {
    "orderId": "order_1234567890",
    "amount": 1733,
    "currency": "INR",
    "keyId": "rzp_test_xxxxx"
  }
}
```

---

### 6. Verify Payment
**Endpoint:** `POST /customer/verify-payment`  
**Access:** Public  
**Description:** Verify Razorpay payment after successful transaction

**Request Body:**
```json
{
  "razorpayOrderId": "order_1234567890",
  "razorpayPaymentId": "pay_1234567890",
  "razorpaySignature": "signature_hash_here",
  "bookingId": 45
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

---

## Protected Customer APIs (Require JWT Token)

**Authentication:** Add header `Authorization: Bearer <token>`

### 7. Get Profile
**Endpoint:** `GET /customer/profile`  
**Access:** Protected  
**Description:** Get customer profile details

**Response:**
```json
{
  "id": 1,
  "customerCode": "CUST1234567890",
  "fullName": "John Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com",
  "authType": "OTP",
  "accountStatus": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00",
  "lastLogin": "2024-06-24T14:20:00",
  "totalBookings": 5
}
```

---

### 8. Update Profile
**Endpoint:** `PUT /customer/profile`  
**Access:** Protected  
**Description:** Update customer profile

**Request Body:**
```json
{
  "fullName": "John Updated Doe",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

### 9. Get Bookings
**Endpoint:** `GET /customer/bookings`  
**Access:** Protected  
**Description:** Get all bookings for logged-in customer

**Response:**
```json
[
  {
    "id": 45,
    "pickupLocation": "Kolkata Airport",
    "dropLocation": "Salt Lake Sector V",
    "serviceType": "STANDARD",
    "status": "CONFIRMED",
    "fare": 115.5,
    "distance": 10.5,
    "duration": 20,
    "createdAt": "2024-06-24T10:30:00",
    "scheduledAt": null
  }
]
```

---

### 10. Get Booking Details
**Endpoint:** `GET /customer/bookings/{id}`  
**Access:** Protected  
**Description:** Get detailed information about a specific booking

**Response:**
```json
{
  "id": 45,
  "pickupLocation": "Kolkata Airport",
  "dropLocation": "Salt Lake Sector V",
  "serviceType": "STANDARD",
  "status": "CONFIRMED",
  "fare": 115.5,
  "advanceAmount": 17.33,
  "remainingAmount": 98.17,
  "advancePaid": true,
  "distance": 10.5,
  "duration": 20,
  "notes": "Please call before arrival",
  "createdAt": "2024-06-24T10:30:00"
}
```

---

### 11. Get Payment History
**Endpoint:** `GET /customer/payments`  
**Access:** Protected  
**Description:** Get payment history for customer

**Response:**
```json
[
  {
    "id": 12,
    "bookingId": 45,
    "amount": 17.33,
    "paymentType": "ADVANCE",
    "paymentStatus": "SUCCESS",
    "razorpayOrderId": "order_1234567890",
    "razorpayPaymentId": "pay_1234567890",
    "paymentDate": "2024-06-24T10:35:00",
    "createdAt": "2024-06-24T10:30:00"
  }
]
```

---

### 12. Get Saved Locations
**Endpoint:** `GET /customer/saved-locations`  
**Access:** Protected  
**Description:** Get all saved locations for customer

**Response:**
```json
[
  {
    "id": 3,
    "label": "HOME",
    "address": "123 Main Street, Kolkata",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "createdAt": "2024-01-20T15:00:00"
  }
]
```

---

### 13. Add Saved Location
**Endpoint:** `POST /customer/saved-locations`  
**Access:** Protected  
**Description:** Save a new location

**Request Body:**
```json
{
  "label": "OFFICE",
  "address": "Tech Park, Salt Lake",
  "latitude": 22.5744,
  "longitude": 88.4329
}
```

**Response:**
```json
{
  "id": 4,
  "label": "OFFICE",
  "address": "Tech Park, Salt Lake",
  "latitude": 22.5744,
  "longitude": 88.4329,
  "createdAt": "2024-06-24T14:30:00"
}
```

---

### 14. Delete Saved Location
**Endpoint:** `DELETE /customer/saved-locations/{id}`  
**Access:** Protected  
**Description:** Delete a saved location

**Response:**
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Service Types
- `STANDARD` - Standard cab service
- `PREMIUM` - Premium cab service
- `SUV` - SUV cab service
- `CITY_TAXI` - City taxi
- `ONE_WAY` - One way trip
- `HOURLY_RENTAL` - Hourly rental
- `ROUND_TRIP` - Round trip
- `AIRPORT_TRANSFER` - Airport transfer
- `OUTSTATION` - Outstation trip

## Booking Status
- `PENDING` - Booking created, waiting for driver assignment
- `CONFIRMED` - Driver assigned
- `IN_PROGRESS` - Trip started
- `COMPLETED` - Trip completed
- `CANCELLED` - Booking cancelled

## Payment Status
- `PENDING` - Payment not yet completed
- `SUCCESS` - Payment successful
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

## Auth Types
- `OTP` - Phone number + OTP authentication
- `EMAIL_PASSWORD` - Email + Password authentication

## Account Status
- `ACTIVE` - Account is active
- `INACTIVE` - Account is inactive
