package com.rahicabs.service;

import com.rahicabs.dto.*;
import com.rahicabs.entity.*;
import com.rahicabs.repository.*;
import com.rahicabs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    public JwtResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = (User) auth.getPrincipal();
        String token = jwtTokenProvider.generateToken(auth);
        return new JwtResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    public ApiResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ApiResponse.error("Email already in use");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : Role.CLIENT)
                .build();

        User saved = userRepository.save(user);

        // Create driver profile automatically if role is DRIVER
        if (saved.getRole() == Role.DRIVER) {
            DriverProfile profile = DriverProfile.builder().user(saved).build();
            driverProfileRepository.save(profile);
        }

        return ApiResponse.ok("Registration successful");
    }
}
