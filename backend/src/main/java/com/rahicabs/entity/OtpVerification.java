package com.rahicabs.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verification")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    private Boolean verified;

    @Column(nullable = false)
    private Integer attemptCount;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (verified == null) {
            verified = false;
        }
        if (attemptCount == null) {
            attemptCount = 0;
        }
    }
}
