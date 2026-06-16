package com.rahicabs.dto;

import com.rahicabs.entity.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingRequest {
    // Guest fields (required when no auth token)
    private String guestName;
    private String guestPhone;

    @NotBlank
    private String pickupLocation;

    @NotBlank
    private String dropLocation;

    @NotNull
    private ServiceType serviceType;

    private LocalDateTime scheduledAt;
    private Double fare;
    private String notes;
}
