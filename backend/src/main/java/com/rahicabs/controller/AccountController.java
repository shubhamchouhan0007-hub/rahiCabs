package com.rahicabs.controller;

import com.rahicabs.dto.ApiResponse;
import com.rahicabs.entity.User;
import com.rahicabs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Self-service account management for any logged-in staff user
 * (admin / driver / client) — view/edit own profile and change password.
 */
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private User current() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile() {
        User u = current();
        return ResponseEntity.ok(Map.of(
                "name",  u.getName()  != null ? u.getName()  : "",
                "email", u.getEmail(),
                "phone", u.getPhone() != null ? u.getPhone() : "",
                "role",  u.getRole().name()
        ));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfile(@RequestBody Map<String, String> body) {
        User u = current();
        String name  = body.get("name");
        String email = body.get("email");
        String phone = body.get("phone");
        if (name  != null && !name.isBlank()) u.setName(name.trim());
        if (phone != null)                    u.setPhone(phone.trim());
        boolean emailChanged = false;
        if (email != null && !email.isBlank() && !email.trim().equalsIgnoreCase(u.getEmail())) {
            if (userRepository.existsByEmail(email.trim()))
                return ResponseEntity.badRequest().body(ApiResponse.error("Email already in use"));
            u.setEmail(email.trim());
            emailChanged = true;
        }
        userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.ok(emailChanged
                ? "Profile updated. Please log in again with your new email."
                : "Profile updated."));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse> changePassword(@RequestBody Map<String, String> body) {
        User u = current();
        String currentPw = body.getOrDefault("currentPassword", "");
        String newPw     = body.getOrDefault("newPassword", "");
        if (!passwordEncoder.matches(currentPw, u.getPassword()))
            return ResponseEntity.badRequest().body(ApiResponse.error("Current password is incorrect."));
        if (newPw.length() < 6)
            return ResponseEntity.badRequest().body(ApiResponse.error("New password must be at least 6 characters."));
        u.setPassword(passwordEncoder.encode(newPw));
        userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully."));
    }
}
