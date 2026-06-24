# ✅ RahiCabs Startup Checklist

## Before You Start

### Check Installed Software
- [ ] Java 21+ installed - Run: `java -version`
- [ ] Node.js 18+ installed - Run: `node -v`
- [ ] npm installed - Run: `npm -v`
- [ ] Internet connection active (for maps & Razorpay)

### Choose Your Method
- [ ] **Method 1:** IDE (IntelliJ/Eclipse) for backend + Terminal for frontend
- [ ] **Method 2:** Terminal for both

---

## Startup Process

### 🟢 Backend (Choose One)

#### Option A: Using IDE (Easiest)
- [ ] Open IntelliJ IDEA or Eclipse
- [ ] Open project: `/Users/shubhamchouhan/Desktop/rahiCabs/backend`
- [ ] Find: `src/main/java/com/rahicabs/RahiCabsApplication.java`
- [ ] Right-click → Run
- [ ] Wait for: "Started RahiCabsApplication in X seconds"
- [ ] Verify: http://localhost:8080 is accessible

#### Option B: Using Terminal
- [ ] Open Terminal
- [ ] Run: `cd /Users/shubhamchouhan/Desktop/rahiCabs/backend`
- [ ] Run: `mvn spring-boot:run`
- [ ] Wait for: "Started RahiCabsApplication"
- [ ] Verify: http://localhost:8080 is accessible

### 🔵 Frontend

- [ ] Open new Terminal window
- [ ] Run: `cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend`
- [ ] Run: `npm install` (first time only, 2-3 mins)
- [ ] Run: `npm run dev`
- [ ] Wait for: "Local: http://localhost:5173/"
- [ ] Verify: http://localhost:5173 shows homepage

---

## Verification Tests

### Basic Checks
- [ ] Backend terminal shows no errors
- [ ] Frontend terminal shows no errors
- [ ] Browser opens http://localhost:5173 successfully
- [ ] Homepage loads with "Book Now" button visible

### Feature Checks
- [ ] Click "Book Now" → Redirects to `/book`
- [ ] Map loads (wait 3-5 seconds for tiles)
- [ ] Type "kol" in pickup → Dropdown shows suggestions
- [ ] Type "salt" in drop → Dropdown shows suggestions
- [ ] Click on suggestion → Location selected
- [ ] Click on map → Location selected
- [ ] Both methods work correctly

### Booking Flow Test
- [ ] Select pickup location (search or map)
- [ ] Select drop location (search or map)
- [ ] Click "Calculate Fare" → Shows fare details
- [ ] Enter name, phone, email
- [ ] Click "Send OTP"
- [ ] OTP appears in backend terminal
- [ ] Enter OTP in frontend
- [ ] Click "Proceed to Payment"
- [ ] Razorpay modal opens

### Payment Test
- [ ] Razorpay modal shows correctly
- [ ] Shows advance amount (15% of total)
- [ ] Enter test card: 4111 1111 1111 1111
- [ ] Enter CVV: 123
- [ ] Enter Expiry: 12/25
- [ ] Click "Pay"
- [ ] Payment succeeds
- [ ] Redirects to customer dashboard
- [ ] Booking shows in "My Bookings"

### Login Test
- [ ] Logout from dashboard
- [ ] Click "My Bookings" in navigation
- [ ] Enter phone number used in booking
- [ ] Click "Send OTP"
- [ ] OTP appears in backend terminal
- [ ] Enter OTP
- [ ] Click "Verify & Login"
- [ ] Redirects to dashboard
- [ ] Previous booking(s) visible

---

## Troubleshooting Checklist

### Backend Issues
- [ ] Java version is 21 or higher
- [ ] Port 8080 is not in use by another app
- [ ] No firewall blocking port 8080
- [ ] Maven dependencies downloaded
- [ ] No errors in terminal

### Frontend Issues
- [ ] Node.js version is 18 or higher
- [ ] Port 5173 is not in use
- [ ] `node_modules` folder exists
- [ ] No errors in terminal
- [ ] Internet connection active

### Browser Issues
- [ ] Tried Chrome/Firefox/Safari
- [ ] Ad blocker disabled
- [ ] Browser console (F12) shows no errors
- [ ] Cookies enabled
- [ ] JavaScript enabled

### OTP Issues
- [ ] Backend terminal is visible
- [ ] Scrolled up to find OTP message
- [ ] OTP is within 5 minutes (not expired)
- [ ] Haven't exceeded 3 attempts
- [ ] Phone number exactly 10 digits

### Payment Issues
- [ ] Internet connection active
- [ ] Razorpay script loaded (check Network tab)
- [ ] Using test card: 4111 1111 1111 1111
- [ ] Razorpay credentials configured (optional for testing)
- [ ] Browser allows pop-ups

---

## Configuration Checklist (Optional)

### Razorpay Setup (For Real Payments)
- [ ] Signed up at https://razorpay.com/
- [ ] Got test API Key ID
- [ ] Got test API Secret
- [ ] Updated `backend/src/main/resources/application.properties`:
  ```properties
  app.razorpay.key-id=rzp_test_YOUR_KEY
  app.razorpay.key-secret=YOUR_SECRET
  ```
- [ ] Restarted backend

### Database Setup (Optional - H2 works by default)
- [ ] Accessing H2 console at http://localhost:8080/h2-console
- [ ] JDBC URL: `jdbc:h2:mem:testdb`
- [ ] Username: `sa`
- [ ] Password: (blank)
- [ ] Can see tables: customers, bookings, payments, etc.

---

## Success Criteria

### ✅ Fully Working System
- [x] Backend starts without errors
- [x] Frontend starts without errors
- [x] Homepage loads in browser
- [x] Maps load correctly
- [x] Location search works (autocomplete)
- [x] Map click selection works
- [x] Fare calculation works
- [x] OTP system works (shows in terminal)
- [x] Razorpay modal opens
- [x] Test payment succeeds
- [x] Booking confirmed
- [x] Customer dashboard works
- [x] Login with OTP works
- [x] Booking history displays

### 🎉 Ready for Testing!
- [ ] All above criteria met
- [ ] Can complete full booking flow
- [ ] Can login as returning customer
- [ ] Can view booking history
- [ ] Can update profile
- [ ] System is stable

---

## Quick Commands Reference

### Start Backend (Terminal):
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/backend && mvn spring-boot:run
```

### Start Frontend (Terminal):
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend && npm install && npm run dev
```

### Check Status:
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend
open http://localhost:5173
```

### View OTP:
```
Look at backend terminal, scroll up to find:
=== OTP GENERATED ===
OTP: 123456
====================
```

---

## Final Verification

### All Systems Go? ✅
- [ ] Both terminals running without errors
- [ ] Browser showing application
- [ ] All features tested and working
- [ ] No console errors

### 🚀 You're Ready to Demo!

**Open:** http://localhost:5173  
**Test Card:** 4111 1111 1111 1111  
**CVV:** 123  
**Expiry:** 12/25

---

## Need Help?

### Documentation Files:
- `HOW_TO_START.txt` - Simple text instructions
- `START_APPLICATION.md` - Detailed guide
- `STARTUP_COMMANDS.md` - Copy-paste commands
- `TESTING_GUIDE.md` - Complete testing scenarios
- `QUICK_START.md` - Quick overview

### Common Issues:
- See `TESTING_GUIDE.md` → Troubleshooting section
- Check backend terminal for errors
- Check frontend terminal for errors
- Check browser console (F12) for errors

---

**Happy Testing! 🎊**

Print this checklist and tick off items as you complete them!
