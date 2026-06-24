# ⚡ START NOW - EXACT STEPS

## ✅ Prerequisites Check
- Java 21: ✅ INSTALLED
- Node.js 24: ✅ INSTALLED  
- Frontend Dependencies: ✅ INSTALLED

## 🚀 START IN 2 MINUTES

### Step 1: Start Backend (Choose ONE option)

#### Option A: IntelliJ IDEA (RECOMMENDED)
```
1. Open IntelliJ IDEA
2. Click: File → Open
3. Navigate to: /Users/shubhamchouhan/Desktop/rahiCabs/backend
4. Click: Open
5. Wait for indexing to complete (status bar at bottom)
6. In left panel: src → main → java → com.rahicabs
7. Right-click: RahiCabsApplication.java
8. Click: Run 'RahiCabsApplication.main()'
9. Watch console tab at bottom
10. Wait for: "Started RahiCabsApplication in X seconds"
```

✅ **Backend is now running at http://localhost:8080**

#### Option B: Terminal (If you have Maven)
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/backend
mvn spring-boot:run
```

---

### Step 2: Start Frontend (EXACT COMMANDS)

**Open NEW Terminal Window** (Command+N or Terminal → New Window)

**Copy and paste this EXACT command:**
```bash
cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend && npm run dev
```

**Expected Output:**
```
  VITE v5.4.8  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

✅ **Frontend is now running at http://localhost:5173**

---

### Step 3: Open Browser

**Copy this URL and paste in your browser:**
```
http://localhost:5173
```

Press Enter.

✅ **You should see the RahiCabs homepage!**

---

## 🧪 Quick Test (5 minutes)

1. **Click "Book Now"**
2. **In Pickup field, type:** `kolkata airport`
3. **Click on suggestion** that appears
4. **In Drop field, type:** `salt lake`
5. **Click on suggestion**
6. **Click "Calculate Fare"**
7. **Fill form:**
   - Name: Test User
   - Phone: 9876543210
   - Email: test@example.com
8. **Click "Send OTP"**
9. **IMPORTANT:** Go to backend terminal/console
10. **Find OTP:** Look for "=== OTP GENERATED ===" 
11. **Copy the 6-digit OTP**
12. **Paste in frontend**
13. **Click "Proceed to Payment"**
14. **Razorpay modal opens**
15. **Enter test card:**
    - Card: 4111 1111 1111 1111
    - CVV: 123
    - Expiry: 12/25
16. **Click "Pay"**

✅ **Success! Booking confirmed!**

---

## 🆘 TROUBLESHOOTING

### "Backend won't start"
→ Use IntelliJ IDEA (Option A above)
→ Don't use terminal if Maven not installed

### "Frontend won't start"
→ Open NEW terminal window
→ Don't use same terminal as backend
→ Copy exact command above

### "Can't see OTP"
→ Look at IntelliJ console (bottom panel)
→ Or backend terminal
→ Scroll up to find "=== OTP GENERATED ==="

### "Port already in use"
```bash
# Kill port 8080
lsof -ti:8080 | xargs kill -9

# Kill port 5173  
lsof -ti:5173 | xargs kill -9
```

---

## ✅ SUCCESS INDICATORS

**Backend:**
```
Console shows:
Started RahiCabsApplication in X.XXX seconds (JVM running for X.XXX)
```

**Frontend:**
```
Terminal shows:
➜  Local:   http://localhost:5173/
```

**Browser:**
- Opens http://localhost:5173
- Shows RahiCabs homepage
- Has "Book Now" button

---

## 🎯 WHAT TO DO RIGHT NOW:

1. **Open IntelliJ IDEA** (or your Java IDE)
2. **Open backend project**
3. **Run RahiCabsApplication.java**
4. **Wait for "Started RahiCabsApplication"**
5. **Open NEW terminal**
6. **Run:** `cd /Users/shubhamchouhan/Desktop/rahiCabs/frontend && npm run dev`
7. **Open browser:** http://localhost:5173
8. **Test booking flow!**

---

**YOUR SYSTEM IS READY! Just follow the exact steps above!** 🚀
