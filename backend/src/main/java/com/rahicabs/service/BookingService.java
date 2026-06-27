package com.rahicabs.service;

import com.rahicabs.dto.*;
import com.rahicabs.entity.*;
import com.rahicabs.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.rahicabs.entity.Role;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final NotificationService notificationService;

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
        Booking saved = bookingRepository.save(booking);
        notificationService.onBookingCreated(saved);
        return BookingResponse.from(saved);
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
        Booking saved = bookingRepository.save(booking);
        notificationService.onBookingCreated(saved);
        return BookingResponse.from(saved);
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
        Booking saved = bookingRepository.save(booking);
        notificationService.onBookingCancelled(saved);
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
        Booking saved = bookingRepository.save(booking);
        notificationService.onDriverAssigned(saved);
        return BookingResponse.from(saved);
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
        Booking saved = bookingRepository.save(booking);
        fireStatusNotification(saved, status);
        return BookingResponse.from(saved);
    }

    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total",        bookingRepository.count());
        stats.put("pending",      bookingRepository.countByStatus(BookingStatus.PENDING));
        stats.put("confirmed",    bookingRepository.countByStatus(BookingStatus.CONFIRMED));
        stats.put("inProgress",   bookingRepository.countByStatus(BookingStatus.IN_PROGRESS));
        stats.put("completed",    bookingRepository.countByStatus(BookingStatus.COMPLETED));
        stats.put("cancelled",    bookingRepository.countByStatus(BookingStatus.CANCELLED));
        stats.put("totalUsers",   userRepository.count());
        stats.put("totalDrivers", userRepository.countByRole(Role.DRIVER));
        Double revenue = bookingRepository.sumFareByStatus(BookingStatus.COMPLETED);
        stats.put("totalRevenue", revenue != null ? revenue : 0.0);
        return stats;
    }

    public Map<String, Object> getDriverStats(User driver) {
        List<BookingResponse> rides = getDriverRides(driver);
        Map<String, Object> stats = new HashMap<>();
        stats.put("total",     rides.size());
        stats.put("completed", rides.stream().filter(r -> "COMPLETED".equals(r.getStatus())).count());
        stats.put("pending",   rides.stream().filter(r -> "PENDING".equals(r.getStatus())).count());
        stats.put("inProgress",rides.stream().filter(r -> "IN_PROGRESS".equals(r.getStatus())).count());
        Double earnings = bookingRepository.sumFareByDriver(driver);
        stats.put("totalEarnings", earnings != null ? earnings : 0.0);
        return stats;
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
        Booking saved = bookingRepository.save(booking);
        fireStatusNotification(saved, status);
        return BookingResponse.from(saved);
    }

    private void fireStatusNotification(Booking b, BookingStatus status) {
        switch (status) {
            case IN_PROGRESS -> notificationService.onRideStarted(b);
            case COMPLETED   -> notificationService.onRideCompleted(b);
            case CANCELLED   -> notificationService.onBookingCancelled(b);
            default          -> {} // PENDING, CONFIRMED etc handled elsewhere
        }
    }
}
