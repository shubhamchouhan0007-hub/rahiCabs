package com.rahicabs.controller;

import com.rahicabs.dto.*;
import com.rahicabs.entity.User;
import com.rahicabs.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client")
@RequiredArgsConstructor
public class ClientController {

    private final BookingService bookingService;

    @PostMapping("/bookings")
    public ResponseEntity<BookingResponse> book(@Valid @RequestBody BookingRequest request,
                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.createBooking(request, user));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> myBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getClientBookings(user));
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<ApiResponse> cancel(@PathVariable Long id,
                                              @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, user));
    }
}
