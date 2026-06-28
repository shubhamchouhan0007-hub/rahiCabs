package com.rahicabs.controller;

import com.rahicabs.dto.ApiResponse;
import com.rahicabs.dto.BookingRequest;
import com.rahicabs.dto.BookingResponse;
import com.rahicabs.entity.ContactMessage;
import com.rahicabs.repository.ContactMessageRepository;
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
    private final ContactMessageRepository contactMessageRepository;

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

    /** Contact form submission */
    @PostMapping("/contact")
    public ResponseEntity<ApiResponse> submitContact(@RequestBody Map<String, String> body) {
        String name    = body.getOrDefault("name", "").trim();
        String phone   = body.getOrDefault("phone", "").trim();
        String email   = body.getOrDefault("email", "").trim();
        String message = body.getOrDefault("message", "").trim();
        if (name.isBlank() || phone.isBlank() || message.isBlank())
            return ResponseEntity.badRequest().body(ApiResponse.error("Name, phone and message are required"));
        ContactMessage msg = ContactMessage.builder()
                .name(name).phone(phone)
                .email(email.isBlank() ? null : email)
                .message(message).build();
        contactMessageRepository.save(msg);
        return ResponseEntity.ok(ApiResponse.ok("Message sent! We'll get back to you soon."));
    }

    /** Look up bookings by phone number — no auth needed (capped at 20 most recent) */
    @GetMapping("/bookings/check")
    public ResponseEntity<List<BookingResponse>> checkBookings(@RequestParam String phone) {
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        List<BookingResponse> all = bookingService.getGuestBookingsByPhone(phone.trim());
        return ResponseEntity.ok(all.stream().limit(20).collect(java.util.stream.Collectors.toList()));
    }
}
