package com.rahicabs.repository;

import com.rahicabs.entity.Booking;
import com.rahicabs.entity.BookingStatus;
import com.rahicabs.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByClientOrderByCreatedAtDesc(User client);
    List<Booking> findByDriverOrderByCreatedAtDesc(User driver);
    List<Booking> findByDriverAndStatusOrderByScheduledAtAsc(User driver, BookingStatus status);
    long countByStatus(BookingStatus status);
    List<Booking> findByGuestPhoneOrderByCreatedAtDesc(String guestPhone);
}
