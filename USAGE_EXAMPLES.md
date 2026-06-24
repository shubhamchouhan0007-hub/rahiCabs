# 📖 RahiCabs - Usage Examples

## 🎯 How to Use the Location Search

### Example 1: Booking from Kolkata Airport to Salt Lake

#### Step 1: Search Pickup Location
```
1. Open: http://localhost:5173/book
2. In "Pickup Location" field, type: "kolkata airport"
3. Wait 0.5 seconds
4. See dropdown with suggestions:
   📍 Netaji Subhas Chandra Bose International Airport, Kolkata
   📍 Kolkata Airport Metro Station
   📍 Airport Gate 1, Kolkata
   📍 Kolkata Domestic Terminal
   📍 Airport Road, Kolkata
5. Click on: "Netaji Subhas Chandra Bose International Airport"
6. ✅ Location selected! Map zooms to airport
```

#### Step 2: Search Drop Location
```
1. In "Drop Location" field, type: "salt lake"
2. See suggestions:
   📍 Salt Lake City, Kolkata, West Bengal
   📍 Salt Lake Sector V, Kolkata
   📍 Salt Lake Stadium, Kolkata
   📍 Salt Lake City Centre
   📍 Salt Lake Bypass Road
3. Click on: "Salt Lake Sector V, Kolkata"
4. ✅ Location selected! Map shows both markers
```

#### Step 3: Calculate Fare
```
Click: "Calculate Fare" button

Result:
Distance: 10.5 km
Duration: 16 minutes
Total Fare: ₹115.50
Advance (15%): ₹17.33
Remaining: ₹98.17
```

---

### Example 2: Using Map to Select Locations

#### Step 1: Select Pickup on Map
```
1. Click: "Select Pickup on Map" button (turns blue)
2. Click anywhere on the map
3. Wait 2 seconds for reverse geocoding
4. Pickup field auto-fills with: "Street Name, Area, City"
5. ✅ Pickup marker appears
```

#### Step 2: Select Drop on Map
```
1. Click: "Select Drop on Map" button
2. Click different location on map
3. Drop field auto-fills with address
4. ✅ Drop marker appears
```

---

### Example 3: Mixed Method (Search + Map)

#### Scenario: You know pickup but need to explore drop area
```
1. Pickup: Type "patna junction" → Select from dropdown
2. Drop: Click "Select Drop on Map"
3. Zoom into residential area on map
4. Click on specific building/location
5. ✅ Both locations set!
```

---

## 🎬 Complete Booking Flow Examples

### Scenario A: New Customer - First Booking

```
1. HOME PAGE
   Click: "Book Now" button
   
2. LOCATION SELECTION
   Pickup: Type "mumbai airport" → Select
   Drop: Type "bandra station" → Select
   Click: "Calculate Fare"
   
3. FARE DISPLAYED
   Distance: 15.5 km
   Total: ₹170.50
   Advance: ₹25.58
   
4. ENTER DETAILS
   Name: "Rahul Sharma"
   Phone: "9876543210"
   Email: "rahul@example.com"
   Service: "STANDARD"
   Click: "Send OTP"
   
5. BACKEND CONSOLE
   See OTP: 123456
   
6. VERIFY OTP
   Enter: "123456"
   Click: "Proceed to Payment"
   
7. RAZORPAY PAYMENT
   Card: 4111 1111 1111 1111
   CVV: 123
   Expiry: 12/25
   Click: "Pay"
   
8. SUCCESS!
   Alert: "Booking confirmed!"
   Redirect: Customer Dashboard
   Status: You have 1 booking
```

---

### Scenario B: Returning Customer - Login

```
1. HOME PAGE
   Click: "My Bookings"
   
2. LOGIN PAGE
   Phone: "9876543210" (used before)
   Click: "Send OTP"
   
3. BACKEND CONSOLE
   See OTP: 654321
   
4. VERIFY
   Enter: "654321"
   Click: "Verify & Login"
   
5. DASHBOARD
   Shows: Previous bookings
   Status: CONFIRMED
   Driver: Not yet assigned
   
6. PROFILE
   View: Customer details
   Total Bookings: 1
```

---

### Scenario C: New User Tries Login

```
1. Go to: /customer/login
2. Phone: "9123456789" (NEW NUMBER)
3. Click: "Send OTP"
4. Enter OTP: "789012"
5. Click: "Verify & Login"

RESULT:
✅ New account automatically created!
✅ Welcome banner shown
✅ Message: "You don't have any bookings yet"
✅ Button: "Book Your First Ride"
```

---

## 🔍 Search Query Examples

### Popular Searches in Kolkata
```
"kol"          → Kolkata results
"airport"      → Airports nearby
"station"      → Railway stations
"howrah"       → Howrah area
"salt"         → Salt Lake
"new"          → New Town, New Market
"park"         → Park Street, Parks
"maidan"       → Maidan area
"dalhousie"    → Dalhousie area
"esplanade"    → Esplanade
```

### Popular Searches in Patna
```
"patna"        → Patna locations
"junction"     → Patna Junction
"airport"      → Patna Airport
"boring"       → Boring Road
"fraser"       → Fraser Road
"gandhi"       → Gandhi Maidan
"station"      → Railway stations
"ashok"        → Ashok Rajpath
```

