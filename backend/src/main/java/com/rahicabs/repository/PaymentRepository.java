package com.rahicabs.repository;

import com.rahicabs.entity.Booking;
import com.rahicabs.entity.Customer;
import com.rahicabs.entity.Payment;
import com.rahicabs.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByCustomerOrderByCreatedAtDesc(Customer customer);
    List<Payment> findByBooking(Booking booking);
    Optional<Payment> findByRazorpayOrderId(String orderId);
    List<Payment> findByPaymentStatus(PaymentStatus status);
}
