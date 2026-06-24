package com.rahicabs.service;

import com.rahicabs.dto.ApiResponse;
import com.rahicabs.entity.OtpVerification;
import com.rahicabs.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

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

    @Value("${app.sms.msg91.authkey:}")
    private String msg91AuthKey;

    @Value("${app.sms.msg91.template-id:}")
    private String msg91TemplateId;

    @Value("${app.sms.msg91.sender-id:RAHICB}")
    private String msg91SenderId;

    @Value("${app.sms.enabled:false}")
    private boolean smsEnabled;

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

        // Send OTP via MSG91 (if enabled) or fall back to console log
        if (smsEnabled) {
            sendSmsViaMsg91(phoneNumber, otp);
        } else {
            log.info("=== OTP GENERATED (SMS disabled — set app.sms.enabled=true) ===");
            log.info("Phone: {} | OTP: {} | Expires: {}", phoneNumber, otp, expiryTime);
        }

        return ApiResponse.ok("OTP sent successfully");
    }

    private void sendSmsViaMsg91(String phoneNumber, String otp) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // MSG91 expects 91XXXXXXXXXX format for India
            String mobile = phoneNumber.startsWith("91") ? phoneNumber : "91" + phoneNumber;

            String url = "https://control.msg91.com/api/v5/otp" +
                    "?template_id=" + msg91TemplateId +
                    "&mobile=" + mobile +
                    "&authkey=" + msg91AuthKey +
                    "&otp=" + otp;

            HttpHeaders headers = new HttpHeaders();
            headers.set("authkey", msg91AuthKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(headers), String.class);

            log.info("MSG91 response for {}: {}", phoneNumber, response.getBody());
        } catch (Exception e) {
            log.error("Failed to send OTP via MSG91 to {}: {}", phoneNumber, e.getMessage());
            // Don't throw — OTP is still saved; log it as fallback
            log.info("Fallback OTP for {}: {}", phoneNumber, otp);
        }
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
