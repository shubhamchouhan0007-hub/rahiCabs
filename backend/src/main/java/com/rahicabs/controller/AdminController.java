package com.rahicabs.controller;

import com.rahicabs.dto.*;
import com.rahicabs.entity.*;
import com.rahicabs.repository.*;
import com.rahicabs.service.AppSettingService;
import com.rahicabs.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    private final AppSettingService appSettingService;
    private final PasswordEncoder passwordEncoder;
    private final ContactMessageRepository contactMessageRepository;

    // ── Stats ────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(bookingService.getAdminStats());
    }

    // ── Bookings ─────────────────────────────────────────────────────────────

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponse>> allBookings(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        List<BookingResponse> all = bookingService.getAllBookings();
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            all = all.stream().filter(b ->
                (b.getClientName()  != null && b.getClientName().toLowerCase().contains(q)) ||
                (b.getClientPhone() != null && b.getClientPhone().toLowerCase().contains(q)) ||
                (b.getGuestName()   != null && b.getGuestName().toLowerCase().contains(q))  ||
                (b.getGuestPhone()  != null && b.getGuestPhone().contains(q)) ||
                (b.getPickupLocation() != null && b.getPickupLocation().toLowerCase().contains(q)) ||
                (b.getDropLocation()   != null && b.getDropLocation().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }
        if (status != null && !status.isBlank() && !status.equals("ALL")) {
            all = all.stream()
                .filter(b -> b.getStatus() != null && status.equals(b.getStatus().name()))
                .collect(Collectors.toList());
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

    // ── Drivers ──────────────────────────────────────────────────────────────

    @GetMapping("/drivers")
    public ResponseEntity<List<Map<String, Object>>> getDrivers() {
        return ResponseEntity.ok(driverProfileRepository.findAll().stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",            p.getId());
            m.put("userId",        p.getUser().getId());
            m.put("name",          p.getUser().getName());
            m.put("email",         p.getUser().getEmail());
            m.put("phone",         p.getUser().getPhone() != null ? p.getUser().getPhone() : "");
            m.put("vehicleNumber",  p.getVehicleNumber()  != null ? p.getVehicleNumber()  : "");
            m.put("vehicleType",    p.getVehicleType()    != null ? p.getVehicleType()    : "");
            m.put("aadhaarNumber",  p.getAadhaarNumber()  != null ? "****" + p.getAadhaarNumber().replaceAll(".*(.{4})$","$1") : "");
            m.put("licenseNumber",  p.getLicenseNumber()  != null ? p.getLicenseNumber()  : "");
            m.put("isAvailable",   p.getIsAvailable());
            m.put("totalRides",    p.getTotalRides());
            m.put("rating",        p.getRating());
            return m;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/drivers")
    public ResponseEntity<Map<String, Object>> createDriver(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            email = "driver_" + System.currentTimeMillis() + "@rahicab.internal";
        if (userRepository.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));

        User user = new User();
        user.setName(body.get("name"));
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(body.getOrDefault("password", "driver123")));
        user.setPhone(body.get("phone"));
        user.setRole(Role.DRIVER);
        user.setCreatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        DriverProfile profile = DriverProfile.builder()
            .user(saved)
            .vehicleNumber(body.get("vehicleNumber"))
            .vehicleType(body.get("vehicleType"))
            .aadhaarNumber(body.get("aadhaarNumber"))
            .licenseNumber(body.get("licenseNumber"))
            .build();
        driverProfileRepository.save(profile);

        return ResponseEntity.ok(Map.of("message", "Driver created", "id", saved.getId()));
    }

    @DeleteMapping("/drivers/{userId}")
    public ResponseEntity<Map<String, String>> deleteDriver(@PathVariable Long userId) {
        driverProfileRepository.findAll().stream()
            .filter(p -> p.getUser().getId().equals(userId))
            .findFirst()
            .ifPresent(driverProfileRepository::delete);
        userRepository.findById(userId).ifPresent(userRepository::delete);
        return ResponseEntity.ok(Map.of("message", "Driver deleted"));
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",        u.getId());
            m.put("name",      u.getName());
            m.put("email",     u.getEmail());
            m.put("phone",     u.getPhone() != null ? u.getPhone() : "");
            m.put("role",      u.getRole().name());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            return m;
        }).collect(Collectors.toList()));
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (userRepository.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));

        Role role;
        try { role = Role.valueOf(body.getOrDefault("role", "CLIENT")); }
        catch (IllegalArgumentException e) { role = Role.CLIENT; }

        User user = new User();
        user.setName(body.get("name"));
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(body.getOrDefault("password", "user123")));
        user.setPhone(body.get("phone"));
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        if (role == Role.DRIVER) {
            driverProfileRepository.save(DriverProfile.builder().user(saved).build());
        }

        return ResponseEntity.ok(Map.of("message", "User created", "id", saved.getId()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userRepository.findById(id).ifPresent(u -> {
            if (u.getRole() == Role.DRIVER) {
                driverProfileRepository.findAll().stream()
                    .filter(p -> p.getUser().getId().equals(id))
                    .findFirst().ifPresent(driverProfileRepository::delete);
            }
            userRepository.delete(u);
        });
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    @GetMapping("/settings")
    public ResponseEntity<Map<String, String>> getSettings() {
        return ResponseEntity.ok(appSettingService.getAll());
    }

    @PutMapping("/settings")
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> body) {
        appSettingService.setAll(body);
        return ResponseEntity.ok(appSettingService.getAll());
    }

    // ── Contact Messages ──────────────────────────────────────────────────────

    @GetMapping("/messages")
    public ResponseEntity<Map<String, Object>> getMessages() {
        return ResponseEntity.ok(Map.of(
            "messages",    contactMessageRepository.findAllByOrderBySentAtDesc(),
            "unreadCount", contactMessageRepository.countByIsReadFalse()
        ));
    }

    @PutMapping("/messages/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        contactMessageRepository.findById(id).ifPresent(m -> {
            m.setIsRead(true);
            contactMessageRepository.save(m);
        });
        return ResponseEntity.ok().build();
    }
}