### Popular Searches in Mumbai
```
"mumbai"       → Mumbai locations
"bandra"       → Bandra area
"andheri"      → Andheri
"airport"      → Mumbai airports
"cst"          → CST station
"marine"       → Marine Drive
"juhu"         → Juhu Beach
```

---

## 🎨 UI Interaction Examples

### Typing Experience
```
User types: "k"
→ Nothing happens (need 3 chars)

User types: "ko"
→ Still nothing

User types: "kol"
→ Loading icon appears (🔄)
→ Wait 0.5 seconds (debounce)
→ Dropdown appears with results

User types more: "kolkata"
→ Loading icon appears again
→ New results after 0.5s
→ More specific suggestions
```

### Selecting from Dropdown
```
User sees:
┌──────────────────────────────────┐
│ 📍 Kolkata Airport               │ ← hover (background changes)
│ 📍 Kolkata Railway Station       │
│ 📍 Salt Lake City, Kolkata       │
└──────────────────────────────────┘

User clicks: "Kolkata Airport"
→ Dropdown closes
→ Input shows: "Netaji Subhas Chandra..."
→ Map zooms to airport
→ Marker appears
→ Ready to select drop!
```

### Map Interaction
```
User clicks: "Select Pickup on Map"
→ Button turns blue
→ Instruction appears

User clicks on map
→ Loading... (reverse geocoding)
→ After 2 seconds
→ Input field fills with address
→ Marker appears
→ User can now select drop
```

---

## 🐛 Common Scenarios & Solutions

### Scenario: "No suggestions appearing"
```
Problem: Typed "kolkata" but no dropdown

Check:
1. Did you type at least 3 characters? ✓
2. Did you wait 0.5 seconds? ⏱️
3. Is internet connected? 🌐
4. Check browser console for errors 🔍

Solution:
- Wait 1 second after typing
- Try typing more specific: "kolkata airport"
- Check backend is running
- Clear browser cache
```

### Scenario: "Wrong location selected"
```
Problem: Selected "Kolkata" but wanted "Kolkata Airport"

Solution:
1. Click in the input field again
2. Type more specific: "kolkata airport"
3. Select correct one from new suggestions
4. Or use map click method
```

### Scenario: "Map not centering"
```
Problem: Selected location but map doesn't move

Solution:
- Map centers with 1-second delay
- If still not centered, click "Select on Map" button
- Map will center on next click
```

---

## 📱 Mobile Usage Tips

### On Small Screens
```
1. SEARCH FIELDS
   - Stack vertically (not side-by-side)
   - Full width for easy typing
   - Dropdown auto-adjusts height
   
2. MAP
   - Full width
   - 300px height (mobile optimized)
   - Pinch to zoom works
   
3. TOGGLE BUTTONS
   - Stack vertically
   - Full width for easy tapping
   - Icons + text for clarity
```

### Mobile Gestures
```
✓ Tap input → Keyboard appears
✓ Type → Suggestions show
✓ Tap suggestion → Selects
✓ Tap map → Selects location
✓ Pinch map → Zoom in/out
✓ Drag map → Move around
✓ Tap toggle → Switch mode
```

---

## 🎯 Pro Tips

### Tip 1: Search Faster
```
Instead of: "netaji subhas chandra bose international airport"
Just type: "kolkata airport"
Result: Same suggestions, 80% less typing!
```

### Tip 2: Mix Methods
```
Pickup: Search "mumbai airport" (fast!)
Drop: Click on map in residential area (precise!)
Best of both worlds!
```

### Tip 3: Use Hints
```
Notice the gray text: "Or click on the map below to select"
This reminds you there are 2 ways to select!
```

### Tip 4: Check Map After Search
```
After selecting from dropdown:
→ Check the map marker
→ Make sure it's the right location
→ If not, try again with more specific search
```

### Tip 5: Mobile Typing
```
On mobile:
→ Use predictive text
→ "kol" → Select "kolkata" from keyboard
→ Faster than typing full word
```

---

## ✅ Success Indicators

### You Know It's Working When:
```
✓ Dropdown appears after typing 3+ characters
✓ Loading spinner shows while searching
✓ Suggestions are relevant to your search
✓ Clicking suggestion fills the field
✓ Map centers on selected location
✓ Marker appears on map
✓ "Calculate Fare" button becomes enabled
```

### Red Flags (Something Wrong):
```
✗ No suggestions after 2 seconds
✗ Console shows errors
✗ Dropdown stays empty
✗ Map doesn't center
✗ No marker appears
✗ Backend not running

→ Check: Backend running on :8080
→ Check: Frontend running on :5173
→ Check: Internet connection
→ Check: Browser console
```

---

## 🎊 Summary

### TWO Ways to Select Locations:

**Method 1: Search (Recommended)**
- Fast ⚡
- Accurate 🎯
- Easy 😊
- Mobile-friendly 📱

**Method 2: Map Click**
- Visual 👁️
- Flexible 🔄
- Exploratory 🗺️
- Precise 📍

**Best Practice:**
Use search for known places, use map for exploring!

---

**Happy Booking!** 🚖✨
