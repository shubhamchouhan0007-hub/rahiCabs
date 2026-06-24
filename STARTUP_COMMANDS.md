# 🚀 RahiCabs - Copy-Paste Startup Commands

## Method 1: Using IDE (Recommended for Backend)

### Step 1: Backend (IntelliJ/Eclipse)
```
1. Open IntelliJ IDEA or Eclipse
2. File → Open → Select: /Users/shubhamchouhan/Desktop/rahiCabs/backend
3. Wait for project to load
4. Navigate to: src/main/java/com/rahicabs/RahiCabsApplication.java
5. Right-click on file → Run 'RahiCabsApplication.main()'
6. Wait for console to show: "Started RahiCabsApplication"
```

### Step 2: Frontend (Terminal)
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend
npm install
npm run dev
```

**Open Browser:** http://localhost:5173

---

## Method 2: Terminal Only (Both)

### Terminal 1 - Backend:
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/backend
mvn spring-boot:run
```

### Terminal 2 - Frontend:
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend
npm install && npm run dev
```

**Open Browser:** http://localhost:5173

---

## One-Line Commands (Copy-Paste)

### Backend (if Maven installed):
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/backend && mvn spring-boot:run
```

### Frontend:
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend && npm install && npm run dev
```

---

## Quick Test Flow

### Test Booking (Copy-Paste):
```
1. Open: http://localhost:5173
2. Click: "Book Now"
3. Pickup: Type "kolkata airport" → Select from dropdown
4. Drop: Type "salt lake" → Select from dropdown
5. Click: "Calculate Fare"
6. Name: Test User
7. Phone: 9876543210
8. Email: test@example.com
9. Click: "Send OTP"
10. Check backend terminal for OTP
11. Enter OTP
12. Click: "Proceed to Payment"
13. Card: 4111 1111 1111 1111
14. CVV: 123
15. Expiry: 12/25
16. Click: "Pay"
```

---

## Check If Running

### Backend Check:
```bash
curl http://localhost:8080/actuator/health
```
**Expected:** `{"status":"UP"}`

### Frontend Check:
```
Open: http://localhost:5173
```
**Expected:** RahiCabs homepage loads

---

## Stop Services

### Stop Backend:
```
Terminal 1: Press Ctrl+C
```

### Stop Frontend:
```
Terminal 2: Press Ctrl+C
```

---

## Troubleshooting Commands

### Check Java Version:
```bash
java -version
```
**Need:** 21 or higher

### Check Node Version:
```bash
node -v
```
**Need:** v18 or higher

### Check Ports:
```bash
# Check if port 8080 is free (backend)
lsof -i :8080

# Check if port 5173 is free (frontend)
lsof -i :5173
```

### Kill Process on Port:
```bash
# Kill backend port
kill -9 $(lsof -t -i:8080)

# Kill frontend port
kill -9 $(lsof -t -i:5173)
```

### Clear Frontend Cache:
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Database Access (H2 Console)

```
URL: http://localhost:8080/h2-console
JDBC URL: jdbc:h2:mem:testdb
Username: sa
Password: (leave blank)
```

---

## View Logs

### Backend Logs:
```
Look at Terminal 1 where backend is running
Scroll up to see OTP and other logs
```

### Frontend Logs:
```
Look at Terminal 2 where frontend is running
```

### Browser Console:
```
Press F12 → Console tab
Look for errors (red text)
```

---

## Success Indicators

### ✅ Backend Started:
```
Terminal shows:
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
...
Started RahiCabsApplication in X.XXX seconds (JVM running for X.XXX)
```

### ✅ Frontend Started:
```
Terminal shows:
  VITE v5.4.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### ✅ Everything Working:
```
1. Backend terminal shows: "Started RahiCabsApplication"
2. Frontend terminal shows: "Local: http://localhost:5173/"
3. Browser at http://localhost:5173 shows homepage
4. Clicking "Book Now" loads map
5. Searching shows dropdown suggestions
6. OTP appears in backend terminal
7. Payment modal opens
```

---

## Quick Reference URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 |
| H2 Console | http://localhost:8080/h2-console |
| API Docs | See API_DOCUMENTATION.md |

---

## Test Card Details

```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
Name: TEST USER
```

**Result:** Payment SUCCESS ✅

---

## Common Error Solutions

### Error: "mvn: command not found"
```
Solution: Use IDE (IntelliJ/Eclipse) to run backend
Or install Maven: brew install maven
```

### Error: "npm: command not found"
```
Solution: Install Node.js from https://nodejs.org/
```

### Error: "Port 8080 already in use"
```bash
# Find and kill process
lsof -i :8080
kill -9 <PID>
```

### Error: "Cannot find module"
```bash
cd frontend
rm -rf node_modules
npm install
```

---

## Full Restart

```bash
# Stop everything (Ctrl+C in both terminals)

# Backend
cd /Users/shubhamchouhan/Desktop/rahiCabs/backend
mvn clean install
mvn spring-boot:run

# Frontend (new terminal)
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend
rm -rf node_modules
npm install
npm run dev
```

---

**Ready to start? Copy the commands above and paste in your terminal!** 🚀
