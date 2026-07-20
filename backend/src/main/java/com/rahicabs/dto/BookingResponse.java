package com.rahicabs.dto;

import com.rahicabs.entity.Booking;
import com.rahicabs.entity.BookingStatus;
import com.rahicabs.entity.ServiceType;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingResponse {
    private Long id;
    private Long clientId;
    private String clientName;
    private String clientPhone;
    private String guestName;
    private String guestPhone;
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private String pickupLocation;
    private String dropLocation;
    private ServiceType serviceType;
    private BookingStatus status;
    private String customerName;
    private String customerPhone;
    private LocalDateTime scheduledAt;
    private LocalDateTime createdAt;
    private Double fare;
    private Double advanceAmount;
    private Double remainingAmount;
    private String startOtp;   // shown to the customer only; nulled for the driver
    private String notes;

    public static BookingResponse from(Booking b) {
        BookingResponse r = new BookingResponse();
        r.setId(b.getId());
        r.setPickupLocation(b.getPickupLocation());
        r.setDropLocation(b.getDropLocation());
        r.setServiceType(b.getServiceType());
        r.setStatus(b.getStatus());
        r.setScheduledAt(b.getScheduledAt());
        r.setCreatedAt(b.getCreatedAt());
        r.setFare(b.getFare());
        r.setAdvanceAmount(b.getAdvanceAmount());
        r.setRemainingAmount(b.getRemainingAmount());
        r.setStartOtp(b.getStartOtp());
        r.setNotes(b.getNotes());
        r.setGuestName(b.getGuestName());
        r.setGuestPhone(b.getGuestPhone());
        if (b.getCustomer() != null) {
            r.setCustomerName(b.getCustomer().getFullName());
            r.setCustomerPhone(b.getCustomer().getPhoneNumber());
        }
        if (b.getClient() != null) {
            r.setClientId(b.getClient().getId());
            r.setClientName(b.getClient().getName());
            r.setClientPhone(b.getClient().getPhone());
        }
        if (b.getDriver() != null) {
            r.setDriverId(b.getDriver().getId());
            r.setDriverName(b.getDriver().getName());
            r.setDriverPhone(b.getDriver().getPhone());
        }
        return r;
    }
}
