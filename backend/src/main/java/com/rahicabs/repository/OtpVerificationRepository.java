package com.rahicabs.repository;

import com.rahicabs.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByPhoneNumberAndVerifiedFalseOrderByCreatedAtDesc(String phoneNumber);
    List<OtpVerification> findByPhoneNumberAndCreatedAtAfter(String phoneNumber, LocalDateTime after);
    void deleteByPhoneNumber(String phoneNumber);
}
