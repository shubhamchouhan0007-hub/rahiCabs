package com.rahicabs.controller;

import com.rahicabs.dto.*;
import com.rahicabs.entity.*;
import com.rahicabs.repository.DriverProfileRepository;
import com.rahicabs.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/driver")
@RequiredArgsConstructor
public class DriverController {

    private final BookingService bookingService;
    private final DriverProfileRepository driverProfileRepository;

    @GetMapping("/rides")
    public ResponseEntity<List<BookingResponse>> myRides(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getDriverRides(user));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> myStats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getDriverStats(user));
    }

    @PutMapping("/rides/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(@PathVariable Long id,
                                                        @RequestParam BookingStatus status,
                                                        @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.updateRideStatus(id, status, user));
    }

    // Accept an assigned ride
    @PutMapping("/rides/{id}/accept")
    public ResponseEntity<BookingResponse> accept(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.driverAccept(id, user));
    }

    // Reject an assigned ride (returns it to the pool for reassignment)
    @PutMapping("/rides/{id}/reject")
    public ResponseEntity<BookingResponse> reject(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.driverReject(id, user));
    }

    // Start the ride after verifying the customer's start OTP
    @PutMapping("/rides/{id}/start")
    public ResponseEntity<?> start(@PathVariable Long id, @RequestBody Map<String, String> body,
                                   @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(bookingService.driverStart(id, user, body.get("otp")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Complete the ride (collect the remaining balance from the customer)
    @PutMapping("/rides/{id}/complete")
    public ResponseEntity<BookingResponse> complete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.driverComplete(id, user));
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> profile(@AuthenticationPrincipal User user) {
        return driverProfileRepository.findByUser(user)
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name",          user.getName());
                    m.put("email",         user.getEmail());
                    m.put("phone",         user.getPhone() != null ? user.getPhone() : "");
                    m.put("vehicleNumber",  p.getVehicleNumber()  != null ? p.getVehicleNumber()  : "");
                    m.put("vehicleType",    p.getVehicleType()    != null ? p.getVehicleType()    : "");
                    m.put("aadhaarNumber",  p.getAadhaarNumber()  != null ? p.getAadhaarNumber()  : "");
                    m.put("licenseNumber",  p.getLicenseNumber()  != null ? p.getLicenseNumber()  : "");
                    m.put("isAvailable",    p.getIsAvailable());
                    m.put("totalRides",     p.getTotalRides());
                    m.put("rating",         p.getRating());
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/availability")
    public ResponseEntity<ApiResponse> toggleAvailability(@RequestParam boolean available,
                                                          @AuthenticationPrincipal User user) {
        return driverProfileRepository.findByUser(user).map(p -> {
            p.setIsAvailable(available);
            driverProfileRepository.save(p);
            return ResponseEntity.ok(ApiResponse.ok("Availability updated"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
