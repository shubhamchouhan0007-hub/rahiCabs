package com.rahicabs.repository;

import com.rahicabs.entity.Booking;
import com.rahicabs.entity.BookingStatus;
import com.rahicabs.entity.Customer;
import com.rahicabs.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByClientOrderByCreatedAtDesc(User client);
    List<Booking> findByCustomerOrderByCreatedAtDesc(Customer customer);
    List<Booking> findByDriverOrderByCreatedAtDesc(User driver);
    List<Booking> findByDriverAndStatusOrderByScheduledAtAsc(User driver, BookingStatus status);
    long countByStatus(BookingStatus status);
    List<Booking> findByGuestPhoneOrderByCreatedAtDesc(String guestPhone);

    @Query("SELECT COALESCE(SUM(b.fare), 0) FROM Booking b WHERE b.status = :status AND b.fare IS NOT NULL")
    Double sumFareByStatus(@Param("status") BookingStatus status);

    @Query("SELECT COALESCE(SUM(b.fare), 0) FROM Booking b WHERE b.driver = :driver AND b.status = 'COMPLETED' AND b.fare IS NOT NULL")
    Double sumFareByDriver(@Param("driver") User driver);
}
