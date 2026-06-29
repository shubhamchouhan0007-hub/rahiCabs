package com.rahicabs.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

/**
 * Verifies Firebase Phone-Auth ID tokens. The frontend completes the SMS OTP
 * with Firebase and sends the resulting ID token; we verify it server-side and
 * trust the phone number Firebase put in it.
 *
 * The service account JSON is supplied via the FIREBASE_SERVICE_ACCOUNT env var
 * (the whole JSON as a single string). If absent, verification is disabled and
 * the app still boots — useful for local dev/tests.
 */
@Service
@Slf4j
public class FirebaseService {

    @Value("${app.firebase.service-account:}")
    private String serviceAccountJson;

    private boolean enabled = false;

    @PostConstruct
    public void init() {
        if (serviceAccountJson == null || serviceAccountJson.isBlank()) {
            log.warn("Firebase service account not set (app.firebase.service-account) — phone-auth verification DISABLED");
            return;
        }
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials creds = GoogleCredentials.fromStream(
                        new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8)));
                FirebaseApp.initializeApp(FirebaseOptions.builder().setCredentials(creds).build());
            }
            enabled = true;
            log.info("Firebase Admin initialized — phone-auth verification ENABLED");
        } catch (Exception e) {
            log.error("Failed to initialize Firebase Admin: {}", e.getMessage());
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Verifies the ID token and returns the 10-digit phone number (India, +91 stripped).
     * @throws IllegalArgumentException if the token is invalid or has no phone number.
     */
    public String verifyAndGetPhone(String idToken) {
        if (!enabled) {
            throw new IllegalStateException("Phone verification is not configured on the server.");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Missing verification token.");
        }
        try {
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            Object phoneClaim = decoded.getClaims().get("phone_number");
            if (phoneClaim == null) {
                throw new IllegalArgumentException("Token has no phone number.");
            }
            String phone = phoneClaim.toString();          // e.g. +919876543210
            String digits = phone.replaceAll("[^0-9]", ""); // 919876543210
            if (digits.length() > 10) digits = digits.substring(digits.length() - 10); // last 10
            return digits;
        } catch (FirebaseAuthException e) {
            throw new IllegalArgumentException("Phone verification failed. Please try again.");
        }
    }
}
