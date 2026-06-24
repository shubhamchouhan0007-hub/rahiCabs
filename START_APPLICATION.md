# 🚀 Start RahiCabs Application - Step by Step

## Quick Start (Choose Your Method)

### Method 1: Using IDE (Easiest - Recommended)

#### Backend (Spring Boot)
```
1. Open IntelliJ IDEA or Eclipse
2. File → Open → Select "rahiCabs/backend" folder
3. Wait for Maven to download dependencies
4. Find: RahiCabsApplication.java
5. Right-click → Run 'RahiCabsApplication'
6. Wait for: "Started RahiCabsApplication in X seconds"
7. Backend running at: http://localhost:8080
```

#### Frontend (React + Vite)
```
1. Open Terminal/Command Prompt
2. cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend
3. npm install (first time only, might take 2-3 minutes)
4. npm run dev
5. Wait for: "Local: http://localhost:5173/"
6. Frontend running at: http://localhost:5173
```

---

### Method 2: Using Terminal Only

#### Backend
```bash
# Navigate to backend
cd /Users/shubhamchouhan/Desktop/rahiCabs/backend

# Option A: If Maven is installed
mvn clean install
mvn spring-boot:run

# Option B: If Maven wrapper exists
./mvnw clean install
./mvnw spring-boot:run

# Option C: If Maven not available
# Use your IDE (IntelliJ/Eclipse) to run RahiCabsApplication.java
```

#### Frontend (Separate Terminal)
```bash
# Navigate to frontend
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

---

## 🎯 Step-by-Step with Screenshots

### Step 1: Check Prerequisites

**Open Terminal and check:**
```bash
# Check Java (need 21+)
java -version
# Should show: java version "21.x.x"

# Check Node.js (need 18+)
node -v
# Should show: v18.x.x or higher

# Check npm
npm -v
# Should show: 9.x.x or higher
```

**If missing:**
- Java: Download from https://adoptium.net/
- Node.js: Download from https://nodejs.org/

---

### Step 2: Start Backend

**Terminal 1:**
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/backend

# Try running with Maven
mvn spring-boot:run
```

**Expected Output:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::               (v3.3.4)

2024-06-24 ... : Starting RahiCabsApplication
2024-06-24 ... : Started RahiCabsApplication in 5.234 seconds
```

**✅ Success! Backend is running on http://localhost:8080**

---

### Step 3: Start Frontend

**Terminal 2 (New Terminal):**
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend

# First time: Install dependencies
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
  VITE v5.4.8  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**✅ Success! Frontend is running on http://localhost:5173**

---

### Step 4: Open in Browser

```
1. Open your browser
2. Go to: http://localhost:5173
3. You should see RahiCabs homepage
4. Click "Book Now" to test!
```

---

## 🧪 Test the Application

### Quick Test Flow
```
1. Click "Book Now"
2. Type "kol" in pickup → Select from dropdown
3. Type "salt" in drop → Select from dropdown
4. Click "Calculate Fare"
5. Enter:
   - Name: Test User
   - Phone: 9876543210
   - Email: test@example.com
6. Click "Send OTP"
7. Check Terminal 1 (Backend) for OTP
8. Enter OTP
9. Click "Proceed to Payment"
10. Razorpay modal should open!
```

**Test Card:**
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

---

## 🐛 Troubleshooting

### Issue 1: Backend Won't Start

**Error: "mvn command not found"**
```
Solution: Use IDE to run
1. Open IntelliJ/Eclipse
2. Import backend folder
3. Run RahiCabsApplication.java
```

**Error: "Port 8080 already in use"**
```bash
# Find what's using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or change port in application.properties
server.port=8081
```

**Error: Java version mismatch**
```bash
# Check version
java -version

# If wrong version, install Java 21
# Download from: https://adoptium.net/
```

---

### Issue 2: Frontend Won't Start

**Error: "npm command not found"**
```bash
# Install Node.js
# Download from: https://nodejs.org/

# Verify installation
node -v
npm -v
```

**Error: "Port 5173 already in use"**
```bash
# Kill process on port 5173
lsof -i :5173
kill -9 <PID>

# Or it will auto-use next available port
```

**Error: Dependencies install fails**
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 3: Can't See OTP

**Problem: OTP not showing**
```
Solution:
1. Look at Terminal 1 (Backend console)
2. Scroll up to find:
   === OTP GENERATED ===
   Phone: 9876543210
   OTP: 123456
   ====================
3. Use this OTP in frontend
```

---

### Issue 4: Razorpay Modal Not Opening

**Problem: Click "Proceed to Payment" but nothing happens**
```
Solutions:
1. Check browser console (F12) for errors
2. Verify Razorpay script loaded:
   - Open DevTools → Network tab
   - Look for: checkout.razorpay.com
3. Disable ad blockers
4. Try different browser (Chrome/Firefox)
5. Check internet connection
```

---

## 📋 Verification Checklist

### Backend Running? ✓
```bash
# Test in browser or terminal
curl http://localhost:8080/actuator/health

# Or just open in browser:
http://localhost:8080
```

### Frontend Running? ✓
```bash
# Should show in Terminal 2:
➜  Local:   http://localhost:5173/

# Open in browser
http://localhost:5173
```

### Database Working? ✓
```bash
# H2 Console (dev mode)
http://localhost:8080/h2-console

JDBC URL: jdbc:h2:mem:testdb
Username: sa
Password: (leave blank)
```

### OTP System Working? ✓
```
1. Send OTP from frontend
2. Check backend console
3. Should see OTP printed
```

### Maps Working? ✓
```
1. Go to booking page
2. Map should load (wait 3-5 seconds)
3. Type in search → See dropdown
4. Click on map → Location selected
```

---

## 🎬 Video Tutorial Steps

### Record These Steps:
```
1. Open 2 terminals side by side
2. Terminal 1: cd backend && mvn spring-boot:run
3. Wait for "Started RahiCabsApplication"
4. Terminal 2: cd frontend && npm run dev
5. Wait for "Local: http://localhost:5173/"
6. Open browser → http://localhost:5173
7. Click "Book Now"
8. Select locations
9. Complete booking flow
10. Show OTP in Terminal 1
11. Complete payment with test card
12. Show success in dashboard
```

---

## 🚀 Quick Commands (Copy-Paste)

### Terminal 1 (Backend):
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/backend && mvn spring-boot:run
```

### Terminal 2 (Frontend):
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend && npm install && npm run dev
```

### Browser:
```
http://localhost:5173
```

---

## 📞 Need Help?

### Check Logs:
```bash
# Backend logs in Terminal 1
# Look for errors or OTP

# Frontend logs in Terminal 2
# Look for build errors

# Browser console
# F12 → Console tab
# Look for red errors
```

### Common URLs:
```
Frontend:  http://localhost:5173
Backend:   http://localhost:8080
H2 DB:     http://localhost:8080/h2-console
```

---

## ✅ Success Indicators

### You Know It's Working When:
```
✓ Terminal 1 shows: "Started RahiCabsApplication"
✓ Terminal 2 shows: "Local: http://localhost:5173/"
✓ Browser opens: RahiCabs homepage
✓ Map loads when clicking "Book Now"
✓ OTP appears in Terminal 1
✓ Razorpay modal opens for payment
✓ Success message after payment
✓ Dashboard shows booking
```

---

## 🎉 You're Ready!

Once both terminals show success messages:
1. ✅ Backend: http://localhost:8080
2. ✅ Frontend: http://localhost:5173
3. 🎊 **Open browser and start testing!**

---

**Need me to help with any specific step? Just ask!** 🚀
