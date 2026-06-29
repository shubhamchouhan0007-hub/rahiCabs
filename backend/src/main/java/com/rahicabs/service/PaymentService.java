package com.rahicabs.service;

import com.rahicabs.dto.ApiResponse;
import com.rahicabs.dto.PaymentRequest;
import com.rahicabs.entity.*;
import com.rahicabs.repository.BookingRepository;
import com.rahicabs.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
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
    private final NotificationService notificationService;

    @Value("${app.razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:}")
    private String razorpayKeySecret;

    private boolean isConfigured() {
        return razorpayKeyId   != null && !razorpayKeyId.isBlank()   && !razorpayKeyId.startsWith("your_")
            && razorpayKeySecret != null && !razorpayKeySecret.isBlank() && !razorpayKeySecret.startsWith("your_");
    }

    public Map<String, Object> createOrder(Customer customer, Booking booking, Double amount) {
        long amountPaise = Math.round(amount * 100);
        String orderId;

        if (isConfigured()) {
            try {
                RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                JSONObject req = new JSONObject();
                req.put("amount",          amountPaise);
                req.put("currency",        "INR");
                req.put("receipt",         "rcpt_bk" + booking.getId());
                req.put("payment_capture", 1);
                com.razorpay.Order rzpOrder = client.orders.create(req);
                orderId = rzpOrder.get("id");
                log.info("Razorpay order created: {} for booking #{}", orderId, booking.getId());
            } catch (RazorpayException e) {
                log.error("Razorpay order creation failed: {}", e.getMessage());
                throw new RuntimeException("Payment gateway error. Please try again later.");
            }
        } else {
            // Dev mode: no real API call, checkout popup will not work for real payments
            log.warn("Razorpay keys not set — using dev mock order (configure app.razorpay.key-id/key-secret to go live)");
            orderId = "order_dev_" + System.currentTimeMillis();
        }

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
        orderData.put("orderId",  orderId);
        orderData.put("amount",   amountPaise);   // Razorpay expects paise
        orderData.put("currency", "INR");
        orderData.put("keyId",    razorpayKeyId);

        return orderData;
    }

    @Transactional
    public ApiResponse verifyPayment(PaymentRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (request.getRazorpayOrderId().startsWith("order_dev_")) {
            return ApiResponse.error("Dev mode orders cannot be verified. Configure Razorpay keys to accept real payments.");
        }

        if (!isConfigured()) {
            return ApiResponse.error("Razorpay keys not configured on server");
        }

        try {
            String expectedSig = hmacSha256(
                    request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId(),
                    razorpayKeySecret);

            if (!expectedSig.equals(request.getRazorpaySignature())) {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                return ApiResponse.error("Payment verification failed — signature mismatch");
            }

            markPaymentSuccess(payment, request.getRazorpayPaymentId(), request.getRazorpaySignature());
            return ApiResponse.ok("Payment verified successfully");

        } catch (Exception e) {
            log.error("Payment verification error", e);
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return ApiResponse.error("Payment verification failed");
        }
    }

    private void markPaymentSuccess(Payment payment, String paymentId, String signature) {
        payment.setRazorpayPaymentId(paymentId);
        payment.setRazorpaySignature(signature);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaymentDate(LocalDateTime.now());
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        booking.setAdvancePaid(true);
        booking.setStatus(BookingStatus.PENDING);
        bookingRepository.save(booking);
        notificationService.onPaymentConfirmed(booking);
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes());
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
