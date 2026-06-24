package com.rahicabs.controller;

import com.rahicabs.dto.*;
import com.rahicabs.entity.*;
import com.rahicabs.repository.*;
import com.rahicabs.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final BookingService bookingService;
    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(bookingService.getAdminStats());
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> allBookings(@RequestParam(required = false) String search,
                                                              @RequestParam(required = false) String status) {
        List<BookingResponse> all = bookingService.getAllBookings();
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            all = all.stream().filter(b ->
                (b.getClientName() != null && b.getClientName().toLowerCase().contains(q)) ||
                (b.getClientPhone() != null && b.getClientPhone().toLowerCase().contains(q)) ||
                (b.getPickupLocation() != null && b.getPickupLocation().toLowerCase().contains(q)) ||
                (b.getDropLocation() != null && b.getDropLocation().toLowerCase().contains(q))
            ).collect(java.util.stream.Collectors.toList());
        }
        if (status != null && !status.isBlank() && !status.equals("ALL")) {
            all = all.stream().filter(b -> b.getStatus() != null && status.equals(b.getStatus().name())).collect(java.util.stream.Collectors.toList());
        }
        return ResponseEntity.ok(all);
    }

    @PutMapping("/bookings/{id}/assign-driver/{driverId}")
    public ResponseEntity<BookingResponse> assignDriver(@PathVariable Long id,
                                                        @PathVariable Long driverId) {
        return ResponseEntity.ok(bookingService.assignDriver(id, driverId));
    }

    @PutMapping("/bookings/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(@PathVariable Long id,
                                                        @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<Map<String, Object>>> getDrivers() {
        List<DriverProfile> profiles = driverProfileRepository.findAll();
        List<Map<String, Object>> result = profiles.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",            p.getId());
            m.put("userId",        p.getUser().getId());
            m.put("name",          p.getUser().getName());
            m.put("email",         p.getUser().getEmail());
            m.put("phone",         p.getUser().getPhone() != null ? p.getUser().getPhone() : "");
            m.put("vehicleNumber", p.getVehicleNumber() != null ? p.getVehicleNumber() : "");
            m.put("vehicleType",   p.getVehicleType() != null ? p.getVehicleType() : "");
            m.put("isAvailable",   p.getIsAvailable());
            m.put("totalRides",    p.getTotalRides());
            m.put("rating",        p.getRating());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",        u.getId());
            m.put("name",      u.getName());
            m.put("email",     u.getEmail());
            m.put("phone",     u.getPhone() != null ? u.getPhone() : "");
            m.put("role",      u.getRole().name());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}
