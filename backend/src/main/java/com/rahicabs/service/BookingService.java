package com.rahicabs.service;

import com.rahicabs.dto.*;
import com.rahicabs.entity.*;
import com.rahicabs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;

    // ---- GUEST (no account needed) ----
    public BookingResponse createGuestBooking(BookingRequest request) {
        Booking booking = Booking.builder()
                .guestName(request.getGuestName())
                .guestPhone(request.getGuestPhone())
                .pickupLocation(request.getPickupLocation())
                .dropLocation(request.getDropLocation())
                .serviceType(request.getServiceType())
                .scheduledAt(request.getScheduledAt())
                .fare(request.getFare())
                .notes(request.getNotes())
                .status(BookingStatus.PENDING)
                .build();
        return BookingResponse.from(bookingRepository.save(booking));
    }

    public List<BookingResponse> getGuestBookingsByPhone(String phone) {
        return bookingRepository.findByGuestPhoneOrderByCreatedAtDesc(phone)
                .stream().map(BookingResponse::from).collect(Collectors.toList());
    }

    // ---- CLIENT ----
    public BookingResponse createBooking(BookingRequest request, User client) {
        Booking booking = Booking.builder()
                .client(client)
                .pickupLocation(request.getPickupLocation())
                .dropLocation(request.getDropLocation())
                .serviceType(request.getServiceType())
                .scheduledAt(request.getScheduledAt())
                .fare(request.getFare())
                .notes(request.getNotes())
                .status(BookingStatus.PENDING)
                .build();
        return BookingResponse.from(bookingRepository.save(booking));
    }

    public List<BookingResponse> getClientBookings(User client) {
        return bookingRepository.findByClientOrderByCreatedAtDesc(client)
                .stream().map(BookingResponse::from).collect(Collectors.toList());
    }

    public ApiResponse cancelBooking(Long id, User client) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getClient().getId().equals(client.getId())) {
            return ApiResponse.error("Not authorized");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.IN_PROGRESS) {
            return ApiResponse.error("Cannot cancel a ride that is already started or completed");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        return ApiResponse.ok("Booking cancelled");
    }

    // ---- ADMIN ----
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(BookingResponse::from).collect(Collectors.toList());
    }

    public BookingResponse assignDriver(Long bookingId, Long driverId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        booking.setDriver(driver);
        booking.setStatus(BookingStatus.CONFIRMED);
        return BookingResponse.from(bookingRepository.save(booking));
    }

    public BookingResponse updateStatus(Long bookingId, BookingStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(status);
        if (status == BookingStatus.COMPLETED && booking.getDriver() != null) {
            driverProfileRepository.findByUser(booking.getDriver()).ifPresent(p -> {
                p.setTotalRides(p.getTotalRides() + 1);
                driverProfileRepository.save(p);
            });
        }
        return BookingResponse.from(bookingRepository.save(booking));
    }

    public Map<String, Long> getAdminStats() {
        return Map.of(
            "total",      bookingRepository.count(),
            "pending",    bookingRepository.countByStatus(BookingStatus.PENDING),
            "confirmed",  bookingRepository.countByStatus(BookingStatus.CONFIRMED),
            "inProgress", bookingRepository.countByStatus(BookingStatus.IN_PROGRESS),
            "completed",  bookingRepository.countByStatus(BookingStatus.COMPLETED),
            "cancelled",  bookingRepository.countByStatus(BookingStatus.CANCELLED),
            "totalUsers", userRepository.count()
        );
    }

    // ---- DRIVER ----
    public List<BookingResponse> getDriverRides(User driver) {
        return bookingRepository.findByDriverOrderByCreatedAtDesc(driver)
                .stream().map(BookingResponse::from).collect(Collectors.toList());
    }

    public BookingResponse updateRideStatus(Long bookingId, BookingStatus status, User driver) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("Not authorized");
        }
        booking.setStatus(status);
        return BookingResponse.from(bookingRepository.save(booking));
    }
}
