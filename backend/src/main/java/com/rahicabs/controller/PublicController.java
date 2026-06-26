package com.rahicabs.controller;

import com.rahicabs.dto.ApiResponse;
import com.rahicabs.dto.BookingRequest;
import com.rahicabs.dto.BookingResponse;
import com.rahicabs.service.AppSettingService;
import com.rahicabs.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final BookingService bookingService;
    private final AppSettingService appSettingService;

    /** Guest booking — no auth needed */
    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> createGuestBooking(@RequestBody BookingRequest request) {
        if (request.getGuestName() == null || request.getGuestName().isBlank() ||
            request.getGuestPhone() == null || request.getGuestPhone().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(bookingService.createGuestBooking(request));
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, String>> getSettings() {
        return ResponseEntity.ok(appSettingService.getAll());
    }

    /** Look up bookings by phone number — no auth needed */
    @GetMapping("/bookings/check")
    public ResponseEntity<List<BookingResponse>> checkBookings(@RequestParam String phone) {
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(bookingService.getGuestBookingsByPhone(phone.trim()));
    }
}
