package com.rahicabs.service;

import com.rahicabs.dto.ApiResponse;
import com.rahicabs.entity.OtpVerification;
import com.rahicabs.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpVerificationRepository otpRepository;

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.otp.rate-limit-minutes:1}")
    private int rateLimitMinutes;

    @Transactional
    public ApiResponse sendOtp(String phoneNumber) {
        // Rate limiting - check if OTP was sent recently
        LocalDateTime rateLimitTime = LocalDateTime.now().minusMinutes(rateLimitMinutes);
        List<OtpVerification> recentOtps = otpRepository.findByPhoneNumberAndCreatedAtAfter(
                phoneNumber, rateLimitTime);
        
        if (!recentOtps.isEmpty()) {
            return ApiResponse.error("Please wait before requesting another OTP");
        }

        // Generate 6-digit OTP
        String otp = generateOtp();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(otpExpiryMinutes);

        OtpVerification otpVerification = OtpVerification.builder()
                .phoneNumber(phoneNumber)
                .otp(otp)
                .expiryTime(expiryTime)
                .verified(false)
                .attemptCount(0)
                .build();

        otpRepository.save(otpVerification);

        // TODO: Integrate with SMS provider (MSG91 or Twilio)
        log.info("OTP for {}: {}", phoneNumber, otp);
        System.out.println("=== OTP GENERATED ===");
        System.out.println("Phone: " + phoneNumber);
        System.out.println("OTP: " + otp);
        System.out.println("Expires at: " + expiryTime);
        System.out.println("====================");

        return ApiResponse.ok("OTP sent successfully");
    }

    @Transactional
    public ApiResponse verifyOtp(String phoneNumber, String otp) {
        OtpVerification otpVerification = otpRepository
                .findTopByPhoneNumberAndVerifiedFalseOrderByCreatedAtDesc(phoneNumber)
                .orElse(null);

        if (otpVerification == null) {
            return ApiResponse.error("No OTP found for this phone number");
        }

        // Check if OTP expired
        if (LocalDateTime.now().isAfter(otpVerification.getExpiryTime())) {
            return ApiResponse.error("OTP has expired");
        }

        // Check attempt count
        if (otpVerification.getAttemptCount() >= maxAttempts) {
            return ApiResponse.error("Maximum OTP attempts exceeded");
        }

        // Increment attempt count
        otpVerification.setAttemptCount(otpVerification.getAttemptCount() + 1);
        otpRepository.save(otpVerification);

        // Verify OTP
        if (!otpVerification.getOtp().equals(otp)) {
            return ApiResponse.error("Invalid OTP");
        }

        // Mark as verified
        otpVerification.setVerified(true);
        otpRepository.save(otpVerification);

        return ApiResponse.ok("OTP verified successfully");
    }

    @Transactional
    public void invalidateOtp(String phoneNumber) {
        otpRepository.deleteByPhoneNumber(phoneNumber);
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000); // 6-digit OTP
        return String.valueOf(otp);
    }
}
