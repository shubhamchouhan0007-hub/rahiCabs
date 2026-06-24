package com.rahicabs.service;

import com.rahicabs.dto.ApiResponse;
import com.rahicabs.dto.PaymentRequest;
import com.rahicabs.entity.*;
import com.rahicabs.repository.BookingRepository;
import com.rahicabs.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Value("${app.razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:}")
    private String razorpayKeySecret;

    public Map<String, Object> createOrder(Customer customer, Booking booking, Double amount) {
        // Create Razorpay order
        String orderId = "order_" + System.currentTimeMillis();

        // Create payment record
        Payment payment = Payment.builder()
                .customer(customer)
                .booking(booking)
                .razorpayOrderId(orderId)
                .amount(amount)
                .paymentType(PaymentType.ADVANCE)
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        
        paymentRepository.save(payment);

        Map<String, Object> orderData = new HashMap<>();
        orderData.put("orderId", orderId);
        orderData.put("amount", amount * 100); // Convert to paise
        orderData.put("currency", "INR");
        orderData.put("keyId", razorpayKeyId);

        return orderData;
    }

    @Transactional
    public ApiResponse verifyPayment(PaymentRequest request) {
        // Find payment
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        // Verify signature
        try {
            String generated_signature = hmacSha256(
                    request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId(),
                    razorpayKeySecret
            );

            if (!generated_signature.equals(request.getRazorpaySignature())) {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                return ApiResponse.error("Payment verification failed");
            }

            // Update payment
            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            payment.setPaymentStatus(PaymentStatus.SUCCESS);
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);

            // Update booking
            Booking booking = payment.getBooking();
            booking.setAdvancePaid(true);
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            return ApiResponse.ok("Payment verified successfully");

        } catch (Exception e) {
            log.error("Payment verification error", e);
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return ApiResponse.error("Payment verification failed");
        }
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes());
        
        StringBuilder result = new StringBuilder();
        for (byte b : hash) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}
