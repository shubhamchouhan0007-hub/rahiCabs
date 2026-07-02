package com.rahicabs.controller;

import com.rahicabs.dto.*;
import com.rahicabs.entity.User;
import com.rahicabs.repository.UserRepository;
import com.rahicabs.service.AuthService;
import com.rahicabs.service.FirebaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FirebaseService firebaseService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /** Reset a staff password after verifying phone ownership via Firebase OTP. */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody Map<String, String> body) {
        String newPw = body.getOrDefault("newPassword", "");
        if (newPw.length() < 6)
            return ResponseEntity.badRequest().body(ApiResponse.error("Password must be at least 6 characters."));

        String phone;
        try {
            phone = firebaseService.verifyAndGetPhone(body.get("firebaseIdToken"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phone verification failed. Please try again."));
        }

        final String verified = phone;
        User user = userRepository.findAll().stream()
                .filter(u -> u.getPhone() != null && last10(u.getPhone()).equals(verified))
                .findFirst().orElse(null);
        if (user == null)
            return ResponseEntity.badRequest().body(ApiResponse.error("No staff account is registered with this phone number."));

        user.setPassword(passwordEncoder.encode(newPw));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully. Log in with your new password."));
    }

    private String last10(String raw) {
        String d = raw.replaceAll("[^0-9]", "");
        return d.length() > 10 ? d.substring(d.length() - 10) : d;
    }
}
