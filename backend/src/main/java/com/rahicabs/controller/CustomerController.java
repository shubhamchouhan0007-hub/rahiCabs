package com.rahicabs.controller;

import com.rahicabs.dto.*;
import com.rahicabs.entity.Booking;
import com.rahicabs.entity.BookingStatus;
import com.rahicabs.entity.Customer;
import com.rahicabs.entity.Payment;
import com.rahicabs.entity.SavedLocation;
import com.rahicabs.repository.BookingRepository;
import com.rahicabs.repository.CustomerRepository;
import com.rahicabs.security.JwtTokenProvider;
import com.rahicabs.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final OtpService otpService;
    private final FareCalculationService fareService;
    private final PaymentService paymentService;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final NotificationService notificationService;
    private final FirebaseService firebaseService;

    // ========== OTP & Authentication ==========

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse> sendOtp(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(otpService.sendOtp(request.getPhoneNumber()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return ResponseEntity.ok(otpService.verifyOtp(request.getPhoneNumber(), request.getOtp()));
    }

    @PostMapping("/login")
    public ResponseEntity<CustomerJwtResponse> loginWithOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return ResponseEntity.ok(customerService.loginWithOtp(request.getPhoneNumber(), request.getOtp()));
    }

    /** Log in after the phone is verified client-side by Firebase (no DLT SMS needed). */
    @PostMapping("/firebase-login")
    public ResponseEntity<?> firebaseLogin(@RequestBody Map<String, String> body) {
        String phone;
        try {
            phone = firebaseService.verifyAndGetPhone(body.get("firebaseIdToken"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phone verification failed. Please try again."));
        }
        return ResponseEntity.ok(customerService.loginWithFirebase(phone));
    }

    // ========== Fare Calculation ==========

    @PostMapping("/calculate-fare")
    public ResponseEntity<FareCalculationResponse> calculateFare(@Valid @RequestBody FareCalculationRequest request) {
        return ResponseEntity.ok(fareService.calculateFare(request));
    }

    /** Lead capture: a visitor viewed a fare but hasn't paid — email admin their details. */
    @PostMapping("/fare-lead")
    public ResponseEntity<ApiResponse> fareLead(@RequestBody Map<String, Object> body) {
        try {
            Object fare = body.get("fare");
            notificationService.onFareLead(
                str(body.get("name")), str(body.get("phone")), str(body.get("email")),
                str(body.get("pickup")), str(body.get("drop")), str(body.get("serviceType")),
                fare == null ? null : Double.valueOf(fare.toString()));
        } catch (Exception ignored) { /* never block the booking flow */ }
        return ResponseEntity.ok(ApiResponse.ok("ok"));
    }

    private static String str(Object o) { return o == null ? null : o.toString(); }

    // ========== Guest Booking ==========

    @PostMapping("/book")
    public ResponseEntity<Map<String, Object>> createBooking(
            @Valid @RequestBody CustomerBookingRequest request,
            @RequestHeader(value = "Authorization", required = false) String authToken) {

        Customer customer;
        if (authToken != null && !authToken.isBlank()) {
            // Already-logged-in customer: their session already proves phone ownership,
            // so no OTP is needed. Trust the phone on the token, not the request body.
            try {
                Customer session = getCustomerFromToken(authToken);
                customer = customerService.getOrCreateCustomer(
                        session.getPhoneNumber(), request.getName(), request.getEmail());
            } catch (Exception e) {
                return ResponseEntity.status(401).body(Map.of("success", false,
                        "message", "Session expired. Please log in again."));
            }
        } else {
            // Guest booking: verify the phone via the Firebase OTP token.
            String verifiedPhone;
            try {
                verifiedPhone = firebaseService.verifyAndGetPhone(request.getFirebaseIdToken());
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
            }
            if (!verifiedPhone.equals(request.getPhoneNumber())) {
                return ResponseEntity.badRequest().body(Map.of("success", false,
                        "message", "Verified phone does not match the booking phone number."));
            }
            customer = customerService.getOrCreateCustomer(
                    request.getPhoneNumber(), request.getName(), request.getEmail());
        }

        // Calculate advance amount
        double advanceAmount = request.getTotalFare() * 0.15;
        double remainingAmount = request.getTotalFare() - advanceAmount;

        // Create booking
        Booking booking = Booking.builder()
                .customer(customer)
                .pickupLocation(request.getPickupLocation())
                .pickupLatitude(request.getPickupLatitude())
                .pickupLongitude(request.getPickupLongitude())
                .dropLocation(request.getDropLocation())
                .dropLatitude(request.getDropLatitude())
                .dropLongitude(request.getDropLongitude())
                .serviceType(request.getServiceType())
                .scheduledAt(request.getScheduledAt())
                .distance(request.getDistance())
                .duration(request.getDuration())
                .fare(request.getTotalFare())
                .advanceAmount(advanceAmount)
                .remainingAmount(remainingAmount)
                .advancePaid(false)
                .notes(request.getNotes())
                .status(BookingStatus.PENDING_PAYMENT)
                .build();

        booking = bookingRepository.save(booking);
        notificationService.onBookingCreated(booking);

        // Create Razorpay order
        Map<String, Object> paymentOrder = paymentService.createOrder(customer, booking, advanceAmount);

        Map<String, Object> response = Map.of(
                "success", true,
                "message", "Booking created successfully",
                "bookingId", booking.getId(),
                "paymentOrder", paymentOrder
        );

        return ResponseEntity.ok(response);
    }

    // ========== Payment ==========

    @PostMapping("/verify-payment")
    public ResponseEntity<ApiResponse> verifyPayment(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.verifyPayment(request));
    }

    // ========== Protected Routes (Requires JWT) ==========

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@RequestHeader("Authorization") String token) {
        Customer customer = getCustomerFromToken(token);
        return ResponseEntity.ok(customerService.getCustomerProfile(customer));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> updates) {
        Customer customer = getCustomerFromToken(token);
        return ResponseEntity.ok(customerService.updateProfile(
                customer,
                updates.get("fullName"),
                updates.get("email")
        ));
    }

    /** Register/refresh this customer's FCM device token for push notifications. */
    @PostMapping("/device-token")
    public ResponseEntity<ApiResponse> saveDeviceToken(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> body) {
        Customer customer = getCustomerFromToken(token);
        customerService.saveDeviceToken(customer, body.get("fcmToken"));
        return ResponseEntity.ok(ApiResponse.ok("Device registered for notifications"));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> getBookings(@RequestHeader("Authorization") String token) {
        Customer customer = getCustomerFromToken(token);
        return ResponseEntity.ok(customerService.getBookingHistory(customer));
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<?> getBookingDetails(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Customer customer = getCustomerFromToken(token);
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) return ResponseEntity.notFound().build();
        if (!booking.getCustomer().getId().equals(customer.getId()))
            return ResponseEntity.status(403).build();
        return ResponseEntity.ok(BookingResponse.from(booking));
    }

    @GetMapping("/payments")
    public ResponseEntity<List<Payment>> getPaymentHistory(@RequestHeader("Authorization") String token) {
        Customer customer = getCustomerFromToken(token);
        return ResponseEntity.ok(customerService.getPaymentHistory(customer));
    }

    @GetMapping("/saved-locations")
    public ResponseEntity<List<SavedLocation>> getSavedLocations(@RequestHeader("Authorization") String token) {
        Customer customer = getCustomerFromToken(token);
        return ResponseEntity.ok(customerService.getSavedLocations(customer));
    }

    @PostMapping("/saved-locations")
    public ResponseEntity<SavedLocation> addSavedLocation(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody SavedLocationRequest request) {
        Customer customer = getCustomerFromToken(token);
        return ResponseEntity.ok(customerService.addSavedLocation(customer, request));
    }

    @DeleteMapping("/saved-locations/{id}")
    public ResponseEntity<ApiResponse> deleteSavedLocation(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Customer customer = getCustomerFromToken(token);
        return ResponseEntity.ok(customerService.deleteSavedLocation(id, customer));
    }

    // ========== Helper Method ==========

    private Customer getCustomerFromToken(String token) {
        String jwtToken = token.replace("Bearer ", "");
        Long customerId = jwtTokenProvider.getCustomerIdFromToken(jwtToken);
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }
}
